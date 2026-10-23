const { handleError } = require('../utils/errorHandler');
const { editable } = require('../utils/safeBody');
const { internalId } = require('../utils/internalId');
const QualityInspection = require('../models/QualityInspection');
const QualityParameter = require('../models/QualityParameter');
const QualityNonConformance = require('../models/QualityNonConformance');
const { IncomingInspectionHeader, IncomingMaterialSampling, IncomingVendorEvaluation, IncomingDefectLog } = require('../models/IncomingQuality');
const { InProcessInspectionHeader, InProcessInspectionParameter, InProcessDefectLog, InProcessCAPALinkage } = require('../models/InProcessQuality');
const { FinalInspectionHeader, FinalQualityParameter, ProductReleaseApprovalLog, FinalNonConformanceQuarantine } = require('../models/FinalQuality');
const { QualityParameterDefinition, QualityMeasurementLog } = require('../models/QualityParametersManagement');
const { NonConformanceHeader, RootCauseAnalysis, CorrectiveAction, PreventiveAction } = require('../models/CAPAManagement');
const { Material: MasterMaterial } = require('../models/MasterMaterial');
const { WOHeader, WODetail } = require('../models/WorkOrder');

/* The real tolerance for what is being made, or nothing.
 *
 * In-process inspection used to seed its own parameter when none was given —
 * "Critical Dimension (Outer Diameter), 50.00 mm, 49.5 to 50.5" — and then
 * judge the operator's measurement Pass or Fail against those numbers. They
 * were invented. For a press shop working 0.8mm sheet to ±0.03 that is not a
 * harmless default: it passes parts that are out of spec and fails parts that
 * are not, and the Quality Report counts both.
 *
 * Master Data → Quality Parameters holds the real specs per material. This
 * reads them, and returns null when the material has none, so the caller can
 * record the measurement without pretending to have a verdict.
 */
const toleranceFor = async (workOrderId) => {
  if (!workOrderId) return null;
  try {
    const detail = await WODetail.findOne({ WO_ID: workOrderId }).lean();
    const materialId = detail?.Material_ID;
    if (!materialId) return null;
    const spec = await QualityParameter.findOne({ materialId }).lean();
    if (!spec || typeof spec.standardValue !== 'number') return null;
    const minus = Number(spec.toleranceMinus) || 0;
    const plus = Number(spec.tolerancePlus) || 0;
    return {
      Parameter_Name: spec.parameterType || 'Measurement',
      Standard_Value: String(spec.standardValue),
      LSL: spec.standardValue - minus,
      USL: spec.standardValue + plus
    };
  } catch { return null; }
};
const { GoodsReceipt } = require('../models/GoodsReceipt');
const { Vendor: MasterVendor } = require('../models/MasterVendor');
const { AuditLog } = require('../models/Audit');

const logAudit = async (action, entityType, entityId, userId, changes) => {
  try {
    await AuditLog.create({
      action,
      module: entityType,
      recordId: entityId,
      changedBy: userId,
      newValue: changes || null
    });
  } catch (err) { console.error('Audit Log Error:', err); }
};

// ================= Quality Inspection (Incoming, In-Process, Final) =================

exports.getAllInspections = async (req, res) => {
  try {
    const filters = {};
    if (req.query.type) filters.type = req.query.type;

    const inspections = await QualityInspection.find(filters)
      .populate('vendorId', 'vendorName vendorCode')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: inspections });
  } catch (error) { handleError(res, error); }
};

exports.recordInspection = async (req, res) => {
  try {
    req.body.inspectionNumber = internalId('QI');
    req.body.inspectorName = req.body.inspectorName || `${req.user.firstName} ${req.user.lastName}`.trim();

    // Vendor evaluation logic for incoming
    if (req.body.type === 'Incoming' && req.body.status !== 'Pending') {
      req.body.vendorQualityScore = req.body.status === 'Pass' ? 100 : req.body.status === 'Hold' ? 50 : 0;
    }

    const ins = await QualityInspection.create(req.body);
    await logAudit('CREATE', 'QualityInspection', ins._id, req.user._id);
    res.status(201).json({ success: true, data: ins });
  } catch (error) { handleError(res, error); }
};

exports.updateInspection = async (req, res) => {
  try {
    if (req.body.type === 'Incoming' && req.body.status) {
      req.body.vendorQualityScore = req.body.status === 'Pass' ? 100 : req.body.status === 'Hold' ? 50 : 0;
    }

    const ins = await QualityInspection.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!ins) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'QualityInspection', ins._id, req.user._id);
    res.json({ success: true, data: ins });
  } catch (error) { handleError(res, error); }
};

exports.approveProductRelease = async (req, res) => {
  try {
    const ins = await QualityInspection.findOne({ _id: req.params.id, type: 'Final' });
    if (!ins) return res.status(404).json({ success: false, message: 'Final Inspection not found' });
    if (ins.status !== 'Pass') return res.status(400).json({ success: false, message: 'Inspection must be passed to approve release' });

    ins.productReleaseStatus = 'Approved';
    await ins.save();
    res.json({ success: true, data: ins });
  } catch (error) { handleError(res, error); }
};


// ================= Quality Parameters =================

exports.getAllParameters = async (req, res) => {
  try {
    const params = await QualityParameter.find()
      .populate('materialId', 'name code')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: params });
  } catch (error) { handleError(res, error); }
};

