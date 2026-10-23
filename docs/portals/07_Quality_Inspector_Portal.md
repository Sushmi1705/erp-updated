# Portal Documentation: Quality Inspector
**Quality Assurance (QA), Incoming Inspection, In-Process QC & IATF 16949 NCR Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Quality Inspector
- **Login Email:** `quality.inspector@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Priya Sundaram (Senior Quality Assurance & Compliance Engineer)
- **Target Demo Audience:** Head of Quality Assurance, IATF 16949 / ISO 9001 Auditors, Customer Quality Engineers, QC Inspectors
- **Access Level:** Full Access to `Quality`; Read-Only Access to `GoodsReceipt`, `Production`, `Procurement`, and `MasterData`.

---

## 2. Portal Overview & Value Proposition
For automotive stamping suppliers, quality is non-negotiable. Tier-1 and OEM clients impose strict PPM thresholds (often < 50 PPM) and demand complete compliance with automotive standards (PPAP, APQP, FMEA, Control Plans, and 8D problem-solving).

The Quality Inspector Portal enforces quality gates across the entire manufacturing journey: verifying raw steel Mill Test Certificates (MTC) at the gate, conducting First-Piece Inspection (FPI) before full press runs, performing patrol inspections on running dies, executing Pre-Dispatch Inspection (PDI), managing inspection gauge limits (USL/LSL), and generating structured 8D Non-Conformance Reports (NCR) with root-cause analysis (5-Why/Fishbone) and CAPA tracking.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Quality Management Module (`/quality`)

#### 1. Incoming Material Checks (`/quality/incoming`)
- **Purpose:** Inspect incoming raw steel coils, sheet bundles, bought-out hardware, and outsourced plating batches before warehouse acceptance.
- **Inspection Protocols:**
  - *Mill Test Certificate (MTC) Verification:* Check steel mill heat number, chemical composition (% Carbon, % Manganese, % Silicon, % Phosphorus, % Sulfur), and mechanical properties (Yield Strength, Tensile Strength, % Elongation).
  - *Physical Measurement:* Coil strip width, coil gauge thickness (measured with micrometer across left, center, right), edge burr, and surface oiling.
  - *Hardness Testing:* Rockwell (HRB) or Vickers (HV) test values recorded against specification limits.
- **Disposition Actions:**
  - `Accept`: Releases batch into active store inventory.
  - `Reject`: Holds batch in quarantine and generates supplier rejection memo with debit note request.
  - `Accept Under Deviation (UDA)`: Requires concession approval for minor non-critical variances.

#### 2. In-Process Quality Checks (`/quality/in-process`)
- **Purpose:** Inspection during production runs on stamping presses and welding lines to catch tool wear early.
- **Checkpoints Supported:**
  - *First-Piece Inspection (FPI):* Mandatory check after every die setup before production is cleared.
  - *Patrol Inspection:* Regular hourly sample checks during press runs (e.g. 5 pieces every 1,000 strokes).
  - *Critical Dimensional Attributes:* Hole pitch, bend angle, extrusion diameter, burr height, flatness, weld nugget push-out test.
- **Actions:**
  - `Log Inspection`: Record measured dimensions against tolerance limits. Out-of-spec readings automatically flag in red.
  - `Halt Press Run`: Automatically sets press status to `Stopped - Quality Hold` if 3 consecutive parts fail critical dimensions.

#### 3. Final Inspection / Pre-Dispatch Inspection (PDI) (`/quality/final`)
- **Purpose:** Final verification of finished sub-assemblies before packaging and customer dispatch.
- **Verification Parameters:**
  - Dimensional check using coordinate measuring machines (CMM) or dedicated checking fixtures (checking gauges).
  - Visual defects: Burr, tool scoring marks, oil sludge, corrosion/rust, deformation.
  - Secondary process check: Zinc plating / electro-deposition coating thickness (microns) and cross-hatch paint adhesion.
- **Actions:**
  - `Generate PDI Certificate`: Produces digital inspection certificate accompanying customer shipment.

#### 4. Inspection Parameters Master (`/quality/parameters`)
- **Purpose:** Configuration of inspection characteristic templates linked to part numbers and control plans.
- **Configuration Fields:**
  - Parameter Name (e.g. *Flange Width, Center Hole Dia, Burr Height, Zinc Plating Thickness*).
  - Nominal Dimension, Upper Specification Limit (USL), Lower Specification Limit (LSL).
  - Measuring Instrument: Vernier Caliper, Micrometer, Height Gauge, Profile Projector, CMM, Checking Fixture.
  - Sample Size and Inspection Frequency (e.g. *5 pcs / 500 strokes*).

#### 5. Quality Problems & Fixes / NCR (`/quality/ncr`)
- **Purpose:** Structured Non-Conformance Report (NCR) management and automotive 8D problem-solving.
- **NCR Workflow Stages:**
  - *D1 - Problem Identification:* Part number, batch lot ID, defect description, quantity affected.
  - *D2 - Containment Action:* Quarantine suspect lot, sort warehouse stock, alert customer line if in transit.
  - *D3 - Root Cause Analysis (RCA):* Digital 5-Why Analysis and Fishbone (Ishikawa) diagram (Man, Machine, Material, Method, Measurement).
  - *D4 - Corrective Action:* Permanent tool modification, die grinding, sensor installation.
  - *D5 - Preventive Action (CAPA):* Update FMEA and Control Plan to prevent recurrence.
  - *D6 - Verification & Closure:* Verification of 3 consecutive trouble-free batches before NCR closure.

#### 6. Quality Reports & Analytics (`/quality/analytics`)
- **Visual Compliance Dashboards:**
  - Monthly Rejection PPM trend against customer target.
  - Pareto Analysis: Top defect categories (e.g. 45% Burr, 30% Dimensional Variation, 15% Crack, 10% Other).
  - Cost of Poor Quality (COPQ): Scrapped metal cost + rework labor hours.
  - Supplier rejection ranking.

---

### B. Supporting Operational Visibility (Read-Only)

#### 1. Goods Received Notes (`/receipt/grn`)
- View security gate receipts waiting for QC clearance.

#### 2. Work Orders & Output (`/production`)
- View current press runs, work order routing steps, and active stroke counts.

#### 3. Purchase Orders (`/procurement/po`)
- Review original supplier purchase orders to cross-check guaranteed chemical specifications and mill standards.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `quality.inspector@lbap.in`**:
   - Emphasize to the client: *"This portal is built to satisfy stringent IATF 16949 / OEM customer audit requirements without manual paper logbooks."*
2. **Open Incoming Material Checks (`/quality/incoming`)**:
   - Show how a steel coil receipt is evaluated: demonstrate chemical composition checks against Mill Test Certificates and pass/fail disposition.
3. **Open In-Process Checks (`/quality/in-process`)**:
   - Select a running press work order and enter First-Piece Inspection (FPI) readings.
   - Enter an out-of-tolerance burr height (e.g. 0.12mm against 0.05mm max) and show how the system immediately flags the row in red and triggers an alert.
4. **Open Quality Problems & Fixes (NCR) (`/quality/ncr`)**:
   - Open an active NCR and demonstrate the 5-Why root cause analysis and 8D corrective action tracker. Explain how this impresses OEM vendor assessment auditors.
5. **Open Quality Analytics (`/quality/analytics`)**:
   - Show the live rejection PPM chart and Pareto defect analysis.
