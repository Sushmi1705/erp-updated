/* Shop Floor — LBAP Hosur press shop.
 *
 * The story this seeds:
 *   - 10 machines in a live mix of Running / Idle / Setup / Maintenance / Offline
 *   - 8 operators with Indian names on Morning / Evening / Night shifts
 *   - downtime events across the last 45 days AND today (die change, coil jam,
 *     TNEB power cut, tool breakage) so the "Downtime Today" tile has real
 *     minutes to report
 *   - scrap logged against specific pressed parts with press-shop root causes
 *     (burr, crack at bend radius, dimensional, wrinkle on draw)
 *
 * Nothing here is all-green: one machine is down right now, one operator is
 * absent, one is on leave, one scrap log is a reversal and one downtime is
 * still under investigation from last week.
 */

const ShopFloorMachine = require('../src/models/ShopFloorMachine');
const ShopFloorOperator = require('../src/models/ShopFloorOperator');
const ShopFloorDowntime = require('../src/models/ShopFloorDowntime');
const ShopFloorScrap = require('../src/models/ShopFloorScrap');

module.exports = {
  name: 'Shop Floor',

  run: async (ctx) => {
    const { col, M, mongoose, randInt, rnd } = ctx;
    const { ObjectId } = mongoose.Types;

    const { OperatorProfile, ShiftAssignment, PerformanceMetric } = M('OperatorManagement');
    const { MachineStateHeader, MachineEventLog } = M('MachineUtilization');
    const { DowntimeHeader, DowntimeCause, DowntimeImpact, DowntimeResolution } = M('DowntimeManagement');
    const { ScrapHeader, ScrapDetail, ScrapRootCause, ScrapDashboardMetrics } = M('ScrapManagement');
    const { LaborLog, MachineLog } = M('ProductionExecution');

    // ── Clean our own collections (re-runnable) ────────────────────────────
    const MINE = [
      'shopfloormachines', 'machinestateheaders', 'machineeventlogs', 'machinelogs',
      'laborlogs', 'shopflooroperators', 'operatorprofiles', 'shiftassignments',
      'downtimeheaders', 'downtimecauses', 'downtimeresolutions', 'downtimeimpacts',
      'shopfloordowntimes', 'scrapheaders', 'scrapdetails', 'scraprootcauses',
      'shopfloorscraps', 'scrapdashboardmetrics', 'performancemetrics'
    ];
    for (const c of MINE) await col(c).deleteMany({});

    // ── Time helpers ───────────────────────────────────────────────────────
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    // Minutes elapsed today, so "today" timestamps always land in the past.
    const elapsed = Math.max(90, Math.round((Date.now() - todayStart.getTime()) / 60000));
    const todayAt = (frac) => new Date(todayStart.getTime() + Math.round(elapsed * frac) * 60000);
    const dayAt = (back, h, m = 0) => {
      const d = new Date(Date.now() - back * 864e5);
      d.setHours(h, m, 0, 0);
      return d;
    };
    const plusMins = (d, n) => new Date(d.getTime() + n * 60000);

    // ── Master data lookups ────────────────────────────────────────────────
    const mc = {};
    ctx.machines.forEach((m) => { mc[m.code] = m; });
    const machineList = ['MC-001', 'MC-002', 'MC-003', 'MC-004', 'MC-005',
      'MC-006', 'MC-007', 'MC-008', 'MC-009', 'MC-010'].map((c) => mc[c]).filter(Boolean);

    const mat = {};
    ctx.materials.forEach((m) => { mat[m.code] = m; });
    const matList = ctx.materials;
    const pick = (code) => mat[code] || matList[0];

    const wos = await col('woheaders').find({}).toArray();
    // Legacy WorkOrder refs — fall back to the V2 headers if the legacy
    // collection is empty (it is another module's to fill).
    const legacyWos = await col('workorders').find({}).toArray();
    const woRefs = (legacyWos.length ? legacyWos : wos).map((w) => w._id);
    const woRef = (i) => woRefs.length ? woRefs[i % woRefs.length] : new ObjectId();
    const woV2 = (i) => (wos.length ? wos[i % wos.length]._id : new ObjectId());
    const wosInProgress = wos.filter((w) => w.Status === 'In Progress');

    const plantId = ctx.plant?._id;
    const companyId = ctx.company?._id;
    const userId = ctx.admin?._id;
    const audit = { plantId, companyId, createdBy: userId, isActive: true, isDeleted: false };

    const out = {};

    // ══ 1. OPERATORS ═══════════════════════════════════════════════════════
    const people = [
      { emp: 'LBAP-1041', name: 'R. Kumar',    skill: 'Expert',   status: 'Active',   shift: 'Morning' },
      { emp: 'LBAP-1052', name: 'S. Menon',    skill: 'Standard', status: 'Active',   shift: 'Morning' },
      { emp: 'LBAP-1063', name: 'A. Iyer',     skill: 'Expert',   status: 'Active',   shift: 'Morning' },
      { emp: 'LBAP-1074', name: 'V. Reddy',    skill: 'Standard', status: 'Active',   shift: 'Evening' },
      { emp: 'LBAP-1085', name: 'P. Nair',     skill: 'Trainee',  status: 'Active',   shift: 'Evening' },
      { emp: 'LBAP-1096', name: 'M. Selvam',   skill: 'Expert',   status: 'Active',   shift: 'Evening' },
      { emp: 'LBAP-1107', name: 'K. Rajan',    skill: 'Standard', status: 'Active',   shift: 'Night' },
      { emp: 'LBAP-1118', name: 'D. Prakash',  skill: 'Trainee',  status: 'On Leave', shift: 'Night' }
    ];

    const profiles = await OperatorProfile.insertMany(people.map((p, i) => ({
      Operator_ID: `OP-${String(i + 1).padStart(3, '0')}`,
      User_ID: i === 0 ? userId : null,
      Emp_ID: p.emp,
      Operator_Name: p.name,
      Plant_ID: plantId,
      Status: p.status,
      Skill_Level: p.skill,
      ...audit
    })));
    out.operatorprofiles = profiles.length;

    // Shift assignments — today plus the two previous days.
    const shiftWindow = { Morning: [6, 14], Evening: [14, 22], Night: [22, 6] };
    const shiftRows = [];
    for (let back = 2; back >= 0; back--) {
      people.forEach((p, i) => {
        if (p.status === 'On Leave' && back === 0) return; // D. Prakash is off today
        const [inH, outH] = shiftWindow[p.shift];
        // Today's Night shift has not been worked yet; leave it Scheduled.
        let attendance = 'Present';
        if (back === 0 && p.shift === 'Night') attendance = 'Scheduled';
        if (back === 0 && p.name === 'P. Nair') attendance = 'Absent';   // no-show today
        if (back === 1 && p.name === 'V. Reddy') attendance = 'Absent';
        shiftRows.push({
          Operator_ID: profiles[i]._id,
          Shift_ID: p.shift,
          Assigned_Date: dayAt(back, 8),
          Attendance_Status: attendance,
          Clock_In_Time: attendance === 'Present' ? dayAt(back, inH, randInt(0, 9)) : null,
          Clock_Out_Time: attendance === 'Present' && !(back === 0 && p.shift === 'Evening')
            ? dayAt(back, outH < inH ? inH + 8 : outH, randInt(0, 12))
            : null,
          ...audit
        });
      });
    }
    out.shiftassignments = (await ShiftAssignment.insertMany(shiftRows)).length;

    // Productivity ledger — earned vs actual hours over the past week.
    const perfRows = [];
    const perfSeed = [
      { std: 7.6, act: 8, defect: 0.8 }, { std: 6.9, act: 8, defect: 1.4 },
      { std: 7.9, act: 8, defect: 0.5 }, { std: 6.2, act: 8, defect: 2.1 },
      { std: 4.9, act: 8, defect: 4.6 }, { std: 7.7, act: 8, defect: 0.9 },
      { std: 6.6, act: 8, defect: 1.8 }, { std: 5.4, act: 8, defect: 3.2 }
    ];
    people.forEach((p, i) => {
      [7, 1].forEach((back, k) => {
        const s = perfSeed[i];
        const std = Math.round((s.std - (k ? 0 : 0.4)) * 10) / 10;
        perfRows.push({
          Operator_ID: profiles[i]._id,
          Calculation_Date: dayAt(back, 18),
          Standard_Hours_Earned: std,
          Actual_Hours_Worked: s.act,
          Productivity_Score: Math.min(100, Math.round((std / s.act) * 10000) / 100),
          Defect_Rate_Percentage: s.defect,
          ...audit
        });
      });
    });
    out.performancemetrics = (await PerformanceMetric.insertMany(perfRows)).length;

    // Legacy operator board (shift + productivity per operator).
    const legacyOps = people.map((p, i) => ({
      operatorName: p.name,
      employeeId: p.emp,
      workOrderId: woRef(i),
      shift: p.shift,
      assignedDate: dayAt(i % 3, 8),
      productivityScore: Math.min(100, Math.round((perfSeed[i].std / 8) * 100)),
      performanceNotes: [
        'Consistent on 250T. Handles die change without support.',
        'Steady output. Needs watching on coil feed alignment.',
        'Best first-pass yield on the bracket line.',
        'Reworked 2 batches this week — bend radius drifting.',
        'Under training on 63T. Supervised operation only.',
        'Tool room trained. Sets up blanking dies independently.',
        'Night shift lead. Good handover discipline.',
        'On leave — trainee, resumes next week.'
      ][i]
    }));
    out.shopflooroperators = (await ShopFloorOperator.insertMany(legacyOps)).length;

    // ══ 2. MACHINE STATE ═══════════════════════════════════════════════════
    // MC-004 (63T) is Offline — it is the machine broken down right now.
    const stateSpec = [
      { code: 'MC-001', status: 'Running',     util: 87.5, idle: 15,  wo: 0 },
      { code: 'MC-002', status: 'Running',     util: 81.2, idle: 25,  wo: 1 },
      { code: 'MC-003', status: 'Setup',       util: 74.8, idle: 45,  wo: 2 },
      { code: 'MC-004', status: 'Offline',     util: 41.3, idle: 190, wo: null },
      { code: 'MC-005', status: 'Idle',        util: 62.4, idle: 120, wo: null },
      { code: 'MC-006', status: 'Running',     util: 91.0, idle: 10,  wo: 0 },
      { code: 'MC-007', status: 'Running',     util: 78.6, idle: 35,  wo: 1 },
      { code: 'MC-008', status: 'Idle',        util: 55.9, idle: 165, wo: null },
      { code: 'MC-009', status: 'Maintenance', util: 48.7, idle: 210, wo: null },
      { code: 'MC-010', status: 'Running',     util: 84.1, idle: 20,  wo: 2 }
    ];

    const states = await MachineStateHeader.insertMany(stateSpec.map((s, i) => ({
      Machine_State_ID: `MSH-${String(i + 1).padStart(3, '0')}`,
      Machine_ID: mc[s.code]._id,
      Plant_ID: plantId,
      Current_Status: s.status,
      Current_WO_ID: s.wo === null ? null
        : (wosInProgress[s.wo % Math.max(1, wosInProgress.length)]?._id || woV2(s.wo)),
      Current_Idle_Time_Mins: s.idle,
      Live_Utilization_Percentage: s.util,
      Last_State_Change: s.status === 'Running' ? todayAt(0.55) : todayAt(0.3),
      ...audit
    })));
    out.machinestateheaders = states.length;

    // Event ledger: yesterday's closed runs plus today's open event per machine.
    const eventRows = [];
    let mel = 1;
    const nextMel = () => `MEL-${String(mel++).padStart(3, '0')}`;

    stateSpec.forEach((s, i) => {
      const machineId = mc[s.code]._id;
      const woId = s.wo === null ? null : (wosInProgress[s.wo % Math.max(1, wosInProgress.length)]?._id || null);

      // Yesterday: setup then a production run.
      const setupStart = dayAt(1, 6, 10);
      eventRows.push({
        Event_Log_ID: nextMel(), Machine_ID: machineId, WO_ID: woId, Event_Type: 'Setup',
        Start_Time: setupStart, End_Time: plusMins(setupStart, 40 + i * 3),
        Duration_Minutes: 40 + i * 3, Logged_By_User_ID: userId, ...audit
      });
      const runStart = plusMins(setupStart, 45 + i * 3);
      const runMins = 300 + i * 7;
      eventRows.push({
        Event_Log_ID: nextMel(), Machine_ID: machineId, WO_ID: woId, Event_Type: 'Run',
        Start_Time: runStart, End_Time: plusMins(runStart, runMins),
        Duration_Minutes: runMins, Logged_By_User_ID: userId, ...audit
      });
      // Yesterday's idle tail with a reason.
      const idleStart = plusMins(runStart, runMins + 5);
      eventRows.push({
        Event_Log_ID: nextMel(), Machine_ID: machineId, WO_ID: null, Event_Type: 'Idle',
        Start_Time: idleStart, End_Time: plusMins(idleStart, s.idle),
        Duration_Minutes: s.idle, Logged_By_User_ID: userId,
        Idle_Reason_Code_ID: rnd(['Coil changeover', 'Awaiting QC clearance',
          'Material shortage', 'Operator on break', 'Awaiting die from tool room']),
        ...audit
      });

      // Today: one open event matching the live state (End_Time null).
      const typeMap = { Running: 'Run', Setup: 'Setup', Offline: 'Breakdown', Maintenance: 'Breakdown', Idle: 'Idle' };
      eventRows.push({
        Event_Log_ID: nextMel(), Machine_ID: machineId, WO_ID: woId,
        Event_Type: typeMap[s.status] || 'Idle',
        Start_Time: s.status === 'Running' ? todayAt(0.55) : todayAt(0.3),
        End_Time: null, Duration_Minutes: 0, Logged_By_User_ID: userId,
        Idle_Reason_Code_ID: s.status === 'Idle' ? 'No work order allocated'
          : s.status === 'Offline' ? 'Tool breakage — awaiting tool room'
            : s.status === 'Maintenance' ? 'Scheduled preventive maintenance' : undefined,
        ...audit
      });
    });
    out.machineeventlogs = (await MachineEventLog.insertMany(eventRows)).length;

    // Legacy machine allocation board.
    out.shopfloormachines = (await ShopFloorMachine.insertMany(stateSpec.map((s, i) => ({
      machineId: mc[s.code]._id,
      workOrderId: s.wo === null ? undefined : woRef(s.wo),
      allocatedDate: dayAt(s.status === 'Running' ? 0 : randInt(1, 6), 7),
      utilizationPercentage: Math.round(s.util),
      idleTimeMinutes: s.idle,
      status: s.status === 'Running' ? 'Running'
        : (s.status === 'Maintenance' || s.status === 'Offline') ? 'Maintenance' : 'Idle'
    })))).length;

    // ══ 3. DOWNTIME ════════════════════════════════════════════════════════
    // The first four are TODAY — the "Downtime Today" tile reads these.
    const downtimes = [
      { code: 'MC-004', type: 'Unplanned',    reason: 'Tool breakage — blanking punch sheared on Brake Pedal Bracket die',
        comp: 'Blanking punch, station 2', mins: 95, start: todayAt(0.55), status: 'Active',
        loss: 4200, impact: 'Line stopped mid-batch. Tool room re-grinding a spare punch; 63T press out of service since morning break.',
        fix: null },
      { code: 'MC-003', type: 'Planned',      reason: 'Die changeover — Side Stand Bracket to Mudguard Stay',
        comp: 'Die set / bolster', mins: 45, start: todayAt(0.2), status: 'Resolved',
        loss: 1800, impact: 'Planned changeover between two customer batches. Absorbed in the shift plan.',
        fix: 'Die changed and first-off approved by QC. Setter: M. Selvam.' },
      { code: 'MC-006', type: 'Unplanned',    reason: 'TNEB power cut — SIPCOT feeder trip',
        comp: 'Incoming supply', mins: 22, start: todayAt(0.4), status: 'Resolved',
        loss: 900, impact: 'Laser cutting halted, DG set took 4 minutes to pick up load. Two sheets scrapped on restart.',
        fix: 'Supply restored by TNEB. Laser re-homed and resumed. Logged by K. Rajan.' },
      { code: 'MC-001', type: 'Unplanned',    reason: 'Coil jam at decoiler — strip mis-feed',
        comp: 'Servo feeder / decoiler', mins: 38, start: todayAt(0.75), status: 'Resolved',
        loss: 1600, impact: '250T press stopped. Strip pulled out and coil re-loaded, leading edge trimmed.',
        fix: 'Feeder rollers re-set and pilot release adjusted. Attended by R. Kumar.' },

      { code: 'MC-002', type: 'Unplanned',    reason: 'Hydraulic oil leak at main cylinder gland',
        comp: 'Main cylinder gland seal', mins: 165, start: dayAt(2, 11, 20), status: 'Closed',
        loss: 7400, impact: 'Half a shift lost on the Engine Mounting Bracket batch. Overtime booked to recover.',
        fix: 'Gland seal kit replaced and oil topped up. Maintenance: D. Prakash.' },
      { code: 'MC-009', type: 'Preventative', reason: 'Scheduled preventive maintenance — tube bender mandrel service',
        comp: 'Mandrel assembly', mins: 240, start: dayAt(3, 6, 0), status: 'Closed',
        loss: 0, impact: 'Planned PM slot. No customer batch scheduled on the bender that day.',
        fix: 'Mandrel and wiper die replaced, machine re-calibrated. Signed off by A. Iyer.' },
      { code: 'MC-007', type: 'Unplanned',    reason: 'Back gauge servo fault on press brake',
        comp: 'Back gauge servo drive', mins: 130, start: dayAt(5, 15, 45), status: 'Closed',
        loss: 3100, impact: 'Bending operations queued to the manual brake. Cross Member Assembly slipped by a day.',
        fix: 'Drive encoder cable re-terminated. Vendor engineer attended.' },
      { code: 'MC-008', type: 'Unplanned',    reason: 'Shearing blade chipped — clearance out of spec',
        comp: 'Bottom shear blade', mins: 210, start: dayAt(8, 9, 15), status: 'Closed',
        loss: 5600, impact: 'Blank preparation halted. Outsourced one batch of blanks to a local shear.',
        fix: 'Blade rotated to a fresh edge and clearance reset to 0.06 mm.' },
      { code: 'MC-005', type: 'Unplanned',    reason: 'Air compressor pressure drop — clutch not engaging',
        comp: 'Plant air line / clutch', mins: 75, start: dayAt(11, 13, 0), status: 'Closed',
        loss: 2200, impact: '60T press idled while the compressor was restarted.',
        fix: 'Air receiver drained and compressor unloader valve cleaned.' },
      { code: 'MC-001', type: 'Planned',      reason: 'Die changeover — Footrest Bracket LH to RH',
        comp: 'Die set', mins: 55, start: dayAt(14, 10, 30), status: 'Closed',
        loss: 2300, impact: 'Routine LH/RH changeover on the 250T.',
        fix: 'Changeover completed within standard time. First-off cleared.' },
      { code: 'MC-010', type: 'Unplanned',    reason: 'MIG torch liner blocked — porosity in weld',
        comp: 'Torch liner / contact tip', mins: 95, start: dayAt(19, 16, 10), status: 'Closed',
        loss: 1900, impact: 'Battery Tray Assembly welding stopped, 40 assemblies held for re-inspection.',
        fix: 'Liner and contact tip replaced, gas flow reset to 14 lpm.' },
      { code: 'MC-006', type: 'Unplanned',    reason: 'Laser lens contamination — cut edge dross on 3mm HR',
        comp: 'Focusing lens', mins: 145, start: dayAt(26, 8, 40), status: 'Investigating',
        loss: 4800, impact: 'Repeat failure — third lens this quarter. Suspected chiller humidity, still under investigation.',
        fix: null },
      { code: 'MC-004', type: 'Unplanned',    reason: 'Coil jam — camber in incoming CRCA slit coil',
        comp: 'Straightener', mins: 60, start: dayAt(33, 12, 25), status: 'Closed',
        loss: 1400, impact: 'Coil returned to stores and a debit note raised on the supplier.',
        fix: 'Straightener re-set, remaining coil quarantined for incoming inspection.' },
      { code: 'MC-003', type: 'Unplanned',    reason: 'Overload trip on 160T — double blank fed',
        comp: 'Overload protection', mins: 110, start: dayAt(41, 14, 55), status: 'Closed',
        loss: 2600, impact: 'Press tripped and needed a full re-set. Die inspected for damage; none found.',
        fix: 'Overload reset, single-blank sensor fitted at the feed station.' }
    ];

    const dtHeaders = [];
    for (let i = 0; i < downtimes.length; i++) {
      const d = downtimes[i];
      const isOpen = d.status === 'Active' || d.status === 'Investigating';
      dtHeaders.push({
        DT_Log_ID: `DTL-${String(i + 1).padStart(3, '0')}`,
        DT_Log_Number: `DT-${ctx.YEAR}-${String(4100 + i)}`,
        Hardware_ID: mc[d.code]._id,
        Plant_ID: plantId,
        Status: d.status,
        Start_Time: d.start,
        End_Time: isOpen ? null : plusMins(d.start, d.mins),
        Duration_Minutes: isOpen ? 0 : d.mins,
        Logged_Date: d.start,
        ...audit
      });
    }
    const insertedDt = await DowntimeHeader.insertMany(dtHeaders);
    out.downtimeheaders = insertedDt.length;

    out.downtimecauses = (await DowntimeCause.insertMany(insertedDt.map((h, i) => ({
      DT_Log_ID: h._id,
      DT_Type: downtimes[i].type,
      Reason_Code_ID: ['TOOL-BRK', 'DIE-CHG', 'PWR-CUT', 'COIL-JAM', 'HYD-LEAK', 'PM-SCHED',
        'SERVO-FLT', 'BLADE-DMG', 'AIR-LOW', 'DIE-CHG', 'WELD-FLT', 'LASER-OPT',
        'COIL-JAM', 'OVERLOAD'][i],
      Reason_Description: downtimes[i].reason,
      Component_Failed: downtimes[i].comp,
      ...audit
    })))).length;

    out.downtimeimpacts = (await DowntimeImpact.insertMany(insertedDt.map((h, i) => ({
      DT_Log_ID: h._id,
      Impact_Analysis_Notes: downtimes[i].impact,
      Affected_WO_ID: downtimes[i].loss > 0 ? woV2(i) : null,
      Estimated_Production_Loss_Qty: downtimes[i].loss,
      ...audit
    })))).length;

    const resolutions = insertedDt
      .map((h, i) => ({ h, d: downtimes[i] }))
      .filter((x) => x.d.fix)
      .map(({ h, d }) => ({
        DT_Log_ID: h._id,
        Resolved_By_User_ID: userId,
        Corrective_Action_Taken: d.fix,
        Resolution_Timestamp: plusMins(d.start, d.mins),
        ...audit
      }));
    out.downtimeresolutions = (await DowntimeResolution.insertMany(resolutions)).length;

    // Legacy downtime board — this is what the dashboard's "Downtime Today"
    // tile aggregates (dateRecorded >= today, sum of durationMinutes).
    out.shopfloordowntimes = (await ShopFloorDowntime.insertMany(downtimes.map((d, i) => ({
      downtimeNumber: `DT-${ctx.YEAR}-${String(4100 + i)}`,
      machineId: mc[d.code]._id,
      type: d.type === 'Preventative' ? 'Planned' : d.type,
      reason: d.reason,
      durationMinutes: d.status === 'Active'
        ? Math.max(1, Math.round((Date.now() - d.start.getTime()) / 60000))
        : d.mins,
      impactAnalysis: d.impact,
      dateRecorded: d.start
    })))).length;

    // ══ 4. SCRAP ═══════════════════════════════════════════════════════════
    // Scrapped in the press shop: blanked/formed material written off, tagged
    // with the part it was being pressed into and a press-shop root cause.
    const scraps = [
      { matCode: 'MAT-003', part: 'Brake Pedal Bracket',        qty: 182,  type: 'Component',    status: 'Posted', back: 0,
        cause: 'Burr on blanked edge beyond 0.15 mm — punch-die clearance opened up after 40k strokes on the 63T. Punch sent for re-grind.' },
      { matCode: 'MAT-005', part: 'Cross Member Assembly',      qty: 96,   type: 'Finished Good', status: 'Posted', back: 0,
        cause: 'Crack at bend radius on 3.0 mm HR — bending along the rolling direction. Blank layout revised to bend across grain.' },
      { matCode: 'MAT-002', part: 'Fuel Tank Mounting Bracket', qty: 145,  type: 'Component',    status: 'Posted', back: 1,
        cause: 'Dimensional deviation — hole pitch 1.2 mm over drawing. Pierce punch retainer had loosened; re-shimmed and locked.' },
      { matCode: 'MAT-006', part: 'Exhaust Heat Shield',        qty: 68,   type: 'Component',    status: 'Posted', back: 2,
        cause: 'Wrinkle on draw flange of the 1.0 mm GI blank — blank holder pressure too low on the 250T. Pressure raised from 45 to 62 bar.' },
      { matCode: 'MAT-003', part: 'Side Stand Bracket',         qty: 220,  type: 'Component',    status: 'Posted', back: 4,
        cause: 'Coil camber from supplier slit coil caused progressive mis-feed. Whole strip length scrapped, debit note raised on the mill.' },
      { matCode: 'MAT-004', part: 'Seat Mounting Frame',        qty: 54,   type: 'Finished Good', status: 'Posted', back: 6,
        cause: 'Weld spatter and porosity on the MIG station — blocked torch liner. Assemblies could not be reworked to customer cosmetic spec.' },
      { matCode: 'MAT-002', part: 'Mudguard Stay',              qty: 310,  type: 'Component',    status: 'Posted', back: 9,
        cause: 'Die misalignment after a rushed changeover — first 310 pieces off-centre. First-off inspection discipline reinforced with the setters.' },
      { matCode: 'MAT-005', part: 'Engine Mounting Bracket',    qty: 128,  type: 'Component',    status: 'Posted', back: 13,
        cause: 'Surface rust on 3.0 mm HR coil held in the open yard through the monsoon. Rejected at incoming re-inspection after forming.' },
      { matCode: 'MAT-007', part: 'Precision Turned Spacer',    qty: 41,   type: 'Component',    status: 'Posted', back: 17,
        cause: 'Dimensional — OD undersize by 0.08 mm on the SS 304 batch. Tool offset drift, spacers scrapped as they cannot be built up.' },
      { matCode: 'MAT-003', part: 'Footrest Bracket LH/RH',     qty: 76,   type: 'Component',    status: 'Posted', back: 22,
        cause: 'Burr and edge tearing after the shear blade chipped. Traced to the MC-008 blade damage logged the same week.' },
      { matCode: 'MAT-004', part: 'Battery Tray Assembly',      qty: 88,   type: 'Component',    status: 'Draft',  back: 0,
        cause: 'Wrinkle on the tray corners — suspected blank size. Awaiting tool room measurement before the loss is posted.' },
      { matCode: 'MAT-002', part: 'Number Plate Bracket',       qty: 130,  type: 'Component',    status: 'Draft',  back: 1,
        cause: 'Crack observed at the pierced hole edge on 20% of the batch. Held for metallurgical check on the coil certificate.' },
      { matCode: 'MAT-003', part: 'Clutch Pedal Bracket',       qty: 60,   type: 'Component',    status: 'Reversed', back: 7,
        cause: 'Logged as dimensional scrap in error — parts were reworked on the press brake and cleared by QC. Entry reversed.' }
    ];
    // One timestamp per incident, shared by the V2 log and the legacy board.
    scraps.forEach((s) => {
      s.at = s.back === 0 ? todayAt(0.5) : dayAt(s.back, randInt(9, 18));
    });

    const scrapHeaders = [];
    for (let i = 0; i < scraps.length; i++) {
      const s = scraps[i];
      scrapHeaders.push({
        Scrap_Log_ID: `SCL-${String(i + 1).padStart(3, '0')}`,
        Scrap_Log_Number: `SCR-${ctx.YEAR}-${String(2200 + i)}`,
        WO_ID: woV2(i),
        Plant_ID: plantId,
        Logged_Date: s.at,
        Logged_By_User_ID: userId,
        Status: s.status,
        ...audit
      });
    }
    const insertedScrap = await ScrapHeader.insertMany(scrapHeaders);
    out.scrapheaders = insertedScrap.length;

    const details = insertedScrap.map((h, i) => {
      const s = scraps[i];
      const material = pick(s.matCode);
      const unitCost = material.standardCost || 60;
      return {
        Scrap_Log_ID: h._id,
        Material_ID: material._id,
        Material_Type: s.type,
        Quantity: s.qty,
        UOM_ID: ctx.uomKg?._id,
        Unit_Cost: unitCost,
        Total_Value_Lost: Math.round(unitCost * s.qty * 100) / 100,
        ...audit
      };
    });
    out.scrapdetails = (await ScrapDetail.insertMany(details)).length;

    out.scraprootcauses = (await ScrapRootCause.insertMany(insertedScrap.map((h, i) => ({
      Scrap_Log_ID: h._id,
      Root_Cause_Description: `${scraps[i].part}: ${scraps[i].cause}`,
      ...audit
    })))).length;

    // KPI rollup cache — Posted logs only (Draft not yet committed, Reversed backed out).
    const posted = scraps.map((s, i) => ({ s, d: details[i] })).filter((x) => x.s.status === 'Posted');
    await ScrapDashboardMetrics.create({
      Plant_ID: plantId,
      Total_Financial_Impact: Math.round(posted.reduce((a, x) => a + x.d.Total_Value_Lost, 0) * 100) / 100,
      Total_Items_Scrapped: posted.reduce((a, x) => a + x.s.qty, 0),
      Total_Scrap_Incidents: posted.length,
      Last_Updated: new Date(),
      ...audit
    });
    out.scrapdashboardmetrics = 1;

    // Legacy scrap board.
    out.shopfloorscraps = (await ShopFloorScrap.insertMany(scraps.map((s, i) => {
      const material = pick(s.matCode);
      const unitCost = material.standardCost || 60;
      return {
        scrapNumber: `SCR-${ctx.YEAR}-${String(2200 + i)}`,
        workOrderId: woRef(i),
        materialId: material._id,
        scrapQuantity: s.qty,
        unitCost,
        totalScrapCost: Math.round(unitCost * s.qty * 100) / 100,
        rootCauseAnalysis: `${s.part}: ${s.cause}`,
        dateRecorded: s.at
      };
    }))).length;

    // ══ 5. EXECUTION LABOUR / MACHINE LEDGER ═══════════════════════════════
    // These hang off ExecutionOperation rows owned by the production module.
    // Attach to whatever exists; if that module has not run yet there is
    // nothing meaningful to hang them on, so they stay empty.
    const ops = await col('executionoperations').find({}).limit(12).toArray();
    if (ops.length) {
      const activities = ['Setup', 'Run', 'Run', 'Rework', 'Idle', 'Teardown'];
      const laborRows = [];
      const machineRows = [];
      ops.forEach((op, i) => {
        const back = i % 6;
        const start = dayAt(back, 6 + (i % 3) * 4, 10);
        const hrs = [1.5, 6, 5.5, 2, 1, 0.75][i % 6];
        laborRows.push({
          Operation_Log_ID: op._id,
          Operator_User_ID: userId,
          Activity_Type: activities[i % activities.length],
          Start_Time: start,
          End_Time: plusMins(start, hrs * 60),
          Logged_Hours: hrs,
          Billable_Rate: [180, 220, 260][i % 3],
          ...audit
        });
        const mstart = dayAt(back, 6, 0);
        const mh = [7.5, 6.25, 4, 8, 2.5, 5][i % 6];
        machineRows.push({
          Operation_Log_ID: op._id,
          Machine_ID: machineList[i % machineList.length]._id,
          Status: ['Running', 'Running', 'Setup', 'Starved/Idle', 'Breakdown', 'Maintenance'][i % 6],
          Start_Time: mstart,
          End_Time: plusMins(mstart, mh * 60),
          Total_Hours: mh,
          ...audit
        });
      });
      out.laborlogs = (await LaborLog.insertMany(laborRows)).length;
      out.machinelogs = (await MachineLog.insertMany(machineRows)).length;
    } else {
      out.laborlogs = 0;
      out.machinelogs = 0;
    }

    return out;
  }
};
