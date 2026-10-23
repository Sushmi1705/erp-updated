# Portal Documentation: Store Keeper
**Inward Gate, Goods Receipt (GRN) & Warehouse Stock Management Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Store Keeper
- **Login Email:** `store.keeper@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Muthuvel Pandian (Stores & Warehouse In-Charge)
- **Target Demo Audience:** Warehouse Manager, Inventory Controller, Materials Logistics Head, Gate Security In-Charge
- **Access Level:** Full Access to `GoodsReceipt` and `Inventory`; Read-Only Access to `Procurement` and `MasterData`.

---

## 2. Portal Overview & Value Proposition
In automotive press shops, warehouse discipline is paramount. Raw material steel coils arrive in multi-ton coils requiring heat number tracking, mill test certificate verification, quarantine inspection, and bin allocation. A single misplaced coil or unverified steel thickness can damage a progressive press die costing millions of rupees.

The Store Keeper Portal enforces 100% digital control over physical movements: security gate entry against active POs, Goods Receipt Note (GRN) generation, barcode batch tagging, quarantine staging, stock transfer into bin locations, issue of raw coils to press work orders, and end-to-end batch genealogy.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Goods Receiving Module (`/receipt`)

#### 1. Goods Received Note / GRN (`/receipt/grn`)
- **Purpose:** Inward entry of materials at the security gate and dock unloading bay.
- **Key Capabilities & Fields:**
  - *PO Matching:* Search and select valid open Purchase Order. Validates that the supplier and items match pre-approved orders (prevents unapproved deliveries).
  - *Shipment Documentation:* Transporter Name, Vehicle / Truck Number, Delivery Challan (DC) Number & Date, Supplier Tax Invoice Number.
  - *Quantity Inwarded:* Physical weight / count received vs PO order balance.
  - *Batch & Heat Number Capture:*
    - Captures Steel Mill Heat Number (e.g. `HEAT-JSW-98421`), Coil Number, and Slit Identification.
    - Automatically generates internal Unique Barcode Lot ID (`LOT-2026-XXXX`).
  - *Initial Status:* Marked as `Under Quality Inspection` (staged in receiving quarantine).
- **Actions:**
  - `New GRN`: Full entry form with item auto-fill from PO.
  - `Print GRN Slip & Barcode Tags`: Prints physical receiving voucher and barcode stickers to affix directly onto the steel coils.

#### 2. Inspect Received Goods (`/receipt/inspection`)
- **Purpose:** Warehouse staging area reflecting the status of items under inspection by Quality Control.
- **Functionality:**
  - Displays all inwarded lots currently held in the QC bay.
  - Read status updates from Quality Inspectors: `Accepted`, `Rejected`, `Partially Accepted`.
  - Once QC signs off, enables immediate movement into active inventory.

#### 3. Move Into Stock (`/receipt/inventory`)
- **Purpose:** Physical putaway and warehouse rack/bin assignment for accepted goods.
- **Capabilities:**
  - Assign destination warehouse: Raw Material Store (`WH-RM-01`), Bought-Out Store (`WH-BO-01`), Consumables Store (`WH-CS-01`).
  - Assign specific storage Rack, Row, and Bin location (e.g. `RACK-A3-BIN-12`).
  - Updates system status from `Quarantine` to `Available for Production`.

---

### B. Stock & Inventory Management (`/inventory`)

#### 1. Stock on Hand (`/inventory/control`)
- **Purpose:** Real-time visibility into all physical stock across the plant.
- **Multi-Level Filtering & Views:**
  - Filter by Warehouse, Material Category (Coil, Blank, Child Part, Hardware, Finished Goods).
  - Search by Part Number, Heat Number, or Batch ID.
- **Data Columns Displayed:**
  - Item Code, Description, Warehouse Location, Bin ID, Available Quantity, Reserved / Allocated Quantity, On-Order Quantity, Ageing Days in Store.

#### 2. Stock Movements & Transactions (`/inventory/transactions`)
- **Purpose:** Complete transactional stock ledger tracking every issue, receipt, and transfer.
- **Transaction Types Supported:**
  - *Goods Issue to Production:* Issue raw coil or blanks against released Work Orders (`WO-XXXX`). Automatically checks against allocated BOM.
  - *Inter-Warehouse Transfer:* Move materials between Raw Material Store and Line-Side Press Storage.
  - *Floor Material Return:* Return unused partial coils or intact strip ends back to the warehouse with newly weighed balance.
  - *Stock Adjustments:* Cycle counting and annual audit discrepancy reconciliation with mandatory reason code.
- **Actions:**
  - `Issue Material`: Work order issue form with real-time stock balance check.
  - `Transfer Stock`: Inter-store movement voucher.

#### 3. Reorder Levels & Optimization (`/inventory/optimization`)
- **Purpose:** Scientific inventory parameters to prevent line stoppages and excess working capital lockup.
- **Parameters Managed:**
  - Minimum Safety Stock, Maximum Allowed Stock, and Reorder Point (ROP).
  - Automatic visual flags: `Critically Low`, `Reorder Required`, `Healthy`, `Overstocked`.

#### 4. Stock Valuation (`/inventory/valuation`)
- **Purpose:** Total valuation of physical inventory assets for accounting and insurance reporting.
- **Valuation Methods:**
  - FIFO (First-In, First-Out) and Weighted Moving Average.
  - Total inventory asset value broken down by Raw Material, Work In Progress (WIP), and Finished Goods.

#### 5. Batch & Lot Traceability (`/inventory/traceability`)
- **Purpose:** Automotive IATF 16949 compliant genealogy and lot recall radar.
- **Genealogy Tracking:**
  - *Downward Trace:* Search a Steel Mill Heat Number ➔ see every blanking job, stamping work order, finished part, and customer delivery challan it went into.
  - *Upward Trace:* Search a Customer Dispatch DC / Serial Number ➔ trace backwards through finished assembly ➔ stamping press run ➔ operator shift ➔ incoming raw material coil and mill test certificate.

---

### C. Supporting Operational Visibility (Read-Only)

#### 1. Purchase Orders (`/procurement/po`)
- View approved supplier purchase orders to cross-check delivery specifications, allowed quantity tolerances (±5% coil weight variance), and delivery due dates.

#### 2. Master Data (`/master`)
- **Stores & Warehouses (`/master/warehouse`):** View warehouse layouts, storage zones, and bin configurations.
- **Materials (`/master/material`):** Raw material technical specifications, standard packaging units, and weight per piece.

#### 3. Inventory Analytics (`/dashboards/inventory`)
- Stock turnover ratio, ageing analysis of slow-moving items (>90 days), and scrap yard inventory accumulation.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `store.keeper@lbap.in`**:
   - Emphasize to the client that this portal is built for rugged warehouse use — high contrast, fast barcode lookup, and zero unnecessary paperwork.
2. **Open Goods Received (GRN) (`/receipt/grn`)**:
   - Click `New GRN` and select an open Purchase Order. Show how supplier details and agreed rates auto-fill.
   - Enter the Supplier Challan Number and Mill Heat Number. Explain how this auto-generates the internal barcode lot ID.
3. **Open Move Into Stock (`/receipt/inventory`)**:
   - Show how accepted lots are assigned to specific storage bins (e.g. `WH-RM-01 / RACK-B2`), making parts instantly findable on the floor.
4. **Open Stock Movements (`/inventory/transactions`)**:
   - Demonstrate the `Issue Material` action — select a Work Order and show how the system issues the exact steel coil allocated to that job.
5. **Open Batch & Lot Traceability (`/inventory/traceability`)**:
   - Type in a batch number and show the complete visual genealogy tree from raw coil to final customer dispatch. Explain: *"If a customer reports a crack in a bracket, within 30 seconds you can identify every other vehicle that received parts from that same steel coil."*
