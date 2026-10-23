# Portal Documentation: Super Admin
**Master Enterprise Operations, Multi-Plant Governance & Global Administration Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Super Admin
- **Login Email:** `admin@example.com`
- **Default Password:** `password123`
- **Assigned Persona:** System Owner / Executive Director & Head of Digital Operations
- **Target Demo Audience:** Managing Director (MD), Chief Executive Officer (CEO), Chief Operating Officer (COO), Chief Information Officer (CIO) / Head of IT, Plant Heads, External ISO/IATF Audit Teams
- **Access Level:** **100% Unrestricted God-Mode Access** across all 16 ERP operational modules, 60+ functional screens, approval hierarchies, audit trails, and master system configurations (Create, Read, Update, Delete, Approve, Export, and Configure).

---

## 2. Portal Overview & Executive Value Proposition
The Super Admin Portal is the central nervous system of Precision ERP (built for Laxmi Balaji Automotive Precision Components Pvt Ltd — sheet metal pressings, stamped assemblies, and welded sub-assemblies).

Designed for top management and corporate IT, this portal delivers **complete organizational visibility and sovereign control**:
1. **Cross-Departmental Command:** Eliminates departmental silos by providing instantaneous real-time visibility from initial customer drawing inquiries and raw steel coil slitting to multi-stage stamping, quality gating, automated dispatch e-Way billing, and financial general ledger reconciliation.
2. **Automotive Standards Compliance (IATF 16949 / ISO 9001):** Enforces mandatory quality gates, engineering change governance (ECM), full mill-to-chassis heat number batch traceability, and tamper-proof non-repudiation audit logging.
3. **Enterprise Security & Governance:** Enforces strict Role-Based Access Control (RBAC), multi-level sequential approval hierarchies, dynamic financial spending limits, and separation of duties (SoD) to protect company capital.

---

## 3. Global Top Bar & Utility Controls (Available on Every Screen)
Regardless of which module the Super Admin is viewing, the top header bar provides instant enterprise utilities:

1. **Breadcrumb Navigation:** Displays the exact location path in real time (e.g., `Purchasing › Purchase Orders (PO)` or `Stock (Inventory) › Batch & Lot Tracking`).
2. **Command Palette (`Ctrl + K` / `⌘ + K`):** Instant keyboard-driven global search. Type any part number, supplier name, screen name, or transaction code (`SO-2026-`, `PO-2026-`) to jump directly to it in milliseconds without browsing menus.
3. **Problem Reporting / Helpdesk Hotline (`LifeBuoy` Icon):** One-click button allowing users to report any floor issue or system question directly into the centralized `/issues` queue with screen context and severity.
4. **Theme Switcher (`Sun` / `Moon` Icon):** Instant toggle between Dark Mode (modern, sleek, reduced eye strain in low-light control rooms) and Light Mode (high contrast for bright shop-floor terminals and executive boardrooms).
5. **Change Password Modal (`KeyRound` Icon):** Secure in-app password update dialog with current password validation and matching checks.
6. **User Badge & Instant Sign-Out:** Displays current user initials (`SA` for Super Admin) with a 1-click logout button that invalidates authentication tokens and redirects to the login screen.

---

## 4. Complete Navigation & Module-by-Module Breakdown

