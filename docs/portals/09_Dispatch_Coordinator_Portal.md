# Portal Documentation: Dispatch Coordinator
**Finished Goods Shipping, Delivery Challans, Logistics & In-Transit Tracking Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Dispatch Coordinator
- **Login Email:** `dispatch.coordinator@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Lakshmi Narayanan (Logistics, Finished Goods & Dispatch Coordinator)
- **Target Demo Audience:** Head of Logistics, Finished Goods Warehouse Manager, Dispatch In-Charges, Transportation Coordinators
- **Access Level:** Full Access to `Dispatch`; Read-Only Access to `Sales`, `Inventory`, and `MasterData`.

---

## 2. Portal Overview & Value Proposition
In Tier-1 automotive supply chains, missing a customer delivery window by even two hours can shut down an OEM vehicle assembly line, triggering crippling line-stoppage penalties. Dispatch coordinators must balance customer delivery schedules, finished goods batch availability, returnable packaging bins, transporter truck bookings, and statutory shipping documentation (Delivery Challans and e-Way Bills).

The Dispatch Coordinator Portal organizes the shipping dock: consolidating customer schedule demands into optimized vehicle loads, generating legal Delivery Challans (DC) with serial and batch numbers, logging transporter and driver credentials, automatically deducting dispatched stock from inventory, and tracking consignments through to customer Proof of Delivery (POD) sign-off.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Dispatch & Logistics Operations (`/dispatch`)

#### 1. Dispatch Plan (`/dispatch/planning`)
- **Purpose:** Consolidated daily and weekly shipping planner aligning customer PO schedules with finished goods warehouse availability.
- **Key Capabilities & Views:**
  - *Customer Schedule Demand Grid:* Shows all confirmed Sales Order lines due for delivery today or in the upcoming week.
  - *Finished Goods Stock Check:* Live comparison between ordered quantity vs available stock in the Finished Goods Store (`WH-FG-01`).
    - 🟢 Green: Full stock available and batch allocated.
    - 🟡 Amber: Partial stock available (can make partial shipment).
    - 🔴 Red: Insufficient stock (informs PPC of urgent work order completion).
  - *Vehicle Load Grouping:* Group multiple part orders for the same customer plant (e.g. TATA Motors Pune Plant) into a single truck shipment to optimize freight costs.
- **Actions:**
  - `Create Dispatch Run`: Binds selected customer orders into an active shipping batch ready for loading dock execution.

#### 2. Record Dispatch (`/dispatch/execution`)
- **Purpose:** Official shipment creation, legal document generation, and physical inventory deduction.
- **Shipment Documentation & Data Fields:**
  - *Dispatch Challan ID:* Auto-generated legal sequence (`DC-2026-XXXX`).
  - *Customer & Destination:* Consignee name, plant delivery address, customer GSTIN, State code.
  - *Itemized Packaging List:* Part numbers, customer part numbers, description, quantity dispatched, number of packaging bins / steel crates, gross weight, net tare weight.
  - *Batch & Heat Allocation:* Specific finished goods batch numbers loaded onto the truck (ensuring end-to-end traceability).
  - *Logistics & Transport Details:*
    - Transporter Name / Carrier Agency.
    - Truck / Vehicle Registration Number (e.g. `TN-70-AB-1234`).
    - Driver Name, Driver Mobile Contact, Driver License Number.
    - e-Way Bill Number and e-Way Bill Expiry Date.
    - Lorry Receipt / Bilty Number (LR No).
- **System Automations & Actions:**
  - `Confirm Dispatch & Ship`:
    - Automatically deducts the dispatched quantities from Finished Goods inventory (`WH-FG-01`).
    - Sets linked Sales Order line schedule status to `Dispatched`.
    - Triggers notification to Accounts Executive that goods have cleared the gate and are ready for GST Tax Invoice generation.
  - `Print Delivery Challan (DC)`: Generates standardized 4-copy Delivery Challan (Original for Buyer, Duplicate for Transporter, Triplicate for Accounts, Quadruplicate for Gate Security).
  - `Print Packing Slip`: Prints pallet and container stickers listing box serial numbers and part counts.

#### 3. Delivery Tracking (`/dispatch/tracking`)
- **Purpose:** Real-time visibility into shipped consignments between plant gate departure and customer receiving dock.
- **Consignment Status Stages:**
  - 1. `Dispatched / In Transit`: Truck has exited factory gate; driver is on the road.
  - 2. `Reached Customer Gate`: Vehicle reported at OEM receiving gate.
  - 3. `Delivered & Unloaded`: Physical crates received into customer store.
  - 4. `POD Acknowledged / Closed`: Customer stamped physical Delivery Challan or uploaded digital Proof of Delivery (POD).
- **Actions:**
  - `Update Transit Status`: Log checkpoint updates or transit delays (e.g. weather, highway checkpost inspection).
  - `Upload Signed POD`: Attach customer-signed Delivery Challan scan, proving successful delivery and unblocking customer invoicing.

---

### B. Supporting Operational Visibility (Read-Only)

#### 1. Sales Orders & Delivery Schedules (`/sales/order`)
- View confirmed customer orders, agreed delivery dates, special customer packing instructions, and customer PO amendments.

#### 2. Stock on Hand (`/inventory/control`)
- Live view of finished goods storage bins to coordinate physical forklift picking and packing before truck arrival.

#### 3. Customers Master (`/master/customer`)
- View customer delivery gate instructions, plant entry timings (e.g. no heavy vehicles between 8:00 AM - 11:00 AM), and logistics contact personnel.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `dispatch.coordinator@lbap.in`**:
   - Highlight how this portal bridges the internal plant floor with customer receiving docks.
2. **Open Dispatch Plan (`/dispatch/planning`)**:
   - Show how customer delivery schedules for today are aggregated. Point out the green stock indicator showing that 2,000 stamped brackets are packaged and waiting in the warehouse.
3. **Open Record Dispatch (`/dispatch/execution`)**:
   - Click `Create Dispatch` and demonstrate loading documentation: enter vehicle number, driver name, e-Way bill number, and container count.
   - Click `Confirm Dispatch` and show how finished goods inventory is instantly deducted while generating the legal Delivery Challan (DC).
4. **Open Delivery Tracking (`/dispatch/tracking`)**:
   - Show active consignments in transit. Upload a sample customer-stamped POD (Proof of Delivery) and demonstrate how this closes the delivery loop and notifies the accounts department.
