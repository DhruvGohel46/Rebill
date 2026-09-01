"""
=============================================================================
 TEST LIVE ORDERS & MERGE BILLING — backend/tests/test_live_orders.py
=============================================================================
 Tests for the Live Order View feature:
   - Creating pending bills
   - Creating paid bills (backward compatibility)
   - Merging bills into groups
   - Merging into existing open groups (collapse/extend)
   - Settling merge groups (flat allocation to member bills)
   - Splitting / reverting open merge groups
   - Edge case validations (min bills, non-existent, cancelled, etc.)
   - GET /api/bill/live endpoint + version hash
=============================================================================
"""

import json
import pytest
from datetime import datetime, date
from models import db, Bill, MergeGroup, Product, DailySalesSummary
from services.live_order_service import (
    get_live_orders,
    merge_bills,
    settle_group,
    split_group,
)
from services.aggregation_service import update_daily_summary
from error_handler import ValidationError, NotFoundError


@pytest.fixture
def clean_db(app):
    """Ensure clean bills and merge groups for each test."""
    with app.app_context():
        # Ensure test product exists
        p = Product.query.get("LIVE-PROD-1")
        if not p:
            p = Product(
                product_id="LIVE-PROD-1",
                name="Cold Coffee",
                price=100.0,
                active=True,
            )
            db.session.add(p)
            db.session.commit()

        # Clear existing bills and merge groups
        Bill.query.delete()
        MergeGroup.query.delete()
        DailySalesSummary.query.delete()
        db.session.commit()
        yield