```
========================================================================================
                                 SUPER ADMIN MENU HIERARCHY
========================================================================================
├── TOP EXECUTIVE CONTROLS
│   ├── 1. Dashboard (/dashboard)
│   ├── 2. Pending Approvals (/approvals)
│   ├── 3. Who Can Approve What (/approval-rights)
│   ├── 4. Company Setup (/company)
│   ├── 5. Users & Logins (/users)
│   └── 6. Roles & Access (/roles)
│
├── MODULE 1: REPORTS & ANALYTICS (/dashboards)
│   ├── All Reports Hub (/dashboards)
│   ├── Company Overview (CEO) (/dashboards/ceo)
│   ├── Sales Report (/dashboards/sales)
│   ├── Purchasing Report (/dashboards/procurement)
│   ├── Stock Report (/dashboards/inventory)
│   ├── Production Report (/dashboards/production)
│   ├── Quality Report (/dashboards/quality)
│   └── Maintenance Report (/dashboards/maintenance)
│
├── MODULE 2: MASTER DATA GOVERNANCE (/master)
│   ├── Customers (/master/customer)
│   ├── Suppliers (Vendors) (/master/vendor)
│   ├── Products We Make (/master/product)
│   ├── Raw Materials (/master/material)
│   ├── Units of Measure (/master/uom)
│   ├── Stores & Warehouses (/master/warehouse)
│   ├── Machines (/master/machine)
│   ├── Work Centres (/master/workcenter)
│   └── System Settings (/master/system-config)
│
├── MODULE 3: ENGINEERING & PRODUCT DESIGN (/engineering)
│   ├── Parts Lists (BOM) (/engineering/bom)
│   ├── Process Steps (Routing) (/engineering/routing)
│   └── Design Change Requests (ECM) (/engineering/change)
│
├── MODULE 4: SALES & COMMERCIAL (/sales)
│   ├── Customer Inquiries (/sales/inquiry)
│   ├── Quotations (/sales/quotation)
│   └── Sales Orders (/sales/order)
│
├── MODULE 5: DEMAND PLANNING (/demand)
│   ├── Demand Forecast (/demand/forecasting)
│   └── Combined Demand (Consolidation) (/demand/consolidation)
│
├── MODULE 6: MATERIAL PLANNING (MRP) (/mrp)
│   ├── Run Material Plan (/mrp/execution)
│   ├── Material Shortages (/mrp/shortages)
│   └── Suggested Orders (/mrp/recommendations)
│
├── MODULE 7: CAPACITY PLANNING (/capacity)
│   ├── Machine Capacity (/capacity/machine)
│   ├── Manpower Capacity (/capacity/labor)
│   └── Production Schedule (/capacity/schedule)
│
├── MODULE 8: PURCHASING & PROCUREMENT (/procurement)
│   ├── Purchase Requests (/procurement/requisition)
│   ├── Supplier Price Requests (RFQ) (/procurement/rfq)
│   ├── Purchase Orders (PO) (/procurement/po)
│   └── Supplier Performance (/procurement/performance)
│
├── MODULE 9: GOODS RECEIVING (/receipt)
│   ├── Goods Received (GRN) (/receipt/grn)
│   ├── Inspect Received Goods (/receipt/inspection)
│   └── Move Into Stock (/receipt/inventory)
│
├── MODULE 10: STOCK (INVENTORY) MANAGEMENT (/inventory)
│   ├── Stock on Hand (/inventory/control)
│   ├── Stock Movements (/inventory/transactions)
│   ├── Reorder Levels (/inventory/optimization)
│   ├── Stock Value (/inventory/valuation)
│   └── Batch & Lot Tracking (/inventory/traceability)
│
├── MODULE 11: PRODUCTION MANAGEMENT (/production)
│   ├── Production Plan (/production/plan)
│   ├── Work Orders (/production/wo)
│   ├── Allocate Material (/production/allocation)
│   ├── Run Production (/production/execution)
│   └── Production Output (/production/output)
│
├── MODULE 12: SHOP FLOOR GOVERNANCE (/shopfloor)
│   ├── Operators (/shopfloor/operator)
│   ├── Machine Usage (/shopfloor/machine)
│   ├── Machine Downtime (/shopfloor/downtime)
│   └── Scrap & Rejections (/shopfloor/scrap)
│
├── MODULE 13: QUALITY ASSURANCE & CONTROL (/quality)
│   ├── Incoming Material Checks (/quality/incoming)
│   ├── In-Process Checks (/quality/in-process)
│   ├── Final Inspection (/quality/final)
│   ├── Inspection Parameters (/quality/parameters)
│   ├── Quality Problems & Fixes (NCR) (/quality/ncr)
│   └── Quality Reports (/quality/analytics)
│
├── MODULE 14: PLANT MAINTENANCE (/maintenance)
│   ├── Planned Maintenance (/maintenance/preventive)
│   ├── Breakdown Repairs (/maintenance/breakdown)
│   ├── Spare Parts (/maintenance/sparepart)
│   └── Maintenance Reports (/maintenance/analytics)
│
├── MODULE 15: DISPATCH & LOGISTICS (/dispatch)
│   ├── Dispatch Plan (/dispatch/planning)
│   ├── Record Dispatch (/dispatch/execution)
│   └── Delivery Tracking (/dispatch/tracking)
│
├── MODULE 16: FINANCE & ACCOUNTS (/finance)
│   ├── Money In (Receivable) (/finance/ar)
│   ├── Money Out (Payable) (/finance/ap)
│   ├── General Ledger (/finance/ledger)
│   ├── Tax & GST (/finance/tax)
│   ├── Financial Statements (/finance/statements)
│   └── Cost Accounting (/finance/costing)
│
└── SYSTEM AUDIT & SUPPORT
    ├── Reported Problems (/issues)
    └── Change History (Audit) (/audit)
========================================================================================
```

