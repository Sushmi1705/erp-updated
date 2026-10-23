# Portal Documentation: Maintenance Engineer
**Plant Maintenance, Press Reliability, Breakdown Repairs & Spares Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Maintenance Engineer
- **Login Email:** `maintenance.engineer@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Ravishankar Pillai (Plant Maintenance & Tool Room Reliability Engineer)
- **Target Demo Audience:** Head of Maintenance, Plant Engineering Director, Tool Room Supervisors, Reliability Engineers
- **Access Level:** Full Access to `Maintenance`; Read-Only Access to `MasterData`, `ShopFloor`, and `Production`.

---

## 2. Portal Overview & Value Proposition
In a high-tonnage sheet-metal stamping facility, mechanical and hydraulic press uptime is directly linked to operating profitability. Unplanned stoppages from hydraulic seal blowouts, pneumatic clutch slippage, or cracked die guide pins halt production lines and lead to severe OEM delivery default penalties.

The Maintenance Engineer Portal delivers Total Productive Maintenance (TPM): scheduling automated Preventive Maintenance (PM) routines with digital checklists, dispatching technicians for emergency breakdown repairs, managing critical press spare parts inventory, and measuring machine reliability through Mean Time Between Failures (MTBF) and Mean Time To Repair (MTTR).

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Maintenance Operations (`/maintenance`)

#### 1. Planned Maintenance / PM Schedules (`/maintenance/preventive`)
- **Purpose:** Systematic scheduling and execution of preventive servicing to eliminate unexpected breakdowns.
- **PM Frequencies Supported:**
  - *Daily Checklists:* Operator autonomous maintenance (oil level check, pneumatic pressure check, safety curtain sensor test).
  - *Weekly Checklists:* Press ram guide lubrication, counterbalance cylinder pressure check, clutch-brake lining inspection.
  - *Monthly Checklists:* Hydraulic oil filtration, hydraulic pump vibration analysis, flywheel belt tensioning, electrical panel thermal scanning.
  - *Annual Overhauls:* Complete press bushing inspection, hydraulic seal kit replacement, crown tie-rod tension calibration.
- **Key Capabilities & Actions:**
  - `PM Calendar View`: Interactive calendar displaying scheduled maintenance dates per press.
  - `Generate PM Work Order`: Creates digital servicing checklist for technicians.
  - `Complete PM Checklist`: Technician signs off on individual checklist items, logs oil liters consumed, and enters post-service machine clearances.

#### 2. Breakdown Repairs (`/maintenance/breakdown`)
- **Purpose:** Emergency repair ticket inbox and rapid-response incident management.
- **Breakdown Ticket Workflow:**
  - *Ticket Trigger:* Automatically created when a Shop Floor Supervisor logs machine downtime as "Mechanical/Electrical Breakdown", or logged manually by maintenance technicians.
  - *Technician Assignment:* Assign mechanical, electrical, or tool room specialist to the ticket.
  - *Diagnosis & Action Log:*
    - Root cause diagnosis (e.g. *Solenoid valve coil burnt out, hydraulic line fractured*).
    - Repair action executed (e.g. *Replaced solenoid valve, flushed hydraulic filter, tested 20 idle strokes*).
  - *Spare Parts Consumed:* Select replacement spares directly from the maintenance store, automatically deducting them from stock.
  - *Verification & Handover:* Joint sign-off between Maintenance Engineer and Shift Supervisor to confirm machine is ready for production.
- **Actions:**
  - `Acknowledge Ticket`: Logs technician response time.
  - `Close Breakdown`: Restores machine state to `Ready for Production` and recalculates plant downtime metrics.

#### 3. Spare Parts Management (`/maintenance/sparepart`)
- **Purpose:** Critical maintenance spare parts inventory management.
- **Spares Categories Tracked:**
  - *Hydraulic & Pneumatic:* Solenoid valves, pressure relief valves, seal kits, O-rings, air cylinders, lubricator units.
  - *Electrical & Automation:* Proximity sensors, limit switches, contactors, PLC relays, emergency stop buttons.
  - *Mechanical & Tool Room:* Die springs, ejector pins, guide bushings, wear plates, clutch friction plates, V-belts.
- **Functionality:**
  - Set Minimum Stock Level and Safety Reorder Thresholds.
  - Automatic low-stock alert notifications to the Purchase Officer when critical spares reach reorder points.
  - Track consumption history per machine to identify recurring component failures.

#### 4. Maintenance Reports & Analytics (`/maintenance/analytics`)
- **Reliability & OEE Analytics:**
  - *MTBF (Mean Time Between Failures):* Average operating hours between machine breakdowns (higher is better).
  - *MTTR (Mean Time To Repair):* Average clock time taken to diagnose and repair breakdowns (lower is better).
  - *Downtime Pareto by Machine:* Identifies top "bad actor" presses consuming the most repair hours.
  - *Maintenance Cost Analysis:* Total spend on replacement spares and lubricants by press line.

---

### B. Supporting Operational Visibility (Read-Only)

#### 1. Machine Usage & Downtime Logs (`/shopfloor`)
- **Machine Usage (`/shopfloor/machine`):** Live view of running machines, active stroke counts, and operating hours.
- **Downtime Logs (`/shopfloor/downtime`):** Monitor floor downtime incidents as they occur to dispatch technicians before production coordinators escalate.

#### 2. Master Data (`/master`)
- **Machines Master (`/master/machine`):** Detailed machine technical specs: Press Make, Model, Tonnage, Stroke Length, Bed Size (L × W), Year of Commissioning, Serial Number.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `maintenance.engineer@lbap.in`**:
   - Introduce the portal: *"This screen ensures zero catastrophic line stoppages by enforcing preventive discipline and rapid breakdown recovery."*
2. **Open Planned Maintenance (`/maintenance/preventive`)**:
   - Show the interactive calendar: point out scheduled weekly hydraulic press servicing routines.
   - Open a PM checklist and show digital verification of press clutch-brake gap measurements.
3. **Open Breakdown Repairs (`/maintenance/breakdown`)**:
   - Open a breakdown repair ticket: show how the system captures time of stoppage, technician arrival time, root cause diagnosis, and spare parts consumed.
4. **Open Spare Parts Management (`/maintenance/sparepart`)**:
   - Show press spares stock (e.g. hydraulic valves, guide pins): show how low-stock alerts automatically flag items needing replenishment.
5. **Open Maintenance Reports (`/maintenance/analytics`)**:
   - Show MTTR and MTBF graphs. Explain: *"These graphs give plant directors concrete proof that maintenance is actively increasing press availability month over month."*