exports.createParameter = async (req, res) => {
  try {
    const param = await QualityParameter.create(req.body);
    await logAudit('CREATE', 'QualityParameter', param._id, req.user._id);
    res.status(201).json({ success: true, data: param });
  } catch (error) { handleError(res, error); }
};

exports.recordMeasurement = async (req, res) => {
  try {
    const param = await QualityParameter.findById(req.params.id);
    if (!param) return res.status(404).json({ success: false, message: 'Not found' });

    const { value } = req.body;
    const isPass = value >= (param.standardValue - param.toleranceMinus) && value <= (param.standardValue + param.tolerancePlus);

    param.recordedMeasurements.push({
      value,
      pass: isPass,
      inspector: req.user.name,
      date: new Date()
    });

    await param.save();
    res.json({ success: true, data: param, pass: isPass });
  } catch (error) { handleError(res, error); }
};


// ================= Non-Conformance (CAPA) =================

exports.getAllNCRs = async (req, res) => {
  try {
    const ncrs = await QualityNonConformance.find()
      .populate({ path: 'inspectionId', select: 'inspectionNumber type referenceId' })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: ncrs });
  } catch (error) { handleError(res, error); }
};

exports.recordNCR = async (req, res) => {
  try {
    req.body.ncrNumber = internalId('NCR');
    const ncr = await QualityNonConformance.create(req.body);
    await logAudit('CREATE', 'QualityNonConformance', ncr._id, req.user._id);
    res.status(201).json({ success: true, data: ncr });
  } catch (error) { handleError(res, error); }
};

exports.updateNCR = async (req, res) => {
  try {
    const ncr = await QualityNonConformance.findByIdAndUpdate(req.params.id, editable(req.body), { new: true, runValidators: true });
    if (!ncr) return res.status(404).json({ success: false, message: 'Not found' });
    await logAudit('UPDATE', 'QualityNonConformance', ncr._id, req.user._id);
    res.json({ success: true, data: ncr });
  } catch (error) { handleError(res, error); }
};


// ================= Quality Analytics =================

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Defect Trends (Count of NCRs by Month)
    const ncrs = await QualityNonConformance.find({}, 'dateRecorded');
    
    // 2. Rejection Analysis
    const inspections = await QualityInspection.find({ type: { $in: ['Incoming', 'In-Process', 'Final'] } }, 'type status vendorQualityScore vendorId').populate('vendorId', 'vendorName');
    
    let totalIns = 0;
    let totalRejected = 0;
    let typeRejections = { 'Incoming': 0, 'In-Process': 0, 'Final': 0 };
    
    const vendorScores = {};

    inspections.forEach(ins => {
      totalIns++;
      if (ins.status === 'Fail') {
        totalRejected++;
        typeRejections[ins.type]++;
      }
      if (ins.type === 'Incoming' && ins.vendorId && ins.vendorQualityScore !== undefined) {
        const vName = ins.vendorId.vendorName;
        if (!vendorScores[vName]) vendorScores[vName] = { totalScore: 0, count: 0 };
        vendorScores[vName].totalScore += ins.vendorQualityScore;
        vendorScores[vName].count++;
      }
    });

    const vendorAverages = Object.keys(vendorScores).map(v => ({
      vendorName: v,
      averageScore: Math.round(vendorScores[v].totalScore / vendorScores[v].count)
    }));

    res.json({
      success: true,
      data: {
        totalInspections: totalIns,
        rejectionRate: totalIns > 0 ? Math.round((totalRejected / totalIns) * 100) : 0,
        typeRejections,
        totalDefectsLogged: ncrs.length,
        vendorAverages
      }
    });
  } catch (error) { handleError(res, error); }
};

// ================= Incoming Quality (V2 Architecture) =================

exports.getV2IncomingInspections = async (req, res) => {
  try {
    const headers = await IncomingInspectionHeader.find()
      .populate('GRN_ID', 'grnNumber poNumber')
      .populate('Vendor_ID', 'name code vendorName vendorCode')
      .populate('Inspector_User_ID', 'name username')
      .sort({ createdAt: -1 });

    const fullInspections = await Promise.all(headers.map(async (h) => {
      const samplings = await IncomingMaterialSampling.find({ Insp_ID: h._id }).populate('Material_ID', 'name code');
      const vendorEval = await IncomingVendorEvaluation.findOne({ Insp_ID: h._id });
      
      const samplingsWithDefects = await Promise.all(samplings.map(async (s) => {
        const defects = await IncomingDefectLog.find({ Insp_Detail_ID: s._id });
        return { ...s.toObject(), defects: defects.map(d => d.toObject()) };
      }));

      return {
        ...h.toObject(),
        samplings: samplingsWithDefects,
        vendorEval: vendorEval ? vendorEval.toObject() : null
      };
    }));

    res.json({ success: true, data: fullInspections });
  } catch (error) { handleError(res, error); }
};