---

### A. Top Executive Governance Menus

#### 1. Dashboard (`/dashboard`)
- **Core Purpose:** The central operational and executive pulse cockpit of the stamping plant.
- **Widgets & KPI Cards:**
  - *Daily Production Volume:* Live press stroke counter and parts produced today across mechanical and hydraulic presses.
  - *Plant Scrap & PPM:* Overall rejection rate in Parts Per Million against the corporate target benchmark (< 1.5%).
  - *Active Work Orders:* Visual status breakdown (`Draft`, `Released`, `In Production`, `Completed`).
  - *Revenue & Order Intake:* Monthly sales invoiced vs target budget run-rate in INR.
  - *Quick Launchpad Shortcuts:* Direct 1-click modal triggers to create Quotations, Sales Orders, Work Orders, and Goods Receipts without navigating through sub-menus.
- **Admin Capabilities:** Change date filters (Today, This Week, This Month, Fiscal Year), select specific plants, and click any KPI widget to drill directly into underlying transactions.

#### 2. Pending Approvals (`/approvals`)
- **Core Purpose:** Personal and organizational executive inbox consolidating all pending authorization requests across the company.
- **Document Streams Covered:**
  - *Purchase Orders (PO):* High-value steel coil and tooling orders requiring director sign-off.
  - *Purchase Requests (PR):* Plant machinery, spare parts, and Capex indents.
  - *Sales Orders (SO):* Orders with custom pricing discounts or credit limit overrides.
  - *Engineering Changes (ECR):* Drawing revision changes impacting live tooling and scrap.
  - *Scrap Write-offs & NCRs:* Financial approval for write-off of defective stamped batches.
- **Admin Capabilities:**
  - Full modal preview of underlying documents (item lines, vendor rates, taxes, requester notes).
  - One-click `Approve` (applies cryptographic timestamp and digital approval).
  - One-click `Reject` (requires mandatory reason for audit history).
  - Status and entity filtering.

#### 3. Who Can Approve What (`/approval-rights`)
- **Core Purpose:** Enterprise multi-level approval matrix configuration for all operational and organizational workflows.
- **Rule Engine Features:**
  - *Full Document Coverage:* Define rules for 14 operational document types (PO, PR, SO, Quotation, ECR, WO, Vendor, Customer, NCR, Scrap, Plant, Warehouse, User, Role).
  - *Sequential Multi-Level Escalation:* Define multi-tier chains (e.g., Level 1: Purchase Officer ➔ Level 2: Plant Manager ➔ Level 3: Super Admin).
  - *Threshold-Based Spending Rules:* Set minimum/maximum transaction amounts (e.g., PO up to ₹1,00,000 auto-approved; ₹1L - ₹10L requires Plant Manager; > ₹10L requires Super Admin).
  - *Visual Pipeline Preview:* Interactive visual flow chart displaying sequence, approver role badges, and escalation arrows.
  - *Automotive Quick Presets:* 1-click loading of industry-standard approval workflows (PO sign-off, Supplier onboarding, Engineering change governance, Scrap write-off).
  - *KPI Monitoring Cockpit:* Real-time tracking of Active Rules, Multi-Level Chains, Governed Document Types, and Engaged Roles.
- **Admin Capabilities:** Create new rules, edit approval limits, reorder approval stages, and activate/deactivate policies instantly.

#### 4. Company Setup (`/company`)
- **Core Purpose:** Multi-entity legal structure, plant modeling, and cost center hierarchy.
- **Tabs & Capabilities:**
  - *Corporate Entity:* Company legal name (`Precision Auto Components Pvt Ltd`), CIN, PAN, registered office address.
  - *Plants Tab:* Configure stamping facilities (`LBAP-HOSUR`, Tool Room Unit), GSTIN, factory license, power sanction capacity, shift timings.
  - *Business Units Tab:* Manage operating divisions (`Sheet Metal Components Division`, `Tool & Die Division`).
  - *Departments Tab:* Configure departments (`Press Shop`, `Welding & Assembly`, `Tool Room`, `Quality Assurance`, `Maintenance`, `Stores`, `Sales`, `Accounts`).
  - *Cost Centers Tab:* Set up operational cost centers for granular machine and overhead expenditure allocation.
- **Admin Capabilities:** Add new plants, edit factory tax configurations, and assign plant heads.

