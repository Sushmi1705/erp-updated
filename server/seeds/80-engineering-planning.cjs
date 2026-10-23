/* LBAP demo data — Engineering, Dispatch, Demand/MRP, Capacity, Maintenance, Approvals.
 *
 * The story this seeds:
 *   Laxmi Balaji presses brackets from steel coil. Each bracket has a parts list
 *   (which coil, how much per piece, how much falls out as blanking skeleton) and
 *   a routing across the press / weld / QC work centres. Customer forecasts feed
 *   a demand consolidation, which feeds an MRP run, which spits out purchase and
 *   production suggestions plus a handful of shortages that are genuinely open.
 *   Finished brackets go out on delivery plans -> executions -> trucks -> tracking.
 *   The presses are on a PM calendar and one of them is down waiting on spares.
 *
 * Deliberately not all green: an overdue PM, a line-down ECR, a bottlenecked press
 * shop, an understaffed night shift, a cancelled dispatch, a partially delivered
 * consignment, a delayed truck and six open material shortages.
 */

module.exports = {
  name: 'Engineering / Dispatch / MRP / Capacity / Maintenance',

  run: async (ctx) => {
    const {
      col, M, rnd, randInt, daysAgo, daysAhead, plant, company, admin,
      products, materials, machines, workcenters, departments, customers, vendors,
      uomKg, uomEa, users
    } = ctx;

    // ── Models ────────────────────────────────────────────────────────────────
    const { BOMHeader, BOMRevision, BOMComponent, SubstituteComponent, OperationLink } = M('EngineeringBOM');
    const { RoutingHeader, RoutingRevision, RoutingOperation, OperationResource,
            SubcontractingDetail, EngineeringRouting } = M('EngineeringRouting');
    const { ECMHeader, ECMAffectedItem, ECMImpactAnalysis, ECMApprovalRouting,
            EngineeringChange } = M('EngineeringChange');
    const { DeliveryPlan, ShipmentSchedule, VehicleAssignment } = M('DispatchPlanning');
    const { DispatchExecution, PackingManagement, LoadingManagement, DispatchConfirmation } = M('DispatchExecution');
    const { DeliveryTracking, ShipmentTracking, DeliveryConfirmationHandover } = M('DeliveryTracking');
    const { ForecastHeader, ForecastLineItem, ForecastHistoryRef, ForecastAdjustment } = M('DemandForecasting');
    const { ConsolidationRunHeader, ConsolidationLineItem, SourceTraceabilityLink } = M('DemandConsolidation');
    const { MrpRunHeader, ExplodedRequirement, InventorySupplySnapshot } = M('MrpExecution');
    const { ShortageRecord, ConstraintDetails, ResolutionLog } = M('MrpShortage');
    const { RecommendationRecord } = M('MrpRecommendation');
    const { CapacityPeriod, LoadDetail, LaborCapacityPeriod, LaborLoadDetail } = M('CapacityPlanning');
    const CapacityMachine = M('CapacityMachine');
    const CapacityLabor = M('CapacityLabor');
    const { PreventiveMaintenanceHeader, MaintenanceTaskChecklist, SparePartsConsumption } = M('PreventiveMaintenance');
    const { BreakdownIncidentHeader, RepairActionLog, BreakdownSparePartsConsumption,
            BreakdownCostAnalysis } = M('BreakdownMaintenance');
    const MaintenancePreventive = M('MaintenancePreventive');
    const MaintenanceBreakdown = M('MaintenanceBreakdown');
    const MaintenanceSparePart = M('MaintenanceSparePart');
    const { SparePartLedger, PartActivityLog, MaintenanceLinkage } = M('SparePartsManagement');
    const { ApprovalRequest } = M('Approval');

    // ── Wipe only our own collections ─────────────────────────────────────────
    const OWNED = [
      'bomheaders', 'bomrevisions', 'bomcomponents', 'substitutecomponents', 'operationlinks',
      'routingheaders', 'routingrevisions', 'routingoperations', 'operationresources',
      'subcontractingdetails', 'engineeringroutings',
      'ecmheaders', 'ecmaffecteditems', 'ecmimpactanalyses', 'ecmapprovalroutings', 'engineeringchanges',
      'deliveryplans', 'shipmentschedules', 'vehicleassignments',
      'dispatchexecutions', 'packingmanagements', 'loadingmanagements', 'dispatchconfirmations',
      'deliverytrackings', 'shipmenttrackings', 'deliveryconfirmationhandovers',
      'forecastheaders', 'forecastlineitems', 'forecasthistoryrefs', 'forecastadjustments',
      'consolidationrunheaders', 'consolidationlineitems', 'sourcetraceabilitylinks',
      'mrprunheaders', 'explodedrequirements', 'inventorysupplysnapshots',
      'shortagerecords', 'constraintdetails', 'resolutionlogs', 'recommendationrecords',
      'capacityperiods', 'loaddetails', 'laborcapacityperiods', 'laborloaddetails',
      'capacitymachines', 'capacitylabors',
      'preventivemaintenanceheaders', 'maintenancetaskchecklists', 'sparepartsconsumptions',
      'breakdownincidentheaders', 'repairactionlogs', 'breakdownsparepartsconsumptions',
      'breakdowncostanalyses',
      'maintenancepreventives', 'maintenancebreakdowns', 'maintenancespareparts',
      'sparepartledgers', 'partactivitylogs', 'maintenancelinkages',
      'approvalrequests'
    ];
    for (const c of OWNED) await col(c).deleteMany({});

    const out = {};
    const n = (k, v) => { out[k] = Array.isArray(v) ? v.length : v; return v; };

    // ── Lookups ───────────────────────────────────────────────────────────────
    const P = (code) => products.find((p) => p.code === code);
    const MAT = (code) => materials.find((m) => m.code === code);
    const MC = (code) => machines.find((m) => m.code === code);
    const WC = (code) => workcenters.find((w) => w.code === code);
    const DEPT = (code) => departments.find((d) => d.code === code);
    const CUST = (needle) => customers.find((c) => new RegExp(needle, 'i').test(c.name || ''));
    const VEND = (needle) => vendors.find((v) => new RegExp(needle, 'i').test(v.name || ''));

    const roles = await col('roles').find({}).toArray();
    const roleAdmin = roles.find((r) => r.name === 'Super Admin') || roles[0];
    const roleSales = roles.find((r) => /sales/i.test(r.name || '')) || roleAdmin;
    const woHeaders = await col('woheaders').find({}).sort({ WO_Number: 1 }).toArray();
    const soHeaders = [...ctx.soheaders].sort((a, b) =>
      String(a.orderNumber).localeCompare(String(b.orderNumber)));

    const stamp = { companyId: company?._id, plantId: plant?._id, createdBy: admin?._id };
    const techNames = ['R. Kumar', 'S. Menon', 'A. Iyer', 'V. Reddy', 'P. Nair', 'M. Selvam', 'K. Rajan', 'D. Prakash'];
    const pick = (arr, i) => arr[i % arr.length];

    // ═══════════════════════════════════════════════════════════════════════════
    // (a) ENGINEERING — routings first, so BOM headers can point at one
    // ═══════════════════════════════════════════════════════════════════════════

    // Legacy flat routing docs: BOMHeader.defaultRoutingId and OperationLink.routingId
    // both ref the legacy 'EngineeringRouting' model, and the controller populates
    // `routingNumber` off it. Keep those rows so the BOM screen isn't full of nulls.
    const ROUTED = ['PRD-001', 'PRD-005', 'PRD-009', 'PRD-010', 'PRD-011', 'PRD-013'];
    const legacyRoutings = n('engineeringroutings', await EngineeringRouting.create(
      ROUTED.map((code, i) => ({
        productId: P(code)._id,
        routingNumber: `ROUT-${code.replace('PRD-', '')}`,
        description: `${P(code).name} — press shop routing`,
        isActive: true,
        operations: []
      }))
    ));
    const legacyRoutingFor = (code) => legacyRoutings[ROUTED.indexOf(code)];

    const routingHeaders = n('routingheaders', await RoutingHeader.create(
      ROUTED.map((code) => ({
        routingCode: `RTG-${code.replace('PRD-', '')}`,
        routingName: `${P(code).name} — Press / Weld`,
        productId: P(code)._id,
        plantId: plant._id,
        baseQuantity: 100,              // times below are per 100 pieces
        isDefaultRouting: true,
        status: 'Active',
        ...stamp
      }))
    ));
    const rtgFor = (code) => routingHeaders[ROUTED.indexOf(code)];

    const routingRevisions = n('routingrevisions', await RoutingRevision.create([
      ...ROUTED.map((code, i) => ({
        routingId: rtgFor(code)._id,
        revisionCode: 'v1.0',
        validFromDate: daysAgo(180 - i * 9),
        approvalStatus: 'Approved',
        ...stamp
      })),
      // Cross member gets a v1.1 in flight against ECR-2026-003
      {
        routingId: rtgFor('PRD-010')._id,
        revisionCode: 'v1.1',
        validFromDate: daysAhead(9),
        approvalStatus: 'Pending',
        ...stamp
      }
    ]));
    const revFor = (code) => routingRevisions[ROUTED.indexOf(code)];

    // Shear -> blank -> form -> pierce -> (weld) -> inspect
    const OPS = {
      'PRD-001': [
        [10, 'Shear CRCA 1.6 coil to 118 mm strip', 'WC-PRESS', 'MC-008', 25, 6.0, 8, 'Standard'],
        [20, 'Blank on 250T power press (die DIE-BLK-001)', 'WC-PRESS', 'MC-001', 45, 4.5, 6, 'Backflush'],
        [30, 'Form pedal arm on 160T', 'WC-PRESS', 'MC-003', 35, 5.2, 6, 'Standard'],
        [40, 'Pierce 2 x Ø9 mounting holes on 63T', 'WC-PRESS', 'MC-004', 20, 3.8, 5, 'Standard'],
        [50, 'Deburr and dimensional check (CMM sample 1 in 200)', 'WC-QC', null, 5, 2.5, 0, 'Milestone']
      ],
      'PRD-005': [
        [10, 'Shear CRCA 1.2 coil to blank strip', 'WC-PRESS', 'MC-008', 22, 5.5, 8, 'Standard'],
        [20, 'Blank + pierce compound die on 250T', 'WC-PRESS', 'MC-002', 50, 4.9, 6, 'Backflush'],
        [30, 'Bend flanges on CNC press brake', 'WC-PRESS', 'MC-007', 30, 9.4, 6, 'Standard'],
        [40, 'Final inspection and bin packing', 'WC-QC', null, 5, 2.2, 0, 'Milestone']
      ],
      'PRD-009': [
        [10, 'Laser cut frame profiles from CRCA 1.2', 'WC-PRESS', 'MC-006', 18, 14.0, 8, 'Standard'],
        [20, 'Form side rails on press brake', 'WC-PRESS', 'MC-007', 30, 11.5, 6, 'Standard'],
        [30, 'MIG weld frame on fixture JIG-WELD-014', 'WC-WELD', 'MC-010', 20, 26.0, 5, 'Standard'],
        [40, 'Weld dressing and leak-free visual', 'WC-WELD', null, 8, 7.5, 4, 'Standard'],
        [50, 'Final inspection — weld penetration sample', 'WC-QC', null, 6, 4.0, 0, 'Milestone']
      ],
      'PRD-010': [
        [10, 'Shear HR 3.0 coil to 240 mm strip', 'WC-PRESS', 'MC-008', 28, 7.2, 8, 'Standard'],
        [20, 'Blank cross member on 250T', 'WC-PRESS', 'MC-001', 55, 6.8, 6, 'Backflush'],
        [30, 'Form channel section on 160T', 'WC-PRESS', 'MC-003', 40, 8.4, 6, 'Standard'],
        [40, 'MIG weld spacers and gussets', 'WC-WELD', 'MC-010', 25, 31.0, 5, 'Standard'],
        [50, 'Zinc phosphate — subcontracted', 'WC-WELD', null, 0, 0, 0, 'Standard'],
        [60, 'Final inspection and despatch tagging', 'WC-QC', null, 6, 4.5, 0, 'Milestone']
      ],
      'PRD-011': [
        [10, 'Shear GI 1.0 sheet to tray blank', 'WC-PRESS', 'MC-008', 20, 5.0, 8, 'Standard'],
        [20, 'Draw tray on 160T', 'WC-PRESS', 'MC-003', 38, 7.6, 6, 'Backflush'],
        [30, 'Pierce drain and strap slots on 63T', 'WC-PRESS', 'MC-004', 18, 4.2, 5, 'Standard'],
        [40, 'MIG weld strap brackets', 'WC-WELD', 'MC-010', 15, 18.0, 5, 'Standard'],
        [50, 'Final inspection', 'WC-QC', null, 5, 2.8, 0, 'Milestone']
      ],
      'PRD-013': [
        [10, 'Shear SS 304 1.0 sheet — nesting layout N-4', 'WC-PRESS', 'MC-008', 24, 4.8, 8, 'Standard'],
        [20, 'Blank shield on 63T', 'WC-PRESS', 'MC-004', 30, 3.6, 5, 'Backflush'],
        [30, 'Emboss ribs and form edges on 160T', 'WC-PRESS', 'MC-003', 42, 6.4, 6, 'Standard'],
        [40, 'Final inspection — flatness within 0.8 mm', 'WC-QC', null, 6, 3.2, 0, 'Milestone']
      ]
    };

    const routingOperations = n('routingoperations', await RoutingOperation.create(
      ROUTED.flatMap((code) => OPS[code].map(([seq, desc, wc, mc, setup, run, move, ck]) => ({
        revisionId: revFor(code)._id,
        operationSequence: seq,
        operationDescription: desc,
        workCenterId: WC(wc)._id,
        machineId: mc ? MC(mc)._id : null,
        setupTime: setup,
        runTime: run,
        moveTime: move,
        timeUOM: 'Minutes',
        controlKey: ck,
        isSubcontracted: /subcontract/i.test(desc),
        ...stamp
      })))
    ));
    const opAt = (code, seq) => routingOperations.find(
      (o) => String(o.revisionId) === String(revFor(code)._id) && o.operationSequence === seq);

    n('operationresources', await OperationResource.create([
      { operationId: opAt('PRD-001', 20)._id, resourceType: 'Tool',       resourceCode: 'DIE-BLK-001',  quantityRequired: 1 },
      { operationId: opAt('PRD-001', 30)._id, resourceType: 'Tool',       resourceCode: 'DIE-FRM-004',  quantityRequired: 1 },
      { operationId: opAt('PRD-001', 20)._id, resourceType: 'Labor Skill', resourceCode: 'SKL-PRESS-B', quantityRequired: 2 },
      { operationId: opAt('PRD-005', 20)._id, resourceType: 'Tool',       resourceCode: 'DIE-CMP-011',  quantityRequired: 1 },
      { operationId: opAt('PRD-005', 30)._id, resourceType: 'Jig/Fixture', resourceCode: 'JIG-BRK-006', quantityRequired: 1 },
      { operationId: opAt('PRD-009', 30)._id, resourceType: 'Jig/Fixture', resourceCode: 'JIG-WELD-014', quantityRequired: 1 },
      { operationId: opAt('PRD-009', 30)._id, resourceType: 'Labor Skill', resourceCode: 'SKL-MIG-A',   quantityRequired: 2 },
      { operationId: opAt('PRD-010', 20)._id, resourceType: 'Tool',       resourceCode: 'DIE-BLK-017',  quantityRequired: 1 },
      { operationId: opAt('PRD-010', 40)._id, resourceType: 'Jig/Fixture', resourceCode: 'JIG-WELD-021', quantityRequired: 1 },
      { operationId: opAt('PRD-011', 20)._id, resourceType: 'Mold',       resourceCode: 'DRW-TRAY-002', quantityRequired: 1 },
      { operationId: opAt('PRD-013', 20)._id, resourceType: 'Tool',       resourceCode: 'DIE-BLK-029',  quantityRequired: 1 },
      { operationId: opAt('PRD-013', 30)._id, resourceType: 'Tool',       resourceCode: 'DIE-EMB-008',  quantityRequired: 1 }
    ]));

    n('subcontractingdetails', await SubcontractingDetail.create([
      {
        operationId: opAt('PRD-010', 50)._id,
        vendorId: (VEND('kalyani') || vendors[0])._id,
        serviceItemId: null,
        leadTimeDays: 4,
        standardCost: 9.5   // Rs / piece, zinc phosphate + oil
      }
    ]));

    // ── ECRs ──────────────────────────────────────────────────────────────────
    const ecrs = n('ecmheaders', await ECMHeader.create([
      {
        ecrNumber: 'ECR-2026-001',
        title: 'Brake pedal bracket — raise gauge 1.6 mm to 2.0 mm',
        reasonForChange: 'TVS field return: bracket yielding at the pivot boss under panic braking. Ashok Leyland audit raised the same observation on the 250T line.',
        changeType: 'Design', priority: 'High', status: 'Implemented',
        targetImplementationDate: daysAgo(21), isLocked: true, ...stamp
      },
      {
        ecrNumber: 'ECR-2026-002',
        title: 'Battery tray — move from CRCA 1.2 to GI 1.0 and drop the paint stage',
        reasonForChange: 'Pre-galvanised sheet removes the outsourced paint operation and 4 days of lead time. Salt spray already validated at 240 h.',
        changeType: 'Material Replacement', priority: 'Medium', status: 'In Review',
        targetImplementationDate: daysAhead(24), isLocked: false, ...stamp
      },
      {
        ecrNumber: 'ECR-2026-003',
        title: 'Cross member — add pierce station, delete secondary drilling',
        reasonForChange: 'Drilling at op 60 is the bottleneck on the assembly line. Piercing in the form die removes 31 sec/piece.',
        changeType: 'Process', priority: 'Medium', status: 'Approved',
        targetImplementationDate: daysAhead(9), isLocked: true, ...stamp
      },
      {
        ecrNumber: 'ECR-2026-004',
        title: 'Exhaust heat shield — renest SS 304 blank layout',
        reasonForChange: 'SS 304 at Rs 245/kg is the single largest material cost. Layout N-4 lifts utilisation from 71% to 84%.',
        changeType: 'Cost Reduction', priority: 'High', status: 'Submitted',
        targetImplementationDate: daysAhead(35), isLocked: false, ...stamp
      },
      {
        ecrNumber: 'ECR-2026-005',
        title: 'Seat frame weld fixture rework after TVS line stoppage',
        reasonForChange: 'LINE DOWN at TVS Hosur on 3 Aug — frame diagonal out by 2.4 mm. Fixture locators worn, needs hard-chrome rebuild.',
        changeType: 'Process', priority: 'Urgent/Line-Down', status: 'Draft',
        targetImplementationDate: daysAhead(4), isLocked: false, ...stamp
      },
      {
        ecrNumber: 'ECR-2026-006',
        title: 'Silencer mounting bracket in aluminium 1.5 mm',
        reasonForChange: 'Weight saving proposal from customer engineering.',
        changeType: 'Material Replacement', priority: 'Low', status: 'Rejected',
        targetImplementationDate: null, isLocked: false, ...stamp
      }
    ]));
    const ecr = (num) => ecrs.find((e) => e.ecrNumber === num);

    // Legacy EngineeringChange rows — BOM/Routing revisions ref this model on ecoNumber.
    const legacyEcos = n('engineeringchanges', await EngineeringChange.create([
      { ecrNumber: 'ECR-2026-001', changeNumber: 'ECO-2026-001', title: ecr('ECR-2026-001').title,
        description: 'Gauge change 1.6 -> 2.0 mm, new blanking die DIE-BLK-001A', status: 'Implemented' },
      { ecrNumber: 'ECR-2026-002', changeNumber: 'ECO-2026-002', title: ecr('ECR-2026-002').title,
        description: 'CRCA 1.2 replaced by GI 1.0 on battery tray', status: 'In Review' },
      { ecrNumber: 'ECR-2026-003', changeNumber: 'ECO-2026-003', title: ecr('ECR-2026-003').title,
        description: 'Pierce station added to cross member routing v1.1', status: 'Approved' }
    ]));
    const eco = (num) => legacyEcos.find((e) => e.changeNumber === num);

    n('ecmaffecteditems', await ECMAffectedItem.create([
      { ecrId: ecr('ECR-2026-001')._id, itemType: 'Product Master', productId: P('PRD-001')._id, currentRevisionCode: 'v1.0', newRevisionCode: 'v1.1', ...stamp },
      { ecrId: ecr('ECR-2026-003')._id, itemType: 'Routing', routingId: rtgFor('PRD-010')._id, currentRevisionCode: 'v1.0', newRevisionCode: 'v1.1', ...stamp },
      { ecrId: ecr('ECR-2026-004')._id, itemType: 'Routing', routingId: rtgFor('PRD-013')._id, currentRevisionCode: 'v1.0', newRevisionCode: '', ...stamp },
      { ecrId: ecr('ECR-2026-005')._id, itemType: 'Routing', routingId: rtgFor('PRD-009')._id, currentRevisionCode: 'v1.0', newRevisionCode: '', ...stamp },
      { ecrId: ecr('ECR-2026-006')._id, itemType: 'Product Master', productId: P('PRD-004')._id, currentRevisionCode: 'v1.0', newRevisionCode: '', ...stamp }
    ]));

    n('ecmimpactanalyses', await ECMImpactAnalysis.create([
      { ecrId: ecr('ECR-2026-001')._id, productImpactNotes: 'Part weight up from 0.34 to 0.42 kg; customer drawing rev C issued.',
        bomImpactNotes: 'CRCA 1.6 replaced by HR 2.0 on BOM-PRD-001 rev v1.1.',
        routingImpactNotes: 'Blanking tonnage up; job moves from 160T to 250T for forming.',
        costImpactEstimated: 4.8, inventoryDisposition: 'Use Existing', ...stamp },
      { ecrId: ecr('ECR-2026-002')._id, productImpactNotes: 'No dimensional change.',
        bomImpactNotes: 'MAT-002 CRCA 1.2 -> MAT-006 GI 1.0, 0.62 kg/pc unchanged.',
        routingImpactNotes: 'Outsourced paint operation deleted.',
        costImpactEstimated: -2.6, inventoryDisposition: 'Use Existing', ...stamp },
      { ecrId: ecr('ECR-2026-003')._id, productImpactNotes: 'None.',
        bomImpactNotes: 'None.', routingImpactNotes: 'Op 40 pierce added, secondary drilling removed. 31 sec/pc saved.',
        costImpactEstimated: -3.4, inventoryDisposition: 'Use Existing', ...stamp },
      { ecrId: ecr('ECR-2026-004')._id, productImpactNotes: 'None.',
        bomImpactNotes: 'SS 304 consumption 0.19 -> 0.16 kg/pc.',
        routingImpactNotes: 'New shear program; strip width 96 mm.',
        costImpactEstimated: -7.35, inventoryDisposition: 'Use Existing', ...stamp },
      { ecrId: ecr('ECR-2026-005')._id, productImpactNotes: 'Frame diagonal tolerance tightened to +/-1.0 mm.',
        bomImpactNotes: 'None.', routingImpactNotes: 'Weld fixture JIG-WELD-014 out of service 3 days.',
        costImpactEstimated: 62000, inventoryDisposition: 'Rework', ...stamp },
      { ecrId: ecr('ECR-2026-006')._id, productImpactNotes: 'Aluminium 1.5 mm at Rs 280/kg — landed cost up 46%.',
        bomImpactNotes: 'Rejected, no BOM change.', routingImpactNotes: 'Rejected.',
        costImpactEstimated: 11.2, inventoryDisposition: 'Use Existing', ...stamp }
    ]));

    n('ecmapprovalroutings', await ECMApprovalRouting.create([
      { ecrId: ecr('ECR-2026-001')._id, approvalStep: 1, requiredRole: roleAdmin._id, assignedUserId: admin?._id, approvalStatus: 'Approved', approvalDate: daysAgo(30), comments: 'Gauge change agreed with customer engineering.', ...stamp },
      { ecrId: ecr('ECR-2026-001')._id, approvalStep: 2, requiredRole: roleSales._id, approvalStatus: 'Approved', approvalDate: daysAgo(28), comments: 'Price revision passed to TVS.', ...stamp },
      { ecrId: ecr('ECR-2026-002')._id, approvalStep: 1, requiredRole: roleAdmin._id, assignedUserId: admin?._id, approvalStatus: 'Pending', comments: '', ...stamp },
      { ecrId: ecr('ECR-2026-003')._id, approvalStep: 1, requiredRole: roleAdmin._id, assignedUserId: admin?._id, approvalStatus: 'Approved', approvalDate: daysAgo(6), comments: 'Tooling budget released.', ...stamp },
      { ecrId: ecr('ECR-2026-004')._id, approvalStep: 1, requiredRole: roleAdmin._id, approvalStatus: 'Pending', comments: '', ...stamp },
      { ecrId: ecr('ECR-2026-005')._id, approvalStep: 1, requiredRole: roleAdmin._id, approvalStatus: 'Pending', comments: 'Awaiting tool room estimate.', ...stamp },
      { ecrId: ecr('ECR-2026-006')._id, approvalStep: 1, requiredRole: roleAdmin._id, approvalStatus: 'Rejected', approvalDate: daysAgo(44), comments: 'Cost per piece up 46%. Not viable at current SOP price.', ...stamp }
    ]));

    // ── BOMs ──────────────────────────────────────────────────────────────────
    // [productCode, [ [materialCode|productCode, qtyPerPiece, scrap%, issueMethod, type] ] ]
    const BOMS = [
      ['PRD-001', 'ROUT-001', [['MAT-003', 0.340, 12, 'Backflush', 'Standard']]],
      ['PRD-002', null,       [['MAT-003', 0.310, 12, 'Backflush', 'Standard']]],
      ['PRD-004', null,       [['MAT-004', 0.290,  9, 'Backflush', 'Standard']]],
      ['PRD-005', 'ROUT-005', [['MAT-002', 0.410, 14, 'Backflush', 'Standard']]],
      ['PRD-009', 'ROUT-009', [['MAT-002', 0.860, 11, 'Backflush', 'Standard'],
                               ['MAT-009', 0.020,  4, 'Floor Stock', 'Bulk/Floor Stock']]],
      ['PRD-010', 'ROUT-010', [['MAT-005', 1.420,  8, 'Backflush', 'Standard'],
                               ['MAT-009', 0.045,  4, 'Floor Stock', 'Bulk/Floor Stock'],
                               ['PRD-015', 4,       2, 'Manual Pick', 'Standard']]],
      ['PRD-011', 'ROUT-011', [['MAT-006', 0.620, 10, 'Backflush', 'Standard'],
                               ['MAT-009', 0.030,  4, 'Floor Stock', 'Bulk/Floor Stock']]],
      ['PRD-012', null,       [['MAT-005', 0.780,  9, 'Backflush', 'Standard']]],
      ['PRD-013', 'ROUT-013', [['MAT-007', 0.190, 16, 'Backflush', 'Standard']]]
    ];

    const bomHeaders = n('bomheaders', await BOMHeader.create(
      BOMS.map(([code, rout]) => ({
        bomCode: `BOM-${code.replace('PRD-', 'P')}`,
        bomName: `${P(code).name} — Manufacturing BOM`,
        productId: P(code)._id,
        plantId: plant._id,
        bomType: 'Manufacturing',
        baseQuantity: 1,
        uomId: uomEa?._id,
        defaultRoutingId: rout ? legacyRoutingFor(`PRD-${rout.replace('ROUT-', '')}`)._id : null,
        isDefaultBOM: true,
        status: code === 'PRD-004' ? 'Inactive' : 'Active',
        ...stamp
      }))
    ));
    const bomFor = (code) => bomHeaders[BOMS.findIndex((b) => b[0] === code)];

    const costOf = (line) => {
      const [item, qty, scrap] = line;
      const rate = item.startsWith('MAT-')
        ? (MAT(item).standardCost || MAT(item).unitPrice || 0)
        : (P(item).unitPrice || P(item).standardCost || 0);
      return qty * rate * (1 + scrap / 100);
    };

    const bomRevisions = n('bomrevisions', await BOMRevision.create([
      ...BOMS.map(([code, , lines], i) => ({
        bomId: bomFor(code)._id,
        revisionCode: 'v1.0',
        ecoNumber: null,
        validFromDate: daysAgo(200 - i * 8),
        validToDate: code === 'PRD-001' ? daysAgo(21) : null,
        totalStandardCost: Math.round(lines.reduce((s, l) => s + costOf(l), 0) * 100) / 100,
        approvalStatus: code === 'PRD-001' ? 'Obsolete' : 'Approved',
        ...stamp
      })),
      // Implemented gauge change on the brake pedal bracket
      {
        bomId: bomFor('PRD-001')._id, revisionCode: 'v1.1', ecoNumber: eco('ECO-2026-001')._id,
        validFromDate: daysAgo(21), validToDate: null,
        totalStandardCost: Math.round(0.42 * (MAT('MAT-004').standardCost || 56) * 1.1 * 100) / 100,
        approvalStatus: 'Approved', ...stamp
      },
      // Battery tray material swap still under review
      {
        bomId: bomFor('PRD-011')._id, revisionCode: 'v1.1', ecoNumber: eco('ECO-2026-002')._id,
        validFromDate: daysAhead(24), validToDate: null,
        totalStandardCost: Math.round(0.62 * (MAT('MAT-006').standardCost || 68) * 1.1 * 100) / 100,
        approvalStatus: 'Pending', ...stamp
      }
    ]));
    const revV10 = (code) => bomRevisions[BOMS.findIndex((b) => b[0] === code)];
    const revBrakeV11 = bomRevisions[BOMS.length];
    const revTrayV11 = bomRevisions[BOMS.length + 1];

    const compDocs = [];
    BOMS.forEach(([code, , lines]) => {
      lines.forEach(([item, qty, scrap, issue, type], idx) => {
        compDocs.push({
          revisionId: revV10(code)._id,
          lineSequenceNumber: (idx + 1) * 10,
          materialId: item.startsWith('MAT-') ? MAT(item)._id : null,
          productId: item.startsWith('PRD-') ? P(item)._id : null,
          componentType: type,
          quantityPerAssembly: qty,
          uomId: item.startsWith('MAT-') ? uomKg?._id : uomEa?._id,
          scrapYieldPercentage: scrap,
          issueMethod: issue,
          costingRelevancy: true,
          leadTimeOffsetDays: item.startsWith('MAT-') ? 2 : 1,
          ...stamp
        });
      });
    });
    // v1.1 lines
    compDocs.push({
      revisionId: revBrakeV11._id, lineSequenceNumber: 10, materialId: MAT('MAT-004')._id,
      componentType: 'Standard', quantityPerAssembly: 0.42, uomId: uomKg?._id,
      scrapYieldPercentage: 10, issueMethod: 'Backflush', costingRelevancy: true, leadTimeOffsetDays: 2, ...stamp
    });
    compDocs.push({
      revisionId: revTrayV11._id, lineSequenceNumber: 10, materialId: MAT('MAT-006')._id,
      componentType: 'Standard', quantityPerAssembly: 0.62, uomId: uomKg?._id,
      scrapYieldPercentage: 10, issueMethod: 'Backflush', costingRelevancy: true, leadTimeOffsetDays: 3, ...stamp
    });
    compDocs.push({
      revisionId: revTrayV11._id, lineSequenceNumber: 20, materialId: MAT('MAT-009')._id,
      componentType: 'Bulk/Floor Stock', quantityPerAssembly: 0.03, uomId: uomKg?._id,
      scrapYieldPercentage: 4, issueMethod: 'Floor Stock', costingRelevancy: true, leadTimeOffsetDays: 0, ...stamp
    });
    const bomComponents = n('bomcomponents', await BOMComponent.create(compDocs));
    const compIn = (revId, seq) => bomComponents.find(
      (c) => String(c.revisionId) === String(revId) && c.lineSequenceNumber === seq);

    n('substitutecomponents', await SubstituteComponent.create([
      { primaryComponentId: compIn(revV10('PRD-002')._id, 10)._id, substituteMaterialId: MAT('MAT-002')._id,
        conversionFactor: 1.33, priorityRank: 1, validFromDate: daysAgo(120), isActive: true, ...stamp },
      { primaryComponentId: compIn(revV10('PRD-004')._id, 10)._id, substituteMaterialId: MAT('MAT-005')._id,
        conversionFactor: 1.5, priorityRank: 1, validFromDate: daysAgo(90), isActive: true, ...stamp },
      { primaryComponentId: compIn(revV10('PRD-013')._id, 10)._id, substituteMaterialId: MAT('MAT-006')._id,
        conversionFactor: 1.0, priorityRank: 2, validFromDate: daysAgo(60), validToDate: daysAhead(120), isActive: false, ...stamp }
    ]));

    n('operationlinks', await OperationLink.create([
      { componentId: compIn(revV10('PRD-001')._id, 10)._id, routingId: legacyRoutingFor('PRD-001')._id, operationSequence: 20, workCenterId: WC('WC-PRESS')._id, ...stamp },
      { componentId: compIn(revV10('PRD-005')._id, 10)._id, routingId: legacyRoutingFor('PRD-005')._id, operationSequence: 20, workCenterId: WC('WC-PRESS')._id, ...stamp },
      { componentId: compIn(revV10('PRD-009')._id, 10)._id, routingId: legacyRoutingFor('PRD-009')._id, operationSequence: 10, workCenterId: WC('WC-PRESS')._id, ...stamp },
      { componentId: compIn(revV10('PRD-009')._id, 20)._id, routingId: legacyRoutingFor('PRD-009')._id, operationSequence: 30, workCenterId: WC('WC-WELD')._id, ...stamp },
      { componentId: compIn(revV10('PRD-010')._id, 20)._id, routingId: legacyRoutingFor('PRD-010')._id, operationSequence: 40, workCenterId: WC('WC-WELD')._id, ...stamp },
      { componentId: compIn(revV10('PRD-010')._id, 30)._id, routingId: legacyRoutingFor('PRD-010')._id, operationSequence: 40, workCenterId: WC('WC-WELD')._id, ...stamp },
      { componentId: compIn(revV10('PRD-013')._id, 10)._id, routingId: legacyRoutingFor('PRD-013')._id, operationSequence: 20, workCenterId: WC('WC-PRESS')._id, ...stamp }
    ]));

    // ═══════════════════════════════════════════════════════════════════════════
    // (b) DISPATCH
    // ═══════════════════════════════════════════════════════════════════════════
    const CARRIERS = ['TCI Freight', 'Safexpress', 'VRL Logistics', 'Gati-KWE', 'LBAP Own Fleet'];
    const VEHICLES = ['TN20BX4471', 'KA51AD9082', 'TN29AL6613', 'TN70CQ1188', 'TN20AS3306', 'KA05MH7719'];

    // [soIndex, status, plannedDaysOffset, weightKg, volumeM3]
    const PLANS = [
      [0, 'Delivered',  -18, 4820, 12.4],
      [1, 'In-Transit',  -3, 6140, 15.8],
      [2, 'In-Transit',  -1, 3260,  9.1],
      [4, 'Delivered',  -11, 5510, 13.6],
      [5, 'Assigned',     1, 7280, 18.2],
      [6, 'Assigned',     3, 2940,  7.7],
      [7, 'Scheduled',    6, 4410, 11.3],
      [8, 'Planned',      9, 5960, 14.9],
      [9, 'Cancelled',   -6, 1880,  5.2]
    ];

    const deliveryPlans = n('deliveryplans', await DeliveryPlan.create(
      PLANS.map(([soIdx, status, off, wt, vol], i) => ({
        Plan_ID: `DPLAN-${String(i + 1).padStart(4, '0')}`,
        Plan_Number: `DP-2026-${String(4001 + i)}`,
        Sales_Order_ID: soHeaders[soIdx % soHeaders.length]._id,
        Planned_Date: off < 0 ? daysAgo(-off) : daysAhead(off),
        Status: status,
        Total_Weight: wt,
        Total_Volume: vol,
        Plant_ID: plant._id,
        ...stamp
      }))
    ));

    // Everything from Scheduled onwards has a booked carrier.
    const scheduledIdx = deliveryPlans
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => ['Scheduled', 'Assigned', 'In-Transit', 'Delivered'].includes(p.Status));

    const shipmentSchedules = n('shipmentschedules', await ShipmentSchedule.create(
      scheduledIdx.map(({ p, i }, k) => ({
        Schedule_ID: `SCH-${String(k + 1).padStart(4, '0')}`,
        Plan_ID: p._id,
        Scheduled_Date: p.Planned_Date,
        Carrier_ID: pick(CARRIERS, k),
        Estimated_Arrival_Date: new Date(p.Planned_Date.getTime() + (k % 3 === 0 ? 1 : 2) * 864e5),
        Shipping_Method: 'Road',
        ...stamp
      }))
    ));

    const assignedPairs = scheduledIdx
      .map((x, k) => ({ ...x, sched: shipmentSchedules[k] }))
      .filter(({ p }) => ['Assigned', 'In-Transit', 'Delivered'].includes(p.Status));

    n('vehicleassignments', await VehicleAssignment.create(
      assignedPairs.map(({ p, sched }, k) => ({
        Assignment_ID: `VA-${String(k + 1).padStart(4, '0')}`,
        Schedule_ID: sched._id,
        Plan_ID: p._id,
        Vehicle_ID: pick(VEHICLES, k),
        Driver_ID: pick(techNames, k + 3),
        Assignment_Date: new Date(p.Planned_Date.getTime() - 864e5),
        Dispatch_Status: p.Status === 'Delivered' ? 'Arrived'
          : p.Status === 'In-Transit' ? 'Dispatched' : 'Pending',
        ...stamp
      }))
    ));

    // One execution per plan, so the controller's auto-seed has nothing to invent.
    const EXEC_STATUS = {
      Delivered: 'Dispatched', 'In-Transit': 'Dispatched', Assigned: 'Loading',
      Scheduled: 'Packing', Planned: 'Pending', Cancelled: 'Cancelled'
    };
    const dispatchExecutions = n('dispatchexecutions', await DispatchExecution.create(
      deliveryPlans.map((p, i) => ({
        Exec_ID: `DEXE-${String(i + 1).padStart(4, '0')}`,
        Exec_Number: `DE-2026-${String(5001 + i)}`,
        executionNumber: `DE-2026-${String(5001 + i)}`,   // legacy unique index
        Plan_ID: p._id,
        dispatchPlanId: p._id,                            // legacy unique index
        Sales_Order_ID: p.Sales_Order_ID,
        Overall_Status: EXEC_STATUS[p.Status],
        Plant_ID: plant._id,
        ...stamp
      }))
    ));

    const packStatus = (s) => (s === 'Pending' ? 'Pending' : s === 'Packing' ? 'In Progress' : 'Completed');
    const loadStatus = (s) => (s === 'Dispatched' ? 'Completed' : s === 'Loading' ? 'In Progress' : 'Pending');

    n('packingmanagements', await PackingManagement.create(
      dispatchExecutions.map((e, i) => {
        const st = packStatus(e.Overall_Status);
        const start = daysAgo(randInt(1, 16));
        return {
          Packing_ID: `PKG-${String(i + 1).padStart(4, '0')}`,
          Exec_ID: e._id,
          Packing_Status: e.Overall_Status === 'Cancelled' ? 'Pending' : st,
          Total_Boxes: st === 'Pending' ? 0 : randInt(18, 96),
          Packing_Start_Time: st === 'Pending' ? undefined : start,
          Packing_End_Time: st === 'Completed' ? new Date(start.getTime() + 5.5 * 36e5) : undefined,
          ...stamp
        };
      })
    ));

    n('loadingmanagements', await LoadingManagement.create(
      dispatchExecutions.map((e, i) => ({
        Loading_ID: `LDG-${String(i + 1).padStart(4, '0')}`,
        Exec_ID: e._id,
        Loading_Status: e.Overall_Status === 'Cancelled' ? 'Pending' : loadStatus(e.Overall_Status),
        Loading_Bay: `Bay-0${(i % 3) + 1}`,
        Loader_ID: (users[i % users.length] || admin)?._id,
        ...stamp
      }))
    ));

    n('dispatchconfirmations', await DispatchConfirmation.create(
      dispatchExecutions.map((e, i) => ({
        Confirmation_ID: `CNF-${String(i + 1).padStart(4, '0')}`,
        Exec_ID: e._id,
        Dispatch_Status: e.Overall_Status === 'Dispatched' ? 'Confirmed'
          : e.Overall_Status === 'Cancelled' ? 'Failed' : 'Pending',
        Dispatched_Date: e.Overall_Status === 'Dispatched' ? deliveryPlans[i].Planned_Date : undefined,
        Proof_Of_Dispatch_Ref: e.Overall_Status === 'Dispatched' ? `EWB-3210${8800 + i}` : undefined,
        ...stamp
      }))
    ));

    // Trackings for every Dispatched execution (again, so nothing is auto-created).
    const dispatched = dispatchExecutions
      .map((e, i) => ({ e, plan: deliveryPlans[i] }))
      .filter(({ e }) => e.Overall_Status === 'Dispatched');

    const TRACK_STATUS = ['Delivered', 'In-Transit', 'Delayed', 'Delivered'];
    const deliveryTrackings = n('deliverytrackings', await DeliveryTracking.create(
      dispatched.map(({ e, plan }, k) => ({
        Tracking_ID: `DTRK-${String(k + 1).padStart(4, '0')}`,
        Tracking_Number: `DT-2026-${String(6001 + k)}`,
        trackingNumber: `DT-2026-${String(6001 + k)}`,     // legacy unique index
        dispatchExecutionId: e._id,                        // legacy unique index
        Exec_ID: e._id,
        Plan_ID: plan._id,
        Sales_Order_ID: plan.Sales_Order_ID,
        Overall_Delivery_Status: TRACK_STATUS[k % TRACK_STATUS.length],
        Plant_ID: plant._id,
        ...stamp
      }))
    ));

    const MILESTONES = [
      ['Departed', 'Hosur SIPCOT Phase II — LBAP gate', 'Sealed and gated out, e-way bill attached'],
      ['Arrived at Hub', 'Krishnagiri hub, NH-44', 'Transhipment scan'],
      ['Out for Delivery', 'Peenya Industrial Area, Bengaluru', 'At customer gate, awaiting unloading slot'],
      ['Delayed', 'Hosur–Bengaluru NH-44, KM 42', 'Held 5 h — highway blockade near Attibele check post'],
      ['Departed', 'Hosur SIPCOT Phase II — LBAP gate', 'Second trip, balance quantity'],
      ['Arrived at Hub', 'Sriperumbudur consolidation yard', 'Handed to line-feed vehicle'],
      ['Out for Delivery', 'Ambattur Industrial Estate, Chennai', 'Docked at receiving bay 4']
    ];
    n('shipmenttrackings', await ShipmentTracking.create(
      deliveryTrackings.flatMap((t, k) => {
        const count = t.Overall_Delivery_Status === 'Delayed' ? 3 : 2;
        return Array.from({ length: count }, (_, j) => {
          const [st, loc, rem] = MILESTONES[(k * 2 + j) % MILESTONES.length];
          return {
            Event_ID: `EVT-${String(k * 3 + j + 1).padStart(4, '0')}`,
            Tracking_ID: t._id,
            Tracking_Status: t.Overall_Delivery_Status === 'Delayed' && j === count - 1 ? 'Delayed' : st,
            Current_Location: loc,
            Event_Timestamp: daysAgo(12 - k * 3 - j),
            Remarks_Exceptions: rem,
            ...stamp
          };
        });
      })
    ));

    n('deliveryconfirmationhandovers', await DeliveryConfirmationHandover.create(
      deliveryTrackings.map((t, k) => {
        const delivered = t.Overall_Delivery_Status === 'Delivered';
        return {
          Confirmation_ID: `POD-${String(k + 1).padStart(4, '0')}`,
          Tracking_ID: t._id,
          Final_Status: delivered
            ? (k === 3 ? 'Partially Delivered' : 'Successfully Delivered')
            : 'Pending',
          Delivered_Date: delivered ? daysAgo(randInt(2, 14)) : undefined,
          Received_By: delivered ? pick(techNames, k + 1) : undefined,
          Proof_Of_Delivery_Ref: delivered ? `POD/${2026}/${7100 + k}` : undefined,
          Customer_Feedback_Notes: k === 3
            ? 'Short by 640 pieces against the DC — balance to follow on the next trip.'
            : delivered ? 'Received in full, packing condition OK.' : undefined,
          ...stamp
        };
      })
    ));

    // ═══════════════════════════════════════════════════════════════════════════
    // (c) DEMAND + MRP
    // ═══════════════════════════════════════════════════════════════════════════
    const monthStart = (offset) => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth() + offset, 1);
    };
    const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = (d) => `${MONTH[d.getMonth()]} ${d.getFullYear()}`;

    const FORECASTS = [
      ['FC-2026-0001', 'Customer', CUST('tvs motor'),      'Moving Average',        'Finalized',
       ['PRD-001', 'PRD-003', 'PRD-006']],
      ['FC-2026-0002', 'Customer', CUST('ashok leyland'),  'Exponential Smoothing', 'Finalized',
       ['PRD-010', 'PRD-012']],
      ['FC-2026-0003', 'Customer', CUST('brakes india'),   'ML-Prophet',            'Pending Review',
       ['PRD-001', 'PRD-002']],
      ['FC-2026-0004', 'Customer', CUST('sundram'),        'Manual Entry',          'Draft',
       ['PRD-013']]
    ].filter((f) => f[2]);

    const forecastHeaders = n('forecastheaders', await ForecastHeader.create(
      FORECASTS.map(([num, type, target, algo, status]) => ({
        forecastNumber: num,
        forecastType: type,
        targetEntityId: target._id,
        forecastPeriod: `${label(monthStart(0))} – ${label(monthStart(2))}`,
        algorithmUsed: algo,
        status,
        totalAdjustedQty: 0,
        companyId: company?._id,
        createdBy: admin?._id
      }))
    ));

    const flDocs = [];
    FORECASTS.forEach(([, , , , , codes], fi) => {
      codes.forEach((code) => {
        for (let m = 0; m < 3; m++) {
          const base = randInt(9, 34) * 1000;
          const adj = m === 1 ? Math.round(base * 0.08) : 0;
          flDocs.push({
            forecastId: forecastHeaders[fi]._id,
            productId: P(code)._id,
            timeBucketDate: monthStart(m),
            systemCalculatedQty: base,
            manualAdjustedQty: adj,
            finalForecastQty: base + adj,
            uomId: uomEa?._id,
            confidenceScorePercentage: randInt(58, 94),
            companyId: company?._id
          });
        }
      });
    });
    const forecastLines = n('forecastlineitems', await ForecastLineItem.create(flDocs));

    // Roll the totals back onto the headers so the list screen isn't all zeros.
    for (let i = 0; i < forecastHeaders.length; i++) {
      const total = forecastLines
        .filter((l) => String(l.forecastId) === String(forecastHeaders[i]._id))
        .reduce((s, l) => s + l.finalForecastQty, 0);
      await col('forecastheaders').updateOne({ _id: forecastHeaders[i]._id }, { $set: { totalAdjustedQty: total } });
    }

    n('forecastadjustments', await ForecastAdjustment.create(
      forecastLines.filter((l) => l.manualAdjustedQty > 0).slice(0, 6).map((l, i) => ({
        lineId: l._id,
        adjustedBy: admin?._id,
        adjustmentDate: daysAgo(randInt(4, 30)),
        previousQty: l.systemCalculatedQty,
        newQty: l.finalForecastQty,
        reasonCode: pick(['Market Trend', 'Customer Insight', 'Promotion', 'Outlier Correction'], i),
        notes: pick([
          'Customer schedule pull-in ahead of the festive build.',
          'EV variant launch adds a second bracket per vehicle.',
          'Line rate at the customer raised from 480 to 540 per shift.',
          'Two spike weeks in the history were a one-off export order.'
        ], i)
      })))
    );

    n('forecasthistoryrefs', await ForecastHistoryRef.create(
      soHeaders.slice(0, 6).map((so, i) => ({
        forecastId: forecastHeaders[i % forecastHeaders.length]._id,
        sourceModule: 'Sales Orders',
        sourceRecordId: String(so._id),
        historicalPeriodDate: monthStart(-(i % 4) - 1),
        quantityConsumed: randInt(6, 28) * 1000
      })))
    );

    const consRuns = n('consolidationrunheaders', await ConsolidationRunHeader.create([
      { runNumber: 'DC-2026-0007', runDate: daysAgo(34), targetHorizonStart: monthStart(-1),
        targetHorizonEnd: monthStart(2), status: 'Consumed_By_MRP', runType: 'Full Regeneration',
        executedBy: admin?._id, companyId: company?._id },
      { runNumber: 'DC-2026-0008', runDate: daysAgo(5), targetHorizonStart: monthStart(0),
        targetHorizonEnd: monthStart(3), status: 'Completed', runType: 'Net Change',
        executedBy: admin?._id, companyId: company?._id }
    ]));

    const CONS_ITEMS = ['PRD-001', 'PRD-002', 'PRD-005', 'PRD-009', 'PRD-010', 'PRD-011', 'PRD-012', 'PRD-013'];
    // NOTE: ConsolidationLineItem's pre('save') hook still uses the callback style
    // (`function (next) { … next(); }`), which Mongoose 9 no longer supports — any
    // .save()/.create() on it throws "next is not a function". insertMany skips
    // document save middleware, so the totals are computed here instead.
    const consLines = n('consolidationlineitems', await ConsolidationLineItem.insertMany(
      CONS_ITEMS.map((code, i) => {
        const fc = randInt(8, 30) * 1000;
        const so = randInt(2, 14) * 1000;
        const ss = randInt(1, 4) * 500;
        const adj = i === 2 ? -1500 : i === 5 ? 2000 : 0;
        return {
          runId: consRuns[1]._id,
          periodName: label(monthStart(i % 2)),
          productId: P(code)._id,
          forecastDemandQty: fc,
          salesOrderQty: so,
          safetyStockQty: ss,
          totalGrossDemand: fc + so + ss,
          manualAdjustmentQty: adj,
          finalNetDemand: fc + so + ss + adj,
          companyId: company?._id
        };
      })
    ));

    n('sourcetraceabilitylinks', await SourceTraceabilityLink.create(
      consLines.flatMap((l, i) => ([
        { consolidationLineId: l._id, sourceType: 'Forecast',
          sourceRecordId: String(forecastHeaders[i % forecastHeaders.length]._id),
          contributedQty: l.forecastDemandQty, isConsumed: i % 3 === 0, companyId: company?._id },
        { consolidationLineId: l._id, sourceType: 'Sales_Order',
          sourceRecordId: String(soHeaders[i % soHeaders.length]._id),
          contributedQty: l.salesOrderQty, isConsumed: true, companyId: company?._id }
      ]))
    ));

    const mrpRuns = n('mrprunheaders', await MrpRunHeader.create([
      { runNo: 'MRP-2026-0011', targetPeriod: label(monthStart(-1)), runDate: daysAgo(38), status: 'Superseded',
        runParameters: { horizonDays: 90, includeSafetyStock: true, lotSizing: 'Lot-for-Lot' },
        executedBy: admin?._id, companyId: company?._id },
      { runNo: 'MRP-2026-0012', targetPeriod: label(monthStart(0)), runDate: daysAgo(12), status: 'Completed',
        runParameters: { horizonDays: 90, includeSafetyStock: true, lotSizing: 'MOQ' },
        executedBy: admin?._id, companyId: company?._id },
      { runNo: 'MRP-2026-0013', targetPeriod: label(monthStart(1)), runDate: daysAgo(2), status: 'Completed',
        runParameters: { horizonDays: 120, includeSafetyStock: true, lotSizing: 'MOQ', netChangeOnly: true },
        executedBy: admin?._id, companyId: company?._id }
    ]));
    const liveRun = mrpRuns[2];

    // Level 0 = finished brackets, level 1 = the coil they are pressed from.
    const EXPLODE = [
      ['PRD-001', 'MasterProduct', 'Production',  38000, 0, 8],
      ['PRD-002', 'MasterProduct', 'Production',  24500, 0, 11],
      ['PRD-009', 'MasterProduct', 'Production',   9200, 0, 14],
      ['PRD-010', 'MasterProduct', 'Production',   6400, 0, 17],
      ['PRD-011', 'MasterProduct', 'Production',  12800, 0, 20],
      ['PRD-013', 'MasterProduct', 'Production',  17600, 0, 23],
      ['MAT-003', 'MasterMaterial', 'Procurement', 21800, 1, 4],
      ['MAT-002', 'MasterMaterial', 'Procurement', 12300, 1, 6],
      ['MAT-005', 'MasterMaterial', 'Procurement', 14900, 1, 9],
      ['MAT-006', 'MasterMaterial', 'Procurement',  8700, 1, 12],
      ['MAT-007', 'MasterMaterial', 'Procurement',  3880, 1, 15],
      ['MAT-009', 'MasterMaterial', 'Procurement',   690, 1, 7],
      ['PRD-015', 'MasterProduct', 'Production',   26000, 1, 10]
    ];
    const toModel = (m) => (m === 'MasterMaterial' ? 'Material' : m === 'MasterProduct' ? 'Product' : m);

    const explodedReqs = n('explodedrequirements', await ExplodedRequirement.create(
      EXPLODE.map(([item, model, type, qty, lvl, due], i) => ({
        runId: liveRun._id,
        requirementType: type,
        itemModel: toModel(model),
        itemId: model === 'MasterMaterial' ? MAT(item)._id : P(item)._id,
        requiredQty: qty,
        requirementDate: daysAhead(due),
        bomLevel: lvl,
        isExpedited: ['MAT-003', 'MAT-007'].includes(item),
        companyId: company?._id
      }))
    ));

    n('inventorysupplysnapshots', await InventorySupplySnapshot.create(
      EXPLODE.slice(6).concat([['PRD-001', 'MasterProduct'], ['PRD-013', 'MasterProduct'], ['MAT-001', 'MasterMaterial'], ['MAT-004', 'MasterMaterial']])
        .map(([item, model]) => ({
          runId: liveRun._id,
          itemModel: toModel(model),
          itemId: model === 'MasterMaterial' ? MAT(item)._id : P(item)._id,
          onHandQty: randInt(400, 22000),
          scheduledReceiptsQty: randInt(0, 9000),
          allocatedQty: randInt(0, 6000),
          companyId: company?._id
        }))
    ));

    // Shortages — six genuinely open, three of them Critical/High.
    const SHORTAGES = [
      ['MAT-003', 'MasterMaterial', 'Raw Material',          21800, 8300,  'Critical', 'Open',         4],
      ['MAT-007', 'MasterMaterial', 'Raw Material',           3880, 1050,  'High',     'Open',         9],
      ['PRD-015', 'MasterProduct',  'Component',             26000, 12400, 'High',     'Open',         6],
      ['MAT-005', 'MasterMaterial', 'Raw Material',          14900, 13350, 'Medium',   'Open',        14],
      ['MAT-009', 'MasterMaterial', 'Raw Material',            690,  430,  'Low',      'Open',        18],
      ['PRD-010', 'MasterProduct',  'Production Constraint',  6400, 3900,  'Critical', 'Open',         7],
      ['MAT-002', 'MasterMaterial', 'Raw Material',          12300, 9800,  'Medium',   'Action Taken', 11],
      ['MAT-006', 'MasterMaterial', 'Raw Material',           8700, 7250,  'Low',      'Action Taken', 16],
      ['MAT-001', 'MasterMaterial', 'Raw Material',           5400, 5400,  'Medium',   'Resolved',    -3]
    ];
    const shortages = n('shortagerecords', await ShortageRecord.create(
      SHORTAGES.map(([item, model, cat, req, avail, sev, status, due]) => ({
        runId: liveRun._id,
        itemModel: toModel(model),
        itemId: model === 'MasterMaterial' ? MAT(item)._id : P(item)._id,
        shortageCategory: cat,
        requiredQty: req,
        availableQty: avail,
        shortageQty: Math.max(0, req - avail),
        impactDate: due < 0 ? daysAgo(-due) : daysAhead(due),
        severity: sev,
        status,
        companyId: company?._id
      }))
    ));

    n('constraintdetails', await ConstraintDetails.create([
      { shortageId: shortages[5]._id, constraintType: 'Capacity Deficit',
        description: 'Press shop is loaded to 97% for the next three weeks. 250T #1 cannot absorb the cross member batch without a third shift.',
        companyId: company?._id },
      { shortageId: shortages[2]._id, constraintType: 'Lead Time Violation',
        description: 'Turned spacer sub-order placed 6 days late against an 18 day supplier lead time.',
        companyId: company?._id }
    ]));

    n('resolutionlogs', await ResolutionLog.create([
      { shortageId: shortages[6]._id, actionType: 'Expedite PO', referenceDocNo: 'PO-2026-2004',
        actionedBy: admin._id, actionDate: daysAgo(8), companyId: company?._id },
      { shortageId: shortages[7]._id, actionType: 'Substitute Item', referenceDocNo: 'SUB/GI-1.0/CRCA-1.2',
        actionedBy: admin._id, actionDate: daysAgo(5), companyId: company?._id },
      { shortageId: shortages[8]._id, actionType: 'Create Transfer', referenceDocNo: 'TR-2026-0118',
        actionedBy: admin._id, actionDate: daysAgo(19), companyId: company?._id }
    ]));

    const RECS = [
      ['MAT-003', 'MasterMaterial', 'Purchase',   'Create New',     13500, 'tata',   3, 12, 'Selected'],
      ['MAT-007', 'MasterMaterial', 'Purchase',   'Create New',      2830, 'jindal', 5, 21, 'Pending'],
      ['MAT-005', 'MasterMaterial', 'Purchase',   'Create New',      1550, 'jsw',    2, 14, 'Pending'],
      ['MAT-002', 'MasterMaterial', 'Purchase',   'Reschedule In',   2500, 'sail',   1,  9, 'Converted'],
      ['MAT-006', 'MasterMaterial', 'Purchase',   'Create New',      1450, 'apl',    4, 18, 'Pending'],
      ['MAT-009', 'MasterMaterial', 'Purchase',   'Create New',       260, 'ador',   2, 11, 'Pending'],
      ['PRD-001', 'MasterProduct',  'Production', 'Create New',     38000, null,     2, 10, 'Pending'],
      ['PRD-010', 'MasterProduct',  'Production', 'Reschedule Out',  6400, null,     6, 24, 'Pending'],
      ['PRD-013', 'MasterProduct',  'Production', 'Create New',     17600, null,     3, 16, 'Selected'],
      ['PRD-015', 'MasterProduct',  'Production', 'Create New',     14000, null,     1,  8, 'Rejected'],
      ['PRD-011', 'MasterProduct',  'Production', 'Create New',     12800, null,     4, 20, 'Pending'],
      ['MAT-004', 'MasterMaterial', 'Purchase',   'Cancel',          4200, 'tata',   0,  6, 'Dismissed']
    ];
    n('recommendationrecords', await RecommendationRecord.create(
      RECS.map(([item, model, cat, act, qty, vend, rel, due, status]) => ({
        runId: liveRun._id,
        itemModel: toModel(model),
        itemId: model === 'MasterMaterial' ? MAT(item)._id : P(item)._id,
        suggestionCategory: cat,
        actionType: act,
        suggestedQty: qty,
        suggestedReleaseDate: daysAhead(rel),
        suggestedDueDate: daysAhead(due),
        targetSupplierId: vend && VEND(vend) ? VEND(vend)._id : undefined,
        status,
        companyId: company?._id
      }))
    ));

    // ═══════════════════════════════════════════════════════════════════════════
    // (d) CAPACITY
    // ═══════════════════════════════════════════════════════════════════════════
    // Press shop runs two shifts six days; tool room is a single general shift.
    const WC_CAP = [
      ['WC-PRESS', 288, [281, 272, 258]],   // 2 shifts x 6 days x 24 machine-hours-ish
      ['WC-WELD',  144, [112, 126,  98]],
      ['WC-TOOL',   96, [ 34,  41,  29]],
      ['WC-QC',     96, [ 71,  78,  66]]
    ];
    const capDocs = [];
    WC_CAP.forEach(([wc, avail, used]) => {
      used.forEach((u, w) => {
        const pct = Math.round((u / avail) * 1000) / 10;
        capDocs.push({
          workCenterId: WC(wc)._id,
          periodLabel: `WEEK ${34 + w}`,
          startDate: daysAgo(14 - w * 7),
          endDate: daysAgo(8 - w * 7),
          availableHrs: avail,
          utilizedHrs: u,
          utilizationPct: pct,
          status: pct >= 95 ? 'Bottleneck' : pct < 55 ? 'Underutilized' : 'Optimal',
          companyId: company?._id
        });
      });
    });
    const capPeriods = n('capacityperiods', await CapacityPeriod.create(capDocs));

    n('loaddetails', await LoadDetail.create(
      capPeriods.slice(0, 10).map((cp, i) => {
        const setup = randInt(1, 4) + 0.5;
        const run = randInt(6, 26);
        return {
          capacityPeriodId: cp._id,
          workOrderId: (woHeaders[i % Math.max(woHeaders.length, 1)] || {})._id || cp._id,
          routingStepNo: [10, 20, 30, 40, 50][i % 5],
          setupHours: setup,
          runHours: run,
          totalRequiredHours: setup + run,
          companyId: company?._id
        };
      })
    ));

    const LABOR = [
      ['DEPT-PRESS', 'Morning', 22, 176, 168, 'Optimal'],
      ['DEPT-PRESS', 'Evening', 19, 152, 158, 'Understaffed'],
      ['DEPT-PRESS', 'Night',    8,  64,  48, 'Overstaffed'],
      ['DEPT-WELD',  'Morning', 12,  96,  91, 'Optimal'],
      ['DEPT-WELD',  'Evening',  9,  72,  78, 'Understaffed'],
      ['DEPT-TOOL',  'Morning',  6,  48,  22, 'Overstaffed'],
      ['DEPT-QC',    'Morning',  7,  56,  52, 'Optimal'],
      ['DEPT-QC',    'Evening',  4,  32,  35, 'Skill Constraint'],
      ['DEPT-STORE', 'Morning',  5,  40,  33, 'Optimal']
    ];
    const laborPeriods = n('laborcapacityperiods', await LaborCapacityPeriod.create(
      LABOR.filter(([d]) => DEPT(d)).map(([dept, shift, head, avail, planned, status]) => ({
        departmentId: DEPT(dept)._id,
        shiftName: shift,
        standardShiftHours: 8,
        periodLabel: `WEEK ${36}`,
        startDate: daysAgo(1),
        endDate: daysAhead(5),
        headcount: head,
        availableHrs: avail,
        plannedHrs: planned,
        varianceHrs: avail - planned,
        status,
        companyId: company?._id
      }))
    ));

    n('laborloaddetails', await LaborLoadDetail.create(
      laborPeriods.slice(0, 8).map((lp, i) => ({
        laborPeriodId: lp._id,
        workOrderId: (woHeaders[i % Math.max(woHeaders.length, 1)] || {})._id || lp._id,
        routingStepNo: [10, 20, 30, 40][i % 4],
        requiredLaborHours: randInt(6, 34),
        skillLevelRequired: pick(['Basic', 'Intermediate', 'Expert'], i),
        companyId: company?._id
      }))
    ));

    // Legacy flat capacity views (the V1 screens read these).
    n('capacitymachines', await CapacityMachine.create(
      WC_CAP.flatMap(([wc, avail, used]) => used.map((u, w) => ({
        workCenterId: WC(wc)._id,
        period: `Week ${34 + w} - 2026`,
        availableHours: avail,
        utilizedHours: u,
        bottleneckDetails: u / avail > 0.95
          ? 'Both 250T presses committed to TVS and Brakes India schedules; no slot for new blanking jobs.'
          : undefined
      })))
    ));

    n('capacitylabors', await CapacityLabor.create(
      LABOR.map(([dept, shift, head, avail, planned]) => ({
        department: (DEPT(dept) || {}).name || dept,
        period: label(monthStart(0)),
        totalOperators: head,
        shiftType: shift,
        availableShiftHours: avail,
        plannedWorkforceHours: planned,
        notes: planned > avail ? 'Overtime approved to cover the shortfall.' : undefined
      }))
    ));

    // ═══════════════════════════════════════════════════════════════════════════
    // (e) MAINTENANCE
    // ═══════════════════════════════════════════════════════════════════════════
    const PMS = [
      ['MC-001', 'Slide gib clearance check and central lubrication top-up — 250T', 'Completed', -26, 'Time-Based'],
      ['MC-002', 'Clutch/brake air line inspection and dryer drain — 250T',          'Completed', -12, 'Time-Based'],
      ['MC-003', 'Crown bearing greasing and flywheel brake pad check — 160T',       'Overdue',    -9, 'Usage-Based'],
      ['MC-004', 'Die cushion pressure calibration — 63T',                           'Overdue',    -4, 'Time-Based'],
      ['MC-006', 'Laser optics cleaning, nozzle change and beam calibration',        'In Progress', 0, 'Condition-Based'],
      ['MC-007', 'Press brake ram parallelism and crowning check',                   'Scheduled',   5, 'Time-Based'],
      ['MC-008', 'Shear blade gap adjustment and hold-down cylinder service',        'Scheduled',  11, 'Usage-Based'],
      ['MC-010', 'MIG torch liner and contact tip replacement, gas leak test',       'Scheduled',  18, 'Time-Based'],
      ['MC-009', 'Tube bender mandrel and wiper die inspection',                     'Cancelled',  -2, 'Time-Based']
    ];
    const pmHeaders = n('preventivemaintenanceheaders', await PreventiveMaintenanceHeader.create(
      PMS.map(([mc, task, status, off, type], i) => ({
        PM_ID: `PM-2026-${String(801 + i)}`,
        Machine_ID: MC(mc)._id,
        Task_Summary: task,
        Status: status,
        Technician_ID: (users[i % users.length] || admin)?._id,
        Scheduled_Date: off < 0 ? daysAgo(-off) : daysAhead(off),
        Executed_Date: status === 'Completed' ? daysAgo(-off - 1) : undefined,
        Maintenance_Type: type,
        Plant_ID: plant._id,
        ...stamp
      }))
    ));

    const CHECKS = [
      'Lock out / tag out and confirm zero energy',
      'Inspect and record gib clearance at four corners',
      'Top up central lubrication reservoir (ISO VG 220)',
      'Check air dryer bowl and drain condensate',
      'Verify e-stop and light curtain response',
      'Record vibration reading and log in machine history'
    ];
    n('maintenancetaskchecklists', await MaintenanceTaskChecklist.create(
      pmHeaders.flatMap((h, i) => CHECKS.slice(0, i % 2 === 0 ? 3 : 2).map((c, j) => ({
        PM_ID: h._id,
        Sequence_Number: j + 1,
        Task_Description: c,
        Is_Completed: h.Status === 'Completed' || (h.Status === 'In Progress' && j === 0),
        Task_Notes: h.Status === 'Completed' ? 'Within limits.' : undefined,
        ...stamp
      })))
    ));

    n('sparepartsconsumptions', await SparePartsConsumption.create(
      pmHeaders.filter((h) => ['Completed', 'In Progress'].includes(h.Status)).map((h, i) => ({
        PM_ID: h._id,
        Spare_Part_ID: MAT(pick(['MAT-009', 'MAT-010'], i))._id,
        Planned_Quantity: randInt(1, 4),
        Actual_Quantity_Consumed: randInt(1, 4),
        UOM_ID: uomKg?._id,
        ...stamp
      }))
    ));

    const BREAKDOWNS = [
      ['MC-001', 'Clutch–brake solenoid sticking; press stopping mid-stroke on the brake pedal bracket job.', 'Resolved',           6.5, 12],
      ['MC-006', 'Chiller alarm E-31, cutting head overheating after 40 minutes of continuous cut.',          'In Progress',        3.0,  2],
      ['MC-003', 'Hydraulic overload pump seal leaking, oil on the bolster. Seal kit on order from Coimbatore.', 'Waiting on Spares', 21.0,  4],
      ['MC-008', 'Back gauge encoder drift — cut length out by 1.8 mm across the strip.',                     'Open',               1.5,  1]
    ];
    const incidents = n('breakdownincidentheaders', await BreakdownIncidentHeader.create(
      BREAKDOWNS.map(([mc, issue, status, hours, daysBack], i) => ({
        Incident_ID: `BD-2026-${String(401 + i)}`,
        Machine_ID: MC(mc)._id,
        Reported_Issue: issue,
        Reported_By_ID: (users[i % users.length] || admin)?._id,
        Reported_Datetime: daysAgo(daysBack),
        Resolution_Datetime: status === 'Resolved' ? daysAgo(daysBack - 1) : undefined,
        Total_Downtime_Hours: hours,
        Status: status,
        Plant_ID: plant._id,
        ...stamp
      }))
    ));

    n('repairactionlogs', await RepairActionLog.create(
      incidents.flatMap((inc, i) => ([
        { Incident_ID: inc._id, Technician_ID: (users[i % users.length] || admin)?._id,
          Action_Taken: 'Attended the call, isolated the machine and confirmed the symptom on a dry cycle.',
          Log_Datetime: inc.Reported_Datetime, Labor_Hours_Spent: 0.5, ...stamp },
        { Incident_ID: inc._id, Technician_ID: (users[(i + 1) % users.length] || admin)?._id,
          Action_Taken: pick([
            'Stripped and cleaned the solenoid valve, replaced the seal kit and re-tested 50 strokes.',
            'Flushed the chiller circuit, topped up coolant. Waiting for the OEM engineer on the flow sensor.',
            'Raised an urgent indent for the seal kit; machine tagged out until the part lands.',
            'Re-zeroed the back gauge; drift returned after 200 cuts, encoder suspected.'
          ], i),
          Log_Datetime: new Date(inc.Reported_Datetime.getTime() + 3 * 36e5),
          Labor_Hours_Spent: randInt(1, 5), ...stamp }
      ]))
    ));

    n('breakdownsparepartsconsumptions', await BreakdownSparePartsConsumption.create(
      incidents.slice(0, 3).map((inc, i) => ({
        Incident_ID: inc._id,
        Spare_Part_ID: MAT(pick(['MAT-009', 'MAT-010'], i))._id,
        Quantity_Consumed: randInt(1, 3),
        UOM_ID: uomKg?._id,
        Unit_Cost: pick([1850, 4200, 980], i),
        ...stamp
      }))
    ));

    n('breakdowncostanalyses', await BreakdownCostAnalysis.create(
      incidents.map((inc, i) => {
        const spares = pick([3700, 4200, 12600, 0], i);
        const labor = Math.round(inc.Total_Downtime_Hours * 320);
        const downtime = Math.round(inc.Total_Downtime_Hours * 2800);
        return {
          Incident_ID: inc._id,
          Spares_Cost: spares, Labor_Cost: labor, Downtime_Cost: downtime,
          Total_Incident_Cost: spares + labor + downtime,
          ...stamp
        };
      })
    ));

    // Legacy flat maintenance rows (V1 screens).
    n('maintenancepreventives', await MaintenancePreventive.create(
      PMS.filter(([, , s]) => s !== 'Cancelled').map(([mc, task, status, off], i) => ({
        scheduleNumber: `PMS-2026-${String(901 + i)}`,
        machineId: MC(mc)._id,
        maintenanceTask: task,
        scheduledDate: off < 0 ? daysAgo(-off) : daysAhead(off),
        executionDate: status === 'Completed' ? daysAgo(-off - 1) : undefined,
        status: status === 'In Progress' ? 'In-Progress' : status,
        assignedTechnician: pick(techNames, i),
        executionNotes: status === 'Completed' ? 'Completed, machine released to production.' : undefined
      }))
    ));

    n('maintenancebreakdowns', await MaintenanceBreakdown.create(
      BREAKDOWNS.map(([mc, issue, status, hours, daysBack], i) => ({
        breakdownNumber: `BRK-2026-${String(501 + i)}`,
        machineId: MC(mc)._id,
        reportedDate: daysAgo(daysBack),
        issueDescription: issue,
        repairStatus: status === 'Resolved' ? 'Resolved'
          : status === 'Open' ? 'Reported' : 'In-Repair',
        repairNotes: status === 'Open' ? undefined : 'Under attention by the maintenance cell.',
        resolutionDate: status === 'Resolved' ? daysAgo(daysBack - 1) : undefined,
        resolutionDetails: status === 'Resolved'
          ? 'Solenoid valve seal kit replaced, 50 dry strokes verified, handed back to press shop.' : undefined,
        downtimeDurationHours: hours,
        downtimeCostPerHour: 2800
      }))
    ));

    const SPARES = [
      ['SP-001', 'MAT-010', 'Clutch–brake seal kit — 250T press',      42, 1850],
      ['SP-002', 'MAT-010', 'Hydraulic overload pump seal kit — 160T',  3, 4200],
      ['SP-003', 'MAT-009', 'MIG torch liner 4.5 m',                   26,  980],
      ['SP-004', 'MAT-009', 'MIG contact tip 1.2 mm (pack of 10)',      8,  620],
      ['SP-005', 'MAT-010', 'Shear blade set — 3 mm capacity',          2, 38500],
      ['SP-006', 'MAT-010', 'Laser nozzle 1.5 mm — copper',            14, 1240]
    ];
    const ledgers = n('sparepartledgers', await SparePartLedger.create(
      SPARES.map(([pid, mat, name, qty, cost]) => ({
        Part_ID: pid,
        Material_ID: MAT(mat)._id,
        Part_Name: name,
        Stock_On_Hand: qty,
        Unit_Cost: cost,
        Total_Value: qty * cost,
        Minimum_Stock_Level: pid === 'SP-002' ? 6 : pid === 'SP-005' ? 4 : 5,
        Is_Reorder_Warning: (pid === 'SP-002' || pid === 'SP-005'),
        UOM_ID: uomEa?._id,
        Plant_ID: plant._id,
        ...stamp
      }))
    ));

    const activityLogs = n('partactivitylogs', await PartActivityLog.create(
      ledgers.flatMap((l, i) => ([
        { Activity_ID: `ACT-${String(i * 2 + 1).padStart(4, '0')}`, Part_ID: l._id, Activity_Type: 'Receipt',
          Transaction_Quantity: randInt(5, 40), Unit_Cost_At_Transaction: l.Unit_Cost,
          Transaction_Date: daysAgo(randInt(30, 90)), Performed_By_ID: admin?._id, ...stamp },
        { Activity_ID: `ACT-${String(i * 2 + 2).padStart(4, '0')}`, Part_ID: l._id, Activity_Type: 'Issue',
          Transaction_Quantity: -randInt(1, 6), Unit_Cost_At_Transaction: l.Unit_Cost,
          Transaction_Date: daysAgo(randInt(1, 25)), Performed_By_ID: admin?._id, ...stamp }
      ]))
    ));

    n('maintenancelinkages', await MaintenanceLinkage.create(
      activityLogs.filter((a) => a.Activity_Type === 'Issue').slice(0, 5).map((a, i) => ({
        Activity_ID: a._id,
        Maintenance_Type: pick(['Preventive', 'Breakdown', 'General'], i),
        Reference_Ticket_ID: i % 2 === 0 ? pmHeaders[i % pmHeaders.length].PM_ID : incidents[i % incidents.length].Incident_ID,
        Target_Machine_ID: MC(pick(['MC-001', 'MC-003', 'MC-006', 'MC-008', 'MC-010'], i))._id,
        Remarks: 'Issued against the maintenance ticket from the spares crib.',
        ...stamp
      }))
    ));

    n('maintenancespareparts', await MaintenanceSparePart.create(
      SPARES.flatMap(([pid, mat, name, qty, cost], i) => ([
        { transactionId: `MSP-${String(i * 2 + 1).padStart(4, '0')}`, materialId: MAT(mat)._id,
          transactionType: 'Receipt', quantity: randInt(4, 30), unitCost: cost,
          totalCost: 0, referenceType: 'Initial Stock', referenceId: pid,
          dateRecorded: daysAgo(randInt(40, 110)) },
        { transactionId: `MSP-${String(i * 2 + 2).padStart(4, '0')}`, materialId: MAT(mat)._id,
          transactionType: 'Consumption', quantity: randInt(1, 5), unitCost: cost,
          totalCost: 0, referenceType: i % 2 === 0 ? 'Preventive' : 'Breakdown',
          referenceId: i % 2 === 0 ? pmHeaders[i % pmHeaders.length].PM_ID : incidents[i % incidents.length].Incident_ID,
          dateRecorded: daysAgo(randInt(2, 30)) }
      ])).map((d) => ({ ...d, totalCost: d.quantity * d.unitCost }))
    ));

    // ═══════════════════════════════════════════════════════════════════════════
    // (f) APPROVALS
    // ═══════════════════════════════════════════════════════════════════════════
    const lvl = (roleId, status) => ({ level: 1, roleId, status: status || 'Pending' });
    const APPROVALS = [
      ['Engineering Change', 'approve', 'Pending',
       { ecrNumber: 'ECR-2026-004', title: 'Renest SS 304 heat shield blank', estimatedSavingPerPiece: 7.35 }],
      ['Engineering Change', 'approve', 'Pending',
       { ecrNumber: 'ECR-2026-005', title: 'Seat frame weld fixture rework', priority: 'Urgent/Line-Down' }],
      ['BOM Revision', 'update', 'Pending',
       { bomCode: 'BOM-P011', revisionCode: 'v1.1', change: 'CRCA 1.2 to GI 1.0', costDelta: -2.6 }],
      ['Dispatch Plan', 'create', 'Pending',
       { planNumber: 'DP-2026-4008', customer: 'Wheels India', weightKg: 5960, vehicle: 'KA05MH7719' }],
      ['MRP Recommendation', 'convert', 'Pending',
       { item: 'CRCA Coil 1.6mm', quantityKg: 13500, supplier: 'Tata Steel', valueInr: 810000 }],
      ['Maintenance', 'create', 'Pending',
       { incident: 'BD-2026-403', machine: 'Power Press 160T', spare: 'Hydraulic overload pump seal kit', valueInr: 12600 }],
      ['Capacity Plan', 'update', 'Approved',
       { workCentre: 'Press Shop', action: 'Add third shift for WEEK 36', additionalHours: 96 }],
      ['Engineering Change', 'approve', 'Rejected',
       { ecrNumber: 'ECR-2026-006', title: 'Silencer bracket in aluminium', costImpactPerPiece: 11.2 }]
    ];
    n('approvalrequests', await ApprovalRequest.create(
      APPROVALS.map(([mod, action, status, payload], i) => ({
        module: mod,
        action,
        payload,
        requestedBy: (users[i % users.length] || admin)._id,
        status,
        currentLevel: 1,
        requiredLevels: [
          lvl(roleAdmin._id, status === 'Pending' ? 'Pending' : status),
          { level: 2, roleId: roleSales._id, status: 'Pending' }
        ],
        createdAt: daysAgo(randInt(1, 20))
      }))
    ));

    return out;
  }
};