exports.createV2IncomingInspection = async (req, res) => {
  try {
    const { GRN_ID, Vendor_ID, Material_ID, Received_Quantity, Sample_Size } = req.body;

    const count = await IncomingInspectionHeader.countDocuments();
    const inspId = internalId('QI');

    const header = await IncomingInspectionHeader.create({
      Insp_ID: inspId,
      GRN_ID: GRN_ID || null,
      Vendor_ID,
      Overall_Status: 'Pending',
      Inspector_User_ID: req.user?._id,
      Inspection_Date: new Date()
    });

    if (Material_ID) {
      await IncomingMaterialSampling.create({
        Insp_ID: header._id,
        Material_ID,
        Received_Quantity: Number(Received_Quantity) || 100,
        Sample_Size: Number(Sample_Size) || 10,
        Accepted_Quantity: 0,
        Rejected_Quantity: 0
      });
    }

    await logAudit('CREATE', 'IncomingInspectionHeader', header._id, req.user?._id, `Created Incoming Inspection ${inspId}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.updateV2IncomingResults = async (req, res) => {
  try {
    const { id } = req.params; // Insp_ID
    const { Accepted_Quantity, Rejected_Quantity, Overall_Status, Defect_Code_ID, Action_Required, Evaluation_Notes } = req.body;

    const header = await IncomingInspectionHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Inspection record not found' });

    // Rule 5: Result Immutability
    if (header.Overall_Status === 'Pass' || header.Overall_Status === 'Fail') {
      return res.status(400).json({ success: false, message: 'Finalized Quality Inspection records are immutable and cannot be modified.' });
    }

    const sampling = await IncomingMaterialSampling.findOne({ Insp_ID: header._id });
    if (!sampling) return res.status(400).json({ success: false, message: 'Material sampling details not found for this inspection.' });

    const accQty = Number(Accepted_Quantity) || 0;
    const rejQty = Number(Rejected_Quantity) || 0;
    const recQty = sampling.Received_Quantity;

    // Rule 3: Quantity Conservation
    if (accQty + rejQty !== recQty) {
      return res.status(400).json({
        success: false,
        message: `Quantity conservation violation: Accepted Qty (${accQty}) + Rejected Qty (${rejQty}) must strictly equal Received Qty (${recQty}).`
      });
    }

    sampling.Accepted_Quantity = accQty;
    sampling.Rejected_Quantity = rejQty;
    await sampling.save();

    // Log defect if rejected quantity > 0
    if (rejQty > 0) {
      await IncomingDefectLog.create({
        Insp_Detail_ID: sampling._id,
        Defect_Code_ID: Defect_Code_ID || 'Material Non-Conformance',
        Affected_Quantity: rejQty,
        Action_Required: Action_Required || 'Return to Vendor'
      });
    }

    // Rule 2: Dynamic Vendor Scoring Math
    const penaltyPoints = rejQty > 0 ? Math.min(50, Math.round((rejQty / recQty) * 100)) : 0;
    const score = Math.max(0, Math.round(((accQty / recQty) * 100) - penaltyPoints));

    await IncomingVendorEvaluation.findOneAndUpdate(
      { Insp_ID: header._id },
      {
        Vendor_ID: header.Vendor_ID,
        Score_Awarded: score,
        Max_Possible_Score: 100,
        Penalty_Points: penaltyPoints,
        Evaluation_Notes: Evaluation_Notes || (rejQty > 0 ? `Penalty applied: -${penaltyPoints} pts for ${rejQty} rejected items` : '100% Quality Acceptance')
      },
      { upsert: true, new: true }
    );

    const finalStatus = Overall_Status || (rejQty > 0 ? 'Fail' : 'Pass');

    // Rule 4: Failure Routing (CAPA Integration)
    // Routed into NonConformanceHeader - the collection the CAPA screen reads via GET /quality/v2/capa.
    // Written BEFORE the header is finalized: Rule 5 immutability below would otherwise strand the
    // inspection with no retry path if this write failed after the 'Fail' status was already committed.
    if (finalStatus === 'Fail') {
      await NonConformanceHeader.create({
        NCR_ID: internalId('NCR'),
        Source_Inspection_Ref: header.Insp_ID,
        Defect_Description: `Incoming inspection ${header.Insp_ID} failed with ${rejQty} rejected units out of ${recQty}. Defect: ${Defect_Code_ID || 'Material Non-Conformance'}. Action: ${Action_Required || 'Return to Vendor'}`,
        Reported_By_ID: req.user?._id,
        Date_Logged: new Date(),
        NCR_Status: 'Open',
        CA_Overall_Status: 'Pending',
        PA_Overall_Status: 'Pending'
      });
    }

    header.Overall_Status = finalStatus;
    await header.save();

    await logAudit('UPDATE', 'IncomingInspectionHeader', header._id, req.user?._id, `Updated results: Status = ${header.Overall_Status}, Vendor Score = ${score}`);
    res.json({ success: true, data: header, vendorScore: score });
  } catch (error) { handleError(res, error); }
};

exports.releaseV2IncomingQuarantine = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await IncomingInspectionHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Inspection record not found' });

    if (header.Overall_Status === 'Fail') {
      return res.status(400).json({
        success: false,
        message: 'Failed inspections cannot be released to available stock. CAPA Return to Vendor flow initiated.'
      });
    }

    header.Overall_Status = 'Pass';
    await header.save();

    await logAudit('UPDATE', 'IncomingInspectionHeader', header._id, req.user?._id, 'Released inventory from Quarantine to Available Stock');
    res.json({ success: true, message: 'Inventory released from Quarantine to Available Stock successfully.' });
  } catch (error) { handleError(res, error); }
};

// ================= In-Process Quality (V2 Architecture) =================

exports.getV2InProcessInspections = async (req, res) => {
  try {
    const headers = await InProcessInspectionHeader.find()
      .populate('Work_Order_ID', 'WO_Number Status workOrderNumber status productCode')
      .populate('Inspector_ID', 'name username')
      .sort({ createdAt: -1 });

    const fullInspections = await Promise.all(headers.map(async (h) => {
      const parameters = await InProcessInspectionParameter.find({ Insp_ID: h._id });
      const defects = await InProcessDefectLog.find({ Insp_ID: h._id });
      const capa = await InProcessCAPALinkage.findOne({ Insp_ID: h._id });

      return {
        ...h.toObject(),
        parameters: parameters.map(p => p.toObject()),
        defects: defects.map(d => d.toObject()),
        capa: capa ? capa.toObject() : null
      };
    }));

    res.json({ success: true, data: fullInspections });
  } catch (error) { handleError(res, error); }
};

exports.createV2InProcessInspection = async (req, res) => {
  try {
    const { Work_Order_ID, Operation_ID, Sample_Size_Checked, Observations, Parameters } = req.body;

    // Rule 1: Work Order Status Check
    const wo = await WOHeader.findById(Work_Order_ID);
    if (wo) {
      const woStatus = wo.Status || wo.status;
      if (['Closed', 'Cancelled', 'Not Started', 'Created'].includes(woStatus)) {
        return res.status(400).json({
          success: false,
          message: `Work Order Status Check Failure: Cannot log In-Process inspection against Work Order in '${woStatus}' status. Must be 'In Progress' or 'Released'.`
        });
      }
    }

    const count = await InProcessInspectionHeader.countDocuments();
    const inspId = internalId('QI');

    const header = await InProcessInspectionHeader.create({
      Insp_ID: inspId,
      Work_Order_ID,
      Operation_ID: Operation_ID || 'OP-010 Turning',
      Inspector_ID: req.user?._id,
      Inspection_Date: new Date(),
      Overall_Status: 'Pending',
      Observations: Observations || '',
      Sample_Size_Checked: Number(Sample_Size_Checked) || 5
    });

    /* What is being checked, and against what. Anything the caller supplies
       wins; otherwise the material's own spec from Quality Parameters. A
       parameter with no limits is still worth creating — the inspector can
       record what they measured — but it is marked Pending, not Pass, because
       nothing here knows whether that measurement is good. */
    const spec = await toleranceFor(Work_Order_ID);
    if (Array.isArray(Parameters) && Parameters.length > 0) {
      for (const p of Parameters) {
        const lsl = p.LSL !== undefined && p.LSL !== '' ? Number(p.LSL) : spec?.LSL;
        const usl = p.USL !== undefined && p.USL !== '' ? Number(p.USL) : spec?.USL;
        const measured = p.Actual_Measured_Value !== undefined && p.Actual_Measured_Value !== ''
          ? Number(p.Actual_Measured_Value) : undefined;
        const judged = (measured !== undefined && Number.isFinite(lsl) && Number.isFinite(usl))
          ? (measured < lsl || measured > usl ? 'Fail' : 'Pass')
          : 'Pending';
        await InProcessInspectionParameter.create({
          Insp_ID: header._id,
          Parameter_Name: p.Parameter_Name || spec?.Parameter_Name || 'Measurement',
          Standard_Value: p.Standard_Value || spec?.Standard_Value,
          LSL: Number.isFinite(lsl) ? lsl : undefined,
          USL: Number.isFinite(usl) ? usl : undefined,
          Actual_Measured_Value: measured,
          Parameter_Status: judged
        });
      }
    } else if (spec) {
      await InProcessInspectionParameter.create({
        Insp_ID: header._id,
        Parameter_Name: spec.Parameter_Name,
        Standard_Value: spec.Standard_Value,
        LSL: spec.LSL,
        USL: spec.USL,
        Parameter_Status: 'Pending'
      });
    }

    await logAudit('CREATE', 'InProcessInspectionHeader', header._id, req.user?._id, `Recorded In-Process Inspection ${inspId}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.updateV2InProcessResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { Actual_Measured_Value, Overall_Status, Defect_Code_ID, Affected_Quantity, Severity, Action_Taken } = req.body;

    const header = await InProcessInspectionHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'In-Process inspection record not found' });

    let param = await InProcessInspectionParameter.findOne({ Insp_ID: header._id });
    if (!param) {
      // The material's own spec, or a bare parameter with no limits — never
      // limits this controller made up.
      const spec = await toleranceFor(header.Work_Order_ID);
      param = await InProcessInspectionParameter.create({
        Insp_ID: header._id,
        Parameter_Name: spec?.Parameter_Name || 'Measurement',
        Standard_Value: spec?.Standard_Value,
        LSL: spec?.LSL,
        USL: spec?.USL
      });
    }

    // Rule 3: Auto-Status Calculation via LSL / USL
    const actualVal = Number(Actual_Measured_Value);
    const hasLimits = Number.isFinite(param.LSL) && Number.isFinite(param.USL);
    let computedOverallStatus = Overall_Status || 'Pass';
    // Said back to the inspector when nothing could be judged for them.
    let toleranceNote = null;

    if (!isNaN(actualVal)) {
      param.Actual_Measured_Value = actualVal;
      if (hasLimits) {
        const fails = actualVal < param.LSL || actualVal > param.USL;
        param.Parameter_Status = fails ? 'Fail' : 'Pass';
        if (fails) computedOverallStatus = 'Fail';
      } else {
        /* No spec for this material, so the measurement is recorded and the
           inspector's own verdict stands. Judging it against a made-up
           tolerance is how good parts get scrapped. */
        param.Parameter_Status = 'Pending';
        toleranceNote = `Measurement recorded, but no tolerance is set for this part, so the system could not judge it. Set one under Quality → Inspection Parameters and this check becomes automatic.`;
      }
      await param.save();
    }

    header.Overall_Status = computedOverallStatus;

    // Rule 2: Mandatory Defect Logging on Fail or Rework
    if (computedOverallStatus === 'Fail' || computedOverallStatus === 'Rework') {
      if (!Defect_Code_ID) {
        return res.status(400).json({
          success: false,
          message: `Mandatory Defect Logging Required: Overall inspection status is '${computedOverallStatus}'. You must provide a valid Defect Code and Affected Quantity.`
        });
      }

      await InProcessDefectLog.create({
        Insp_ID: header._id,
        Defect_Code_ID: Defect_Code_ID || 'Dimensional Tolerance Error',
        Affected_Quantity: Number(Affected_Quantity) || 1,
        Severity: Severity || 'Major',
        Action_Taken: Action_Taken || 'Send to Rework'
      });

      // Rule 4: CAPA Linkage Trigger
      const capaCount = await InProcessCAPALinkage.countDocuments();
      await InProcessCAPALinkage.create({
        Insp_ID: header._id,
        CAPA_Ref_Number: internalId('CAPA'),
        // Only cite limits when there are limits; a root cause reading
        // "outside [undefined - undefined]" helps nobody investigate.
        Root_Cause_Identified: hasLimits
          ? `In-Process check failed: measured ${actualVal} against ${param.Parameter_Name} limits ${param.LSL} to ${param.USL}.`
          : `In-Process check marked ${computedOverallStatus} by the inspector${isNaN(actualVal) ? '' : ` (measured ${actualVal})`}; no tolerance is set for this part.`,
        Resolution_Status: 'Open'
      });
    }

    await header.save();

    await logAudit('UPDATE', 'InProcessInspectionHeader', header._id, req.user?._id, `Updated In-Process Quality check: ${header.Overall_Status}`);
    res.json({ success: true, data: header, ...(toleranceNote ? { warning: toleranceNote } : {}) });
  } catch (error) { handleError(res, error); }
};