#### 5. Users & Logins (`/users`)
- **Core Purpose:** Centralized staff identity management, credential provisioning, and role assignment.
- **User Directory Capabilities:**
  - View all 11 ERP role personas and employee accounts with real-time status.
  - `Add User`: Form to create employee logins with First/Last Name, Email, Phone, Plant attachment, Department, and RBAC Role assignment.
  - `Status Toggle`: Instant 1-click toggle between `Active` and `Inactive` (immediately blocks access for suspended or exited staff).
  - `Reset Password`: Generate one-time secure password reset links or set temporary credentials.
  - `MFA Management`: Enforce Two-Factor Authentication policies across high-privilege roles.
- **Admin Capabilities:** Full control over all system credentials and access privileges.

#### 6. Roles & Access (`/roles`)
- **Core Purpose:** Granular Role-Based Access Control (RBAC) permission engine.
- **Architecture & Capabilities:**
  - Manage predefined roles: `Super Admin`, `Plant Manager`, `Sales Executive`, `Purchase Officer`, `Store Keeper`, `Production Planner`, `Shop Floor Supervisor`, `Quality Inspector`, `Maintenance Engineer`, `Dispatch Coordinator`, `Accounts Executive`.
  - `Create Custom Role`: Build specialized roles (e.g., `Tool Room In-charge`, `Contract Stores Trainee`).
  - `Permission Matrix`: Checkbox grid across all 16 modules with discrete permissions (`Create`, `Read`, `Update`, `Delete`).
  - Enforce strict Separation of Duties (SoD) — ensuring shop floor operators cannot view customer pricing or approve purchase orders.
- **Admin Capabilities:** Modify permissions for any role, clone existing roles, and assign wildcard permissions.

---

### B. Module 1: Reports & Analytics Hub (`/dashboards`)

#### 1. All Reports Hub (`/dashboards`)
- High-level directory card deck presenting all departmental executive reports with quick links and health indicators.

#### 2. Company Overview / CEO Dashboard (`/dashboards/ceo`)
- **Executive Cockpit:** Net revenue, gross operating margin %, total inventory valuation across all stores, monthly order book value, and overall plant OEE (Overall Equipment Effectiveness).
- **Executive Insights:** Customer concentration chart, supplier spend distribution, cash flow trends, and high-level risk alerts.

#### 3. Sales Report (`/dashboards/sales`)
- Order intake run-rate vs monthly targets, quotation conversion win-rate, customer revenue ranking (TVS, Ashok Leyland, Tata Motors), pending order backlog, and billing realization.

#### 4. Purchasing Report (`/dashboards/procurement`)
- Vendor spend breakdown, purchase order cycle time, raw steel coil price variance trends, and supplier on-time delivery (OTD) ratings.

#### 5. Stock Report (`/dashboards/inventory`)
- Total stock valuation in INR, store-wise breakdown (Raw Material, WIP, Finished Goods), slow-moving and dead-stock identification, inventory turnover ratio.

#### 6. Production Report (`/dashboards/production`)
- Total gross press stroke count, plan vs actual output variance, work order cycle time efficiency, and downtime loss analysis.

#### 7. Quality Report (`/dashboards/quality`)
- Incoming raw material rejection PPM, in-process defect PPM, final assembly inspection yield %, defect Pareto analysis (Burrs, Dents, Cracks, Dimensional Inaccuracy), open NCR count.

#### 8. Maintenance Report (`/dashboards/maintenance`)
- Mean Time Between Failures (MTBF), Mean Time To Repair (MTTR), breakdown frequency by press line, preventive maintenance schedule adherence %, spare parts cost.

---

### C. Module 2: Master Data Governance (`/master`)

Standing lists and master files that serve as the foundation for all operational transactions:

1. **Customers (`/master/customer`):** Client codes, legal entity name, GSTIN, PAN, billing/shipping addresses, credit limits, credit payment days, delivery terms, and customer contacts.
2. **Suppliers (Vendors) (`/master/vendor`):** Vendor codes, legal name, MSME status, GSTIN, bank IFSC and account details, approved vendor rating, lead time in days.
3. **Products We Make (`/master/product`):** Stamped automotive parts, customer part numbers, internal part codes, engineering drawing numbers, revision level, HSN code (`8708...`), standard selling price.
4. **Raw Materials (`/master/material`):** Steel coils (CRCA, HR, EDD grades), strip sheet thicknesses (0.8mm to 3.2mm), fasteners, hardware, stamping lubricants, unit weight (Kg/Nos).
5. **Units of Measure (`/master/uom`):** Base units (`NOS`, `KGS`, `MTR`, `SET`), conversion factors (e.g., 1 Coil = 2,500 Kg, 1 Box = 50 Nos).
6. **Stores & Warehouses (`/master/warehouse`):** Raw Material Store (`WH-RM`), Press Shop WIP Store (`WH-WIP`), Finished Goods Store (`WH-FG`), Scrap Yard, rack and bin allocations.
7. **Machines (`/master/machine`):** Mechanical stamping presses (50T to 500T), hydraulic presses, decoilers, servo feeders, robotic welding cells, tonnage, stroke speed, hourly operating cost rate.
8. **Work Centres (`/master/workcenter`):** Groupings of machines (Heavy Press Line 1, Light Blanking Line, Sub-Assembly Cell), available shift hours, capacity ratings.
9. **System Settings (`/master/system-config`):** Prefix numbering series (`SO-2026-`, `PO-2026-`, `WO-2026-`, `GRN-2026-`), financial year lock dates, base currency (INR ₹), email notification triggers.

- **Admin Capabilities:** Complete Create, Read, Update, Delete, Import (CSV), and Export across all 9 master datasets.

---

### D. Module 3: Engineering & Product Design (`/engineering`)

1. **Parts Lists (BOM) (`/engineering/bom`):**
   - Multi-level Bill of Materials linking finished stamped bracket/panel to raw steel coil grade, strip pitch, blank gross weight, net part weight, and engineered scrap allowance.
   - Version control (`Rev A`, `Rev B`), active/inactive status flags, tool reference numbers.
2. **Process Steps (Routing) (`/engineering/routing`):**
   - Sequential operations plan (Op 10: Decoiling & Blanking ➔ Op 20: Drawing ➔ Op 30: Piercing & Trimming ➔ Op 40: Deburring ➔ Op 50: Projection Welding ➔ Op 60: Packing).
   - Machine assignment, setup time (die setting hours), run cycle time (strokes per minute), operator skill requirement.
3. **Design Change Requests (ECM) (`/engineering/change`):**
   - Formal Engineering Change Management (ECM/ECR/ECO) for customer drawing revisions.
   - Tool modification tracking, scrap risk assessment, effective cutoff dates, change approval workflows.

---

### E. Module 4: Sales & Commercial (`/sales`)

1. **Customer Inquiries (`/sales/inquiry`):**
   - Central register for inbound customer RFQs and development inquiries.
   - Technical drawing uploads, target annual volume, expected target price, technical feasibility sign-off (`Feasible`, `Feasible with Tooling Mod`, `Regret`).
   - One-click `Convert to Quotation`.
2. **Quotations (`/sales/quotation`):**
   - Precision sheet-metal cost estimator: Raw material gross weight, stamping machine hourly cost, secondary coating/plating, tooling amortization, scrap recovery credit.
   - Quotation revisioning (`Rev 0`, `Rev 1`), formal commercial PDF proposal generation, one-click `Convert to Sales Order`.
3. **Sales Orders (`/sales/order`):**
   - Confirmed customer PO entry, line items, pricing, GST tax calculation.
   - Multi-date delivery schedules for Just-In-Time (JIT) customer schedules.
   - Real-time batch allocation from finished goods warehouse (`WH-FG`).
   - Order confirmation triggering automated demand alerts.

---

### F. Module 5: Demand Planning (`/demand`)

1. **Demand Forecast (`/demand/forecasting`):**
   - 3-to-6 month rolling customer forecast schedules.
   - Historical consumption tracking, seasonal demand variations, OEM vehicle production projections.
2. **Combined Demand (Consolidation) (`/demand/consolidation`):**
   - Merges confirmed firm Sales Orders with uncommitted customer forecasts into a unified net production demand by part number, plant, and month.

---

### G. Module 6: Material Requirements Planning (MRP) (`/mrp`)

1. **Run Material Plan (`/mrp/execution`):**
   - Multi-level MRP computation engine.
   - Explodes BOMs against consolidated demand, deducting on-hand warehouse inventory and open purchase orders.
2. **Material Shortages (`/mrp/shortages`):**
   - Identifies exact raw material shortages (e.g., CRCA Coil 1.2mm shortage of 8,500 Kg on 24-Oct).
   - Projects expected stockout dates and shortage impact on work orders.
3. **Suggested Orders (Recommendations) (`/mrp/recommendations`):**
   - Algorithmic purchasing and production recommendations: Suggested POs for raw steel coils/fasteners and suggested Work Orders for press shop batches.
   - One-click approval converting recommendations into active Purchase Orders and Work Orders.

