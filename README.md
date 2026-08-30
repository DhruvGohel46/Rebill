# InfoOS Desktop - Next-Generation Offline POS & Enterprise Store Management

[![Version](https://img.shields.io/badge/version-30.2.10-orange.svg)](package.json)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Cross--Platform-blue.svg)](electron/main.js)
[![Stack](https://img.shields.io/badge/stack-Electron%20%7C%20React%2018%20%7C%20Python%20Flask%20%7C%20SQLite-brightgreen.svg)](package.json)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](electron/assets/license.txt)

> **InfoOS Desktop** is a zero-latency, 100% offline-first Point of Sale (POS) and comprehensive retail/restaurant operations suite built for high-throughput billing, inventory control, automated staff payroll, daily expense tracking, and real-time sales analytics.

---

## ⚡ 10-Second Executive Summary

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                     INFOOS AT A GLANCE                                  │
├──────────────────────────┬───────────────────────────┬──────────────────────────────────┤
│ 🛒 High-Speed POS        │ ⚡ Live Orders & Merging  │ 📊 Analytics & BI                │
│ • Sub-second checkout    │ • Drag-to-Merge billing   │ • Pre-aggregated instant stats   │
│ • ESC/POS 58/80mm print  │ • Split / Settle payments │ • Real-time revenue & net profit │
│ • KOT kitchen routing    │ • Un-merge audit trail    │ • Pending revenue separation     │
├──────────────────────────┼───────────────────────────┼──────────────────────────────────┤
│ 📦 Inventory & Menu      │ 👥 Worker & Payroll       │ 🤖 Autonomous AI Agents          │
│ • Direct sale & raw mats │ • Attendance tracking     │ • Multi-agent state graph runner │
│ • Variations & modifiers │ • Advances & salary calc  │ • 0-token deterministic router   │
│ • Live <1s group sync    │ • Role-Based PIN Lock     │ • Human-in-the-loop approvals    │
└──────────────────────────┴───────────────────────────┴──────────────────────────────────┘
```

---

## 🏛️ System Architecture Topology

InfoOS Desktop follows a **three-tier offline local hybrid architecture**:
1. **Frontend Presentation**: React 18 inside an Electron container with GPU-accelerated glassmorphic UI, `@dnd-kit/core` drag-and-drop order canvas, load-once context state caching, and responsive typography scaling.
2. **Local Middleware API**: An embedded Python 3 Flask REST service providing business logic, SQLite ORM models, background aggregation workers, state graph agent orchestration, and AI ONNX models.
3. **Device & Persistence Layer**: Zero-dependency local SQLite database (`products.db`), direct ESC/POS hardware printer spoolers, and secure IPC bridges.

```mermaid
flowchart TB
    subgraph UI_Tier [Tier 1: Electron and React Presentation Layer]
        Shell["Electron Main Process (main.js)"]
        IPC["Secure IPC Bridge (preload.js)"]
        ReactApp["React 18 Single Page App (App.jsx)"]
        
        subgraph UI_Screens [Active Screen Nodes]
            POS_Screen["POS Billing (/ - Bill.jsx)"]
            Live_Screen["Live Orders & Merge (/live - LiveOrders.jsx)"]
            Analytics_Screen["Analytics and Reports (/analytics)"]
            Inventory_Screen["Inventory Management (/inventory)"]
            Product_Screen["Catalog and Groups (/management)"]
            Workers_Screen["Staff and Payroll (/workers)"]
            Expenses_Screen["Expense Tracking (/expenses)"]
            Reminders_Screen["Reminders and Tasks (/reminders)"]
            Settings_Screen["System and Hardware (/settings)"]
        end

        subgraph State_Engine [Context and State Engine]
            POSCtx["POSDataContext (Catalog Cache)"]
            AuthCtx["AuthContext (Admin/Worker RBAC)"]
            NotifCtx["NotificationContext (Alert Bus)"]
            SettingsCtx["SettingsContext (Store Config)"]
        end
    end

    subgraph Backend_Tier [Tier 2: Embedded Python Flask API Layer]
        Flask["Flask REST API Gateway (app.py : 5050)"]
        
        subgraph Route_Handlers [REST Route Handlers]
            R_Billing["/api/billing (Transactions & Merge)"]
            R_Agents["/api/agents (Agentic State Graph)"]
            R_Products["/api/products and /groups"]
            R_Inventory["/api/inventory (Stock)"]
            R_Workers["/api/workers and /worker_types"]
            R_Expenses["/api/expenses (Spend)"]
            R_Analytics["/api/summary and /reports"]
            R_Reminders["/api/reminders and /notifications"]
        end

        subgraph Core_Services [Background and Processing Services]
            LiveService["Live Order Service (Merge / Settle / Split)"]
            AgentGraphRunner["AgentGraph State Machine (Checkpoints)"]
            AggService["Aggregation Service (Daily Summary)"]
            PrintService["ESC/POS Formatter (printer_service.py)"]
            ExcelService["Excel and XLSX Service"]
            AIModel["AI Image Normalizer (ONNX rembg)"]
        end
    end

    subgraph Storage_Hardware [Tier 3: Local Hardware and Storage]
        DB[("Local SQLite Storage (products.db)")]
        Printers["Thermal Printers (USB / LAN / Windows)"]
        FileSystem["Local Export and Backup Files"]
    end

    Shell <--> IPC
    IPC <--> ReactApp
    ReactApp --> UI_Screens
    UI_Screens <--> State_Engine
    State_Engine --> Flask
    Flask --> Route_Handlers
    Route_Handlers --> Core_Services
    Core_Services <--> DB
    Shell --> Printers
    Core_Services --> Printers
    Core_Services --> FileSystem
```

---

## 🧭 Complete Application Node Directory

For developers, maintainers, and LLMs parsing this system, here is the complete map of every functional node across the desktop application:

### 1. Frontend UI Nodes (`frontend/src/components/screens/`)

| Node Identifier | Route Path | Access Role | Primary Responsibilities | Key Child Components |
| :--- | :--- | :--- | :--- | :--- |
| **`WorkingPOSInterface`** | `/` | All (Worker / Admin) | High-speed item search, Category tabs, Group switching, Cart modifier rules, Mark as Pending toggle, Direct Receipt/KOT printing, Token numbers | `CartSummary`, `ReceiptPreviewModal`, `QuickPay`, `HoldBills`, `VariationPickerModal` |
| **`LiveOrders`** | `/live` | All (Worker / Admin) | Real-time live order board, `@dnd-kit/core` drag-to-merge orders, Multi-order selection, Split-method settlement, Un-merge with audit recovery, 2.5s conditional 304 polling | `DraggableOrderCard`, `MergeConfirmModal`, `SettleModal`, `SplitConfirmModal` |
| **`Analytics`** | `/analytics` | All (Worker / Admin) | Real-time KPI summaries, Revenue vs Cost, Group share charts, Hourly footfall heatmaps, Payment mode shares, Pending revenue separation, Excel/CSV export | `MetricCard`, `SalesTrendChart`, `TopProductsList`, `DateRangeFilter` |
| **`Inventory`** | `/inventory` | **Admin Only** | Stock levels, Raw materials vs Direct sale stock, Cost per unit tracking, Low stock alert thresholds, Manual stock adjustments | `StockTable`, `StockAdjustmentModal`, `ThresholdBadge` |
| **`ProductManagement`** | `/management` | **Admin Only** | Product CRUD, Variation matrix (S/M/L), Image upload with AI background eraser, Category & Group association, Display sorting | `ProductModal`, `GroupManagement`, `CategoryManager`, `AIImageUploader` |
| **`WorkersDashboard`** | `/workers` | **Admin Only** | Staff directory, Role definitions, Daily attendance check-in/out, Salary advance approvals, Monthly payroll disbursement | `WorkerList`, `WorkerProfile`, `Attendance`, `SalaryManager` |
| **`Expenses`** | `/expenses` | **Admin Only** | Multi-item operational expense vouchers, Vendor bills, Salary linking, Payment method selection, Expense category manager | `ExpenseModal`, `ExpenseTypeManager`, `ReceiptItemRow` |
| **`Reminders`** | `/reminders` | All (Worker / Admin) | Scheduled business alerts (once, daily, weekly, monthly), Task snooze/complete, Notification center synchronization | `ReminderCard`, `NewReminderModal`, `NotificationCenterDrawer` |
| **`Settings`** | `/settings` | **Admin / PIN** | Shop metadata, AI Agent API configuration & model parameters, Thermal printer setup (58/80mm, USB/LAN), Diagnostics & Log streamer | `PrinterConfig`, `AIAgentSettings`, `DisplayZoomControls`, `DiagnosticsPanel`, `BackupManager` |

---

### 2. Frontend State & Context Nodes (`frontend/src/context/`)

```mermaid
flowchart LR
    POS["POSDataContext<br/>In-memory catalog, version check"]
    Auth["AuthContext<br/>Admin/Worker state, PIN unlock"]
    Theme["ThemeContext<br/>Dark/Light mode, UI zoom scale"]
    Alert["AlertContext and Toast<br/>Toasts, alerts, confirm modals"]
    Remind["ReminderContext<br/>Background polling, task alerts"]
    Notif["NotificationContext<br/>Drawer state, unread badge counter"]
    Net["NetworkContext<br/>Offline status, sync queue"]

    Auth --> POS
    POS --> Alert
    Remind --> Notif
```

- **`POSDataContext`**: Eliminates redundant network calls by caching active categories, groups, and products in-memory. Polls catalog version hash for background invalidation.
- **`AuthContext`**: Manages Admin vs Worker authorization. Restricts management screens via `<AdminRoute>` and opens `<AdminUnlockModal>` when worker attempts privileged actions.
- **`SettingsContext`**: Holds shop profile, currency symbol (`₹`), and hardware printer device routes.

---

### 3. Backend REST Service Nodes (`backend/routes/`)

| Endpoint Prefix | Source File | HTTP Methods | Node Function |
| :--- | :--- | :--- | :--- |
| **`/api/billing`** | `billing.py` | `POST`, `GET`, `PUT`, `DELETE` | Processes bills, assigns daily token numbers, records line items, and updates pre-aggregated sales stats. |
| **`/api/billing/live`** | `billing.py` | `GET` | Conditional 304 version-hash polling for open/pending bills and active merge groups. |
| **`/api/billing/merge`** | `billing.py` | `POST` | Merges 2+ bills into unified `MergeGroup` with combined totals and member tracking. |
| **`/api/billing/merge/<id>/settle`** | `billing.py` | `POST` | Settles pending merge group with split payments and marks member bills paid. |
| **`/api/billing/merge/<id>/split`** | `billing.py` | `POST` | Admin-only un-merge that restores standalone bills while preserving audit history. |
| **`/api/agents`** | `agents.py` | `POST`, `GET`, `PUT` | Orchestrates multi-agent state graph (`/chat`), fast-path short circuit, and human-in-the-loop action approvals (`/actions/<id>/approve`). |
| **`/api/products`** | `products.py` | `GET`, `POST`, `PUT`, `DELETE` | Product inventory CRUD, variation models, image uploads, category links, and catalog version bumps. |
| **`/api/groups`** | `groups.py` | `GET`, `POST`, `PUT`, `DELETE` | Item group management, display order sorting, and instant enable/disable toggles. |
| **`/api/inventory`** | `inventory.py` | `GET`, `POST`, `PUT` | Tracks stock count, cost valuation, direct sales, raw materials, and threshold alerts. |
| **`/api/workers`** | `workers.py` | `GET`, `POST`, `PUT`, `DELETE` | Worker profiles, daily attendance logging, advances recording, and payroll calculations. |
| **`/api/expenses`** | `expenses.py` | `GET`, `POST`, `PUT`, `DELETE` | Operational vouchers, itemized purchase bills, worker salary deductions. |
| **`/api/summary`** | `summary.py` | `GET` | High-speed aggregated metrics reading directly from `DailySalesSummary` table (separates paid sales from pending revenue). |
| **`/api/reports`** | `reports.py` | `GET` | Generates professional Excel sheets (`.xlsx`) and raw `.csv` reports with branded headers. |
| **`/api/reminders`** | `reminders.py` | `GET`, `POST`, `PUT`, `DELETE` | CRUD & lifecycle management for scheduled operational tasks. |
| **`/api/notifications`**| `notifications.py`| `GET`, `POST`, `PUT` | System notifications, priority queue, read/dismiss status. |
| **`/api/settings`** | `settings.py` | `GET`, `POST` | Persistent key-value application preferences and AI Agent config stored in SQLite. |

---

### 4. Database Entity & Schema Nodes (`backend/models.py`)

```mermaid
erDiagram
    ITEM_GROUP ||--o{ CATEGORY : contains
    CATEGORY ||--o{ PRODUCT : categorizes
    PRODUCT ||--o| INVENTORY : tracks
    
    MERGE_GROUP ||--o{ BILL : groups
    
    WORKER_TYPE ||--o{ WORKER : classifies
    WORKER ||--o{ ATTENDANCE : logs
    WORKER ||--o{ ADVANCE : receives
    WORKER ||--o{ SALARY_PAYMENT : disbursed
    WORKER ||--o{ EXPENSE : linked
    
    EXPENSE_TYPE ||--o{ EXPENSE : categorizes
    EXPENSE ||--o{ EXPENSE_ITEM : details
    
    AGENT_CONFIG ||--o{ AGENT_PERMISSION : configures
    AGENT_ACTION_LOG ||--o| AGENT_CHECKPOINT : checkpoints
    
    MERGE_GROUP {
        string id PK
        string member_bill_ids
        float total_amount
        float amount_paid
        float amount_pending
        string status
        datetime settled_at
    }
    BILL {
        int id PK
        int bill_no
        float total_amount
        float amount_paid
        float amount_pending
        string payment_status
        string merge_group_id FK
        int today_token
        string payment_method
        string order_type
        string items
        string status
        datetime created_at
    }
    ITEM_GROUP {
        int id PK
        string name
        boolean is_active
        int display_order
    }
    CATEGORY {
        int id PK
        string name
        int group_id FK
        boolean active
    }
    PRODUCT {
        string product_id PK
        string name
        float price
        float takeaway_price
        int category_id FK
        string variations
        boolean active
    }
    INVENTORY {
        int id PK
        string product_id FK
        string item_type
        float stock
        float unit_price
        float alert_threshold
    }
    WORKER {
        string worker_id PK
        string name
        string role
        int worker_type_id FK
        float salary
        int salary_day
        string status
    }
    ATTENDANCE {
        string attendance_id PK
        string worker_id FK
        date attendance_date
        string status
        time check_in
        time check_out
    }
    EXPENSE {
        string id PK
        string title
        string category
        float amount
        string worker_id FK
        datetime expense_date
    }
    DAILY_SALES_SUMMARY {
        date summary_date PK
        float total_sales
        float pending_revenue
        int total_orders
        float total_expenses
        float net_profit
        float average_bill_value
        string top_products_json
    }
    AGENT_CHECKPOINT {
        string conversation_id PK
        string state_json
        string status
        datetime updated_at
    }
```

---

## 🔄 Core System Workflows

### 1. High-Throughput Billing & Thermal Printing Flow

```mermaid
sequenceDiagram
    autonumber
    actor Biller as Cashier
    participant UI as POS UI (Bill.jsx)
    participant Ctx as POSDataContext
    participant API as Flask API
    participant DB as SQLite DB
    participant Agg as AggregationService
    participant Print as PrinterManager

    Biller->>UI: Select items (Click / Search / Hotkey)
    UI->>Ctx: Retrieve cached product and variations
    Biller->>UI: Select payment mode and press Enter
    UI->>API: POST /api/billing (Cart, OrderType, Customer)
    API->>DB: Insert into bills table and assign daily token
    API->>Agg: Update DailySalesSummary metrics
    API-->>UI: Return 200 OK (Bill No, Token No)
    
    par Dual Print Dispatch
        UI->>Print: IPC print:bill (Receipt Template)
        Print-->>Biller: Thermal Customer Receipt Printed (58/80mm)
    and KOT Dispatch
        UI->>Print: IPC print:kot (Kitchen Ticket)
        Print-->>Biller: Kitchen Order Ticket Printed
    end
    
    UI->>UI: Show success toast and reset cart for next customer
```

### 2. Live Order Drag-to-Merge & Settlement Flow

```mermaid
sequenceDiagram
    autonumber
    actor Cashier as Cashier / Operator
    participant LiveUI as LiveOrders.jsx (@dnd-kit)
    participant API as Flask API (/api/billing)
    participant Service as LiveOrderService
    participant DB as SQLite DB
    participant Agg as AggregationService

    Note over LiveUI: Cashier drags Table 3 card onto Table 4 card
    LiveUI->>LiveUI: Open MergeConfirmModal with combined preview
    Cashier->>LiveUI: Click "Confirm & Merge"
    LiveUI->>API: POST /api/billing/merge {bill_ids: [101, 102]}
    API->>Service: merge_bills([101, 102])
    Service->>DB: Create/Extend MergeGroup & update bills.merge_group_id
    Service-->>API: Return unified MergeGroup
    API-->>LiveUI: 200 OK (Unified Order Card)

    Note over LiveUI: Customer pays bill at counter
    Cashier->>LiveUI: Click "Settle" -> Select Cash/UPI split
    LiveUI->>API: POST /api/billing/merge/{id}/settle {payments}
    API->>Service: settle_group(id, payments)
    Service->>DB: Mark MergeGroup 'settled' & member bills 'paid'
    Service->>Agg: update_daily_summary() (re-allocate collected sales)
    API-->>LiveUI: 200 OK -> Card removed/marked settled
```

---

### 3. Autonomous AI Agent State Graph & Human-in-the-Loop Flow

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Store Owner
    participant ChatUI as AgentChatPanel.jsx
    participant FastPath as Intent Classifier (0 tokens)
    participant Graph as AgentGraph Runner
    participant LLM as LLM Adapter (OpenAI / Claude / Gemini)
    participant Gate as PermissionGate
    participant DB as SQLite DB (AgentCheckpoint)

    Owner->>ChatUI: "give Priya a 2000 advance"
    ChatUI->>FastPath: classify_intent_deterministic()
    Note over FastPath: Matches ADVANCE_SALARY_KEYWORDS -> worker agent (0 tokens)
    FastPath->>Graph: GRAPH.run(initial_state)
    Graph->>LLM: call_llm (system prompt + tools)
    LLM-->>Graph: tool_calls: propose_salary_advance(worker_id, 2000)
    Graph->>Gate: dispatch_tool (tier: suggest_confirm)
    Gate->>DB: Insert AgentActionLog (status: proposed)
    Gate-->>Graph: status: proposed
    Graph->>DB: Save AgentCheckpoint (status: waiting_approval)
    Graph-->>ChatUI: Stream proposed action card with "Approve & Apply" button

    Owner->>ChatUI: Click "Approve & Apply"
    ChatUI->>Graph: POST /api/agents/actions/{id}/approve
    Graph->>DB: Load AgentCheckpoint & mark action executed
    Graph->>LLM: node_append_tool_result -> call_llm (synthesis)
    LLM-->>Graph: Structured response ("Recorded ₹2,000 advance for Priya")
    Graph-->>ChatUI: 200 OK (Render finalized response)
```

---

### 4. Real-Time Catalog Versioning & Live Group Toggle

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Store Owner
    participant AdminUI as GroupManagement.jsx
    participant API as Flask API (/api/groups)
    participant DB as SQLite DB
    participant POSUI as POS Terminal Screen

    Admin->>AdminUI: Toggle Group status to Disabled
    AdminUI->>API: PUT /api/groups/1 with is_active false
    API->>DB: UPDATE item_groups SET is_active=0
    API->>DB: UPDATE settings SET catalog_version = NEW_UUID
    API-->>AdminUI: Return 200 OK
    
    loop Heartbeat or Screen Focus (Every 1s)
        POSUI->>API: GET /api/products/version
        API-->>POSUI: Return catalog_version
        Note over POSUI: Version change detected
        POSUI->>API: GET /api/pos/bootstrap
        API-->>POSUI: Return updated active catalog
        POSUI->>POSUI: Re-render Grid (Disabled groups hidden)
    end
```

---

### 5. Role-Based Access Control (RBAC) Flow

```mermaid
stateDiagram-v2
    [*] --> WorkerMode

    state WorkerMode {
        [*] --> POS_Active
        POS_Active: POS Billing Screen Enabled
        POS_Active --> Live_Orders: Switch Tab
        Live_Orders: Live Orders & Merging Enabled
        Live_Orders --> Analytics_View: Switch Tab
        Analytics_View: Analytics Read-Only Enabled
        Analytics_View --> POS_Active: Switch Tab
    }

    WorkerMode --> AdminUnlockModal: User selects Restricted Feature
    AdminUnlockModal --> AdminMode: PIN Valid
    AdminUnlockModal --> WorkerMode: PIN Invalid

    state AdminMode {
        [*] --> FullAccess
        FullAccess: Inventory, Catalog, Staff, Expenses, Settings Unlocked
    }

    AdminMode --> WorkerMode: Click Worker button or Session Reset
```

---

### 6. Monthly Staff Payroll Calculation Flow

```mermaid
flowchart TD
    Start([Generate Monthly Payroll]) --> FetchWorkers[Fetch Active Workers]
    FetchWorkers --> LoopWorker{For Each Worker}
    
    LoopWorker --> BaseSalary[Get Base Monthly Salary]
    BaseSalary --> CalcAttendance[Count Present and Half-Days and Unpaid Leaves]
    CalcAttendance --> CalcAdvances[Sum Unpaid Advances for Month]
    CalcAdvances --> Formula[Final Salary = Base minus Deductions minus Advances]
    
    Formula --> PaySlip[Generate Salary Record and Payslip]
    PaySlip --> Disburse{Disburse Payment?}
    Disburse -->|Yes| RecordExpense[Create Expense Record under Salary Category]
    RecordExpense --> MarkPaid[Mark SalaryPayment as Paid]
    Disburse -->|No| SavePending[Keep as Pending Payable]
    
    MarkPaid --> NextWorker[Next Worker]
    SavePending --> NextWorker
    NextWorker --> LoopWorker
```

---

## 🤖 InfoOS Autonomous Multi-Agent AI System Architecture

InfoOS Desktop incorporates an enterprise-grade, offline-first **Agentic AI Assistant** designed to help store owners manage their operations, query analytics, adjust menus, disburse payroll, and record expenses in natural language.

```mermaid
flowchart TB
    UserMsg["User Message / Voice Query"] --> FastPathCheck{"Zero-Cost Fast Path?<br/>(Sales, Attendance, Stock)"}
    
    FastPathCheck -->|Yes - Match| LocalSQLite["Local SQLite Query<br/>(0 Tokens • $0.00 Cost • <10ms)"]
    LocalSQLite --> FastResponse["Structured Response<br/>(Metric List + Insights)"]
    
    FastPathCheck -->|No - Complex| IntentRouter{"Deterministic Pre-LLM Router<br/>(classify_intent_deterministic)"}
    
    IntentRouter -->|Match| DomainAgent["Specialized Domain Agent"]
    IntentRouter -->|Ambiguous| LLMOrchestrator["LLM Orchestrator Fallback<br/>(Few-Shot Intent Classifier)"] --> DomainAgent
    
    subgraph AgentGraph_Engine [AgentGraph State Machine Runner]
        StateInit["Build Initial AgentState<br/>(Pruned History + System Prompt + Tools)"] --> NodeCallLLM["node_call_llm<br/>(Multi-Provider Adapter)"]
        NodeCallLLM --> NodeCheckTools{"node_check_tool_calls<br/>(Tool calls present?)"}
        
        NodeCheckTools -->|No Tools / Max Rounds| Finalize["node_check_tool_calls<br/>(status='done')"]
        NodeCheckTools -->|Tools Present| NodeDispatch["node_dispatch_tool<br/>(PermissionGate)"]
        
        NodeDispatch --> GateDecision{"Permission Tier?"}
        
        GateDecision -->|full_autonomy| ExecDirect["Execute Tool Directly"] --> NodeAppend["node_append_tool_result<br/>(Synthesis Turn)"] --> NodeCheckTools
        GateDecision -->|suggest_confirm| PauseProposal["Pause: status='waiting_approval'<br/>(Save AgentCheckpoint)"] --> UIApprovalCard["Render 'Approve & Apply' Card in UI"]
    end
    
    DomainAgent --> StateInit
    
    UIApprovalCard -->|User Clicks Approve| ResumeGraph["GRAPH.resume(approved=True)<br/>(Execute verbatim with exact args)"] --> NodeAppend
    UIApprovalCard -->|User Clicks Reject| RejectGraph["GRAPH.resume(approved=False)<br/>(Append rejection notice)"] --> NodeAppend
    
    Finalize --> SSEStream["SSE Stream /chat -> AgentChatPanel.jsx"]
    FastResponse --> SSEStream
```

---

### 1. Specialized Domain Agents & Responsibilities

The agent system partitions business capabilities into **7 specialized domain agents**, each equipped with dedicated system prompts, strict boundary rules, and isolated tool registries:

| Domain Agent | Responsibilities & Coverage | Key Tools (`backend/agents/tools.py`) | Autonomy Tier |
| :--- | :--- | :--- | :--- |
| **`BillingAgent`** | POS bills, tokens, customer receipts, KOT kitchen routing, table orders, voiding/canceling transactions. | `lookup_bill`, `list_recent_bills`, `get_table_bill`, `propose_void_bill`, `reprint_bill_receipt` | `suggest_confirm` (mutating), `full_autonomy` (read) |
| **`InventoryAgent`** | Stock levels, raw materials, direct-sale goods, threshold warnings, stock deduction, and inventory restock logging. | `get_inventory_status`, `check_low_stock_items`, `propose_adjust_stock`, `propose_restock_item` | `suggest_confirm` (mutating), `full_autonomy` (read) |
| **`ProductAgent`** | Menu catalog, item names, prices, variations (S/M/L), categories, item groups, and recipes. | `lookup_product`, `list_categories`, `list_item_groups`, `propose_update_product_price`, `propose_create_product` | `suggest_confirm` (mutating), `full_autonomy` (read) |
| **`WorkerAgent`** | Employee directory, daily attendance check-ins, advance salary vouchers, monthly salary calculations, and payroll disbursement. | `list_workers`, `get_worker_attendance`, `propose_mark_attendance`, `propose_salary_advance`, `propose_disburse_salary` | `suggest_confirm` (mutating), `full_autonomy` (read) |
| **`ExpenseAgent`** | Operational spend vouchers, vendor/supplier invoices, utilities, petty cash, and maintenance expenses. | `list_expenses`, `list_expense_types`, `propose_log_expense`, `propose_create_expense_type`, `propose_delete_expense` | `suggest_confirm` (mutating), `full_autonomy` (read) |
| **`AnalyticsAgent`** | Store performance metrics, sales totals, net profit, average bill values, payment mode breakdowns, and top items. | `get_sales_kpi_summary`, `get_top_selling_products`, `get_revenue_trend`, `compare_sales_periods` | `full_autonomy` (100% read-only) |
| **`ReminderAgent`** | Scheduled business reminders, owner tasks, recurring alarms, task completion, and notification drawer sync. | `list_active_reminders`, `propose_create_reminder`, `propose_complete_reminder`, `propose_snooze_reminder` | `suggest_confirm` (mutating), `full_autonomy` (read) |

---

### 2. State Graph Engine (`AgentGraph`) & Checkpoint Persistence

Unlike naive linear loops that re-prompt the LLM on user confirmation, InfoOS implements an **event-driven state graph** (`backend/agents/graph_runner.py` and `graph_nodes.py`):
- **Deterministic Checkpoint Table (`agent_checkpoints`)**: Saves in-flight `AgentState` as JSON keyed by conversation ID.
- **Discrete Node Machine**:
  - `node_call_llm`: Executes model turn with token and cost tracking.
  - `node_check_tool_calls`: Evaluates tool requests and round limits (`max_tool_rounds`).
  - `node_dispatch_tool`: Routes tool calls through `PermissionGate`. If mutating (`suggest_confirm`), pauses graph execution (`waiting_approval`) and stages an `AgentActionLog` proposal.
  - `node_append_tool_result`: Appends execution output or rejection notice into message history and makes the synthesis turn.
- **Verbatim Action Resume**: Clicking **Approve & Apply** resumes the saved checkpoint and executes the original tool call with exact stored arguments without any LLM re-invocation.

---

### 3. Zero-Cost Fast-Path & Deterministic Pre-LLM Routing

To achieve sub-10ms response times and minimize API token costs:
1. **0-Token Zero-Cost Fast Path (`try_zero_cost_fast_path`)**:
   - Queries like *"What are today's sales?"*, *"Who is present today?"*, *"Check low stock items"*, and *"What reminders do I have?"* are resolved directly from SQLite without making any LLM API call (0 tokens, $0.00 cost).
2. **Deterministic Pre-LLM Intent Router (`classify_intent_deterministic`)**:
   - Uses optimized regex and disambiguation sets (`ADVANCE_SALARY_KEYWORDS`) to route queries directly to the target domain agent without burning an initial Orchestrator LLM call.
   - Explicit disambiguation rules prevent confusion between vendor payments (`expense`) and employee salary advances (`worker`).

---

### 4. Multi-Tier Permission Gate & Safety Model

Every tool registered in `backend/agents/tools.py` is governed by `PermissionGate`:
- **`full_autonomy`**: Safe, read-only analytics and data lookups execute immediately.
- **`suggest_confirm`**: Destructive or financial mutations (updating prices, deleting items, paying out advances, logging expenses) generate structured proposals staged in SQLite for user confirmation.
- **Ceiling Security Locks**: Mutating tools cannot be escalated past `suggest_confirm` via configuration, ensuring strict human-in-the-loop oversight.
- **Immutable Audit Trail (`agent_action_logs` and `agent_interaction_audits`)**: Records user prompt, target domain, tool name, arguments diff, execution timestamp, and actor ID.

---

### 5. Multi-Provider LLM Adapter Layer

The unified `LLMAdapter` in `backend/agents/llm_adapter.py` supports:
- **Cloud Providers**: OpenAI (`gpt-4o`, `gpt-4o-mini`), Anthropic Claude (`claude-3-5-sonnet`, `claude-3-haiku`), Google Gemini (`gemini-1.5-flash`, `gemini-1.5-pro`), Groq (`llama-3.3-70b-versatile`).
- **Local / Self-Hosted Models**: OpenAI-compatible local endpoints (Ollama, LM Studio, vLLM, llama.cpp) for 100% offline, air-gapped operations.
- **Security & Key Management**: API keys are AES-256 encrypted in the local SQLite database using machine-derived cryptographic keys.
- **Token & Cost Optimization**: Rolling-window context pruning (keeps system prompt + last 6 conversation turns) and in-memory read tool caching.

---

### 6. Frontend AI User Interface

- **`AgentChatPanel.jsx`**: Floating glassmorphism chat drawer with Server-Sent Events (SSE) live streaming, typing animations, interactive action proposal approval cards, and structured JSON rendering.
- **`DynamicAiMascot.jsx`**: Fluid animated AI mascot trigger button with hover glowing effects.
- **Structured Output Architecture**: Responses are synthesized in clean JSON sections (`metric_list`, `insight_block`, `action_list`, `table`) rendered into styled native React components rather than unstructured markdown text.
- **`AIAgentSettings` (`Settings.jsx`)**: Comprehensive control panel allowing store owners to configure providers, select models, adjust token/round limits, toggle per-agent permissions, and engage the Master Kill Switch.

---

## ⌨️ Ergonomics & Keyboard Shortcuts

Designed for split-second checkout speeds without touching the mouse:

| Action | Shortcut | Scope | Behavior |
| :--- | :--- | :--- | :--- |
| **Cycle Active Item Groups** | `Ctrl` | POS Billing | Instantly advances to next enabled product group tab |
| **Cycle Category Tabs** | `Tab` / `Shift + Tab` | POS Billing | Moves focus across top categories |
| **Toggle Scratchpad Calculator** | `Alt` | Everywhere | Opens/closes liquid glass popup calculator (Full keyboard calculation enabled) |
| **Start New Bill** | `F5` | POS Billing | Instantly resets active cart and starts fresh transaction |
| **Print & Checkout** | `Enter` | POS Billing Modal | Confirms payment and triggers thermal receipt print |
| **Search Products** | `Ctrl + F` | POS & Inventory | Focuses search query bar |
| **Toggle Fullscreen** | `F11` | Application | Toggles kiosk/desktop full screen window |
| **Reload Window** | `Ctrl + R` | Application | Soft reloads web view |
| **Toggle Developer Tools** | `Ctrl + Shift + I` | Electron Mode | Opens Chromium DevTools console |

---

## 🖥️ Calculator Floating Scratchpad

Pressing `Alt` anywhere opens the integrated liquid-glass calculator:
- **Full Numpad Support**: Type numbers `0-9`, `.`, operators `+`, `-`, `*` (or `x`), `/`, `%`.
- **Keyboard Actions**: `Enter` or `=` to calculate, `Backspace` to delete, `Escape` or `C` to clear/close.
- **Mouse + Touch Ready**: Smooth micro-animations with bright contrast keys.

---

## 🛠️ Developer Setup & Execution

### Prerequisites
- **Node.js**: v18.0+ & npm v9.0+
- **Python**: v3.10+ (Windows 64-bit recommended)
- **C++ Build Tools**: For native node modules (optional)

### Method 1: Instant Development Launcher
Double-click `start_dev.bat` or run:
```bash
npm run dev
```
*Launches Python backend on port 5050 and React Webpack Dev Server on port 3050.*

### Method 2: Manual Terminal Startup

1. **Backend Service**:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   python app.py --port 5050
   ```

2. **Frontend Service**:
   ```bash
   cd frontend
   npm install
   npm start
   ```

3. **Electron Shell**:
   ```bash
   npm run electron
   ```

---

## 📦 Production Packaging & Distribution

InfoOS packages into a single, zero-dependency Windows `.exe` installer using PyInstaller for the Python backend and `electron-builder` with NSIS compression.

```bash
# Full automated end-to-end production build
npm run build-all
```

**What this does:**
1. Compiles React frontend to optimized production static bundle in `frontend/build/`.
2. Packages Python Flask backend into standalone executable `backend/dist/backend/backend.exe` via PyInstaller.
3. Packages Electron shell, assets, and bundled backend into a high-compression NSIS installer in `dist/InfoOS Setup.exe`.

---

## 🤖 LLM & Machine Context Specification

> This section provides machine-readable metadata for AI assistants, agents, and automation scripts.

```json
{
  "system_name": "InfoOS Desktop",
  "app_id": "com.burgerbhau.infoos",
  "architecture": "Electron-React-Flask-SQLite Hybrid",
  "default_ports": {
    "frontend_dev": 3050,
    "backend_api": 5050
  },
  "database": {
    "engine": "SQLite 3",
    "filename": "products.db",
    "orm": "Flask-SQLAlchemy",
    "optimization": "Pre-aggregated DailySalesSummary table with real-time row triggers",
    "features": ["MergeGroups", "AgentCheckpoints", "AuditEvents"]
  },
  "security_model": {
    "role_based_access": ["worker", "admin"],
    "admin_protected_routes": ["/inventory", "/management", "/workers", "/expenses", "/settings"],
    "worker_allowed_routes": ["/", "/live", "/analytics", "/reminders"]
  },
  "live_orders": {
    "engine": "@dnd-kit/core",
    "features": ["Drag-to-merge", "Split settlement", "Admin un-merge audit", "304 version hash polling"]
  },
  "agentic_ai_orchestration": {
    "engine": "AgentGraph State Machine",
    "routing": "Zero-Cost Deterministic Fast-Path + LLM Fallback",
    "persistence": "SQLite AgentCheckpoint with Human-in-the-Loop Resume",
    "supported_providers": ["OpenAI", "Anthropic", "Google Gemini", "Groq", "Custom Local OpenAI-compatible"]
  },
  "printing_subsystem": {
    "protocol": "ESC/POS Raw Stream + OS Spooler",
    "supported_widths": ["58mm", "80mm"],
    "interfaces": ["USB", "LAN/Network", "Serial COM", "Windows Spooler"]
  },
  "ai_capabilities": {
    "module": "backend/ai",
    "features": ["Background removal", "Aspect normalization", "Thumbnail generation"],
    "engine": "ONNX / rembg"
  }
}
```

---

## 📄 License & Attribution

Copyright © 2026 **InfoOS Private Limited**. All rights reserved.
Unauthorized copying, modification, distribution, or decompilation of this software via any medium is strictly prohibited.