// ================= Final Quality Inspection (V2 Architecture) =================

exports.getV2FinalInspections = async (req, res) => {
  try {
    const headers = await FinalInspectionHeader.find()
      .populate('Product_ID', 'name code standardCost')
      .populate('Work_Order_ID', 'WO_Number workOrderNumber')
      .populate('Inspector_ID', 'name username')
      .sort({ createdAt: -1 });

    const fullInspections = await Promise.all(headers.map(async (h) => {
      const parameters = await FinalQualityParameter.find({ Insp_ID: h._id });
      const approvalLogs = await ProductReleaseApprovalLog.find({ Insp_ID: h._id }).populate('Approver_ID', 'name username');
      const quarantine = await FinalNonConformanceQuarantine.findOne({ Insp_ID: h._id });

      return {
        ...h.toObject(),
        parameters: parameters.map(p => p.toObject()),
        approvalLogs: approvalLogs.map(a => a.toObject()),
        quarantine: quarantine ? quarantine.toObject() : null
      };
    }));

    res.json({ success: true, data: fullInspections });
  } catch (error) { handleError(res, error); }
};

exports.createV2FinalInspection = async (req, res) => {
  try {
    const { FG_Batch_Ref, Product_ID, Work_Order_ID, Batch_Quantity, Sample_Size_Inspected } = req.body;

    // Rule 4: Batch Reference Validation
    if (!FG_Batch_Ref || !FG_Batch_Ref.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Batch Reference Validation Failure: A valid FG Batch Reference (or GRN/Batch Tag) is strictly required to initiate final inspection.'
      });
    }

    const count = await FinalInspectionHeader.countDocuments();
    const inspId = internalId('QI');

    const header = await FinalInspectionHeader.create({
      Insp_ID: inspId,
      FG_Batch_Ref,
      Product_ID,
      Work_Order_ID: Work_Order_ID || null,
      Inspector_ID: req.user?._id,
      Inspection_Date: new Date(),
      Inspection_Status: 'Pending',
      Release_Status: 'Pending Approval',
      Batch_Quantity: Number(Batch_Quantity) || 100,
      Sample_Size_Inspected: Number(Sample_Size_Inspected) || 10
    });

    // Seed default final quality testing parameter
    await FinalQualityParameter.create({
      Insp_ID: header._id,
      Test_Method: 'Visual Inspection & Dimensional Gauging',
      Expected_Standard: 'Zero Surface Blemishes, Specs within Tolerance',
      Actual_Result: 'Testing Pending',
      Parameter_Status: 'Pass'
    });

    await logAudit('CREATE', 'FinalInspectionHeader', header._id, req.user?._id, `Recorded Final Inspection ${inspId} for Batch ${FG_Batch_Ref}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.updateV2FinalResults = async (req, res) => {
  try {
    const { id } = req.params;
    const { Actual_Result, Inspection_Status, Remarks } = req.body;

    const header = await FinalInspectionHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Final inspection record not found' });

    header.Inspection_Status = Inspection_Status || 'Pass';
    await header.save();

    let param = await FinalQualityParameter.findOne({ Insp_ID: header._id });
    if (param) {
      param.Actual_Result = Actual_Result || 'Meets All Engineering Specs';
      param.Parameter_Status = header.Inspection_Status === 'Pass' ? 'Pass' : 'Fail';
      param.Remarks = Remarks || '';
      await param.save();
    }

    await logAudit('UPDATE', 'FinalInspectionHeader', header._id, req.user?._id, `Updated physical inspection result: ${header.Inspection_Status}`);
    res.json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.approveV2ProductRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { Action_Taken, Approver_Comments } = req.body;

    const header = await FinalInspectionHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'Final inspection record not found' });

    const action = Action_Taken || 'Approve Release';

    // Rule 2: Release Dependency Check
    if (action === 'Approve Release' && header.Inspection_Status !== 'Pass') {
      return res.status(400).json({
        success: false,
        message: `Product Release Dependency Failure: Cannot release batch with Inspection Status '${header.Inspection_Status}'. The batch must pass physical inspection first.`
      });
    }

    if (action === 'Approve Release') {
      header.Release_Status = 'Released';
    } else if (action === 'Reject Release') {
      // Rule 5: Quarantine Enforcement
      header.Release_Status = 'Quarantined';
      await FinalNonConformanceQuarantine.create({
        Insp_ID: header._id,
        CAPA_Ref: internalId('CAPA-FG'),
        Quarantine_Location_ID: 'HOLD-BIN-FG-01',
        Disposition_Decision: 'Quarantine'
      });
    }

    await header.save();

    // Rule 3: Product Release Approval Workflow Log
    await ProductReleaseApprovalLog.create({
      Insp_ID: header._id,
      Approver_ID: req.user?._id,
      Action_Taken: action,
      Action_Date: new Date(),
      Approver_Comments: Approver_Comments || `Workflow Action: ${action}`
    });

    await logAudit('UPDATE', 'FinalInspectionHeader', header._id, req.user?._id, `Product Release Action: ${action}, New Release Status: ${header.Release_Status}`);
    res.json({ success: true, message: `Product release decision '${action}' recorded. Status: ${header.Release_Status}`, data: header });
  } catch (error) { handleError(res, error); }
};

// ================= Quality Parameters (V2 Architecture) =================

exports.getV2QualityParameters = async (req, res) => {
  try {
    const definitions = await QualityParameterDefinition.find({ Is_Active: true })
      .populate('Material_ID', 'name code standardCost')
      .sort({ createdAt: -1 });

    const fullParams = await Promise.all(definitions.map(async (d) => {
      const latestLog = await QualityMeasurementLog.findOne({ Param_Standard_ID: d._id })
        .populate('Inspector_ID', 'name username')
        .sort({ Measurement_Date: -1, createdAt: -1 });

      const logsCount = await QualityMeasurementLog.countDocuments({ Param_Standard_ID: d._id });

      return {
        ...d.toObject(),
        Total_Readings_Count: logsCount,
        latestLog: latestLog ? latestLog.toObject() : null
      };
    }));

    res.json({ success: true, data: fullParams });
  } catch (error) { handleError(res, error); }
};

exports.createV2QualityParameter = async (req, res) => {
  try {
    const { Material_ID, Parameter_Name, Standard_Target, Tolerance_Upper, Tolerance_Lower } = req.body;

    // Rule 2: Uniqueness Constraint (Material_ID + Parameter_Name)
    const existing = await QualityParameterDefinition.findOne({ Material_ID, Parameter_Name, Is_Active: true });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Uniqueness Constraint Error: A quality parameter named '${Parameter_Name}' is already registered for this material.`
      });
    }

    const count = await QualityParameterDefinition.countDocuments();
    const paramStdId = internalId('QPS');

    const definition = await QualityParameterDefinition.create({
      Param_Standard_ID: paramStdId,
      Material_ID,
      Parameter_Name,
      Standard_Target: Number(Standard_Target),
      Tolerance_Upper: Number(Tolerance_Upper),
      Tolerance_Lower: Number(Tolerance_Lower),
      Total_Readings_Count: 0,
      Is_Active: true
    });

    await logAudit('CREATE', 'QualityParameterDefinition', definition._id, req.user?._id, `Defined Quality Parameter ${Parameter_Name} for Material ${Material_ID}`);
    res.status(201).json({ success: true, data: definition });
  } catch (error) { handleError(res, error); }
};

