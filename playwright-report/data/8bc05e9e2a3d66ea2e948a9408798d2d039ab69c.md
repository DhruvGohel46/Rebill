# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing.spec.js >> Billing Screen >> billing page renders product list
- Location: tests\e2e\billing.spec.js:52:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.innerText: Target page, context or browser has been closed
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "BB" [ref=e7] [cursor=pointer]:
        - img [ref=e9]
        - generic [ref=e10]: BB
      - button "Start New Bill" [active] [ref=e11] [cursor=pointer]
      - button "Calculator" [ref=e12] [cursor=pointer]:
        - img [ref=e13]
        - text: Calculator
    - heading "InfoOS InfoOS (Burger Bhau (Kohariya))" [level=1] [ref=e15]:
      - img "InfoOS" [ref=e16]
      - generic [ref=e17]: InfoOS
      - generic [ref=e18]: (Burger Bhau (Kohariya))
    - generic [ref=e19]:
      - generic [ref=e20]:
        - img [ref=e21]
        - generic [ref=e33]: Thu, Sep 03
      - generic [ref=e34]:
        - generic "Worker mode active" [ref=e35]:
          - button "Owner" [ref=e37] [cursor=pointer]:
            - img [ref=e38]
            - text: Owner
          - button "Worker" [ref=e41] [cursor=pointer]:
            - img [ref=e42]
            - text: Worker
        - button "73 unread notifications" [ref=e45] [cursor=pointer]:
          - img [ref=e46]
        - button "Switch to Dark Mode" [ref=e48] [cursor=pointer]:
          - img [ref=e49]
  - main [ref=e51]:
    - generic [ref=e52]:
      - generic [ref=e53]:
        - generic [ref=e56]:
          - generic:
            - img
          - textbox "Search categories..." [ref=e57]
          - generic [ref=e58]:
            - generic: /
        - generic [ref=e59]:
          - heading "Categories" [level=4] [ref=e61]
          - generic [ref=e62]:
            - button "★ Favorites" [ref=e63] [cursor=pointer]:
              - generic [ref=e66]: ★ Favorites
            - button "Burger" [ref=e67] [cursor=pointer]:
              - generic [ref=e69]: Burger
            - button "Drinks" [ref=e70] [cursor=pointer]:
              - generic [ref=e72]: Drinks
            - button "Glass" [ref=e73] [cursor=pointer]:
              - generic [ref=e75]: Glass
            - button "Pizza" [ref=e76] [cursor=pointer]:
              - generic [ref=e78]: Pizza
            - button "Juice" [ref=e79] [cursor=pointer]:
              - generic [ref=e81]: Juice
            - button "Sandwich" [ref=e82] [cursor=pointer]:
              - generic [ref=e84]: Sandwich
            - button "Cane" [ref=e85] [cursor=pointer]:
              - generic [ref=e87]: Cane
            - button "French Fries" [ref=e88] [cursor=pointer]:
              - generic [ref=e90]: French Fries
            - button "Garlic Bread" [ref=e91] [cursor=pointer]:
              - generic [ref=e93]: Garlic Bread
            - button "Large" [ref=e94] [cursor=pointer]:
              - generic [ref=e96]: Large
            - button "Other" [ref=e97] [cursor=pointer]:
              - generic [ref=e99]: Other
            - button "Swaminarayan" [ref=e100] [cursor=pointer]:
              - generic [ref=e102]: Swaminarayan
        - button "All Groups" [ref=e107]:
          - generic [ref=e109]: All Groups
      - generic [ref=e111]:
        - generic [ref=e112]:
          - heading "★ Favorites" [level=2] [ref=e113]
          - generic [ref=e114]:
            - button "Live Board" [ref=e115] [cursor=pointer]:
              - generic [ref=e117]: Live Board
              - img [ref=e118]
            - button "Edit Layout" [ref=e121] [cursor=pointer]:
              - img [ref=e122]
              - text: Edit Layout
        - generic [ref=e125]:
          - generic [ref=e127]:
            - heading "Aloo tikki Burger" [level=4] [ref=e128]
            - generic [ref=e129]:
              - button "Without Cheese ₹40" [ref=e130] [cursor=pointer]:
                - generic [ref=e131]:
                  - generic [ref=e132]: Without
                  - generic [ref=e133]: Cheese
                - generic [ref=e134]: ₹40
              - button "With Cheese ₹50" [ref=e135] [cursor=pointer]:
                - generic [ref=e136]:
                  - generic [ref=e137]: With
                  - generic [ref=e138]: Cheese
                - generic [ref=e139]: ₹50
          - generic [ref=e141] [cursor=pointer]:
            - heading "Pepsi" [level=4] [ref=e142]
            - generic [ref=e143]:
              - generic [ref=e144]: ₹20
              - img [ref=e146]
          - generic [ref=e149]:
            - heading "Schezwan Burger" [level=4] [ref=e150]
            - generic [ref=e151]:
              - button "Without Cheese ₹40" [ref=e152] [cursor=pointer]:
                - generic [ref=e153]:
                  - generic [ref=e154]: Without
                  - generic [ref=e155]: Cheese
                - generic [ref=e156]: ₹40
              - button "With Cheese ₹50" [ref=e157] [cursor=pointer]:
                - generic [ref=e158]:
                  - generic [ref=e159]: With
                  - generic [ref=e160]: Cheese
                - generic [ref=e161]: ₹50
          - generic [ref=e163] [cursor=pointer]:
            - heading "Slice" [level=4] [ref=e164]
            - generic [ref=e165]:
              - generic [ref=e166]: ₹20
              - img [ref=e168]
          - generic [ref=e171]:
            - heading "Creamy Garlic Burger" [level=4] [ref=e172]
            - generic [ref=e173]:
              - button "Without Cheese ₹40" [ref=e174] [cursor=pointer]:
                - generic [ref=e175]:
                  - generic [ref=e176]: Without
                  - generic [ref=e177]: Cheese
                - generic [ref=e178]: ₹40
              - button "With Cheese ₹50" [ref=e179] [cursor=pointer]:
                - generic [ref=e180]:
                  - generic [ref=e181]: With
                  - generic [ref=e182]: Cheese
                - generic [ref=e183]: ₹50
          - generic [ref=e185] [cursor=pointer]:
            - heading "Mirinda" [level=4] [ref=e186]
            - generic [ref=e187]:
              - generic [ref=e188]: ₹20
              - img [ref=e190]
          - generic [ref=e193] [cursor=pointer]:
            - heading "Sosyo" [level=4] [ref=e194]
            - generic [ref=e195]:
              - generic [ref=e196]: ₹20
              - img [ref=e198]
          - generic [ref=e201]:
            - heading "Stuffed Burger" [level=4] [ref=e202]
            - generic [ref=e203]:
              - button "Without Cheese ₹50" [ref=e204] [cursor=pointer]:
                - generic [ref=e205]:
                  - generic [ref=e206]: Without
                  - generic [ref=e207]: Cheese
                - generic [ref=e208]: ₹50
              - button "With Cheese ₹60" [ref=e209] [cursor=pointer]:
                - generic [ref=e210]:
                  - generic [ref=e211]: With
                  - generic [ref=e212]: Cheese
                - generic [ref=e213]: ₹60
          - generic [ref=e215] [cursor=pointer]:
            - heading "Fanta" [level=4] [ref=e216]
            - generic [ref=e217]:
              - generic [ref=e218]: ₹20
              - img [ref=e220]
          - generic [ref=e223]:
            - heading "Punjabi Makni Burger" [level=4] [ref=e224]
            - generic [ref=e225]:
              - button "Without Cheese ₹50" [ref=e226] [cursor=pointer]:
                - generic [ref=e227]:
                  - generic [ref=e228]: Without
                  - generic [ref=e229]: Cheese
                - generic [ref=e230]: ₹50
              - button "With Cheese ₹60" [ref=e231] [cursor=pointer]:
                - generic [ref=e232]:
                  - generic [ref=e233]: With
                  - generic [ref=e234]: Cheese
                - generic [ref=e235]: ₹60
          - generic [ref=e237] [cursor=pointer]:
            - heading "Chass" [level=4] [ref=e238]
            - generic [ref=e239]:
              - generic [ref=e240]: ₹20
              - img [ref=e242]
          - generic [ref=e245] [cursor=pointer]:
            - heading "Cheese Chilli Sandwich" [level=4] [ref=e246]
            - generic [ref=e247]:
              - generic [ref=e248]: ₹30
              - img [ref=e250]
          - generic [ref=e253] [cursor=pointer]:
            - heading "Juice" [level=4] [ref=e254]
            - generic [ref=e255]:
              - generic [ref=e256]: ₹10
              - img [ref=e258]
          - generic [ref=e261] [cursor=pointer]:
            - heading "Masala Tikki Sandwich" [level=4] [ref=e262]
            - generic [ref=e263]:
              - generic [ref=e264]: ₹60
              - img [ref=e266]
          - generic [ref=e269] [cursor=pointer]:
            - heading "7 Up" [level=4] [ref=e270]
            - generic [ref=e271]:
              - generic [ref=e272]: ₹20
              - img [ref=e274]
          - generic [ref=e277] [cursor=pointer]:
            - heading "Classic Salted Fries" [level=4] [ref=e278]
            - generic [ref=e279]:
              - generic [ref=e280]: ₹50
              - img [ref=e282]
          - generic [ref=e285] [cursor=pointer]:
            - heading "Mountain Dew" [level=4] [ref=e286]
            - generic [ref=e287]:
              - generic [ref=e288]: ₹20
              - img [ref=e290]
          - generic [ref=e293] [cursor=pointer]:
            - heading "Peri Peri Fries" [level=4] [ref=e294]
            - generic [ref=e295]:
              - generic [ref=e296]: ₹60
              - img [ref=e298]
          - generic [ref=e301] [cursor=pointer]:
            - heading "COOL LUSI" [level=4] [ref=e302]
            - generic [ref=e303]:
              - generic [ref=e304]: ₹20
              - img [ref=e306]
          - generic [ref=e309] [cursor=pointer]:
            - heading "Cheese Garlic Bread" [level=4] [ref=e310]
            - generic [ref=e311]:
              - generic [ref=e312]: ₹50
              - img [ref=e314]
          - generic [ref=e317]:
            - heading "Tandoori Tadka Burger" [level=4] [ref=e318]
            - generic [ref=e319]:
              - button "Without Cheese ₹50" [ref=e320] [cursor=pointer]:
                - generic [ref=e321]:
                  - generic [ref=e322]: Without
                  - generic [ref=e323]: Cheese
                - generic [ref=e324]: ₹50
              - button "With Cheese ₹60" [ref=e325] [cursor=pointer]:
                - generic [ref=e326]:
                  - generic [ref=e327]: With
                  - generic [ref=e328]: Cheese
                - generic [ref=e329]: ₹60
          - generic [ref=e331]:
            - heading "Thumbs up" [level=4] [ref=e332]
            - generic [ref=e333]:
              - button "Sugar Free ₹10" [ref=e334] [cursor=pointer]:
                - generic [ref=e335]:
                  - generic [ref=e336]: Sugar
                  - generic [ref=e337]: Free
                - generic [ref=e338]: ₹10
              - button "With Suger ₹20" [ref=e339] [cursor=pointer]:
                - generic [ref=e340]:
                  - generic [ref=e341]: With
                  - generic [ref=e342]: Suger
                - generic [ref=e343]: ₹20
          - generic [ref=e345]:
            - heading "Herb Burger" [level=4] [ref=e346]
            - generic [ref=e347]:
              - button "Without Cheese ₹50" [ref=e348] [cursor=pointer]:
                - generic [ref=e349]:
                  - generic [ref=e350]: Without
                  - generic [ref=e351]: Cheese
                - generic [ref=e352]: ₹50
              - button "With Cheese ₹60" [ref=e353] [cursor=pointer]:
                - generic [ref=e354]:
                  - generic [ref=e355]: With
                  - generic [ref=e356]: Cheese
                - generic [ref=e357]: ₹60
          - generic [ref=e359]:
            - heading "Sprite" [level=4] [ref=e360]
            - generic [ref=e361]:
              - button "Suger-Free ₹10" [ref=e362] [cursor=pointer]:
                - generic [ref=e364]: Suger-Free
                - generic [ref=e365]: ₹10
              - button "With Suger ₹20" [ref=e366] [cursor=pointer]:
                - generic [ref=e367]:
                  - generic [ref=e368]: With
                  - generic [ref=e369]: Suger
                - generic [ref=e370]: ₹20
          - generic [ref=e372] [cursor=pointer]:
            - heading "Veg Pizza" [level=4] [ref=e373]
            - generic [ref=e374]:
              - generic [ref=e375]: ₹50
              - img [ref=e377]
          - generic [ref=e380]:
            - heading "Water" [level=4] [ref=e381]
            - generic [ref=e382]:
              - button "Small ₹10" [ref=e383] [cursor=pointer]:
                - generic [ref=e385]: Small
                - generic [ref=e386]: ₹10
              - button "Big ₹20" [ref=e387] [cursor=pointer]:
                - generic [ref=e389]: Big
                - generic [ref=e390]: ₹20
          - generic [ref=e392]:
            - heading "Chocolate paan" [level=4] [ref=e393]
            - generic [ref=e394]:
              - button "Small ₹20" [ref=e395] [cursor=pointer]:
                - generic [ref=e397]: Small
                - generic [ref=e398]: ₹20
              - button "Big ₹40" [ref=e399] [cursor=pointer]:
                - generic [ref=e401]: Big
                - generic [ref=e402]: ₹40
          - generic [ref=e404] [cursor=pointer]:
            - heading "Margherita Pizza" [level=4] [ref=e405]
            - generic [ref=e406]:
              - generic [ref=e407]: ₹80
              - img [ref=e409]
          - generic [ref=e412] [cursor=pointer]:
            - heading "Coca-Cola" [level=4] [ref=e413]
            - generic [ref=e414]:
              - generic [ref=e415]: ₹10
              - img [ref=e417]
          - generic [ref=e420] [cursor=pointer]:
            - heading "Double Cheese Veg Pizza" [level=4] [ref=e421]
            - generic [ref=e422]:
              - generic [ref=e423]: ₹80
              - img [ref=e425]
          - generic [ref=e428] [cursor=pointer]:
            - heading "4 Cheese Pizza (7 inch)" [level=4] [ref=e429]
            - generic [ref=e430]:
              - generic [ref=e431]: ₹100
              - img [ref=e433]
      - generic [ref=e435]:
        - generic [ref=e436]:
          - generic [ref=e437]:
            - heading "Current Bill 0 items" [level=3] [ref=e438]:
              - text: Current Bill
              - generic [ref=e439]: 0 items
            - button "Clear All" [disabled] [ref=e440]:
              - img [ref=e441]
              - generic [ref=e444]: Clear All
          - generic [ref=e445]:
            - button "Dine In" [ref=e446] [cursor=pointer]
            - button "Takeaway" [ref=e447] [cursor=pointer]
          - generic [ref=e448]:
            - button "Table No" [ref=e449] [cursor=pointer]
            - button "KOT No" [ref=e450] [cursor=pointer]
            - button "Cus.Name" [ref=e451] [cursor=pointer]
            - button "Cus.Num" [ref=e452] [cursor=pointer]
          - generic [ref=e453]:
            - img [ref=e455]
            - generic [ref=e458]: Your cart is empty
            - generic [ref=e459]: Add items to create a bill
        - generic [ref=e460]:
          - generic [ref=e461]:
            - button "Paid" [ref=e462] [cursor=pointer]:
              - img [ref=e463]
              - text: Paid
            - button "Mark Pending" [ref=e465] [cursor=pointer]:
              - img [ref=e466]
              - text: Mark Pending
          - generic [ref=e469]:
            - generic [ref=e470]:
              - img [ref=e472]
              - generic [ref=e476]: Total Amount
            - generic [ref=e477]: ₹0
          - generic [ref=e478]:
            - button "Save Only" [ref=e479] [cursor=pointer]:
              - img [ref=e481]
              - text: Save Only
            - button "Print KOT" [ref=e483] [cursor=pointer]:
              - img [ref=e485]
              - text: Print KOT
            - button "Print Bill" [ref=e490] [cursor=pointer]:
              - img [ref=e492]
              - text: Print Bill
            - button "BILL & KOT" [ref=e495] [cursor=pointer]:
              - img [ref=e496]
              - text: BILL & KOT