---

### H. Module 7: Capacity Planning (`/capacity`)

1. **Machine Capacity (`/capacity/machine`):**
   - Machine load vs capacity analysis (required stamping hours vs available shift hours).
   - Identifies bottleneck presses (e.g., 250T mechanical press running at 115% capacity).
2. **Manpower Capacity (`/capacity/labor`):**
   - Press operator, die setter, and welder shift availability vs required labor hours.
3. **Production Schedule (`/capacity/schedule`):**
   - Daily sequencing of work orders on press lines to minimize die changeover times and optimize shop floor throughput.

---

### I. Module 8: Purchasing & Procurement (`/procurement`)

1. **Purchase Requests (PR) (`/procurement/requisition`):**
   - Internal material and consumable indents generated from MRP shortages or manual workshop requisitions.
   - Approval routing based on department and estimated value.
2. **Supplier Price Requests (RFQ) (`/procurement/rfq`):**
   - Multi-vendor quotation requests for raw coils and tooling.
   - Side-by-side comparative quote analysis (base price, freight, payment terms, delivery lead time).
3. **Purchase Orders (PO) (`/procurement/po`):**
   - Formal legally-binding supplier purchase orders.
   - Rate contracts for steel mills (Tata Steel, JSW), delivery milestones, GST tax breakdown, email generation, and multi-tier approval status.
4. **Supplier Performance (`/procurement/performance`):**
   - Vendor rating scorecard tracking On-Time In-Full (OTIF) delivery %, rejection PPM rate, and pricing competitiveness.

---

### J. Module 9: Goods Receiving & Inward Store (`/receipt`)

1. **Goods Received Note (GRN) (`/receipt/grn`):**
   - Gate entry and physical receipt of goods against open Purchase Orders.
   - Capture supplier DC/Invoice number, coil heat number, bundle weight, and mill test certificate (MTC).
2. **Inspect Received Goods (`/receipt/inspection`):**
   - Quality inspection gate: verify coil thickness, tensile hardness (HRB), surface finish, visual defect checks.
   - Record accepted quantity, rejected quantity, and quarantine status.
3. **Move Into Stock (`/receipt/inventory`):**
   - Posts accepted material into Raw Material Store (`WH-RM`) with unique batch/lot identification and automatic General Ledger inventory valuation posting.

---

### K. Module 10: Stock (Inventory) Management (`/inventory`)

1. **Stock on Hand (`/inventory/control`):**
   - Real-time stock levels across all plant warehouses (`WH-RM`, `WH-WIP`, `WH-FG`, `WH-SCRAP`) down to specific racks and bins.
2. **Stock Movements (`/inventory/transactions`):**
   - Complete transaction ledger of all stock issues to shop floor, receipts from suppliers, inter-warehouse transfers, and floor returns.
3. **Reorder Levels (`/inventory/optimization`):**
   - Dynamic Min-Max inventory thresholds, safety stock buffers, and reorder triggers to prevent coil stockouts.
4. **Stock Valuation (`/inventory/valuation`):**
   - Real-time financial valuation of total inventory using FIFO and Weighted Average cost methods.
5. **Batch & Lot Tracking (`/inventory/traceability`):**
   - End-to-end forward and backward automotive traceability: search any finished stamped part serial number and trace it back through work orders to the exact raw steel coil heat number and mill certificate.

---

### L. Module 11: Production Management (`/production`)

1. **Production Plan (`/production/plan`):**
   - Master Production Schedule (MPS) allocating stamping batches to weekly and monthly press shop calendars.
2. **Work Orders (`/production/wo`):**
   - Job cards released to the shop floor detailing target part, planned quantity, BOM requirements, press routing operations, assigned machine, and due dates.
3. **Allocate Material (`/production/allocation`):**
   - Physical reservation of raw steel coils and sheet blanks for released work orders, preventing double-allocation.
4. **Run Production (Execution) (`/production/execution`):**
   - Live job card tracking: Start, Pause, Resume, and Complete stamping operations with operator login and stroke counters.
5. **Production Output (`/production/output`):**
   - Booking of finished stamped parts produced, recording offcut scrap weight, and posting output into WIP or Finished Goods store.

---

### M. Module 12: Shop Floor Governance (`/shopfloor`)

1. **Operators (`/shopfloor/operator`):**
   - Operator shift logging, skill matrix mapping (e.g., Grade A Press Operator, Die Setter, Welder), and machine assignments.
2. **Machine Usage (`/shopfloor/machine`):**
   - Press utilization monitoring, stroke counts, operating vs idle hours.