exports.logV2Measurement = async (req, res) => {
  try {
    const { id } = req.params; // Param_Standard_ID
    const { Measured_Value, Source_Context, Source_Ref_ID } = req.body;

    const definition = await QualityParameterDefinition.findById(id);
    if (!definition) return res.status(404).json({ success: false, message: 'Quality Parameter Definition not found' });

    const val = Number(Measured_Value);
    if (isNaN(val)) return res.status(400).json({ success: false, message: 'Measured Value must be a valid number' });

    // Rule 1: Dynamic Status Calculation (Target - Lower <= Value <= Target + Upper)
    const minBound = definition.Standard_Target - definition.Tolerance_Lower;
    const maxBound = definition.Standard_Target + definition.Tolerance_Upper;
    const calculatedStatus = (val >= minBound && val <= maxBound) ? 'Pass' : 'Fail';

    const count = await QualityMeasurementLog.countDocuments();
    const measLogId = internalId('QML');

    const log = await QualityMeasurementLog.create({
      Measurement_Log_ID: measLogId,
      Param_Standard_ID: definition._id,
      Measured_Value: val,
      Calculated_Status: calculatedStatus,
      Inspector_ID: req.user?._id,
      Measurement_Date: new Date(),
      Source_Context: Source_Context || 'Standalone',
      Source_Ref_ID: Source_Ref_ID || ''
    });

    definition.Total_Readings_Count = (definition.Total_Readings_Count || 0) + 1;
    await definition.save();

    await logAudit('CREATE', 'QualityMeasurementLog', log._id, req.user?._id, `Recorded reading ${val}: ${calculatedStatus}`);
    res.status(201).json({ success: true, pass: calculatedStatus === 'Pass', data: log });
  } catch (error) { handleError(res, error); }
};

