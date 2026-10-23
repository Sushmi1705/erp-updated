# Portal Documentation: Shop Floor Supervisor
**Shopfloor Execution, Press Operations, Downtime & Scrap Logging Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Shop Floor Supervisor
- **Login Email:** `shopfloor.supervisor@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Selvaraj Murugan (Press Shop Supervisor & Shift In-Charge)
- **Target Demo Audience:** Plant Operations Manager, Press Shop Supervisors, Shift Leaders, Industrial Engineers
- **Access Level:** Full Access to `ShopFloor` and `Production`; Read-Only Access to `MasterData`.

---

## 2. Portal Overview & Value Proposition
The shop floor is where automotive metal is formed. The supervisor manages the physical heart of the stamping facility: keeping presses running safely, assigning skilled operators to high-tonnage machines, recording stroke output, tracking unexpected breakdowns, and aggressively controlling scrap.

The Shop Floor Supervisor Portal provides an intuitive, high-speed interface optimized for touch terminals and industrial shop tablets: live press run status, rapid downtime logging with standard root-cause codes, hourly stroke output booking, and instant scrap segregation by defect category.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Shop Floor Operations (`/shopfloor`)

#### 1. Operators & Skill Matrix (`/shopfloor/operator`)
- **Purpose:** Operator shift attendance, machine allocation, and skill competency tracking.
- **Key Capabilities:**
  - *Shift Attendance:* Log operators present across Shift 1, Shift 2, and Shift 3.
  - *Machine Allocation:* Assign primary press operator and helper to specific machines (e.g. Mechanical Press 100T-02).
  - *Skill Matrix Competency:* Displays operator certification level (Level 1: Helper, Level 2: Independent Operator, Level 3: Die Setter & Expert). Prevents assigning uncertified operators to critical progressive dies.
  - *Productivity Metric:* Real-time calculation of operator stroke output against standard routing targets.

#### 2. Machine Usage & Utilization (`/shopfloor/machine`)
- **Purpose:** Live cockpit showing the operating state of every press on the factory floor.
- **Machine State Badges:**
  - 🟢 `Running / In Production`: Press active and stroke counter advancing.
  - 🟡 `Setup / Die Changeover`: Tooling clamped, undergoing first-piece setup.
  - 🟠 `Idle / Waiting`: Starved of raw coil or waiting for operator/inspection.
  - 🔴 `Breakdown / Maintenance`: Machine halted due to electrical, mechanical, or tooling failure.
- **Logged Data:**
  - Machine Code, Current Work Order, Active Operator, Shift Stroke Count, Cumulative Operating Hours.
- **Actions:**
  - `Allocate Machine`: Assign work order to machine.
  - `Change State`: Instant one-click status switch (`Running`, `Setup`, `Idle`, `Breakdown`).

#### 3. Machine Downtime Management (`/shopfloor/downtime`)
- **Purpose:** Accurate, standardized logging of all press stoppages for OEE analysis.
- **Downtime Root-Cause Categories:**
  - *Tooling / Die Issues:* Die blunting, punch chip-off, stripper jam, guide pin wear, slug pull-back.
  - *Raw Material Issues:* Strip thickness variation, coil burr, coil end welding delay, waiting for forklift.
  - *Mechanical / Hydraulic:* Press clutch slipping, hydraulic pressure drop, air leak, oil temperature high.
  - *Electrical / Automation:* Proximity sensor fault, feeder sync error, emergency stop tripped.
  - *Operational / Quality:* Waiting for First-Piece Inspection (FPI), operator personal break, shift changeover.
- **Actions:**
  - `Record Stoppage`: Select machine, reason category, start time, and notes.
  - `Resolve & Resume`: Enters resolution time and action taken; machine automatically returns to `Running`.

#### 4. Scrap & Rejections Management (`/shopfloor/scrap`)
- **Purpose:** Immediate logging of scrap metal and rejected stampings during the shift.
- **Scrap Classification:**
  - *Process / Off-Cut Scrap:* Normal blank skeleton strip, piercing slugs, and coil off-cuts (recorded in Kg).
  - *Defective Part Rejections:* Pieces rejected due to defects (recorded in Nos and Kg).
- **Automotive Defect Codes:**
  - Dimensional variance, excessive burr, crack / tearing on bend radius, surface dent / scratch, missing pierce hole, wrinkling.
- **Actions:**
  - `Log Scrap`: Select Work Order, Machine, Defect Reason Code, and Scrap Quantity/Weight.
  - Generates immediate notification to Quality Control if scrap exceeds 2.5% of hourly run.

---

### B. Production Execution (`/production`)

#### 1. Run Production / Operator Terminal (`/production/execution`)
- **Purpose:** Touch-friendly floor terminal interface for press operators and supervisors.
- **Workflow:**
  - 1. Scan / Select released Work Order (`WO-XXXX`).
  - 2. Verify issued raw material coil Heat Number matches the Job Card.
  - 3. Click `Start Setup` ➔ Clamps die, aligns feeder.
  - 4. Click `Start Production` ➔ Machine stroke timer begins.
  - 5. Click `Pause Job` (with downtime reason) or `Complete Job`.

#### 2. Production Output Booking (`/production/output`)
- **Purpose:** Booking verified good parts, scrap, and rework into the system.
- **Fields Logged:**
  - Work Order ID, Operation Number (e.g. Op 10: Blanking, Op 20: Stamping).
  - Machine Code, Shift, Operator ID.
  - Total Strokes / Pieces Produced, Good Quantity Accepted, Rejected Quantity, Quantity Sent for Deburring/Rework.
- **Automatic System Updates:**
  - Instantly deducts consumed raw material coil weight from warehouse inventory.
  - Adds good stamped pieces to Work In Progress (WIP) stock.
  - Notifies Quality Inspector that a batch is ready for In-Process Inspection.

#### 3. Work Orders (`/production/wo`)
- View active, paused, and completed job cards, download routing sheets, and check planned quantities.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `shopfloor.supervisor@lbap.in`**:
   - Explain: *"This is the screen used on the factory floor by shift leaders to manage the presses in real time."*
2. **Open Machine Usage (`/shopfloor/machine`)**:
   - Show the visual status board: point out which presses are running, which are in setup, and which are idle.
3. **Open Run Production (`/production/execution`)**:
   - Select a released work order, start the job, and show how the terminal tracks active running time.
4. **Open Machine Downtime (`/shopfloor/downtime`)**:
   - Simulate an actual shopfloor event: click `Record Stoppage`, select `Press 150T-01`, select reason `Die Chip-off / Tooling Error`, and save.
   - Show how the machine status immediately changes to red and alert flags appear on the supervisor board.
5. **Open Scrap & Rejections (`/shopfloor/scrap`)**:
   - Log 12 pieces rejected due to "Surface Dent" from metal chip accumulation. Explain how this real-time capture eliminates end-of-month inventory discrepancies.
6. **Open Production Output (`/production/output`)**:
   - Book 500 good stampings. Show how raw material inventory is automatically backflushed, saving hours of manual stock bookkeeping.