3. **Machine Downtime (`/shopfloor/downtime`):**
   - Logging of unplanned stoppages by standardized reason codes (Die Breakdown, Coil Jam, Power Outage, Waiting for Material, Preventative Check) with downtime duration.
4. **Scrap & Rejections (`/shopfloor/scrap`):**
   - Defect logging by operation (Burrs, Wrinkling, Tear, Dimensional Inaccuracy), recording scrap weight in kilograms for scrap metal recovery credit.

---

### N. Module 13: Quality Assurance & Control (`/quality`)

1. **Incoming Material Checks (`/quality/incoming`):**
   - Chemical and physical inspection logs for incoming raw coils against Mill Test Certificates (MTC).
2. **In-Process Checks (`/quality/in-process`):**
   - First-piece inspection sign-off and periodic hourly patrol inspections with dimensional vernier/micrometer readings.
3. **Final Inspection (`/quality/final`):**
   - Pre-dispatch inspection of finished stamped parts, checking visual plating/coating quality, critical dimensions, and packaging.
4. **Inspection Parameters (`/quality/parameters`):**
   - Quality inspection plans, critical dimensions, tolerance limits (upper/lower specifications), and sampling standards.
5. **Quality Problems & Fixes (NCR) (`/quality/ncr`):**
   - Non-Conformance Report (NCR) management, 5-Why root cause analysis, Ishikawa cause-and-effect diagrams, and Corrective/Preventive Action (CAPA) sign-off.
6. **Quality Reports (`/quality/analytics`):**
   - Defect trend charts, supplier PPM rankings, internal scrap analysis, and Cost of Poor Quality (COPQ).

---

### O. Module 14: Plant Maintenance (`/maintenance`)

1. **Planned Maintenance (`/maintenance/preventive`):**
   - Scheduled servicing calendars for mechanical presses, hydraulic oil replacements, lubrication schedules, and die maintenance logs.
2. **Breakdown Repairs (`/maintenance/breakdown`):**
   - Emergency breakdown ticket logging, technician assignment, repair action log, spare parts consumed, downtime closure.
3. **Spare Parts (`/maintenance/sparepart`):**
   - Inventory tracking for press spares: die springs, punches, hydraulic valves, seals, sensors, lubricating oils.
4. **Maintenance Reports (`/maintenance/analytics`):**
   - MTBF, MTTR, breakdown frequency trends, total repair expenditure.

---

### P. Module 15: Dispatch & Delivery (`/dispatch`)

1. **Dispatch Plan (`/dispatch/planning`):**
   - Daily and weekly dispatch schedules consolidating finished parts against confirmed customer Sales Orders.
2. **Record Dispatch (Execution) (`/dispatch/execution`):**
   - Delivery Challan (DC) generation, picking finished goods from `WH-FG`, packing slip creation, vehicle registration number, driver details, e-Way bill reference.
3. **Delivery Tracking (`/dispatch/tracking`):**
   - Shipment status monitoring (`Dispatched`, `In Transit`, `Delivered`, `Customer Acknowledged`), Proof of Delivery (POD) logging.

---

### Q. Module 16: Finance & Accounts (`/finance`)

1. **Money In (Receivable) (`/finance/ar`):**
   - Customer Tax Invoices generated against dispatches, payment receipt tracking, aging analysis (30/60/90 days), TDS reconciliation.
2. **Money Out (Payable) (`/finance/ap`):**
   - Supplier bill booking against GRN (3-way match: PO vs GRN vs Vendor Invoice), payment voucher generation (RTGS/NEFT/Cheque), vendor aging ledger.
3. **General Ledger (`/finance/ledger`):**
   - Standard Chart of Accounts (COA), automated double-entry journal vouchers for all inventory movements, material issues, sales, and purchases.
4. **Tax & GST (`/finance/tax`):**
   - GSTR-1 outward supply summaries, GSTR-2B input tax credit reconciliation, GST payment working.
5. **Financial Statements (`/finance/statements`):**
   - Real-time Balance Sheet, Profit & Loss (P&L) statements, Trial Balance with direct drill-down into accounting vouchers.
6. **Cost Accounting (`/finance/costing`):**
   - Product-level standard vs actual costing, variance analysis (material consumption variance, press machine rate variance, labor variance).

---

### R. System Auditing & Compliance Menu