// ================= Non-Conformance Management (CAPA V2 Architecture) =================

exports.getV2NCRs = async (req, res) => {
  try {
    const headers = await NonConformanceHeader.find()
      .populate('Reported_By_ID', 'name username')
      .sort({ createdAt: -1 });

    const fullNCRs = await Promise.all(headers.map(async (h) => {
      const rca = await RootCauseAnalysis.findOne({ NCR_ID: h._id }).populate('Investigator_ID', 'name username');
      const caTasks = await CorrectiveAction.find({ NCR_ID: h._id }).populate('Assigned_To_ID', 'name username');
      const paTasks = await PreventiveAction.find({ NCR_ID: h._id }).populate('Assigned_To_ID', 'name username');

      return {
        ...h.toObject(),
        rca: rca ? rca.toObject() : null,
        caTasks: caTasks.map(c => c.toObject()),
        paTasks: paTasks.map(p => p.toObject())
      };
    }));

    res.json({ success: true, data: fullNCRs });
  } catch (error) { handleError(res, error); }
};

exports.createV2NCR = async (req, res) => {
  try {
    const { Source_Inspection_Ref, Defect_Description } = req.body;

    if (!Defect_Description || !Defect_Description.trim()) {
      return res.status(400).json({ success: false, message: 'Defect Description is strictly required to log an NCR.' });
    }

    const count = await NonConformanceHeader.countDocuments();
    const ncrId = internalId('NCR');

    const header = await NonConformanceHeader.create({
      NCR_ID: ncrId,
      Source_Inspection_Ref: Source_Inspection_Ref || null,
      Defect_Description,
      Reported_By_ID: req.user?._id,
      Date_Logged: new Date(),
      NCR_Status: 'Open',
      CA_Overall_Status: 'Pending',
      PA_Overall_Status: 'Pending'
    });

    await logAudit('CREATE', 'NonConformanceHeader', header._id, req.user?._id, `Created NCR ${ncrId}`);
    res.status(201).json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.updateV2RCA = async (req, res) => {
  try {
    const { id } = req.params;
    const { RCA_Findings, Analysis_Method } = req.body;

    const header = await NonConformanceHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'NCR record not found' });

    if (!RCA_Findings || !RCA_Findings.trim()) {
      return res.status(400).json({ success: false, message: 'Root Cause Analysis findings cannot be blank.' });
    }

    const rca = await RootCauseAnalysis.findOneAndUpdate(
      { NCR_ID: header._id },
      {
        NCR_ID: header._id,
        RCA_Findings,
        Analysis_Method: Analysis_Method || '5 Whys',
        Investigator_ID: req.user?._id,
        Date_Completed: new Date()
      },
      { upsert: true, new: true }
    );

    header.NCR_Status = 'Under Investigation';
    await header.save();

    await logAudit('UPDATE', 'RootCauseAnalysis', rca._id, req.user?._id, `Recorded RCA for NCR ${header.NCR_ID}`);
    res.json({ success: true, data: rca, ncr: header });
  } catch (error) { handleError(res, error); }
};

