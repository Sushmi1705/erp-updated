# Portal Documentation: Plant Manager
**Plant Operations, Manufacturing Excellence & Shopfloor Command Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Plant Manager
- **Login Email:** `plant.manager@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Suresh Babu (General Manager / Plant Operations Head)
- **Target Demo Audience:** General Manager, VP of Manufacturing, Chief Operating Officer, Plant Directors
- **Access Level:** Complete Operational Authority across `Production`, `ShopFloor`, `Quality`, `Maintenance`, `Capacity`, `MRP`, and `Dispatch`; Full Read-Only Commercial Visibility across `Sales`, `Procurement`, `Inventory`, `Engineering`, and `DemandPlanning`.
- **Deliberate Governance Boundary:** Excludes internal financial ledgers (AR/AP/General Ledger) and IT security administration (User/Role management) to reflect industry-standard plant operational boundaries.

---

## 2. Portal Overview & Value Proposition
The Plant Manager is accountable for the entire manufacturing plant: meeting customer delivery deadlines, maximizing press Overall Equipment Effectiveness (OEE), eliminating scrap, maintaining zero safety incidents, and driving continuous improvement (Kaizen / TPM / 5S).

The Plant Manager Portal gives the plant head a unified operations cockpit: overseeing every operational department from order intake to dispatch without switching accounts. The Plant Head can audit the material plan, inspect press bottlenecks, review live machine downtime, verify customer quality NCRs, track breakdown repairs, and confirm truck dispatch schedules — all within one cohesive interface.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Operational Modules Under Direct Command

#### 1. Production Planning & Work Orders (`/production`)
- **Master Production Plan (`/production/plan`):** Review weekly and monthly production targets vs actual completion.
- **Work Orders (`/production/wo`):** Audit released job cards, check overdue work orders, re-prioritize rush orders, and monitor die assignments.
- **Allocate Material (`/production/allocation`):** Verify that high-priority jobs have steel coils locked to prevent mid-run starvation.

#### 2. Shop Floor Live Operations (`/shopfloor`)
- **Machine Usage & States (`/shopfloor/machine`):** Visual floor layout showing running presses, machines in die setup, and idle work centers.
- **Machine Downtime (`/shopfloor/downtime`):** Audit active stoppages to ensure shift supervisors and maintenance teams are addressing root causes immediately.
- **Scrap & Rejections (`/shopfloor/scrap`):** Live scrap trend monitoring to intervene if hourly scrap rates exceed threshold benchmarks.
- **Operators & Productivity (`/shopfloor/operator`):** Monitor operator attendance and output productivity per shift.

#### 3. Material Planning / MRP (`/mrp`)
- **Run Material Plan (`/mrp/execution`):** View MRP run results to ensure raw material coil orders align with scheduled customer deliveries.
- **Material Shortages (`/mrp/shortages`):** Strategic shortage review to resolve vendor supply delays before line halts occur.

#### 4. Capacity & Scheduling (`/capacity`)
- **Machine Capacity (`/capacity/machine`):** Review 20T to 250T press line load balance and prevent machine overloading.
- **Production Schedule (`/capacity/schedule`):** Sequence press jobs to minimize die changeover downtime.

#### 5. Quality Assurance & Compliance (`/quality`)
- **Incoming, In-Process & Final QC:** Monitor inspection logs across incoming steel coils, press First-Piece Inspections (FPI), and Pre-Dispatch Inspections (PDI).
- **Non-Conformance Reports (NCR) (`/quality/ncr`):** Review open 8D root-cause corrective action investigations for internal and customer complaints.
- **Quality Analytics (`/quality/analytics`):** Plant-wide Rejection PPM trends and Cost of Poor Quality (COPQ) tracking.

#### 6. Maintenance & Reliability (`/maintenance`)
- **Preventive Maintenance (`/maintenance/preventive`):** Ensure periodic hydraulic and mechanical servicing routines are executed on schedule.
- **Breakdown Repairs (`/maintenance/breakdown`):** Review machine breakdown tickets, technician response times, and MTTR/MTBF metrics.
- **Spare Parts Inventory (`/maintenance/sparepart`):** Ensure adequate safety stock of press clutches, valves, and tool room spares.

#### 7. Dispatch & Logistics (`/dispatch`)
- **Dispatch Plan (`/dispatch/planning`):** Ensure finished goods shipments leave on time to satisfy customer JIT schedules.
- **Delivery Tracking (`/dispatch/tracking`):** Monitor consignments in transit and verify customer Proof of Delivery (POD) acknowledgments.

---

### B. Commercial & Supply Chain Cross-Visibility (Read-Only)

#### 1. Sales & Customer Orders (`/sales`)
- Review confirmed customer Sales Orders, delivery schedules, and pending order book value to align plant capacity with customer demand.

#### 2. Procurement & Purchasing (`/procurement`)
- Review open Purchase Orders, vendor delivery commitments, and Supplier Performance scorecards to hold raw material suppliers accountable.

#### 3. Inventory & Warehousing (`/inventory`)
- Live stock balances across Raw Material Coils, Work-In-Progress (WIP), and Finished Goods Warehouses.
- End-to-end batch and heat number traceability (`/inventory/traceability`).

#### 4. Engineering & BOM (`/engineering`)
- Review multi-level Bills of Materials (BOM), stamping operation routings, and customer Engineering Change Orders (ECO).

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `plant.manager@lbap.in`**:
   - Explain to the client: *"This is the daily control cockpit for the General Manager / Plant Head. It gives 360-degree operational command across every department on the floor without administrative noise."*
2. **Open Machine Usage (`/shopfloor/machine`) & Downtime (`/shopfloor/downtime`)**:
   - Show how the plant head monitors press running status in real time and immediately sees any machine experiencing prolonged downtime.
3. **Open Work Orders (`/production/wo`)**:
   - Review released work orders and show how the plant manager can reprioritize urgent customer orders with a single click.
4. **Open Quality NCRs (`/quality/ncr`)**:
   - Review active non-conformance reports. Point out that the plant manager can verify whether 8D corrective actions have been implemented on the press dies.
5. **Open Dispatch Planning (`/dispatch/planning`)**:
   - Review today's customer shipment plan and confirm that finished parts are packaged, loaded, and en route to OEM vehicle plants.
