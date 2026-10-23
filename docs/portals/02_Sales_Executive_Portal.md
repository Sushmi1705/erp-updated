# Portal Documentation: Sales Executive
**Commercial, Quotations & Customer Order Fulfillment Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Sales Executive
- **Login Email:** `sales.exec@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Karthik Raman (Sales & Customer Accounts Executive)
- **Target Demo Audience:** Commercial Director, Head of Sales, Business Development Managers, Key Account Executives
- **Access Level:** Full Access to `Sales`; Read-Only Access to `MasterData`, `Inventory`, and `Dispatch`.

---

## 2. Portal Overview & Value Proposition
In tiered automotive component manufacturing, sales is not just about logging an order — it requires precision costing (sheet blank weight, press cycle time, scrap credit, tooling amortization), revision control over engineering drawings, customer schedule adherence, and immediate stock allocation.

The Sales Executive portal streamlines the commercial lifecycle from initial customer drawing receipt to quotation revisioning, customer PO confirmation, multi-date delivery scheduling, and real-time shipment monitoring.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Core Sales Management (`/sales`)

#### 1. Customer Inquiries (`/sales/inquiry`)
- **Purpose:** Centralized register of all inbound customer RFQs, new part development requests, and pricing inquiries.
- **Key Fields & Capabilities:**
  - *Customer Selection:* Search and select from approved OEM/Tier-1 customer directory.
  - *Inquiry Details:* Customer Inquiry Ref / Email Date, Target Delivery Date.
  - *Part Requirements:* Part Name, Target Annual Volume, Expected Target Price (INR).
  - *Attachments:* Upload customer technical drawings (PDF/DWG) and 3D CAD files.
  - *Feasibility Assessment:* Mark technical and manufacturing feasibility (`Feasible`, `Feasible with Tooling Modification`, `Regret/Cannot Make`).
- **Actions:**
  - `New Inquiry`: Modal form to log inbound inquiry.
  - `Convert to Quotation`: Transfers part specifications, customer details, and volumes directly into the Quotation builder without double data entry.

#### 2. Quotations (`/sales/quotation`)
- **Purpose:** Engineering-backed cost estimation and formal quotation generation.
- **Cost Estimation Breakdown:**
  - *Raw Material Cost:* Coil grade, strip width, pitch, blank weight, gross vs net weight, and scrap realization credit.
  - *Stamping Operations:* Press tonnage required (e.g. 100T mechanical press), strokes per minute (SPM), and machine hourly rate.
  - *Secondary Processes:* Deburring, projection welding, zinc plating, powder coating, and heat treatment.
  - *Tooling Cost:* New press tool / progressive die manufacturing cost and amortization schedule.
  - *Packaging & Freight:* Returnable plastic bins vs corrugated boxes, local freight.
- **Revision Control (`Rev 0`, `Rev 1`, `Rev 2`):**
  - Keeps historical record of every price negotiation iteration with the client.
- **Actions:**
  - `Generate PDF Quote`: Produces a formal branded commercial quotation letter with GST, terms of delivery (Ex-Works / CIF), and payment terms.
  - `Convert to Sales Order`: Once the customer issues a PO, converts the approved quotation revision into a confirmed Sales Order.

#### 3. Sales Orders (`/sales/order`)
- **Purpose:** Confirmed customer sales orders, delivery scheduling, and batch stock commitment.
- **Screen Architecture & Drill-Down Sections:**
  - **Header Level:** Customer PO Number, Customer PO Date, Billing Address, Shipping Address, Payment Terms, Currency, Order Status (`Draft`, `Confirmed`, `In Production`, `Dispatched`, `Closed`).
  - **Order Lines Section:**
    - List of finished goods part numbers, description, HSN code, ordered quantity, unit price, tax rate (GST 18% / 28%), and total line value.
  - **Delivery Schedules Drill-Down:**
    - Essential for automotive JIT (Just-In-Time) deliveries.
    - Allows breaking down a 50,000-piece annual order into weekly or daily delivery schedules (e.g. 2,500 pcs every Tuesday).
  - **Batch & Stock Allocation Drill-Down:**
    - Shows real-time warehouse inventory for the selected part.
    - Sales Executive can allocate specific manufactured batches to the upcoming delivery schedule, guaranteeing stock reservation.
- **Available Actions & Buttons:**
  - `+ New Order`: Header creation form with automated document sequencing (`SO-XXXX`).
  - `+ Add Line`: Line-item addition with real-time tax and amount calculations.
  - `+ Add Schedule`: Schedule generator for line items.
  - `Allocate Batch`: Locks physical warehouse inventory against the order schedule.
  - `Confirm Order`: Freezes the order and triggers demand alerts for Production Planning (MRP).

---

### B. Reports & Analytics (`/dashboards`)

#### 1. Sales Report (`/dashboards/sales`)
- **Visual Analytics:**
  - Monthly Order Intake vs Target Run-rate.
  - Revenue distribution by OEM Client (e.g. TATA Motors, Mahindra, Bosch).
  - Top 10 selling stamped parts and sub-assemblies.
  - Pending Order Book value awaiting dispatch.

#### 2. All Reports Hub (`/dashboards`)
- High-level directory of departmental metrics with quick links.

---

### C. Supporting Operational Visibility (Read-Only)

#### 1. Master Data (`/master`)
- **Customers (`/master/customer`):** View customer legal details, GSTIN, credit limits, payment terms, and contact directory.
- **Products We Make (`/master/product`):** View internal part numbers, customer drawing numbers, standard selling prices, and HSN classifications.

#### 2. Stock on Hand (`/inventory/control`)
- Live warehouse visibility into Finished Goods Store (`WH-FG-01`).
- Check batch status: `Available`, `Allocated`, or `Quality Quarantine`.
- Prevents promising delivery dates for items with zero finished inventory or unallocated raw coils.

#### 3. Dispatch & Delivery (`/dispatch`)
- **Dispatch Plan (`/dispatch/planning`):** View scheduled dispatches planned by the logistics department for today and the upcoming week.
- **Delivery Tracking (`/dispatch/tracking`):** Track truck dispatch status, LR/e-Way bill numbers, and delivery confirmation (POD) to respond instantly to customer follow-ups.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `sales.exec@lbap.in`**:
   - Point out how clean and focused the navigation is — irrelevant engineering and finance screens are omitted.
2. **Open Customer Inquiries (`/sales/inquiry`)**:
   - Show how an inquiry from an automotive OEM is logged with CAD drawings attached.
3. **Open Quotations (`/sales/quotation`)**:
   - Walk through a quotation showing raw material blank weight, press machine rate, and revision history. Click `Convert to Sales Order`.
4. **Open Sales Orders (`/sales/order`)**:
   - Select an order and demonstrate the **Delivery Schedules** feature. Explain: *"In the automotive industry, OEMs release a single blanket PO for 50,000 parts, but demand delivery of 2,000 parts every Monday. Our system natively tracks multi-schedule fulfillment."*
5. **Demonstrate Batch Allocation**:
   - Click `Allocate Batch` to show how existing finished goods stock is reserved specifically for that customer's shipment.
6. **Check Stock on Hand (`/inventory/control`)**:
   - Demonstrate how the sales team has live stock visibility without needing to call the warehouse supervisor.