#### 1. Reported Problems (`/issues`)
- **Operational Helpdesk & Issue Queue:** View, filter, and manage user tickets reported from shop floor or office screens.
- **Admin Capabilities:** Change ticket status (`Open`, `Under Investigation`, `Resolved`, `Closed`), assign to IT staff, and log resolution notes visible to employees.

#### 2. Change History (Audit) (`/audit`)
- **IATF 16949 / ISO 9001 Compliance Audit Trail:** Tamper-proof, non-repudiation log capturing every system event with microsecond timestamps, user email, action (`CREATE`, `UPDATE`, `DELETE`, `LOGIN`), entity, before/after diffs, and client IP address.
- **Admin Capabilities:** Filter by user, date range, module, or transaction ID; export audit logs to CSV for compliance review.

---

## 5. Master Client Demonstration Script (25-Minute Executive Walkthrough)

When demonstrating Precision ERP to client leadership (Managing Director, COO, Head of IT), follow this high-impact 7-step narrative:

### Step 1: Login & Executive Vision (3 mins)
- Log in as `admin@example.com` / `password123`.
- Highlight the modern industrial UI (show Dark Mode and Light Mode toggle).
- Show the **Dashboard (`/dashboard`)**: "Here, your leadership team gets an instantaneous view of daily press output, scrap PPM, active work orders, and billing realization without waiting for end-of-shift spreadsheets."

### Step 2: Multi-Plant Governance & Security (4 mins)
- Open **Company Setup (`/company`)**: Show how the ERP natively models multiple stamping plants (`LBAP-HOSUR`), business units, departments, and cost centers.
- Open **Users & Logins (`/users`)** and **Roles & Access (`/roles`)**: Demonstrate how granular RBAC locks a press operator into shop floor screens and prevents unauthorized visibility into customer pricing or financial ledgers.
- Open **Who Can Approve What (`/approval-rights`)**: Demonstrate the visual multi-tier approval matrix with spend thresholds and quick automotive presets.

### Step 3: Engineering, Sales & Demand Planning (5 mins)
- Open **Parts Lists (BOM) (`/engineering/bom`)**: Show how a stamped automotive bracket is modeled with gross steel coil blank weight, net part weight, and engineered offcut scrap allowance.
- Open **Sales Orders (`/sales/order`)**: Demonstrate confirmed customer orders with multi-date delivery schedules for OEM JIT supply and real-time finished goods stock allocation.
- Open **Combined Demand (`/demand/consolidation`)**: Show how firm orders and rolling customer forecasts merge into unified production demand.

### Step 4: Intelligent MRP & Purchasing (4 mins)
- Open **Material Planning (MRP) (`/mrp/execution`)**: Demonstrate how running the MRP engine explodes BOMs, checks warehouse stock, and calculates net steel coil requirements.
- Open **Material Shortages (`/mrp/shortages`)** and **Suggested Orders (`/mrp/recommendations`)**: Show how the system recommends exact steel coil purchase orders and work orders, ready for 1-click release.
- Open **Purchase Orders (`/procurement/po`)**: Show rate-contract purchase orders for Tata Steel / JSW with GST tax breakdowns.

### Step 5: Shop Floor Execution & Traceability (4 mins)
- Open **Work Orders (`/production/wo`)**: Show released stamping job cards with machine assignments and allocated steel coils.
- Open **Shop Floor Scrap (`/shopfloor/scrap`)** and **Machine Downtime (`/shopfloor/downtime`)**: Show real-time logging of press stoppages and rejection defect codes.
- Open **Batch & Lot Tracking (`/inventory/traceability`)**: **THE WOW MOMENT:** Type a finished part batch number and demonstrate 100% backward traceability to the exact steel coil heat number and mill certificate.

### Step 6: Dispatch, Quality & Finance (3 mins)
- Open **Quality NCR (`/quality/ncr`)**: Show 5-Why root cause analysis and CAPA tracking for IATF compliance.
- Open **Record Dispatch (`/dispatch/execution`)**: Show Delivery Challan (DC) generation with vehicle numbers and e-Way bill references.
- Open **Financial Statements (`/finance/statements`)** and **General Ledger (`/finance/ledger`)**: Show how inventory movements automatically generate double-entry journal vouchers, updating the Balance Sheet and P&L in real time.

### Step 7: Compliance, Audit & Q&A (2 mins)
- Open **Change History (`/audit`)**: Show how any modified record (an altered PO price, user permission change, or deleted bill) is permanently recorded with user identity, timestamp, and before/after diffs for ISO/IATF auditors.
- Conclude by showing the **Command Palette (`Ctrl + K`)**: Demonstrate jumping to any screen in under one second.
