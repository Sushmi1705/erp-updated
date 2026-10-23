/* QUALITY — LBAP demo data.
 *
 * The story runs the full quality chain of a Hosur press shop:
 *   incoming steel coil inspected lot-by-lot against the mill's vendor lots,
 *   in-process checks on the pressed brackets with real measured parameters,
 *   final inspection and product release on finished-goods batches, and the
 *   NCR / CAPA trail that the failures open up.
 *
 * Deliberately NOT all green:
 *   - 4 incoming lots still 'Pending' (one of them 18 days stale),
 *     3 in-process and 3 final inspections 'Pending'  -> dashboard
 *     "Pending Inspections" tile,
 *   - 4 NCRs not Closed -> dashboard "Non-Conformances" tile,
 *   - 2 corrective actions past their target date, a rejected FG batch and a
 *     quarantined one.
 */

module.exports = {
  name: 'Quality',
  run: async (ctx) => {
    const {
      col, M, daysAgo, daysAhead, YEAR, pad, admin, plant, company
    } = ctx;

    const { IncomingInspectionHeader, IncomingMaterialSampling, IncomingVendorEvaluation, IncomingDefectLog } = M('IncomingQuality');
    const { InProcessInspectionHeader, InProcessInspectionParameter, InProcessDefectLog, InProcessCAPALinkage } = M('InProcessQuality');
    const { FinalInspectionHeader, FinalQualityParameter, ProductReleaseApprovalLog, FinalNonConformanceQuarantine } = M('FinalQuality');
    const { NonConformanceHeader, RootCauseAnalysis, CorrectiveAction, PreventiveAction } = M('CAPAManagement');
    const { QualityParameterDefinition, QualityMeasurementLog } = M('QualityParametersManagement');
    const QualityParameter = M('QualityParameter');

    // ---------------------------------------------------------------- setup
    const MINE = [
      'incominginspectionheaders', 'incomingmaterialsamplings', 'incomingdefectlogs', 'incomingvendorevaluations',
      'inprocessinspectionheaders', 'inprocessinspectionparameters', 'inprocessdefectlogs', 'inprocesscapalinkages',
      'finalinspectionheaders', 'finalqualityparameters', 'productreleaseapprovallogs', 'finalnonconformancequarantines',
      'nonconformanceheaders', 'rootcauseanalyses', 'correctiveactions', 'preventiveactions',
      'qualityparameters', 'qualityparameterdefinitions', 'qualitymeasurementlogs'
    ];
    for (const c of MINE) await col(c).deleteMany({});

    const adminId = admin && admin._id;
    const plantId = plant && plant._id;
    const companyId = company && company._id;
    const audit = { createdBy: adminId, companyId, plantId, isActive: true, isDeleted: false };

    // A small pool of inspector accounts so populate() has something to chew on.
    const staff = ctx.users.slice(0, Math.min(4, ctx.users.length)).map((u) => u._id);
    const inspector = (i) => staff[i % staff.length] || adminId;

    const mat = (code) => ctx.materials.find((m) => m.code === code);
    const ven = (code) => ctx.vendors.find((v) => (v.code || v.vendorCode) === code);
    const wos = await col('woheaders').find({}).sort({ WO_Number: 1 }).toArray();
    const wo = (num) => wos.find((w) => w.WO_Number === num) || wos[0] || null;
    const woId = (num) => { const w = wo(num); return w ? w._id : undefined; };

    const counts = {};
    const bump = (k, n) => { counts[k] = (counts[k] || 0) + n; };

    // ============================================================ A. PARAMETER MASTERS
    // Legacy QualityParameter rows — the incoming/in-process/final line items
    // point at these, so they have to exist first.
    const legacySpec = [
      ['MAT-001', 'Thickness', 0.80, 0.03, 0.03, [0.801, 0.792, 0.808, 0.797]],
      ['MAT-002', 'Thickness', 1.20, 0.04, 0.04, [1.203, 1.188, 1.212, 1.196, 1.207]],
      ['MAT-003', 'Thickness', 1.60, 0.05, 0.05, [1.612, 1.588, 1.604]],
      ['MAT-004', 'Thickness', 2.00, 0.10, 0.10, [2.04, 1.94, 2.13, 1.98]],
      ['MAT-005', 'Thickness', 3.00, 0.12, 0.12, [3.05, 2.94, 3.08]],
      ['MAT-006', 'Weight', 120, 15, 15, [124, 118, 131, 109]],
      ['MAT-007', 'Hardness', 180, 20, 20, [176, 214, 183]],
      ['MAT-010', 'Hardness', 60, 2, 2, [60.5, 59.2, 61.4]]
    ];
    const inspectorNames = ['R. Kumar', 'S. Menon', 'A. Iyer', 'V. Reddy', 'P. Nair', 'M. Selvam', 'K. Rajan', 'D. Prakash'];

    const legacyParams = [];
    for (let i = 0; i < legacySpec.length; i++) {
      const [code, type, std, plus, minus, readings] = legacySpec[i];
      const m = mat(code);
      if (!m) continue;
      legacyParams.push(await QualityParameter.create({
        materialId: m._id,
        parameterType: type,
        standardValue: std,
        tolerancePlus: plus,
        toleranceMinus: minus,
        recordedMeasurements: readings.map((v, k) => ({
          value: v,
          date: daysAgo(52 - i * 4 - k * 2),
          pass: v >= std - minus && v <= std + plus,
          inspector: inspectorNames[(i + k) % inspectorNames.length]
        }))
      }));
    }
    bump('qualityparameters', legacyParams.length);
    const lp = (code, type) => legacyParams.find((p) => {
      const m = ctx.materials.find((x) => String(x._id) === String(p.materialId));
      return m && m.code === code && p.parameterType === type;
    });

    // QualityParameterDefinition — the V2 master the Quality Parameters screen reads.
    const defSpec = [
      ['MAT-001', 'Coil Thickness', 0.80, 0.03, 0.03, null, true, [0.801, 0.795, 0.808, 0.788]],
      ['MAT-002', 'Coil Thickness', 1.20, 0.04, 0.04, null, true, [1.203, 1.188, 1.212, 1.196, 1.229]],
      ['MAT-002', 'Coil Width', 1250, 3, 3, null, false, [1250.4, 1249.1]],
      ['MAT-003', 'Coil Thickness', 1.60, 0.05, 0.05, null, true, [1.612, 1.588, 1.604]],
      ['MAT-004', 'Coil Thickness', 2.00, 0.10, 0.10, null, true, [2.04, 1.94, 2.13]],
      ['MAT-004', 'Yield Strength (MPa)', 250, 40, 20, null, true, [268, 241, 236]],
      ['MAT-005', 'Coil Thickness', 3.00, 0.12, 0.12, null, true, [3.05, 2.94, 3.08, 2.90]],
      ['MAT-006', 'Zinc Coating Weight (g/m2)', 120, 15, 15, 'kg', true, [124, 118, 131, 103]],
      ['MAT-007', 'Hardness (HV)', 180, 20, 20, null, true, [176, 214, 183, 191]],
      ['MAT-008', 'Sheet Thickness', 1.50, 0.06, 0.06, null, true, [1.512, 1.478, 1.503]],
      ['MAT-009', 'Wire Diameter', 1.20, 0.03, 0.03, null, true, [1.204, 1.196]],
      ['MAT-010', 'Hardness (HRC)', 60, 2, 2, null, true, [60.5, 59.2, 61.4]]
    ];

    const defs = [];
    const logs = [];
    let logSeq = 0;
    for (let i = 0; i < defSpec.length; i++) {
      const [code, name, target, up, low, uom, active, readings] = defSpec[i];
      const m = mat(code);
      if (!m) continue;
      const def = await QualityParameterDefinition.create({
        Param_Standard_ID: `QPD-${YEAR}-${pad(i + 1)}`,
        Material_ID: m._id,
        Parameter_Name: name,
        Standard_Target: target,
        Tolerance_Upper: up,
        Tolerance_Lower: low,
        UOM_ID: uom === 'kg' ? (ctx.uomKg && ctx.uomKg._id) : undefined,
        Total_Readings_Count: readings.length,
        Is_Active: active,
        ...audit
      });
      defs.push(def);

      for (let k = 0; k < readings.length; k++) {
        const v = readings[k];
        logSeq += 1;
        logs.push(await QualityMeasurementLog.create({
          Measurement_Log_ID: `QML-${YEAR}-${pad(logSeq, 5)}`,
          Param_Standard_ID: def._id,
          Measured_Value: v,
          Calculated_Status: (v >= target - low && v <= target + up) ? 'Pass' : 'Fail',
          Inspector_ID: inspector(i + k),
          Measurement_Date: daysAgo(48 - i * 3 - k * 2),
          Source_Context: k === 0 ? 'Incoming QC' : (k === 1 ? 'In-Process QC' : (k === 2 ? 'Final QC' : 'Standalone')),
          Source_Ref_ID: `${m.code}/LOT-${pad(400 + logSeq)}`,
          ...audit
        }));
      }
    }
    bump('qualityparameterdefinitions', defs.length);
    bump('qualitymeasurementlogs', logs.length);

    // ============================================================ B. INCOMING QUALITY
    // Steel coil arriving from the mills, inspected lot by lot.
    // status: Pending | Pass | Fail | Conditional Accept
    const incomingSpec = [
      { n: 1,  ven: 'VND-001', mat: 'MAT-002', qty: 12400, sample: 12, ago: 42, status: 'Pass',
        score: 98, penalty: 2,  note: 'Lot cleared on first sampling. Thickness 1.203mm, MTC matched. Cleared by R. Kumar.' },
      { n: 2,  ven: 'VND-002', mat: 'MAT-001', qty: 8600,  sample: 10, ago: 36, status: 'Pass',
        score: 96, penalty: 4,  note: 'Minor edge burr on outer wrap, within limits. Cleared by S. Menon.' },
      { n: 3,  ven: 'VND-003', mat: 'MAT-004', qty: 15200, sample: 15, ago: 31, status: 'Fail',
        score: 55, penalty: 45, note: 'Whole lot rejected — rust and mill scale through the outer wraps. Debit note raised. Logged by A. Iyer.',
        defects: [['DEF-SURF-02 — Rust and mill scale across outer wraps', 15200, 'Return to Vendor']] },
      { n: 4,  ven: 'VND-004', mat: 'MAT-003', qty: 9800,  sample: 12, ago: 27, status: 'Conditional Accept',
        acc: 9350, rej: 450, score: 82, penalty: 18,
        note: 'Edge wave on two wraps. Accepted on deviation for the Wheels India order, 450 kg segregated. Approved by M. Selvam.',
        defects: [['DEF-EDGE-01 — Edge wave beyond 3mm/m on 2 wraps', 450, 'Accept on Deviation']] },
      { n: 5,  ven: 'VND-005', mat: 'MAT-006', qty: 5400,  sample: 8,  ago: 21, status: 'Pass',
        score: 94, penalty: 6,  note: 'Zinc coating 124 g/m2 against 120±15. Cleared by V. Reddy.' },
      { n: 6,  ven: 'VND-006', mat: 'MAT-007', qty: 2150,  sample: 6,  ago: 16, status: 'Fail',
        score: 40, penalty: 60, note: 'SS 304 supplied in 1/4-hard temper against annealed spec — 214 HV. Full lot rejected. Logged by K. Rajan.',
        defects: [
          ['DEF-HARD-01 — Hardness 214 HV against 180±20 HV', 2150, 'Return to Vendor'],
          ['DEF-DOC-03 — Mill test certificate temper class mismatch', 2150, 'Return to Vendor']
        ] },
      { n: 7,  ven: 'VND-007', mat: 'MAT-009', qty: 850,   sample: 5,  ago: 12, status: 'Pass',
        score: 99, penalty: 1,  note: 'ER70S-6 spool lot, wire dia 1.204mm. Cleared by P. Nair.' },
      // --- open queue: still awaiting inspection ---
      { n: 8,  ven: 'VND-001', mat: 'MAT-002', qty: 11600, sample: 12, ago: 18, status: 'Pending' }, // deliberately stale
      { n: 9,  ven: 'VND-002', mat: 'MAT-005', qty: 18400, sample: 15, ago: 4,  status: 'Pending' },
      { n: 10, ven: 'VND-009', mat: 'MAT-010', qty: 620,   sample: 4,  ago: 2,  status: 'Pending' },
      { n: 11, ven: 'VND-004', mat: 'MAT-008', qty: 1450,  sample: 6,  ago: 1,  status: 'Pending' }
    ];

    let incHeaders = 0, incSamplings = 0, incDefects = 0, incEvals = 0;
    const incIds = {};

    for (const s of incomingSpec) {
      const v = ven(s.ven);
      const m = mat(s.mat);
      if (!v || !m) continue;
      const inspId = `IQC-${YEAR}-${pad(s.n)}`;
      incIds[s.n] = inspId;

      const header = await IncomingInspectionHeader.create({
        Insp_ID: inspId,
        Vendor_ID: v._id,
        Plant_ID: plantId,
        Overall_Status: s.status,
        Inspector_User_ID: inspector(s.n),
        Inspection_Date: daysAgo(s.ago),
        ...audit
      });
      incHeaders += 1;

      const accepted = s.status === 'Pending' ? 0
        : s.status === 'Fail' ? 0
        : s.acc !== undefined ? s.acc : s.qty;
      const rejected = s.status === 'Pending' ? 0
        : s.status === 'Fail' ? s.qty
        : s.rej !== undefined ? s.rej : 0;

      const stdParam = lp(s.mat, 'Thickness') || lp(s.mat, 'Hardness') || lp(s.mat, 'Weight');
      const sampling = await IncomingMaterialSampling.create({
        Insp_ID: header._id,
        Material_ID: m._id,
        Quality_Parameter_ID: stdParam ? stdParam._id : undefined,
        Received_Quantity: s.qty,
        Sample_Size: s.sample,
        Accepted_Quantity: accepted,
        Rejected_Quantity: rejected,
        ...audit
      });
      incSamplings += 1;

      // Lot 1 arrived as a mixed load — two coil grades on the same GRN.
      if (s.n === 1) {
        const m2 = mat('MAT-001');
        if (m2) {
          await IncomingMaterialSampling.create({
            Insp_ID: header._id,
            Material_ID: m2._id,
            Quality_Parameter_ID: (lp('MAT-001', 'Thickness') || {})._id,
            Received_Quantity: 4200,
            Sample_Size: 6,
            Accepted_Quantity: 4200,
            Rejected_Quantity: 0,
            ...audit
          });
          incSamplings += 1;
        }
      }

      for (const [codeDesc, qty, action] of (s.defects || [])) {
        await IncomingDefectLog.create({
          Insp_Detail_ID: sampling._id,
          Defect_Code_ID: codeDesc,
          Affected_Quantity: qty,
          Action_Required: action,
          ...audit
        });
        incDefects += 1;
      }

      if (s.status !== 'Pending') {
        await IncomingVendorEvaluation.create({
          Insp_ID: header._id,
          Vendor_ID: v._id,
          Score_Awarded: s.score,
          Max_Possible_Score: 100,
          Penalty_Points: s.penalty,
          Evaluation_Notes: s.note,
          ...audit
        });
        incEvals += 1;
      }
    }
    bump('incominginspectionheaders', incHeaders);
    bump('incomingmaterialsamplings', incSamplings);
    bump('incomingdefectlogs', incDefects);
    bump('incomingvendorevaluations', incEvals);

    // ============================================================ C. IN-PROCESS QUALITY
    // Patrol checks on the presses. Parameter_Status is derived from the
    // measured value against LSL/USL so the numbers actually agree with the flags.
    const P = (name, std, lsl, usl, actual, paramRef) =>
      ({ name, std, lsl, usl, actual, paramRef });

    const inProcSpec = [
      { n: 1, wo: 'WO-2026-3002', op: 'OP-20 Blanking — 250T press', ago: 38, status: 'Pass', sample: 20,
        obs: 'First-off and 4-hourly patrol on brake pedal bracket blanks. Strip feed steady, no burr build-up. Checked by R. Kumar.',
        params: [
          P('Blank Thickness (mm)', '1.20 +/- 0.04', 1.16, 1.24, 1.192, ['MAT-002', 'Thickness']),
          P('Blank Width (mm)', '148.0 +/- 0.30', 147.70, 148.30, 148.06)
        ] },
      { n: 2, wo: 'WO-2026-3002', op: 'OP-30 Piercing — 160T press', ago: 33, status: 'Pass', sample: 25,
        obs: 'Hole pattern within PCD. Burr height comfortably inside limit. Checked by S. Menon.',
        params: [
          P('Hole Position PCD (mm)', '62.00 +/- 0.15', 61.85, 62.15, 62.02),
          P('Pierced Hole Dia (mm)', '8.50 +0.08/-0.08', 8.42, 8.58, 8.48),
          P('Burr Height (mm)', 'max 0.10', 0, 0.10, 0.06)
        ] },
      { n: 3, wo: 'WO-2026-3002', op: 'OP-40 Forming — 250T press', ago: 29, status: 'Fail', sample: 30,
        obs: 'Bend angle short across the whole shift lot. Die cushion pressure had drifted from 45 bar to 31 bar. 1,850 pcs held at the press. Raised by A. Iyer.',
        params: [
          P('Bend Angle (deg)', '90.0 +/- 0.5', 89.5, 90.5, 88.4),
          P('Flange Height (mm)', '25.0 +/- 0.4', 24.6, 25.4, 24.1),
          P('Thickness at Bend (mm)', '1.20 -0.10/+0.04', 1.10, 1.24, 1.09, ['MAT-002', 'Thickness'])
        ],
        defects: [['DEF-ANG-01 — Bend angle 1.6 deg short of print', 1850, 'Major', 'Send to Rework']],
        capa: { ref: `NCR-${YEAR}-${pad(2)}`, cause: 'Die cushion pressure setting drifted on the 250T press; gauge overdue for calibration.', status: 'In Progress' } },
      { n: 4, wo: 'WO-2026-3002', op: 'OP-40 Forming — 250T press (re-check after rework)', ago: 27, status: 'Pass', sample: 30,
        obs: 'Cushion pressure re-set to 45 bar, first-off re-approved. Reworked lot re-measured. Checked by A. Iyer.',
        params: [
          P('Bend Angle (deg)', '90.0 +/- 0.5', 89.5, 90.5, 89.9),
          P('Flange Height (mm)', '25.0 +/- 0.4', 24.6, 25.4, 25.05)
        ] },
      { n: 5, wo: 'WO-2026-3003', op: 'OP-20 Blanking — CNC laser', ago: 22, status: 'Pass', sample: 15,
        obs: 'Laser profile on cross member blanks, dross free. Checked by V. Reddy.',
        params: [
          P('Profile Length (mm)', '412.0 +/- 0.5', 411.5, 412.5, 412.18),
          P('Cut Edge Squareness (mm)', 'max 0.15', 0, 0.15, 0.09)
        ] },
      { n: 6, wo: 'WO-2026-3003', op: 'OP-50 Deburr & Inspection', ago: 15, status: 'Rework', sample: 40,
        obs: 'Burr height out on second shift. Deburr belt was 12 hours past its 40-hour change interval. 640 pcs pulled for re-deburr. Raised by K. Rajan.',
        params: [
          P('Burr Height (mm)', 'max 0.10', 0, 0.10, 0.18),
          P('Surface Finish Ra (um)', 'max 3.2', 0, 3.2, 2.6)
        ],
        defects: [['DEF-BUR-01 — Burr height 0.18mm against 0.10mm max', 640, 'Minor', 'Send to Rework']],
        capa: { ref: `NCR-${YEAR}-${pad(6)}`, cause: 'Deburr belt run past its 40-hour change interval; second-shift consumable log not maintained.', status: 'Closed' } },
      { n: 7, wo: 'WO-2026-3001', op: 'OP-30 Piercing — 63T press', ago: 9, status: 'Conditional Accept', sample: 25,
        obs: 'Hole position 0.02mm outside print. Deviation note signed off with Brakes India for this lot only. Approved by M. Selvam.',
        params: [
          P('Hole Position PCD (mm)', '62.00 +/- 0.15', 61.85, 62.15, 62.17),
          P('Burr Height (mm)', 'max 0.10', 0, 0.10, 0.07)
        ],
        defects: [['DEF-POS-02 — Hole position 0.02mm beyond print tolerance', 3200, 'Minor', 'Use As Is']] },
      // --- open queue: awaiting the inspector ---
      { n: 8,  wo: 'WO-2026-3001', op: 'OP-20 Blanking — 250T press', ago: 3, status: 'Pending', sample: 20,
        obs: 'First-off submitted, awaiting patrol inspection.' },
      { n: 9,  wo: 'WO-2026-3003', op: 'OP-40 Forming — press brake', ago: 2, status: 'Pending', sample: 25,
        obs: 'Setup approval pending — CMM slot booked for the morning shift.' },
      { n: 10, wo: 'WO-2026-3004', op: 'OP-10 Shearing', ago: 1, status: 'Pending', sample: 10,
        obs: 'Work order still in draft; blanks sheared for trial, awaiting layout check.' }
    ];

    let ipHeaders = 0, ipParams = 0, ipDefects = 0, ipCapa = 0;
    const ipIds = {};

    for (const s of inProcSpec) {
      const inspId = `IPQ-${YEAR}-${pad(s.n)}`;
      ipIds[s.n] = inspId;
      const header = await InProcessInspectionHeader.create({
        Insp_ID: inspId,
        Work_Order_ID: woId(s.wo),
        Operation_ID: s.op,
        Inspector_ID: inspector(s.n + 1),
        Inspection_Date: daysAgo(s.ago),
        Overall_Status: s.status,
        Observations: s.obs,
        Sample_Size_Checked: s.sample,
        Plant_ID: plantId,
        ...audit
      });
      ipHeaders += 1;

      for (const p of (s.params || [])) {
        const ref = p.paramRef ? lp(p.paramRef[0], p.paramRef[1]) : null;
        await InProcessInspectionParameter.create({
          Insp_ID: header._id,
          Parameter_ID: ref ? ref._id : undefined,
          Parameter_Name: p.name,
          Standard_Value: p.std,
          LSL: p.lsl,
          USL: p.usl,
          Actual_Measured_Value: p.actual,
          Parameter_Status: (p.actual >= p.lsl && p.actual <= p.usl) ? 'Pass' : 'Fail',
          ...audit
        });
        ipParams += 1;
      }

      for (const [code, qty, sev, action] of (s.defects || [])) {
        await InProcessDefectLog.create({
          Insp_ID: header._id,
          Defect_Code_ID: code,
          Affected_Quantity: qty,
          Severity: sev,
          Action_Taken: action,
          ...audit
        });
        ipDefects += 1;
      }

      if (s.capa) {
        await InProcessCAPALinkage.create({
          Insp_ID: header._id,
          CAPA_Ref_Number: s.capa.ref,
          Root_Cause_Identified: s.capa.cause,
          Resolution_Status: s.capa.status,
          ...audit
        });
        ipCapa += 1;
      }
    }
    bump('inprocessinspectionheaders', ipHeaders);
    bump('inprocessinspectionparameters', ipParams);
    bump('inprocessdefectlogs', ipDefects);
    bump('inprocesscapalinkages', ipCapa);

    // ============================================================ D. FINAL QUALITY
    // Note: FinalInspectionHeader.Product_ID refs the Material master (that is
    // what /master/material feeds the screen's dropdown), so the coil grade the
    // batch was pressed from goes here and the part identity rides on FG_Batch_Ref.
    const finalSpec = [
      { n: 1, mat: 'MAT-002', batch: 'FG-BRK-PEDAL-BKT-0138', wo: 'WO-2026-3002', ago: 34,
        insp: 'Pass', rel: 'Released', qty: 8500, sample: 80,
        params: [
          ['Overall Length (mm)', '412.0 +/- 0.5', 411.5, 412.5, '412.12 mm', 'Pass', 'CMM report CMM-0138, 8 pcs'],
          ['Hole Position PCD (mm)', '62.00 +/- 0.15', 61.85, 62.15, '62.03 mm', 'Pass', ''],
          ['Salt Spray (hrs)', '96 hrs min', 96, 240, '120 hrs, no red rust', 'Pass', 'Lab report LAB-2211']
        ],
        approval: ['Approve Release', 'Released to TVS Motor against SO. PPAP dimensional attached. Signed by M. Selvam.'] },
      { n: 2, mat: 'MAT-001', batch: 'FG-SIDE-STAND-BKT-0141', wo: 'WO-2026-3002', ago: 26,
        insp: 'Pass', rel: 'Released', qty: 12000, sample: 120,
        params: [
          ['Bend Angle (deg)', '90.0 +/- 0.5', 89.5, 90.5, '90.1 deg', 'Pass', ''],
          ['Burr Height (mm)', 'max 0.10', 0, 0.10, '0.05 mm', 'Pass', 'Visual + comparator']
        ],
        approval: ['Approve Release', 'Batch released for India Yamaha dispatch. Signed by R. Kumar.'] },
      { n: 3, mat: 'MAT-003', batch: 'FG-ENG-MTG-BKT-0144', wo: 'WO-2026-3003', ago: 20,
        insp: 'Fail', rel: 'Rejected', qty: 4200, sample: 60,
        params: [
          ['Hole Position PCD (mm)', '62.00 +/- 0.15', 61.85, 62.15, '62.31 mm', 'Fail', 'Locating pin wear suspected'],
          ['Weld Spatter', 'Nil on mating face', null, null, 'Spatter on 18 of 60 sampled', 'Fail', 'Ashok Leyland mating face'],
          ['Overall Length (mm)', '298.0 +/- 0.5', 297.5, 298.5, '298.08 mm', 'Pass', '']
        ],
        approval: ['Reject Release', 'Batch rejected. Piercing fixture to be re-qualified before re-offer. Signed by A. Iyer.'],
        quarantine: [`NCR-${YEAR}-${pad(4)}`, 'HOLD-BIN-02', 'Rework'] },
      { n: 4, mat: 'MAT-004', batch: 'FG-CROSS-MEMBER-ASSY-0147', wo: 'WO-2026-3003', ago: 14,
        insp: 'Hold', rel: 'Quarantined', qty: 1800, sample: 40,
        params: [
          ['Flatness after Welding (mm)', 'max 1.5', 0, 1.5, '2.4 mm', 'Fail', 'Measured on surface plate'],
          ['Weld Penetration', 'Full, per WPS-04', null, null, 'Full penetration confirmed', 'Pass', 'Macro etch on 2 pcs']
        ],
        approval: ['Request Re-test', 'Held pending sort and press-straightening trial. Signed by K. Rajan.'],
        quarantine: [`NCR-${YEAR}-${pad(5)}`, 'HOLD-BIN-01', 'Quarantine'] },
      { n: 5, mat: 'MAT-006', batch: 'FG-MUDGUARD-STAY-0150', wo: 'WO-2026-3001', ago: 11,
        insp: 'Pass', rel: 'Released', qty: 15400, sample: 150,
        params: [
          ['Zinc Coating (g/m2)', '120 +/- 15', 105, 135, '124 g/m2', 'Pass', ''],
          ['Overall Length (mm)', '186.0 +/- 0.4', 185.6, 186.4, '186.05 mm', 'Pass', '']
        ],
        approval: ['Approve Release', 'Released for Sundram Fasteners schedule. Signed by V. Reddy.'] },
      { n: 6, mat: 'MAT-007', batch: 'FG-EXH-HEAT-SHIELD-0153', wo: 'WO-2026-3001', ago: 7,
        insp: 'Pass', rel: 'Pending Approval', qty: 2600, sample: 50,
        params: [
          ['Hardness (HV)', '180 +/- 20', 160, 200, '183 HV', 'Pass', 'Replacement SS lot from Kalyani'],
          ['Sheet Thickness (mm)', '1.00 +/- 0.03', 0.97, 1.03, '1.008 mm', 'Pass', '']
        ] },
      // --- open queue: inspected quantity booked, results not entered ---
      { n: 7, mat: 'MAT-002', batch: 'FG-FOOTREST-BKT-0156', wo: 'WO-2026-3002', ago: 5,
        insp: 'Pending', rel: 'Pending Approval', qty: 9200, sample: 90 },
      { n: 8, mat: 'MAT-001', batch: 'FG-NUM-PLATE-BKT-0158', wo: 'WO-2026-3003', ago: 2,
        insp: 'Pending', rel: 'Pending Approval', qty: 7400, sample: 75 },
      { n: 9, mat: 'MAT-005', batch: 'FG-BATTERY-TRAY-ASSY-0161', wo: 'WO-2026-3003', ago: 1,
        insp: 'Pending', rel: 'Pending Approval', qty: 1200, sample: 30 }
    ];

    let fqHeaders = 0, fqParams = 0, fqApprovals = 0, fqQuarantine = 0;
    const fqIds = {};

    for (const s of finalSpec) {
      const m = mat(s.mat);
      if (!m) continue;
      const inspId = `FQC-${YEAR}-${pad(s.n)}`;
      fqIds[s.n] = inspId;
      const header = await FinalInspectionHeader.create({
        Insp_ID: inspId,
        FG_Batch_Ref: s.batch,
        Product_ID: m._id,
        Work_Order_ID: woId(s.wo),
        Inspector_ID: inspector(s.n + 2),
        Inspection_Date: daysAgo(s.ago),
        Inspection_Status: s.insp,
        Release_Status: s.rel,
        Batch_Quantity: s.qty,
        Sample_Size_Inspected: s.sample,
        Plant_ID: plantId,
        ...audit
      });
      fqHeaders += 1;

      for (const [name, expected, lsl, usl, actual, status, remarks] of (s.params || [])) {
        await FinalQualityParameter.create({
          Insp_ID: header._id,
          Test_Method: /Salt Spray|Hardness|Weld/.test(name) ? 'Lab Test / Destructive Sample' : 'Visual & Vernier Measurement',
          Expected_Standard: `${name}: ${expected}`,
          LSL: lsl === null ? undefined : lsl,
          USL: usl === null ? undefined : usl,
          Actual_Result: actual,
          Parameter_Status: status,
          Remarks: remarks || undefined,
          ...audit
        });
        fqParams += 1;
      }

      if (s.approval) {
        await ProductReleaseApprovalLog.create({
          Insp_ID: header._id,
          Approver_ID: adminId,
          Action_Taken: s.approval[0],
          Action_Date: daysAgo(Math.max(0, s.ago - 1)),
          Approver_Comments: s.approval[1],
          ...audit
        });
        fqApprovals += 1;
      }

      if (s.quarantine) {
        await FinalNonConformanceQuarantine.create({
          Insp_ID: header._id,
          CAPA_Ref: s.quarantine[0],
          Quarantine_Location_ID: s.quarantine[1],
          Disposition_Decision: s.quarantine[2],
          ...audit
        });
        fqQuarantine += 1;
      }
    }
    bump('finalinspectionheaders', fqHeaders);
    bump('finalqualityparameters', fqParams);
    bump('productreleaseapprovallogs', fqApprovals);
    bump('finalnonconformancequarantines', fqQuarantine);

    // ============================================================ E. NCR / CAPA
    const ncrSpec = [
      { n: 1, src: incIds[3], ago: 31, status: 'Closed', ca: 'Completed', pa: 'Completed',
        desc: 'Rust and mill scale on the full 15.2 T lot of HR Coil 2.0mm from Steel Authority of India — lot rejected at incoming.',
        rca: { method: 'Fishbone', by: 'A. Iyer', ago: 29,
          findings: 'Coil was stored uncovered in the vendor yard through a pre-monsoon spell. VCI wrap and moisture indicator card required by PO clause 7 were not applied, and the GRN checklist had no line to catch it.' },
        cas: [{ d: 'Return the full 15.2 T lot to SAIL against debit note DN-2026-0114 and expedite a replacement lot for the Ashok Leyland cross member schedule.', st: 'Completed', tgt: 24, act: 22, by: 'R. Kumar',
          ver: 'Replacement lot received and cleared on IQC re-inspection. Verified by R. Kumar.' }],
        pas: [{ d: 'Amend the standard PO terms for all HR/CRCA coil: VCI wrap plus moisture indicator card mandatory, and add a matching line to the incoming inspection checklist.', st: 'Completed', tgt: 18, act: 16, by: 'S. Menon',
          ver: 'Revised PO template in use from lot IQC-' + YEAR + '-0008 onwards. Verified by S. Menon.' }] },

      { n: 2, src: ipIds[3], ago: 29, status: 'Under Investigation', ca: 'In Progress', pa: 'Pending',
        desc: 'Bend angle 88.4 deg against 90.0 +/- 0.5 on brake pedal bracket at OP-40 forming — 1,850 pcs affected on the 250T press.',
        rca: { method: '5 Whys', by: 'A. Iyer', ago: 26,
          findings: 'Die cushion pressure drifted from 45 bar to 31 bar during the shift. The press hydraulic gauge was last calibrated 14 months ago against a 12-month interval, so the drift was never visible to the setter.' },
        cas: [
          { d: 'Re-set die cushion pressure to 45 bar, re-approve first-off, and put the 1,850 held pieces through the OP-40 rework loop.', st: 'In Progress', tgt: -3, by: 'M. Selvam',
            ver: 'Rework running; 1,180 of 1,850 pcs re-formed and re-measured so far. Target date already passed.' },
          { d: 'Recalibrate every press hydraulic pressure gauge in the shop against the master gauge and re-sticker.', st: 'Pending', tgt: 9, by: 'D. Prakash' }
        ],
        pas: [{ d: 'Add cushion pressure to the OP-40 setup approval sheet with a first-off sign-off by the shift QA engineer.', st: 'Pending', tgt: 18, by: 'K. Rajan' }] },

      { n: 3, src: incIds[6], ago: 16, status: 'Pending Actions', ca: 'In Progress', pa: 'In Progress',
        desc: 'SS 304 Sheet 1.0mm from Kalyani Steels failed temper check — 214 HV against 180 +/- 20 HV. 2,150 kg rejected, exhaust heat shield build at risk.',
        rca: { method: 'General', by: 'K. Rajan', ago: 14,
          findings: 'Vendor shipped 1/4-hard temper against the annealed temper called on the PO line. The mill test certificate did carry the correct temper class but it was never cross-checked at goods receipt.' },
        cas: [{ d: 'Return 2,150 kg to Kalyani Steels and expedite an annealed replacement lot to protect the TVS Motor heat shield schedule.', st: 'In Progress', tgt: 2, by: 'V. Reddy',
          ver: 'Replacement lot promised; the heat shield batch FG-EXH-HEAT-SHIELD-0153 was built from it and passed.' }],
        pas: [{ d: 'Make mill-test-certificate temper verification a mandatory field on the incoming inspection screen for all stainless grades.', st: 'In Progress', tgt: 12, by: 'P. Nair' }] },

      { n: 4, src: fqIds[3], ago: 20, status: 'Open', ca: 'Pending', pa: 'Pending',
        desc: 'Engine mounting bracket batch FG-ENG-MTG-BKT-0144 rejected at final inspection — hole position 62.31mm and weld spatter on the mating face, 4,200 pcs for Ashok Leyland.',
        rca: { method: 'Fault Tree', by: 'M. Selvam', ago: 17,
          findings: 'The locating pin in the piercing fixture has worn 0.22mm. The fixture was last refurbished in 2024 and there is no wear-check interval defined for it.' },
        cas: [{ d: 'Replace the locating pins and re-qualify the piercing fixture with a 30-piece capability study before the batch is re-offered.', st: 'Pending', tgt: -4, by: 'D. Prakash',
          ver: 'Pin replacement blocked on tool room load. Target date already passed.' }],
        pas: [{ d: 'Define a wear-check interval for all piercing fixtures and add locating pins to the preventive maintenance schedule.', st: 'Pending', tgt: 21, by: 'R. Kumar' }] },

      { n: 5, src: fqIds[4], ago: 14, status: 'Open', ca: 'Pending', pa: 'Pending',
        desc: 'Cross member assembly batch FG-CROSS-MEMBER-ASSY-0147 held — flatness 2.4mm against 1.5mm max after welding. 1,800 pcs quarantined in HOLD-BIN-01.',
        rca: null,
        cas: [{ d: 'Fixture-check and sort all 1,800 pcs; press-straighten anything within 3mm and scrap the rest.', st: 'Pending', tgt: 3, by: 'S. Menon' }],
        pas: [] },

      { n: 6, src: ipIds[6], ago: 15, status: 'Closed', ca: 'Completed', pa: 'Completed',
        desc: 'Burr height 0.18mm against 0.10mm max on side stand bracket at OP-50 deburr — 640 pcs pulled on second shift.',
        rca: { method: '5 Whys', by: 'K. Rajan', ago: 13,
          findings: 'The deburr belt ran 12 hours past its 40-hour change interval. The second-shift consumable log had not been maintained since the shift pattern changed.' },
        cas: [{ d: 'Change the deburr belt and re-deburr the 640 held pieces, then re-inspect burr height on a 40-piece sample.', st: 'Completed', tgt: 10, act: 9, by: 'P. Nair',
          ver: 'All 640 pcs re-deburred; sample measured 0.08mm max. Verified by P. Nair.' }],
        pas: [{ d: 'Add the belt change interval to the OP-50 shift checklist with an hour-meter reading captured at every handover.', st: 'Completed', tgt: 6, act: 5, by: 'M. Selvam',
          ver: 'Checklist revision B in use on both shifts. Verified by M. Selvam.' }] }
    ];

    let ncrHeaders = 0, rcas = 0, cas = 0, pas = 0;
    for (const s of ncrSpec) {
      const header = await NonConformanceHeader.create({
        NCR_ID: `NCR-${YEAR}-${pad(s.n)}`,
        Source_Inspection_Ref: s.src,
        Defect_Description: s.desc,
        Reported_By_ID: inspector(s.n),
        Date_Logged: daysAgo(s.ago),
        Plant_ID: plantId,
        NCR_Status: s.status,
        CA_Overall_Status: s.ca,
        PA_Overall_Status: s.pa,
        ...audit
      });
      ncrHeaders += 1;

      if (s.rca) {
        await RootCauseAnalysis.create({
          NCR_ID: header._id,
          RCA_Findings: `${s.rca.findings} (Investigated by ${s.rca.by}.)`,
          Analysis_Method: s.rca.method,
          Investigator_ID: inspector(s.n + 1),
          Date_Completed: daysAgo(s.rca.ago),
          ...audit
        });
        rcas += 1;
      }

      for (const c of s.cas) {
        await CorrectiveAction.create({
          NCR_ID: header._id,
          Action_Description: `${c.d} (Owner: ${c.by}.)`,
          Assigned_To_ID: inspector(s.n + 2),
          Target_Completion_Date: c.tgt >= 0 ? daysAhead(c.tgt) : daysAgo(-c.tgt),
          Actual_Completion_Date: c.act !== undefined ? daysAgo(c.act) : undefined,
          Task_Status: c.st,
          Verification_Notes: c.ver,
          ...audit
        });
        cas += 1;
      }

      for (const p of s.pas) {
        await PreventiveAction.create({
          NCR_ID: header._id,
          Action_Description: `${p.d} (Owner: ${p.by}.)`,
          Assigned_To_ID: inspector(s.n + 3),
          Target_Completion_Date: p.tgt >= 0 ? daysAhead(p.tgt) : daysAgo(-p.tgt),
          Actual_Completion_Date: p.act !== undefined ? daysAgo(p.act) : undefined,
          Task_Status: p.st,
          Verification_Notes: p.ver,
          ...audit
        });
        pas += 1;
      }
    }
    bump('nonconformanceheaders', ncrHeaders);
    bump('rootcauseanalyses', rcas);
    bump('correctiveactions', cas);
    bump('preventiveactions', pas);

    return counts;
  }
};
