# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: billing.spec.js >> POS Layout Reordering >> allows entering, reordering categories/products, cancelling and saving
- Location: tests\e2e\billing.spec.js:177:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('button:has-text("Done")')
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button:has-text("Done")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - button "BB" [ref=e7] [cursor=pointer]:
        - img [ref=e9]
        - generic [ref=e10]: BB
      - button "Start New Bill" [ref=e11] [cursor=pointer]
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
            - generic [ref=e64]: ★ Favorites
            - list [ref=e65]:
              - listitem [ref=e66]:
                - generic [ref=e67]:
                  - img [ref=e68]
                  - generic [ref=e70]: Burger
              - listitem [ref=e71]:
                - generic [ref=e72]:
                  - img [ref=e73]
                  - generic [ref=e75]: Drinks
              - listitem [ref=e76]:
                - generic [ref=e77]:
                  - img [ref=e78]
                  - generic [ref=e80]: Glass
              - listitem [ref=e81]:
                - generic [ref=e82]:
                  - img [ref=e83]
                  - generic [ref=e85]: Pizza
              - listitem [ref=e86]:
                - generic [ref=e87]:
                  - img [ref=e88]
                  - generic [ref=e90]: Juice
              - listitem [ref=e91]:
                - generic [ref=e92]:
                  - img [ref=e93]
                  - generic [ref=e95]: Sandwich
              - listitem [ref=e96]:
                - generic [ref=e97]:
                  - img [ref=e98]
                  - generic [ref=e100]: Cane
              - listitem [ref=e101]:
                - generic [ref=e102]:
                  - img [ref=e103]
                  - generic [ref=e105]: French Fries
              - listitem [ref=e106]:
                - generic [ref=e107]:
                  - img [ref=e108]
                  - generic [ref=e110]: Garlic Bread
              - listitem [ref=e111]:
                - generic [ref=e112]:
                  - img [ref=e113]
                  - generic [ref=e115]: Large
              - listitem [ref=e116]:
                - generic [ref=e117]:
                  - img [ref=e118]
                  - generic [ref=e120]: Other
              - listitem [ref=e121]:
                - generic [ref=e122]:
                  - img [ref=e123]
                  - generic [ref=e125]: Swaminarayan
        - button "All Groups" [ref=e130]:
          - generic [ref=e132]: All Groups
      - generic [ref=e134]:
        - generic [ref=e135]:
          - heading "★ Favorites Editing Layout" [level=2] [ref=e136]:
            - text: ★ Favorites
            - generic [ref=e137]: Editing Layout
          - generic [ref=e138]:
            - button "Live Board" [ref=e139] [cursor=pointer]:
              - generic [ref=e141]: Live Board
              - img [ref=e142]
            - button "Cancel" [ref=e145] [cursor=pointer]:
              - img [ref=e146]
              - text: Cancel
            - button "Done" [ref=e148] [cursor=pointer]:
              - img [ref=e149]
              - text: Done
        - generic [ref=e151]:
          - generic [ref=e153]:
            - img [ref=e155]
            - heading "Burger A" [level=4] [ref=e157]
            - generic [ref=e158]:
              - generic [ref=e159]: ₹100
              - img [ref=e161]
          - generic [ref=e164]:
            - img [ref=e166]
            - heading "Burger B" [level=4] [ref=e168]
            - generic [ref=e169]:
              - generic [ref=e170]: ₹120
              - img [ref=e172]
      - generic [ref=e174]:
        - generic [ref=e175]:
          - generic [ref=e176]:
            - heading "Current Bill 0 items" [level=3] [ref=e177]:
              - text: Current Bill
              - generic [ref=e178]: 0 items
            - button "Clear All" [disabled] [ref=e179]:
              - img [ref=e180]
              - generic [ref=e183]: Clear All
          - generic [ref=e184]:
            - button "Dine In" [ref=e185] [cursor=pointer]
            - button "Takeaway" [ref=e186] [cursor=pointer]
          - generic [ref=e187]:
            - button "Table No" [ref=e188] [cursor=pointer]
            - button "KOT No" [ref=e189] [cursor=pointer]
            - button "Cus.Name" [ref=e190] [cursor=pointer]
            - button "Cus.Num" [ref=e191] [cursor=pointer]
          - generic [ref=e192]:
            - img [ref=e194]
            - generic [ref=e197]: Your cart is empty
            - generic [ref=e198]: Add items to create a bill
        - generic [ref=e199]:
          - generic [ref=e200]:
            - button "Paid" [ref=e201] [cursor=pointer]:
              - img [ref=e202]
              - text: Paid
            - button "Mark Pending" [ref=e204] [cursor=pointer]:
              - img [ref=e205]
              - text: Mark Pending
          - generic [ref=e208]:
            - generic [ref=e209]:
              - img [ref=e211]
              - generic [ref=e215]: Total Amount
            - generic [ref=e216]: ₹0
          - generic [ref=e217]:
            - button "Save Only" [ref=e218] [cursor=pointer]:
              - img [ref=e220]
              - text: Save Only
            - button "Print KOT" [ref=e222] [cursor=pointer]:
              - img [ref=e224]
              - text: Print KOT
            - button "Print Bill" [ref=e229] [cursor=pointer]:
              - img [ref=e231]
              - text: Print Bill
            - button "BILL & KOT" [ref=e234] [cursor=pointer]:
              - img [ref=e235]
              - text: BILL & KOT