exports.addV2CAPATask = async (req, res) => {
  try {
    const { id } = req.params;
    const { Task_Type, Action_Description, Assigned_To_ID, Target_Completion_Date, Task_Status } = req.body;

    const header = await NonConformanceHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'NCR record not found' });

    // Rule 2: Sequential Enforcement (RCA must exist)
    const rca = await RootCauseAnalysis.findOne({ NCR_ID: header._id });
    if (!rca || !rca.RCA_Findings) {
      return res.status(400).json({
        success: false,
        message: 'Sequential Enforcement Error: Root Cause Analysis (RCA) findings must be recorded before adding Corrective or Preventive Action tasks.'
      });
    }

    if (Task_Type === 'CA') {
      await CorrectiveAction.create({
        NCR_ID: header._id,
        Action_Description,
        Assigned_To_ID: Assigned_To_ID || req.user?._id,
        Target_Completion_Date: Target_Completion_Date || new Date(Date.now() + 7 * 86400000),
        Task_Status: Task_Status || 'Completed'
      });
    } else {
      await PreventiveAction.create({
        NCR_ID: header._id,
        Action_Description,
        Assigned_To_ID: Assigned_To_ID || req.user?._id,
        Target_Completion_Date: Target_Completion_Date || new Date(Date.now() + 14 * 86400000),
        Task_Status: Task_Status || 'Completed'
      });
    }

    // Rule 4: UI Aggregation Logic for CA/PA overall status
    const caTasks = await CorrectiveAction.find({ NCR_ID: header._id });
    const paTasks = await PreventiveAction.find({ NCR_ID: header._id });

    const allCaDone = caTasks.length > 0 && caTasks.every(t => t.Task_Status === 'Completed');
    const allPaDone = paTasks.length > 0 && paTasks.every(t => t.Task_Status === 'Completed');

    header.CA_Overall_Status = allCaDone ? 'Completed' : caTasks.length > 0 ? 'In Progress' : 'Pending';
    header.PA_Overall_Status = allPaDone ? 'Completed' : paTasks.length > 0 ? 'In Progress' : 'Pending';
    header.NCR_Status = 'Pending Actions';
    await header.save();

    await logAudit('CREATE', 'CAPATask', header._id, req.user?._id, `Added ${Task_Type} task to NCR ${header.NCR_ID}`);
    res.json({ success: true, data: header });
  } catch (error) { handleError(res, error); }
};

