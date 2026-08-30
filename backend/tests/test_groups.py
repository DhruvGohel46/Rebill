import json
import pytest
from models import db, ItemGroup, Category

GROUP_PAYLOAD = {
    "name": "Food Group",
    "description": "Tasty food item group",
    "display_order": 1,
    "color": "#F97316",
    "icon": "🍕",
    "is_active": True,
}


def test_get_groups_empty(client, init_database):
    """GET /api/groups should return empty groups list initially."""
    response = client.get("/api/groups")
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["success"] is True
    assert isinstance(data["groups"], list)


def test_create_group_success(client, init_database):
    """POST /api/groups should successfully create a group."""
    response = client.post(
        "/api/groups",
        data=json.dumps(GROUP_PAYLOAD),
        content_type="application/json",
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data["success"] is True
    assert "group_id" in data


def test_create_group_duplicate_name(client, init_database):
    """POST /api/groups with duplicate name should return 400."""
    # First creation
    client.post(
        "/api/groups",
        data=json.dumps(GROUP_PAYLOAD),
        content_type="application/json",
    )

    # Second creation
    response = client.post(
        "/api/groups",
        data=json.dumps(GROUP_PAYLOAD),
        content_type="application/json",
    )
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data["success"] is False
    assert data["code"] == "GROUP_DUPLICATE"


def test_update_group(client, init_database):
    """PUT /api/groups/<id> should update group details."""
    payload = dict(GROUP_PAYLOAD, name="Food Group Update")
    create_response = client.post(
        "/api/groups",
        data=json.dumps(payload),
        content_type="application/json",
    )
    group_id = json.loads(create_response.data)["group_id"]

    update_payload = {"name": "Updated Food Group", "display_order": 10}
    response = client.put(
        f"/api/groups/{group_id}",
        data=json.dumps(update_payload),
        content_type="application/json",
    )
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data["success"] is True

    # Retrieve and check
    get_response = client.get("/api/groups")
    groups = json.loads(get_response.data)["groups"]
    updated_group = next(g for g in groups if g["id"] == group_id)
    assert updated_group["name"] == "Updated Food Group"
    assert updated_group["display_order"] == 10


def test_delete_group_with_categories_prompt(client, init_database, app):
    """DELETE /api/groups/<id> without action param should fail if categories exist."""
    # Create group
    payload = dict(GROUP_PAYLOAD, name="Food Group Delete Prompt")
    create_response = client.post(
        "/api/groups",
        data=json.dumps(payload),
        content_type="application/json",
    )
    group_id = json.loads(create_response.data)["group_id"]

    # Link category to group
    with app.app_context():
        category = Category(name="Pizza Grouped", group_id=group_id)
        db.session.add(category)
        db.session.commit()

    # Try deleting group without action
    delete_response = client.delete(f"/api/groups/{group_id}")
    assert delete_response.status_code == 400
    data = json.loads(delete_response.data)
    assert data["success"] is False
    assert data["code"] == "GROUP_HAS_CATEGORIES"
    assert data["categories_count"] == 1


def test_delete_group_with_categories_move(client, init_database, app):
    """DELETE /api/groups/<id>?action=move should move categories and soft-delete group."""
    # Create source group
    src_res = client.post(
        "/api/groups",
        data=json.dumps({"name": "Source Group"}),
        content_type="application/json",
    )
    src_id = json.loads(src_res.data)["group_id"]

    # Create target group
    tgt_res = client.post(
        "/api/groups",
        data=json.dumps({"name": "Target Group"}),
        content_type="application/json",
    )
    tgt_id = json.loads(tgt_res.data)["group_id"]

    # Add category to source group
    with app.app_context():
        category = Category(name="Burger Grouped", group_id=src_id)
        db.session.add(category)
        db.session.commit()
        cat_id = category.id

    # Delete source group with move action
    delete_response = client.delete(f"/api/groups/{src_id}?action=move&move_to={tgt_id}")
    assert delete_response.status_code == 200

    # Verify category is now linked to target group
    with app.app_context():
        updated_cat = Category.query.get(cat_id)
        assert updated_cat.group_id == tgt_id

        # Verify group is soft deleted
        deleted_group = ItemGroup.query.get(src_id)
        assert deleted_group.deleted_at is not None
        assert deleted_group.is_active is False


def test_group_disable_enable_cascades_to_products(client, init_database, app):
    """Disabling/Enabling a group should cascade active status to its categories and products in sync."""
    from models import Product

    # 1. Create a group
    group_res = client.post(
        "/api/groups",
        data=json.dumps({"name": "Beverages Group", "is_active": True}),
        content_type="application/json",
    )
    group_id = json.loads(group_res.data)["group_id"]

    # 2. Add category & product under this group
    with app.app_context():
        category = Category(name="Cold Drinks", group_id=group_id, active=True)
        db.session.add(category)
        db.session.commit()
        cat_id = category.id

        prod = Product(
            product_id="cold_drink_1",
            name="Iced Lemon Tea",
            price=50.0,
            category_id=cat_id,
            active=True,
        )
        db.session.add(prod)
        db.session.commit()

    # 3. Disable the group
    disable_res = client.put(
        f"/api/groups/{group_id}",
        data=json.dumps({"is_active": False}),
        content_type="application/json",
    )
    assert disable_res.status_code == 200

    # 4. Verify category and product are now inactive
    with app.app_context():
        cat = Category.query.get(cat_id)
        assert cat.active is False
        product = Product.query.get("cold_drink_1")
        assert product.active is False

    # 5. Enable the group back
    enable_res = client.put(
        f"/api/groups/{group_id}",
        data=json.dumps({"is_active": True}),
        content_type="application/json",
    )
    assert enable_res.status_code == 200

    # 6. Verify category and product are now active in sync
    with app.app_context():
        cat = Category.query.get(cat_id)
        assert cat.active is True
        product = Product.query.get("cold_drink_1")
        assert product.active is True