```

# Test source

```ts
  196 |             {
  197 |               product_id: "TEST-A",
  198 |               name: "Burger A",
  199 |               price: 100,
  200 |               category: "Food",
  201 |               category_id: 1,
  202 |               active: true,
  203 |               favorite: true,
  204 |               display_order: 0
  205 |             },
  206 |             {
  207 |               product_id: "TEST-B",
  208 |               name: "Burger B",
  209 |               price: 120,
  210 |               category: "Food",
  211 |               category_id: 1,
  212 |               active: true,
  213 |               favorite: true,
  214 |               display_order: 1
  215 |             }
  216 |           ]
  217 |         })
  218 |       });
  219 |     });
  220 | 
  221 |     await page.route("**/api/pos/bootstrap", async (route) => {
  222 |       await route.fulfill({
  223 |         status: 200,
  224 |         contentType: "application/json",
  225 |         body: JSON.stringify({
  226 |           success: true,
  227 |           categories: [
  228 |             { id: 1, name: "Food", display_order: 0 },
  229 |             { id: 2, name: "Drinks", display_order: 1 }
  230 |           ],
  231 |           products: [
  232 |             {
  233 |               product_id: "TEST-A",
  234 |               name: "Burger A",
  235 |               price: 100,
  236 |               category: "Food",
  237 |               category_id: 1,
  238 |               active: true,
  239 |               favorite: true,
  240 |               display_order: 0
  241 |             },
  242 |             {
  243 |               product_id: "TEST-B",
  244 |               name: "Burger B",
  245 |               price: 120,
  246 |               category: "Food",
  247 |               category_id: 1,
  248 |               active: true,
  249 |               favorite: true,
  250 |               display_order: 1
  251 |             }
  252 |           ],
  253 |           workers: [],
  254 |           settings: {},
  255 |           next_bill_number: 1
  256 |         })
  257 |       });
  258 |     });
  259 | 
  260 |     // Mock the reorder API endpoints
  261 |     let categoriesReordered = false;
  262 |     let productsReordered = false;
  263 | 
  264 |     await page.route("**/api/categories/reorder", async (route) => {
  265 |       categoriesReordered = true;
  266 |       await route.fulfill({
  267 |         status: 200,
  268 |         contentType: "application/json",
  269 |         body: JSON.stringify({ success: true, message: "Categories reordered successfully" })
  270 |       });
  271 |     });
  272 | 
  273 |     await page.route("**/api/products/reorder", async (route) => {
  274 |       productsReordered = true;
  275 |       await route.fulfill({
  276 |         status: 200,
  277 |         contentType: "application/json",
  278 |         body: JSON.stringify({ success: true, message: "Products reordered successfully" })
  279 |       });
  280 |     });
  281 | 
  282 |     await goToBillingScreen(page);
  283 | 
  284 |     // Wait for the product cards to render, guaranteeing state synchronization
  285 |     await expect(page.locator('text=Burger A').first()).toBeVisible();
  286 | 
  287 |     // 2. Locate and click "Edit Layout" button
  288 |     const editLayoutBtn = page.locator('button:has-text("Edit Layout")');
  289 |     await expect(editLayoutBtn).toBeVisible();
  290 |     await editLayoutBtn.click();
  291 | 
  292 |     // 3. Verify Edit Mode indicators
  293 |     const cancelBtn = page.locator('button:has-text("Cancel")');
  294 |     const doneBtn = page.locator('button:has-text("Done")');
  295 |     await expect(cancelBtn).toBeVisible();
> 296 |     await expect(doneBtn).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
  297 | 
  298 |     // 4. Click Cancel and verify we exit Edit Mode
  299 |     await cancelBtn.click();
  300 |     await expect(editLayoutBtn).toBeVisible();
  301 |     await expect(doneBtn).not.toBeVisible();
  302 | 
  303 |     // 5. Enter Edit Mode again and click Done to verify reordering persistence
  304 |     await editLayoutBtn.click();
  305 |     await expect(doneBtn).toBeVisible();
  306 |     await doneBtn.click();
  307 | 
  308 |     // Verify the APIs were triggered on Done click
  309 |     expect(categoriesReordered).toBe(true);
  310 |     expect(productsReordered).toBe(true);
  311 | 
  312 |     // Assert that no uncaught runtime exceptions occurred during test execution
  313 |     expect(pageErrors).toHaveLength(0);
  314 |   });
  315 | });
  316 | 
```