exports.closeV2NCR = async (req, res) => {
  try {
    const { id } = req.params;
    const header = await NonConformanceHeader.findById(id);
    if (!header) return res.status(404).json({ success: false, message: 'NCR record not found' });

    // Rule 1: CAPA Closure Dependency
    if (header.CA_Overall_Status !== 'Completed' || header.PA_Overall_Status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'CAPA Closure Dependency Failure: Cannot close NCR until all Corrective Actions (CA) and Preventive Actions (PA) evaluate to 100% Completed.'
      });
    }

    header.NCR_Status = 'Closed';
    await header.save();

    await logAudit('UPDATE', 'NonConformanceHeader', header._id, req.user?._id, `Closed NCR ${header.NCR_ID}`);
    res.json({ success: true, message: `NCR ${header.NCR_ID} successfully closed and locked.`, data: header });
  } catch (error) { handleError(res, error); }
};

// ================= Quality Analytics Dashboard (V2 Architecture) =================

exports.getV2Analytics = async (req, res) => {
  try {
    // 1. KPI Summary Aggregation
    const incomingAll = await IncomingInspectionHeader.find();
    const inprocessAll = await InProcessInspectionHeader.find();
    const finalAll = await FinalInspectionHeader.find();

    const incomingCount = incomingAll.length;
    const inprocessCount = inprocessAll.length;
    const finalCount = finalAll.length;

    const totalInspections = incomingCount + inprocessCount + finalCount;

    const incomingFailed = incomingAll.filter(i => ['Fail', 'Quarantined'].includes(i.Overall_Status)).length;
    const inprocessFailed = inprocessAll.filter(i => i.Overall_Status === 'Fail').length;
    const finalFailed = finalAll.filter(i => ['Fail', 'Hold'].includes(i.Inspection_Status) || ['Rejected', 'Quarantined'].includes(i.Release_Status)).length;

    const totalFailedInspections = incomingFailed + inprocessFailed + finalFailed;

    // Rule 1: Rejection Rate Formula
    const rejectionRate = totalInspections > 0
      ? Number(((totalFailedInspections / totalInspections) * 100).toFixed(2))
      : 0;

    // Rule 2: Active NCR Definition (Status != 'Closed')
    const activeNCRCount = await NonConformanceHeader.countDocuments({ NCR_Status: { $ne: 'Closed' } });

    // 2. Rule 5: Cross-Module Stage Mapping
    const incomingRejectionRate = incomingCount > 0 ? Number(((incomingFailed / incomingCount) * 100).toFixed(1)) : 0;
    const inprocessRejectionRate = inprocessCount > 0 ? Number(((inprocessFailed / inprocessCount) * 100).toFixed(1)) : 0;
    const finalRejectionRate = finalCount > 0 ? Number(((finalFailed / finalCount) * 100).toFixed(1)) : 0;

    const stageBreakdown = [
      { stage: 'Incoming Raw Materials', count: incomingCount, failed: incomingFailed, rate: incomingRejectionRate },
      { stage: 'In-Process Operations', count: inprocessCount, failed: inprocessFailed, rate: inprocessRejectionRate },
      { stage: 'Final Finished Goods', count: finalCount, failed: finalFailed, rate: finalRejectionRate }
    ];

    // 3. Rule 3: Vendor Quality Analysis & Scorecards
    const vendors = await MasterVendor.find().limit(10);
    const vendorScorecards = await Promise.all(vendors.map(async (v) => {
      const vendorLots = await IncomingInspectionHeader.find({ Vendor_ID: v._id });
      const lotsReceived = vendorLots.length;
      const lotsRejected = vendorLots.filter(l => ['Fail', 'Quarantined'].includes(l.Overall_Status)).length;

      // Rule 3: Safe N/A returning for zero deliveries
      let qualityScore = 'N/A';
      let ppmRate = 0;

      if (lotsReceived > 0) {
        const passedLots = lotsReceived - lotsRejected;
        qualityScore = Math.round((passedLots / lotsReceived) * 100);
        ppmRate = Math.round((lotsRejected / lotsReceived) * 1000000);
      }

      return {
        vendorId: v._id,
        vendorName: v.name,
        totalLotsReceived: lotsReceived,
        lotsRejected,
        ppmDefectRate: ppmRate,
        qualityScore
      };
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          totalInspections,
          totalFailedInspections,
          rejectionRate,
          activeNCRCount
        },
        stageBreakdown,
        vendorScorecards
      }
    });
  } catch (error) { handleError(res, error); }
};