```

# Test source

```ts
  1   | // @ts-check
  2   | const { test, expect } = require("@playwright/test");
  3   | 
  4   | /**
  5   |  * E2E tests for the InfoBill billing screen.
  6   |  *
  7   |  * These tests run against the React dev server (http://localhost:3050).
  8   |  * The backend must be running at http://localhost:5050 for full integration.
  9   |  * For CI, the backend is mocked via route intercepts where needed.
  10  |  */
  11  | 
  12  | // ─── Helpers ──────────────────────────────────────────────────────────────────
  13  | 
  14  | /**
  15  |  * Navigate to the POS billing screen and wait for it to load.
  16  |  * @param {import('@playwright/test').Page} page
  17  |  */
  18  | async function goToBillingScreen(page) {
  19  |   await page.goto("/");
  20  |   // Wait for the app shell to render
  21  |   await page.waitForSelector("body", { timeout: 10_000 });
  22  | 
  23  |   // Click on the "Bill" or "POS" nav item — adjust selector to match your sidebar
  24  |   const billingLink = page.locator('[data-testid="nav-bill"], a[href*="bill"], button:has-text("Bill")').first();
  25  |   if (await billingLink.isVisible()) {
  26  |     await billingLink.click();
  27  |   }
  28  | }
  29  | 
  30  | // ─── Tests ────────────────────────────────────────────────────────────────────
  31  | 
  32  | test.describe("Billing Screen", () => {
  33  |   test("app loads without crashing", async ({ page }) => {
  34  |     /**
  35  |      * Smoke test: the React app should load with no uncaught JS errors.
  36  |      */
  37  |     /** @type {string[]} */
  38  |     const errors = [];
  39  |     page.on("pageerror", (err) => errors.push(err.message));
  40  | 
  41  |     await page.goto("/");
  42  |     await page.waitForLoadState("domcontentloaded");
  43  | 
  44  |     // No JS crashes
  45  |     expect(errors).toHaveLength(0);
  46  | 
  47  |     // Some root element should be visible
  48  |     const root = page.locator("#root");
  49  |     await expect(root).toBeVisible();
  50  |   });
  51  | 
  52  |   test("billing page renders product list", async ({ page }) => {
  53  |     /**
  54  |      * The billing screen should display at least one product card
  55  |      * or a loading/empty state — it must not be a blank screen.
  56  |      */
  57  |     // Intercept the products API so this test works without a live backend
  58  |     await page.route("**/api/products**", async (route) => {
  59  |       await route.fulfill({
  60  |         status: 200,
  61  |         contentType: "application/json",
  62  |         body: JSON.stringify({
  63  |           success: true,
  64  |           products: [
  65  |             {
  66  |               product_id: "TEST-1",
  67  |               name: "Test Burger",
  68  |               price: 100,
  69  |               category: "Food",
  70  |               active: true,
  71  |             },
  72  |           ],
  73  |         }),
  74  |       });
  75  |     });
  76  | 
  77  |     await goToBillingScreen(page);
  78  | 
  79  |     // Wait for either a product card OR an empty/loading state
  80  |     const productOrEmpty = page.locator(
  81  |       '[data-testid="product-card"], [data-testid="empty-products"], .product-card, .product-item'
  82  |     );
  83  |     // Give it up to 8s to appear
  84  |     await productOrEmpty.first().waitFor({ timeout: 8_000 }).catch(() => {});
  85  | 
  86  |     // Page must not be blank
> 87  |     const bodyText = await page.locator("body").innerText();
      |                                                 ^ Error: locator.innerText: Target page, context or browser has been closed
  88  |     expect(bodyText.length).toBeGreaterThan(10);
  89  |   });
  90  | 
  91  |   test("offline bill queuing — shows toast when backend is down", async ({ page }) => {
  92  |     /**
  93  |      * Simulate the backend being unreachable:
  94  |      * - Block all /api/bill/create requests
  95  |      * - Try to save a bill
  96  |      * - Expect an offline/error notification to appear
  97  |      */
  98  |     // Block all bill creation requests
  99  |     await page.route("**/api/bill/create", async (route) => {
  100 |       await route.abort("failed");
  101 |     });
  102 | 
  103 |     // Also intercept products to return one item
  104 |     await page.route("**/api/products**", async (route) => {
  105 |       await route.fulfill({
  106 |         status: 200,
  107 |         contentType: "application/json",
  108 |         body: JSON.stringify({
  109 |           success: true,
  110 |           products: [
  111 |             {
  112 |               product_id: "TEST-1",
  113 |               name: "Test Burger",
  114 |               price: 100,
  115 |               category: "Food",
  116 |               active: true,
  117 |             },
  118 |           ],
  119 |         }),
  120 |       });
  121 |     });
  122 | 
  123 |     await goToBillingScreen(page);
  124 | 
  125 |     // Try to click the save/checkout button if visible
  126 |     const saveBtn = page.locator(
  127 |       '[data-testid="save-bill"], button:has-text("Save"), button:has-text("Checkout"), button:has-text("Bill")'
  128 |     ).first();
  129 | 
  130 |     if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
  131 |       await saveBtn.click();
  132 | 
  133 |       // Wait for any toast/notification to appear
  134 |       const toast = page.locator(
  135 |         '[data-testid="toast"], .toast, .notification, [role="alert"]'
  136 |       );
  137 |       await toast.first().waitFor({ timeout: 5_000 }).catch(() => {});
  138 |     }
  139 | 
  140 |     // Test passes as long as the page didn't crash
  141 |     await expect(page.locator("#root")).toBeVisible();
  142 |   });
  143 | });
  144 | 
  145 | test.describe("Navigation", () => {
  146 |   test("all main nav links are reachable", async ({ page }) => {
  147 |     /**
  148 |      * Click through main navigation items and verify no JS errors occur.
  149 |      */
  150 |     /** @type {string[]} */
  151 |     const errors = [];
  152 |     page.on("pageerror", (err) => errors.push(err.message));
  153 | 
  154 |     await page.goto("/");
  155 |     await page.waitForLoadState("domcontentloaded");
  156 | 
  157 |     // Find all nav links/buttons
  158 |     const navItems = page.locator("nav a, nav button, aside a, aside button");
  159 |     const count = await navItems.count();
  160 | 
  161 |     // Visit up to 5 nav items
  162 |     for (let i = 0; i < Math.min(count, 5); i++) {
  163 |       const item = navItems.nth(i);
  164 |       if (await item.isVisible()) {
  165 |         await item.click();
  166 |         await page.waitForLoadState("domcontentloaded");
  167 |         // Small pause for any animations
  168 |         await page.waitForTimeout(300);
  169 |       }
  170 |     }
  171 | 
  172 |     expect(errors).toHaveLength(0);
  173 |   });
  174 | });
  175 | 
  176 | test.describe("POS Layout Reordering", () => {
  177 |   test("allows entering, reordering categories/products, cancelling and saving", async ({ page }) => {
  178 |     // Clear localStorage to avoid contamination from other tests
  179 |     await page.addInitScript(() => {
  180 |       window.localStorage.clear();
  181 |     });
  182 | 
  183 |     // Capture page errors to ensure no console/runtime crashes occur
  184 |     /** @type {any[]} */
  185 |     const pageErrors = [];
  186 |     page.on("pageerror", (err) => pageErrors.push(err.message));
  187 | 
```