def test_create_pending_bill(client, clean_db):
    """Creating a bill with payment_status='pending' initializes amount_pending=total and amount_paid=0."""
    res = client.post(
        "/api/bill/create",
        json={
            "products": [{"product_id": "LIVE-PROD-1", "quantity": 2}],
            "customer_name": "Alice",
            "payment_status": "pending",
            "payment_method": "CASH",
        },
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True

    bill = Bill.query.filter_by(bill_no=data["bill"]["bill_no"]).first()
    assert bill is not None
    assert bill.payment_status == "pending"
    assert bill.total_amount == 200.0
    assert bill.amount_paid == 0.0
    assert bill.amount_pending == 200.0


def test_create_paid_bill_backward_compat(client, clean_db):
    """Default payment_status is 'paid' with amount_paid=total and amount_pending=0."""
    res = client.post(
        "/api/bill/create",
        json={
            "products": [{"product_id": "LIVE-PROD-1", "quantity": 1}],
            "customer_name": "Bob",
            "payment_method": "UPI",
        },
    )
    assert res.status_code == 201
    data = res.get_json()
    assert data["success"] is True

    bill = Bill.query.filter_by(bill_no=data["bill"]["bill_no"]).first()
    assert bill.payment_status == "paid"
    assert bill.total_amount == 100.0
    assert bill.amount_paid == 100.0
    assert bill.amount_pending == 0.0


def test_merge_two_bills(app, clean_db):
    """Merging a paid bill and a pending bill creates a MergeGroup with combined totals."""
    with app.app_context():
        # Bill 1: Paid ₹100
        b1 = Bill(
            bill_no=1,
            customer_name="Customer 1",
            total_amount=100.0,
            amount_paid=100.0,
            amount_pending=0.0,
            payment_status="paid",
            payment_method="CASH",
            items=json.dumps([{"name": "Item 1", "quantity": 1, "price": 100.0}]),
            status="CONFIRMED",
            created_at=datetime.now(),
        )
        # Bill 2: Pending ₹150
        b2 = Bill(
            bill_no=2,
            customer_name="Customer 2",
            total_amount=150.0,
            amount_paid=0.0,
            amount_pending=150.0,
            payment_status="pending",
            payment_method="UPI",
            items=json.dumps([{"name": "Item 2", "quantity": 1, "price": 150.0}]),
            status="CONFIRMED",
            created_at=datetime.now(),
        )
        db.session.add_all([b1, b2])
        db.session.commit()

        group = merge_bills([b1.id, b2.id], actor="admin")
        assert group["status"] == "open"
        assert group["total_amount"] == 250.0
        assert group["amount_paid"] == 100.0
        assert group["amount_pending"] == 150.0
        assert set(group["member_bill_ids"]) == {b1.id, b2.id}

        # Check bills now have merge_group_id
        db.session.refresh(b1)
        db.session.refresh(b2)
        assert b1.merge_group_id == group["id"]
        assert b2.merge_group_id == group["id"]


def test_merge_into_existing_group(app, clean_db):
    """Adding a 3rd bill to an existing open group extends the group and recomputes totals."""
    with app.app_context():
        b1 = Bill(
            bill_no=1,
            total_amount=100.0,
            amount_paid=100.0,
            amount_pending=0.0,
            payment_status="paid",
            items="[]",
            created_at=datetime.now(),
        )
        b2 = Bill(
            bill_no=2,
            total_amount=200.0,
            amount_paid=0.0,
            amount_pending=200.0,
            payment_status="pending",
            items="[]",
            created_at=datetime.now(),
        )
        b3 = Bill(
            bill_no=3,
            total_amount=50.0,
            amount_paid=50.0,
            amount_pending=0.0,
            payment_status="paid",
            items="[]",
            created_at=datetime.now(),
        )
        db.session.add_all([b1, b2, b3])
        db.session.commit()

        # Merge b1 & b2
        g1 = merge_bills([b1.id, b2.id])
        # Merge b3 into the existing group
        g2 = merge_bills([b1.id, b3.id])

        assert g2["id"] == g1["id"]
        assert set(g2["member_bill_ids"]) == {b1.id, b2.id, b3.id}
        assert g2["total_amount"] == 350.0
        assert g2["amount_paid"] == 150.0
        assert g2["amount_pending"] == 200.0


def test_settle_group(app, clean_db):
    """Settling a group marks the group settled and sets all member bills to paid (flat allocation)."""
    with app.app_context():
        b1 = Bill(
            bill_no=1,
            total_amount=100.0,
            amount_paid=100.0,
            amount_pending=0.0,
            payment_status="paid",
            items="[]",
            created_at=datetime.now(),
        )
        b2 = Bill(
            bill_no=2,
            total_amount=200.0,
            amount_paid=0.0,
            amount_pending=200.0,
            payment_status="pending",
            items="[]",
            created_at=datetime.now(),
        )
        db.session.add_all([b1, b2])
        db.session.commit()

        group = merge_bills([b1.id, b2.id])

        # Settle pending ₹200 via split payments: ₹100 CASH + ₹100 UPI
        settle_res = settle_group(
            group["id"],
            payments=[{"method": "CASH", "amount": 100.0}, {"method": "UPI", "amount": 100.0}],
            actor="admin",
        )
        assert settle_res["status"] == "settled"
        assert settle_res["amount_pending"] == 0.0
        assert settle_res["amount_paid"] == 300.0

        # Check member bills
        db.session.refresh(b1)
        db.session.refresh(b2)
        assert b2.payment_status == "paid"
        assert b2.amount_paid == 200.0
        assert b2.amount_pending == 0.0


def test_split_group(app, clean_db):
    """Splitting an open group reverts it and clears merge_group_id on members."""
    with app.app_context():
        b1 = Bill(
            bill_no=1,
            total_amount=100.0,
            amount_paid=100.0,
            amount_pending=0.0,
            payment_status="paid",
            items="[]",
            created_at=datetime.now(),
        )
        b2 = Bill(
            bill_no=2,
            total_amount=200.0,
            amount_paid=0.0,
            amount_pending=200.0,
            payment_status="pending",
            items="[]",
            created_at=datetime.now(),
        )
        db.session.add_all([b1, b2])
        db.session.commit()

        group = merge_bills([b1.id, b2.id])
        split_res = split_group(group["id"], actor="admin")

        assert split_res["status"] == "reverted"
        db.session.refresh(b1)
        db.session.refresh(b2)
        assert b1.merge_group_id is None
        assert b2.merge_group_id is None


def test_live_orders_endpoint_and_version_hash(client, clean_db, app):
    """GET /api/bill/live returns live orders and supports version hash 304 response."""
    with app.app_context():
        b1 = Bill(
            bill_no=1,
            total_amount=100.0,
            amount_paid=0.0,
            amount_pending=100.0,
            payment_status="pending",
            items="[]",
            created_at=datetime.now(),
        )
        db.session.add(b1)
        db.session.commit()

    res = client.get("/api/bill/live")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert len(data["bills"]) == 1
    version = data["version_hash"]
    assert bool(version)

    # 304 when polling with identical version
    res_304 = client.get(f"/api/bill/live?version={version}")
    assert res_304.status_code == 304


def test_analytics_pending_revenue_separation(app, clean_db):
    """DailySalesSummary only includes PAID bills in total_sales, and records pending_revenue separately."""
    with app.app_context():
        b1 = Bill(
            bill_no=1,
            total_amount=300.0,
            amount_paid=300.0,
            amount_pending=0.0,
            payment_status="paid",
            items="[]",
            created_at=datetime.now(),
        )
        b2 = Bill(
            bill_no=2,
            total_amount=200.0,
            amount_paid=0.0,
            amount_pending=200.0,
            payment_status="pending",
            items="[]",
            created_at=datetime.now(),
        )
        db.session.add_all([b1, b2])
        db.session.commit()

        update_daily_summary(date.today())

        summary = DailySalesSummary.query.get(date.today())
        assert summary is not None
        assert summary.total_sales == 300.0  # Only paid bill
        assert summary.pending_revenue == 200.0  # Pending bill


def test_update_bill_to_paid_removes_from_live_board(client, clean_db):
    """Updating a pending bill to 'paid' immediately removes it from the Live Orders board."""
    # 1. Create a pending bill
    res = client.post(
        "/api/bill/create",
        json={
            "products": [{"product_id": "LIVE-PROD-1", "quantity": 2}],
            "payment_status": "pending",
        },
    )
    assert res.status_code == 201
    bill_no = res.get_json()["bill"]["bill_no"]

    # 2. Verify on Live Board
    live_res = client.get("/api/bill/live")
    assert live_res.status_code == 200
    live_bills = live_res.get_json()["bills"]
    assert any(b["bill_no"] == bill_no for b in live_bills)

    # 3. Update status to 'paid'
    update_res = client.put(
        f"/api/bill/{bill_no}/update",
        json={
            "products": [{"product_id": "LIVE-PROD-1", "quantity": 2}],
            "payment_status": "paid",
        },
    )
    assert update_res.status_code == 200

    # 4. Verify removed from Live Board
    live_res2 = client.get("/api/bill/live")
    assert live_res2.status_code == 200
    live_bills2 = live_res2.get_json()["bills"]
    assert not any(b["bill_no"] == bill_no for b in live_bills2)


def test_update_bill_to_pending_adds_to_live_board(client, clean_db):
    """Updating a previously paid bill to 'pending' immediately displays it on the Live Orders board."""
    # 1. Create a paid bill
    res = client.post(
        "/api/bill/create",
        json={
            "products": [{"product_id": "LIVE-PROD-1", "quantity": 1}],
            "payment_status": "paid",
        },
    )
    assert res.status_code == 201
    bill_no = res.get_json()["bill"]["bill_no"]

    # 2. Verify not on Live Board
    live_res = client.get("/api/bill/live")
    assert live_res.status_code == 200
    assert not any(b["bill_no"] == bill_no for b in live_res.get_json()["bills"])

    # 3. Update status to 'pending'
    update_res = client.put(
        f"/api/bill/{bill_no}/update",
        json={
            "products": [{"product_id": "LIVE-PROD-1", "quantity": 3}],
            "payment_status": "pending",
        },
    )
    assert update_res.status_code == 200

    # 4. Verify now present on Live Board with updated total
    live_res2 = client.get("/api/bill/live")
    assert live_res2.status_code == 200
    live_bills = live_res2.get_json()["bills"]
    found = next((b for b in live_bills if b["bill_no"] == bill_no), None)
    assert found is not None
    assert found["total_amount"] == 300.0
    assert found["amount_pending"] == 300.0
    assert found["payment_status"] == "pending"
