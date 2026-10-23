/* Production execution for the LBAP Hosur press shop.
 *
 * The shop presses automotive brackets from steel coil. This seeder hangs the
 * whole execution chain off the plan header and work orders that already exist:
 *
 *   plan lines  ->  work order lines  ->  material issued from the RM store
 *               ->  shop-floor runs on the presses  ->  output posted with
 *                   good / rejected / scrap  ->  putaway into finished goods
 *
 * Deliberate rough edges so the alert tiles have something real to show:
 *   - WO-2026-3103 (Battery Tray) is short of GI sheet and past its need-by date
 *   - one run aborted on the 250T after a die crack, with heavy scrap
 *   - one output still sitting in Draft, one Canceled
 *   - one production schedule overdue and still In-Progress
 */

const OPERATORS = ['R. Kumar', 'S. Menon', 'A. Iyer', 'V. Reddy', 'P. Nair', 'M. Selvam', 'K. Rajan', 'D. Prakash'];

module.exports = {
  name: 'Production Execution',

  run: async (ctx) => {
    const { M, col, daysAgo, daysAhead } = ctx;

    const { PlanDetail } = M('ProductionPlan');
    const { WOHeader, WODetail, MaterialTracking, ExecutionProgress } = M('WorkOrder');
    const { ExecutionRun, ExecutionOperation } = M('ProductionExecution');
    const { ProductionOutput, OutputHeader, YieldDetail, InventoryPutaway, QualityReasonCode } = M('ProductionOutput');
    const { ProductionSchedule } = M('ProductionSchedule');
    const { MachineAllocation } = M('MachineUtilization');
    const { TaskAllocation } = M('OperatorManagement');
    const { ComponentRequirement } = M('MaterialAllocation');

    // ── helpers ───────────────────────────────────────────────────────────
    const mat = (code) => ctx.materials.find((m) => m.code === code);
    const prod = (code) => ctx.products.find((p) => p.code === code);
    const mach = (code) => ctx.machines.find((m) => (m.code || m.machineCode) === code);
    const wcen = (code) => ctx.workcenters.find((w) => w.code === code);

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    // Somewhere earlier today, but never before midnight — the launchpad's
    // "Today's Output" tile matches on Recording_Date >= local midnight.
    const todayAt = (hoursBack) =>
      new Date(Math.max(dayStart.getTime() + 15 * 60000, Date.now() - hoursBack * 36e5));

    const audit = {
      createdBy: ctx.admin?._id,
      companyId: ctx.company?._id,
      plantId: ctx.plant?._id
    };

    // timestamps:true stamps createdAt at insert time, so backdate afterwards.
    const backdates = {};
    const stamp = (collection, doc, when) => {
      (backdates[collection] = backdates[collection] || []).push({ _id: doc._id, when });
      return doc;
    };
    const applyBackdates = async () => {
      for (const [name, rows] of Object.entries(backdates)) {
        if (!rows.length) continue;
        await col(name).bulkWrite(rows.map((r) => ({
          updateOne: { filter: { _id: r._id }, update: { $set: { createdAt: r.when, updatedAt: r.when } } }
        })));
      }
    };

    // ── the eight jobs on the floor ───────────────────────────────────────
    // The first four hang off the work orders that already exist; the last four
    // are added here (WO-2026-31xx) so the board shows a full lifecycle.
    const jobs = [
      { wo: 'WO-2026-3001', part: 'Brake Pedal Bracket',      matCode: 'MAT-002', qty: 12000, kgPer: 0.34, machine: 'MC-001', wc: 'WC-PRESS', mine: false, status: 'Released',    progress: 0,   matStatus: 'Allocated',          start: daysAgo(11), end: null },
      { wo: 'WO-2026-3002', part: 'Silencer Mounting Bracket', matCode: 'MAT-003', qty: 9000,  kgPer: 0.46, machine: 'MC-002', wc: 'WC-PRESS', mine: false, status: 'In Progress', progress: 44,  matStatus: 'Partially Consumed', start: daysAgo(9),  end: null },
      { wo: 'WO-2026-3003', part: 'Mudguard Stay',            matCode: 'MAT-001', qty: 15000, kgPer: 0.18, machine: 'MC-003', wc: 'WC-PRESS', mine: false, status: 'In Progress', progress: 27,  matStatus: 'Partially Consumed', start: daysAgo(6),  end: null },
      { wo: 'WO-2026-3004', part: 'Exhaust Heat Shield',      matCode: 'MAT-007', qty: 4000,  kgPer: 0.22, machine: 'MC-004', wc: 'WC-PRESS', mine: false, status: 'Draft',       progress: 0,   matStatus: 'Pending',            start: null,        end: null },
      { wo: 'WO-2026-3101', part: 'Number Plate Bracket',     matCode: 'MAT-001', qty: 20000, kgPer: 0.11, machine: 'MC-004', wc: 'WC-PRESS', mine: true,  status: 'Completed',   progress: 100, matStatus: 'Consumed',           start: daysAgo(38), end: daysAgo(30) },
      { wo: 'WO-2026-3102', part: 'Engine Mounting Bracket',  matCode: 'MAT-005', qty: 6000,  kgPer: 0.95, machine: 'MC-001', wc: 'WC-PRESS', mine: true,  status: 'In Progress', progress: 62,  matStatus: 'Partially Consumed', start: daysAgo(3),  end: null },
      { wo: 'WO-2026-3103', part: 'Battery Tray Assembly',    matCode: 'MAT-006', qty: 3500,  kgPer: 1.20, machine: 'MC-006', wc: 'WC-WELD',  mine: true,  status: 'Released',    progress: 0,   matStatus: 'Pending',            start: null,        end: null, shortage: true },
      { wo: 'WO-2026-3104', part: 'Footrest Bracket LH/RH',   matCode: 'MAT-002', qty: 11000, kgPer: 0.28, machine: 'MC-005', wc: 'WC-PRESS', mine: true,  status: 'Closed',      progress: 100, matStatus: 'Consumed',           start: daysAgo(52), end: daysAgo(45) }
    ];

    // ── wipe our own rows (re-runnable) ───────────────────────────────────
    const MINE = [
      'plandetails', 'wodetails', 'materialtrackings', 'executionprogresses',
      'executionruns', 'executionoperations', 'outputheaders', 'yielddetails',
      'inventoryputaways', 'qualityreasoncodes', 'productionoutputs',
      'productionschedules', 'machineallocations', 'taskallocations',
      'componentrequirements'
    ];
    for (const c of MINE) await col(c).deleteMany({});
    // Only the work orders this seeder owns — the original four stay put.
    await col('woheaders').deleteMany({ WO_Number: /^WO-2026-31/ });

    const counts = {};

    // ── A. PLAN DETAILS ───────────────────────────────────────────────────
    const planHeader = await col('planheaders').findOne({});
    const planDetails = [];
    if (planHeader) {
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i];
        // Line 4 (heat shield) is already past its planned finish while its work
        // order is still Draft — a genuinely late line, not a rounding artefact.
        const startOffset = [-40, -26, -18, -30, -55, -12, -8, -60][i];
        const spanDays = [14, 12, 16, 10, 18, 15, 12, 14][i];
        const d = await PlanDetail.create({
          Plan_ID: planHeader._id,
          Line_Sequence_Number: (i + 1) * 10,
          Material_ID: mat(j.matCode)._id,
          Target_Quantity: j.qty,
          UOM_ID: ctx.uomEa?._id,
          Planned_Start_Date: daysAgo(-startOffset),
          Planned_End_Date: daysAgo(-startOffset - spanDays),
          ...audit
        });
        planDetails.push(stamp('plandetails', d, daysAgo(-startOffset + 2)));
      }
    }
    counts.plandetails = planDetails.length;

    // ── B. WORK ORDER HEADERS + LINES ─────────────────────────────────────
    const woByNumber = {};
    for (const j of jobs) {
      if (j.mine) {
        const h = await WOHeader.create({
          WO_Number: j.wo,
          Source_Plan_ID: planHeader?._id,
          Plant_ID: ctx.plant?._id,
          Status: j.status,
          Material_Status: j.matStatus,
          Overall_Progress_Percentage: j.progress,
          Actual_Start_Date: j.start,
          Actual_End_Date: j.end,
          ...audit
        });
        stamp('woheaders', h, j.start || daysAgo(4));
        woByNumber[j.wo] = h;
      } else {
        // Header already exists; bring its material/date state in line with the
        // issue and progress rows created below, without recreating it.
        const existing = await col('woheaders').findOne({ WO_Number: j.wo });
        if (existing) {
          await col('woheaders').updateOne(
            { _id: existing._id },
            { $set: { Material_Status: j.matStatus, Actual_Start_Date: j.start, Actual_End_Date: j.end } }
          );
          woByNumber[j.wo] = existing;
        }
      }
    }

    const woDetails = {};
    for (const j of jobs) {
      const h = woByNumber[j.wo];
      if (!h) continue;
      const produced = Math.round(j.qty * (j.progress / 100));
      const d = await WODetail.create({
        WO_ID: h._id,
        Material_ID: mat(j.matCode)._id,
        Target_Quantity: j.qty,
        Produced_Quantity: produced,
        Scrapped_Quantity: produced ? Math.round(produced * 0.022) : 0,
        UOM_ID: ctx.uomEa?._id,
        ...audit
      });
      woDetails[j.wo] = stamp('wodetails', d, j.start || daysAgo(5));
    }
    counts.wodetails = Object.keys(woDetails).length;

    // ── C. MATERIAL ISSUED TO THE FLOOR ───────────────────────────────────
    let mtCount = 0;
    for (const j of jobs) {
      const d = woDetails[j.wo];
      if (!d) continue;
      const requiredKg = Math.round(j.qty * j.kgPer);
      // Coil is the blank; welded assemblies also draw MIG wire.
      const lines = [{ material: mat(j.matCode)._id, required: requiredKg }];
      if (j.wc === 'WC-WELD') lines.push({ material: mat('MAT-009')._id, required: Math.round(j.qty * 0.012) });

      for (const l of lines) {
        const ratio = j.shortage ? 0.35 : j.progress >= 100 ? 1 : j.progress > 0 ? j.progress / 100 : j.status === 'Released' ? 1 : 0;
        const issued = Math.round(l.required * ratio);
        const consumed = Math.round(issued * (j.progress >= 100 ? 1 : 0.92));
        const t = await MaterialTracking.create({
          WO_Detail_ID: d._id,
          Component_Material_ID: l.material,
          Required_Quantity: l.required,
          Issued_Quantity: issued,
          Consumed_Quantity: consumed,
          Warehouse_Location_ID: ctx.whRM?._id,
          ...audit
        });
        stamp('materialtrackings', t, j.start || daysAgo(4));
        mtCount++;
      }
    }
    counts.materialtrackings = mtCount;

    // ── D. OPERATION-BY-OPERATION PROGRESS ────────────────────────────────
    const ROUTE = [
      { seq: 10, name: 'Shear / Blank', wc: 'WC-PRESS' },
      { seq: 20, name: 'Press & Form',  wc: 'WC-PRESS' },
      { seq: 30, name: 'Weld / Deburr', wc: 'WC-WELD' },
      { seq: 40, name: 'Final Check',   wc: 'WC-QC' }
    ];
    let epCount = 0;
    for (const j of jobs) {
      const d = woDetails[j.wo];
      if (!d) continue;
      for (const step of ROUTE) {
        // Work flows front-to-back: earlier operations finish first.
        const reach = j.progress + (40 - step.seq) * 1.2;
        let status = 'Pending';
        if (j.progress >= 100) status = 'Completed';
        else if (reach >= 100) status = 'Completed';
        else if (reach > 20) status = step.seq === 30 && j.shortage ? 'Paused' : 'Active';
        if (j.status === 'Draft' || (j.status === 'Released' && j.progress === 0)) status = 'Pending';

        const done = status === 'Completed' ? j.qty
          : status === 'Active' || status === 'Paused' ? Math.round(j.qty * (Math.min(reach, 95) / 100))
            : 0;
        const p = await ExecutionProgress.create({
          WO_Detail_ID: d._id,
          Operation_Sequence: step.seq,
          Work_Center_ID: wcen(step.wc)?._id,
          Step_Status: status,
          Completed_Qty_At_Step: done,
          ...audit
        });
        stamp('executionprogresses', p, j.start || daysAgo(4));
        epCount++;
      }
    }
    counts.executionprogresses = epCount;

    // ── E. SHOP-FLOOR RUNS AND OPERATIONS ─────────────────────────────────
    const runPlan = [
      { wo: 'WO-2026-3104', num: 'A', status: 'Completed',   start: daysAgo(52), hours: 9,  qty: 5500, scrap: 120, rework: 40 },
      { wo: 'WO-2026-3104', num: 'B', status: 'Completed',   start: daysAgo(48), hours: 8,  qty: 5500, scrap: 95,  rework: 0 },
      { wo: 'WO-2026-3101', num: 'A', status: 'Completed',   start: daysAgo(38), hours: 10, qty: 10000, scrap: 210, rework: 60 },
      { wo: 'WO-2026-3101', num: 'B', status: 'Completed',   start: daysAgo(33), hours: 10, qty: 10000, scrap: 180, rework: 0 },
      { wo: 'WO-2026-3002', num: 'A', status: 'Completed',   start: daysAgo(9),  hours: 8,  qty: 2500, scrap: 55,  rework: 30 },
      // Die crack on the 250T mid-shift; the run was aborted and scrap spiked.
      { wo: 'WO-2026-3002', num: 'B', status: 'Aborted',     start: daysAgo(7),  hours: 3,  qty: 2500, scrap: 310, rework: 120, abort: true },
      { wo: 'WO-2026-3003', num: 'A', status: 'Completed',   start: daysAgo(6),  hours: 8,  qty: 4000, scrap: 88,  rework: 0 },
      { wo: 'WO-2026-3102', num: 'A', status: 'Completed',   start: daysAgo(3),  hours: 9,  qty: 2000, scrap: 42,  rework: 25 },
      { wo: 'WO-2026-3102', num: 'B', status: 'Running',     start: todayAt(5),  hours: 0,  qty: 2000, scrap: 18,  rework: 0 },
      { wo: 'WO-2026-3003', num: 'B', status: 'Running',     start: todayAt(4),  hours: 0,  qty: 3500, scrap: 40,  rework: 12 },
      { wo: 'WO-2026-3001', num: 'A', status: 'Paused',      start: daysAgo(1),  hours: 0,  qty: 3000, scrap: 25,  rework: 0 },
      { wo: 'WO-2026-3103', num: 'A', status: 'Not Started', start: null,        hours: 0,  qty: 3500, scrap: 0,   rework: 0 }
    ];

    const runs = [];
    const operations = [];
    let runSeq = 0;
    for (const r of runPlan) {
      const h = woByNumber[r.wo];
      const j = jobs.find((x) => x.wo === r.wo);
      if (!h) continue;
      runSeq++;
      const end = r.status === 'Completed' || r.status === 'Aborted'
        ? new Date(r.start.getTime() + r.hours * 36e5)
        : null;
      const run = await ExecutionRun.create({
        Run_ID: `ER-${ctx.YEAR}-${String(runSeq).padStart(4, '0')}`,
        WO_ID: h._id,
        Plant_ID: ctx.plant?._id,
        Run_Number: `${r.wo.replace('WO-', 'RUN-')}-${r.num}`,
        Run_Status: r.status,
        Run_Start_Time: r.start,
        Run_End_Time: end,
        ...audit
      });
      runs.push(stamp('executionruns', run, r.start || daysAgo(2)));

      for (const step of ROUTE.slice(0, 3)) {
        let opStatus = 'Pending';
        if (r.status === 'Completed') opStatus = 'Completed';
        else if (r.status === 'Aborted') opStatus = step.seq === 10 ? 'Completed' : step.seq === 20 ? 'Paused' : 'Pending';
        else if (r.status === 'Running') opStatus = step.seq === 10 ? 'Completed' : step.seq === 20 ? 'Active' : 'Setup';
        else if (r.status === 'Paused') opStatus = step.seq === 10 ? 'Completed' : 'Paused';

        const good = opStatus === 'Completed' ? r.qty - r.scrap
          : opStatus === 'Active' || opStatus === 'Paused' ? Math.round((r.qty - r.scrap) * 0.55)
            : 0;
        const op = await ExecutionOperation.create({
          Run_ID: run._id,
          Operation_Sequence: step.seq,
          Work_Center_ID: wcen(step.seq === 30 ? (j.wc === 'WC-WELD' ? 'WC-WELD' : 'WC-QC') : step.wc)?._id,
          Operation_Status: opStatus,
          Target_Quantity: r.qty,
          Completed_Good_Quantity: good,
          Scrapped_Quantity: step.seq === 20 ? r.scrap : step.seq === 10 ? Math.round(r.scrap * 0.2) : 0,
          Rework_Quantity: step.seq === 20 ? r.rework : 0,
          ...audit
        });
        operations.push(stamp('executionoperations', { ...op.toObject(), _run: r }, r.start || daysAgo(2)));
      }
    }
    counts.executionruns = runs.length;
    counts.executionoperations = operations.length;

    // ── F. OUTPUT POSTED AGAINST THE WORK ORDERS ──────────────────────────
    // The three Posted rows dated today are what the launchpad's "Today's
    // Output" tile sums (OutputHeader.Status='Posted' + Recording_Date today).
    const outputPlan = [
      { wo: 'WO-2026-3104', when: daysAgo(51), target: 5500, good: 5380, rej: 45,  scrap: 75,  status: 'Posted',   note: 'Burr on trimmed edge — die clearance drifted' },
      { wo: 'WO-2026-3104', when: daysAgo(46), target: 5500, good: 5405, rej: 0,   scrap: 95,  status: 'Posted',   note: 'Coil tail-end scrap' },
      { wo: 'WO-2026-3101', when: daysAgo(37), target: 10000, good: 9790, rej: 90, scrap: 120, status: 'Posted',   note: 'Hole pitch out of tolerance on first 90 pcs' },
      { wo: 'WO-2026-3101', when: daysAgo(32), target: 10000, good: 9820, rej: 0,  scrap: 180, status: 'Posted',   note: 'Setup scrap at strip feed' },
      { wo: 'WO-2026-3002', when: daysAgo(8),  target: 2500, good: 2445, rej: 0,   scrap: 55,  status: 'Posted',   note: 'Normal setup loss' },
      // Die crack shift — 12.4% loss, the worst batch of the quarter.
      { wo: 'WO-2026-3002', when: daysAgo(7),  target: 2500, good: 2190, rej: 120, scrap: 190, status: 'Posted',   note: 'Die crack on 250T #2 — split at draw radius' },
      { wo: 'WO-2026-3003', when: daysAgo(6),  target: 4000, good: 3912, rej: 0,   scrap: 88,  status: 'Posted',   note: 'Within norm' },
      { wo: 'WO-2026-3003', when: daysAgo(10), target: 4000, good: 0,    rej: 0,   scrap: 0,   status: 'Canceled', note: 'Posted against the wrong work order — cancelled by supervisor' },
      { wo: 'WO-2026-3102', when: daysAgo(2),  target: 2000, good: 1958, rej: 0,   scrap: 42,  status: 'Posted',   note: 'Within norm' },
      { wo: 'WO-2026-3002', when: todayAt(6),  target: 2500, good: 2410, rej: 30,  scrap: 55,  status: 'Posted',   note: 'Dent from coil surface defect' },
      { wo: 'WO-2026-3102', when: todayAt(3),  target: 2000, good: 1935, rej: 0,   scrap: 40,  status: 'Posted',   note: 'Setup scrap after die change' },
      { wo: 'WO-2026-3003', when: todayAt(1),  target: 3500, good: 3380, rej: 45,  scrap: 70,  status: 'Posted',   note: 'Weld spatter on stay ends' },
      { wo: 'WO-2026-3001', when: todayAt(0.5), target: 3000, good: 2880, rej: 0,  scrap: 62,  status: 'Draft',    note: 'Second-shift entry, awaiting supervisor posting' }
    ];

    let outHeaders = 0, yields = 0, putaways = 0, reasons = 0;
    let outSeq = 0;
    for (const o of outputPlan) {
      const h = woByNumber[o.wo];
      const j = jobs.find((x) => x.wo === o.wo);
      if (!h) continue;
      outSeq++;
      const header = await OutputHeader.create({
        Output_ID: `POUT-${ctx.YEAR}-${String(outSeq).padStart(4, '0')}`,
        Output_No: `OUT-${o.wo.replace('WO-2026-', '')}-${String(outSeq).padStart(2, '0')}`,
        WO_ID: h._id,
        Plant_ID: ctx.plant?._id,
        Recorded_By_User_ID: ctx.admin?._id,
        Recording_Date: o.when,
        Status: o.status,
        ...audit
      });
      stamp('outputheaders', header, o.when);
      outHeaders++;

      const yd = await YieldDetail.create({
        Output_ID: header._id,
        Material_ID: mat(j.matCode)._id,
        Target_Quantity: o.target,
        Good_Quantity: o.good,
        Rejected_Quantity: o.rej,
        Scrap_Quantity: o.scrap,
        UOM_ID: ctx.uomEa?._id,
        ...audit
      });
      stamp('yielddetails', yd, o.when);
      yields++;

      if (o.good > 0 && o.status === 'Posted') {
        const p = await InventoryPutaway.create({
          Yield_Detail_ID: yd._id,
          Target_Warehouse_ID: ctx.whFG?._id,
          Received_Quantity: o.good,
          Batch_Lot_Number: `FG-${o.wo.replace('WO-2026-', '')}-${String(outSeq).padStart(3, '0')}`,
          ...audit
        });
        stamp('inventoryputaways', p, o.when);
        putaways++;
      }

      for (const [type, qty] of [['Rejected', o.rej], ['Scrapped', o.scrap]]) {
        if (!qty) continue;
        const q = await QualityReasonCode.create({
          Yield_Detail_ID: yd._id,
          Defect_Type: type,
          Affected_Quantity: qty,
          Notes: `${j.part}: ${o.note}`,
          ...audit
        });
        stamp('qualityreasoncodes', q, o.when);
        reasons++;
      }
    }
    counts.outputheaders = outHeaders;
    counts.yielddetails = yields;
    counts.inventoryputaways = putaways;
    counts.qualityreasoncodes = reasons;

    // ── G. LEGACY OUTPUT LEDGER ───────────────────────────────────────────
    // Older-generation records the shop kept before the V2 output screen went
    // in; the launchpad sums both, so one row is dated today (night shift).
    const legacyPlan = [
      { wo: 'WO-2026-3104', ago: 55, good: 5200, rej: 40, scrap: 70 },
      { wo: 'WO-2026-3104', ago: 50, good: 5150, rej: 0,  scrap: 95 },
      { wo: 'WO-2026-3101', ago: 42, good: 9600, rej: 110, scrap: 150 },
      { wo: 'WO-2026-3101', ago: 39, good: 9750, rej: 0,  scrap: 130 },
      { wo: 'WO-2026-3001', ago: 30, good: 3800, rej: 55, scrap: 60 },
      { wo: 'WO-2026-3001', ago: 26, good: 4100, rej: 0,  scrap: 82 },
      { wo: 'WO-2026-3002', ago: 22, good: 2350, rej: 35, scrap: 48 },
      { wo: 'WO-2026-3003', ago: 18, good: 4250, rej: 0,  scrap: 90 },
      { wo: 'WO-2026-3003', ago: 14, good: 3980, rej: 60, scrap: 75 },
      { wo: 'WO-2026-3102', ago: 9,  good: 1880, rej: 0,  scrap: 38 },
      { wo: 'WO-2026-3002', ago: 5,  good: 2280, rej: 25, scrap: 52 },
      { wo: 'WO-2026-3102', ago: 0,  good: 1240, rej: 0,  scrap: 26 }
    ];
    let legacy = 0;
    for (let i = 0; i < legacyPlan.length; i++) {
      const l = legacyPlan[i];
      const h = woByNumber[l.wo];
      if (!h) continue;
      const when = l.ago === 0 ? todayAt(7) : daysAgo(l.ago);
      const po = await ProductionOutput.create({
        outputNumber: `PO-${ctx.YEAR}-${String(i + 1).padStart(4, '0')}`,
        workOrderId: h._id,
        recordedDate: when,
        goodQuantity: l.good,
        rejectedQuantity: l.rej,
        scrapQuantity: l.scrap,
        recordedBy: OPERATORS[i % OPERATORS.length]
      });
      stamp('productionoutputs', po, when);
      legacy++;
    }
    counts.productionoutputs = legacy;

    // ── H. PRODUCTION SCHEDULE (dispatch view for the presses) ────────────
    const schedulePlan = [
      { p: 'PRD-001', qty: 4000, day: -18, type: 'Daily',  wc: 'WC-PRESS', status: 'Completed',      note: 'TVS Motor pull — 250T #1' },
      { p: 'PRD-004', qty: 3000, day: -14, type: 'Daily',  wc: 'WC-PRESS', status: 'Completed',      note: 'Ashok Leyland schedule' },
      { p: 'PRD-006', qty: 5000, day: -11, type: 'Weekly', wc: 'WC-PRESS', status: 'Completed',      note: 'Bulk run, 160T' },
      // Slipped: due last week, still open on the floor.
      { p: 'PRD-013', qty: 1500, day: -6,  type: 'Daily',  wc: 'WC-PRESS', status: 'In-Progress',    note: 'OVERDUE — SS 304 sheet arrived late from Jindal' },
      { p: 'PRD-012', qty: 2000, day: -2,  type: 'Daily',  wc: 'WC-PRESS', status: 'In-Progress',    note: 'Brakes India, 250T #1' },
      { p: 'PRD-003', qty: 6000, day: 0,   type: 'Daily',  wc: 'WC-PRESS', status: 'In-Progress',    note: 'Today — India Yamaha side stands' },
      { p: 'PRD-007', qty: 8000, day: 1,   type: 'Daily',  wc: 'WC-PRESS', status: 'Firm/Released',  note: '63T, single shift' },
      { p: 'PRD-011', qty: 1200, day: 3,   type: 'Daily',  wc: 'WC-WELD',  status: 'Firm/Released',  note: 'Laser blanks then weld fixture' },
      { p: 'PRD-002', qty: 4500, day: 5,   type: 'Weekly', wc: 'WC-PRESS', status: 'Firm/Released',  note: 'Lucas-TVS clutch brackets' },
      { p: 'PRD-009', qty: 900,  day: 8,   type: 'Weekly', wc: 'WC-WELD',  status: 'Draft',          note: 'Awaiting fixture release from tool room' },
      { p: 'PRD-005', qty: 3200, day: 12,  type: 'Weekly', wc: 'WC-PRESS', status: 'Draft',          note: 'Sundram Fasteners tank mounts' },
      { p: 'PRD-010', qty: 700,  day: 16,  type: 'Monthly', wc: 'WC-WELD', status: 'Draft',          note: 'Wheels India cross members' },
      { p: 'PRD-008', qty: 5000, day: -9,  type: 'Daily',  wc: 'WC-PRESS', status: 'Cancelled',      note: 'Cancelled — customer pulled the schedule back' }
    ];
    let schedules = 0;
    for (const s of schedulePlan) {
      const product = prod(s.p);
      if (!product) continue;
      const target = s.day === 0 ? todayAt(8) : s.day < 0 ? daysAgo(-s.day) : daysAhead(s.day);
      const doc = await ProductionSchedule.create({
        scheduleType: s.type,
        targetDate: target,
        productId: product._id,
        scheduledQuantity: s.qty,
        assignedWorkCenterId: wcen(s.wc)?._id,
        status: s.status,
        notes: s.note,
        companyId: ctx.company?._id,
        createdBy: ctx.admin?._id,
        plantId: ctx.plant?._id
      });
      stamp('productionschedules', doc, s.day < 0 ? daysAgo(-s.day + 3) : daysAgo(2));
      schedules++;
    }
    counts.productionschedules = schedules;

    // ── I. MACHINE ALLOCATION ─────────────────────────────────────────────
    let allocs = 0;
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      const r = runPlan[i];
      const j = jobs.find((x) => x.wo === r.wo);
      if (!j || !r.start) continue;
      const firstOp = operations.find((o) => String(o.Run_ID) === String(run._id) && o.Operation_Sequence === 20);
      const live = r.status === 'Running' || r.status === 'Paused';
      const a = await MachineAllocation.create({
        Allocation_ID: `MA-${ctx.YEAR}-${String(i + 1).padStart(4, '0')}`,
        Machine_ID: mach(j.machine)._id,
        WO_ID: run.WO_ID,
        Operation_Log_ID: firstOp?._id,
        Allocated_By_User_ID: ctx.admin?._id,
        Allocation_Status: r.status === 'Aborted' ? 'Canceled' : live ? 'Active' : 'Released',
        Start_Timestamp: r.start,
        End_Timestamp: live ? null : new Date(r.start.getTime() + (r.hours || 1) * 36e5),
        ...audit
      });
      stamp('machineallocations', a, r.start);
      allocs++;
    }
    counts.machineallocations = allocs;

    // ── J. OPERATOR TASK ALLOCATION (only if operator profiles exist) ─────
    // TaskAllocation.Operator_ID is a required ref to OperatorProfile, which is
    // seeded by the shop-floor module. Without profiles the rows would be
    // orphans the shop-floor screen never reads, so skip rather than fake them.
    const operatorProfiles = await col('operatorprofiles').find({ isDeleted: { $ne: true } }).toArray();
    let tasks = 0;
    if (operatorProfiles.length) {
      const liveRuns = runs.filter((_, i) => runPlan[i].start);
      for (let i = 0; i < Math.min(liveRuns.length, 12); i++) {
        const run = liveRuns[i];
        const r = runPlan[runs.indexOf(run)];
        const op = operatorProfiles[i % operatorProfiles.length];
        const firstOp = operations.find((o) => String(o.Run_ID) === String(run._id) && o.Operation_Sequence === 20);
        const live = r.status === 'Running';
        const t = await TaskAllocation.create({
          Operator_ID: op._id,
          WO_ID: run.WO_ID,
          Operation_Log_ID: firstOp?._id,
          Allocation_Status: r.status === 'Aborted' ? 'Reassigned' : live ? 'Active' : r.status === 'Paused' ? 'Paused' : 'Completed',
          Start_Time: r.start,
          End_Time: live ? null : new Date(r.start.getTime() + (r.hours || 1) * 36e5),
          ...audit
        });
        stamp('taskallocations', t, r.start);
        tasks++;
      }
    }
    counts.taskallocations = tasks;

    // ── K. COMPONENT REQUIREMENTS (only if allocation headers exist) ──────
    // Same story: Allocation_ID is a required ref to AllocationHeader, which the
    // material-allocation screen creates lazily. Attach only if headers are there.
    const allocHeaders = await col('allocationheaders').find({ isDeleted: { $ne: true } }).toArray();
    let reqs = 0;
    if (allocHeaders.length) {
      for (const ah of allocHeaders) {
        const j = jobs.find((x) => woByNumber[x.wo] && String(woByNumber[x.wo]._id) === String(ah.WO_ID));
        if (!j) continue;
        const requiredKg = Math.round(j.qty * j.kgPer);
        const ratio = j.shortage ? 0.35 : j.progress >= 100 ? 1 : j.progress > 0 ? j.progress / 100 : 0;
        const c = await ComponentRequirement.create({
          Allocation_ID: ah._id,
          Component_Material_ID: mat(j.matCode)._id,
          Operation_Sequence: 10,
          Required_Quantity: requiredKg,
          Reserved_Quantity: Math.round(requiredKg * (j.shortage ? 0.35 : 1)),
          Issued_Quantity: Math.round(requiredKg * ratio),
          Consumed_Quantity: Math.round(requiredKg * ratio * 0.92),
          Scrapped_Quantity: Math.round(requiredKg * ratio * 0.02),
          UOM_ID: ctx.uomKg?._id,
          Issue_Method: 'Manual Pick',
          Shortage_Flag: !!j.shortage,
          ...audit
        });
        stamp('componentrequirements', c, j.start || daysAgo(4));
        reqs++;
      }
    }
    counts.componentrequirements = reqs;

    await applyBackdates();
    return counts;
  }
};
