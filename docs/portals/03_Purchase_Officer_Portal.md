# Portal Documentation: Purchase Officer
**Procurement, Sourcing & Vendor Relationship Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Purchase Officer
- **Login Email:** `purchase.officer@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Deepa Iyer (Senior Sourcing & Procurement Officer)
- **Target Demo Audience:** Head of Supply Chain, Sourcing Director, Materials Manager, Purchasing Team
- **Access Level:** Full Access to `Procurement`; Read-Only Access to `MRP`, `GoodsReceipt`, `DemandPlanning`, and `MasterData`.

---

## 2. Portal Overview & Value Proposition
In press-tool and sheet-metal manufacturing, raw material (steel coils: CRCA, HR, Galvanized, Stainless Steel) represents 60% to 75% of total product cost. Timely procurement with rigorous price comparison, schedule tracking, and vendor quality rating is critical to plant profitability.

The Purchase Officer Portal provides a closed-loop procurement workflow: converting MRP shortages into supplier inquiries (RFQs), comparing steel mill quotes side-by-side, releasing domestic and job-work POs with automated approval routing, and continuously monitoring vendor On-Time Delivery (OTD) and quality rejection rates.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Core Purchasing Operations (`/procurement`)

#### 1. Purchase Requests / Requisitions (`/procurement/requisition`)
- **Purpose:** Centralized repository of all purchase indents generated automatically by the Material Planning (MRP) engine or created manually by plant departments.
- **Key Fields & Capabilities:**
  - *Indent Number & Date:* Auto-generated requisition sequence (`PR-XXXX`).
  - *Source:* `MRP Auto-Generated` vs `Manual Shop Indent` (e.g. Die lubricants, maintenance welding rods, protective gloves).
  - *Item Details:* Material Code, Description, Quantity Requested, Unit of Measure, Required By Date.
  - *Department & Cost Center:* Allocates purchase cost to specific departments (e.g. Press Shop 1, Tool Room).
  - *Status:* `Pending Approval`, `Approved`, `Consolidated into RFQ`, `Converted to PO`, `Rejected`.
- **Actions:**
  - `New Requisition`: Manual entry modal for plant consumables or urgent tool spares.
  - `Consolidate Items`: Multi-select requisitions for the same steel grade (e.g. 2.0mm CRCA coil) and combine them into a single bulk RFQ to negotiate volume discounts with steel mills.

#### 2. Supplier Price Requests / RFQ (`/procurement/rfq`)
- **Purpose:** Request For Quotation management and side-by-side vendor quotation comparison.
- **Key Capabilities:**
  - *Float RFQ:* Select an indent and broadcast it to multiple approved steel service centers or hardware suppliers.
  - *Supplier Rate Capture:*
    - Base steel rate per metric ton or kilogram.
    - Slitting / blanking processing charges.
    - Freight & transit insurance.
    - Credit terms (e.g. Net 30, Net 60, Advance).
  - *Commercial Comparison Matrix:*
    - Side-by-side table highlighting the lowest bidder (L1), second lowest (L2), payment terms, and promised lead time.
- **Actions:**
  - `Award Supplier`: Selects the winning vendor and auto-populates the Purchase Order screen.

#### 3. Purchase Orders (`/procurement/po`)
- **Purpose:** Commercial contract generation for raw materials, bought-out parts, and job work processing.
- **Key Fields & Capabilities:**
  - *PO Header:* Supplier Selection, PO Type (`Regular PO`, `Job Work / Subcontracting PO`, `Capex PO`), Billing Plant, Delivery Plant, Currency, Payment Terms, IncoTerms.
  - *Line Items:* Material / Product Code, HSN, Quantity, Unit Price, GST % (IGST or CGST+SGST), Delivery Due Date.
  - *Delivery Schedules:* Break bulk orders into staggered weekly coil deliveries matching press consumption.
  - *Special Technical Clauses:* Specify coil width tolerance, slitting burr limits, mill test certificate (MTC) requirement, and packing specs.
  - *Approval Status:* If PO value exceeds buyer financial limit (configured in `/approval-rights`), status shifts to `Pending Management Approval`.
- **Actions:**
  - `+ New PO`: Create manual or RFQ-linked purchase order.
  - `Submit for Approval`: Sends notification to Plant Manager or Super Admin inbox.
  - `Print / Email PO`: Generates standardized PDF with digital terms and dispatches to supplier via email.
  - `Close PO`: Force-close unfulfilled balances after supplier delivery completion.

#### 4. Supplier Performance Scorecard (`/procurement/performance`)
- **Purpose:** Automated vendor rating based on objective receipt and quality inspection data.
- **KPI Metrics Tracked:**
  - *On-Time Delivery (OTD %):* Ratio of deliveries received on or before the committed PO delivery date.
  - *Quality Rating (PPM):* Rejection percentage of incoming coil batches during incoming QC inspection.
  - *Price Competitiveness Index:* Vendor quotation ranking over past 12 months.
  - *Overall Vendor Grade:* Automatic tier classification (`Grade A - Preferred`, `Grade B - Approved`, `Grade C - Under Review`, `Blacklisted`).

---

### B. Material Planning Visibility (Read-Only)

#### 1. Material Shortages (`/mrp/shortages`)
- **Purpose:** Live shortage radar highlighting materials that will stock out based on released production work orders.
- **Details Displayed:** Part Code, Current Stock on Hand, Stock in Transit (Open POs), Production Demand, Net Shortage Date.

#### 2. Suggested Orders (`/mrp/recommendations`)
- **Purpose:** View automated suggestions from the MRP run.
- **Functionality:** Shows which raw materials need immediate PO placement, the recommended order quantity based on Economic Order Quantity (EOQ), and the required order date to respect vendor lead time.

---

### C. Supporting Operational Visibility (Read-Only)

#### 1. Goods Received Notes (`/receipt/grn`)
- **Purpose:** View security gate receipt log to verify which suppliers have delivered against open POs and what is currently parked in the inspection bay.

#### 2. Master Data (`/master`)
- **Suppliers (`/master/vendor`):** View approved vendor directory, GSTIN, MSME registration, bank details, and approved categories (Coil Supplier, Plating Subcontractor, Hardware).
- **Raw Materials (`/master/material`):** Technical catalog of coil thicknesses, steel grades, scrap allowances, and standard purchase costs.

#### 3. Purchasing Analytics (`/dashboards/procurement`)
- Total procurement spend by month and supplier category, open PO backlog value, and price variance analysis.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `purchase.officer@lbap.in`**:
   - Highlight that the buyer's screen focuses exclusively on procurement efficiency and supplier accountability.
2. **Open Material Shortages (`/mrp/shortages`)**:
   - Show how the procurement team immediately spots impending stockouts (e.g. 1.5mm CRCA coil running short next Thursday).
3. **Open Suggested Orders (`/mrp/recommendations`)**:
   - Demonstrate how the system calculates the exact tonnage needed, accounting for existing open POs and minimum supplier order quantities (MOQ).
4. **Open RFQ Management (`/procurement/rfq`)**:
   - Show the comparison table between multiple steel service centers with side-by-side L1/L2 price highlighting.
5. **Open Purchase Orders (`/procurement/po`)**:
   - Create a Purchase Order, demonstrate line items and staggered delivery schedules, and show how the system automatically checks approval limits before issuing.
6. **Open Supplier Performance (`/procurement/performance`)**:
   - Show the automated vendor scorecard with OTD % and PPM rejection ratings — explain to the client how this eliminates supplier bias and ensures IATF compliance.
