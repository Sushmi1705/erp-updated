/* Procurement + Goods Receipt — LBAP demo data.
 *
 * Story: Stores raises steel requisitions, purchase floats RFQs to the mills
 * (Tata / JSW / SAIL / Jindal), bids are scored, POs are awarded, and coil
 * arrives against the six existing POs via GRNs — including a short-shipment,
 * a rejected lot and a receipt held because its PO is still unapproved.
 * Vendor scorecards are computed with the SAME formula the controller uses
 * (procurement.controller.js :: recalculateScorecard) so the numbers survive a
 * recalculation from the UI.
 *
 * Collections owned by this seeder:
 *   prheaders, prlineitems, approvalroutinglogs,
 *   rfqheaders, rfqlineitems, vendorbids, bidscoringmatrixes,
 *   vendorscorecards, kpieventlogs,
 *   goodsreceipts, pochangehistories
 */

module.exports = {
  name: 'Procurement',
  run: async (ctx) => {
    const { M, col, daysAgo, daysAhead, YEAR } = ctx;

    const { PRHeader, PRLineItem, ApprovalRoutingLog } = M('PurchaseRequisition');
    const { RFQHeader, RFQLineItem, VendorBid, BidScoringMatrix } = M('PurchaseRFQ');
    const { POChangeHistory } = M('PurchaseOrder');
    const { VendorScorecard, KPIEventLog } = M('VendorPerformance');
    const GoodsReceipt = M('GoodsReceipt');

    const COMPANY = ctx.company ? ctx.company._id : undefined;
    const PLANT = ctx.plant ? ctx.plant._id : undefined;
    const ADMIN = ctx.admin._id;

    // --- master data lookups (read-only) -----------------------------------
    const V = {};
    ctx.vendors.forEach((v) => { V[v.code] = v; });
    const MAT = {};
    ctx.materials.forEach((m) => { MAT[m.code] = m; });
    const DEPT = {};
    ctx.departments.forEach((d) => { DEPT[d.code] = d; });

    // Rotate requisitioners across whatever real users exist.
    const people = ctx.users.length ? ctx.users : [ctx.admin];
    const who = (i) => people[i % people.length]._id;

    const poHeaders = await col('poheaders').find({}).toArray();
    const poLines = await col('polineitems').find({}).toArray();
    const poByNumber = {};
    poHeaders.forEach((p) => { poByNumber[p.poNumber] = p; });
    const poLine = (poNumber, matCode) => {
      const po = poByNumber[poNumber];
      if (!po) return null;
      const mat = MAT[matCode];
      const lines = poLines.filter(
        (l) => String(l.poId) === String(po._id) && String(l.materialId) === String(mat._id)
      );
      return lines.length ? { po, mat, lines } : null;
    };

    // --- wipe (re-runnable) -------------------------------------------------
    const owned = ['prheaders', 'prlineitems', 'approvalroutinglogs', 'rfqheaders',
      'rfqlineitems', 'vendorbids', 'bidscoringmatrixes', 'vendorscorecards',
      'kpieventlogs', 'goodsreceipts', 'pochangehistories'];
    for (const c of owned) await col(c).deleteMany({});

    const counts = {};

    // =======================================================================
    // 1. PURCHASE REQUISITIONS (+ lines + approval routing)
    // =======================================================================
    const PRS = [
      {
        n: '3001', raised: 55, status: 'PO_Created', dept: 'DEPT-STORE',
        lines: [
          { mat: 'MAT-002', qty: 24000, price: 61, need: -18, vendor: 'VND-001', st: 'Sourced' },
          { mat: 'MAT-003', qty: 18000, price: 60, need: -18, vendor: 'VND-001', st: 'Sourced' }
        ],
        approvals: [
          { seq: 1, days: 54, status: 'Approved', c: 'Coil stock below reorder point — M. Selvam, Stores' },
          { seq: 2, days: 53, status: 'Approved', c: 'Released to sourcing. Float RFQ to all four mills — R. Kumar, Purchase' }
        ]
      },
      {
        n: '3002', raised: 48, status: 'PO_Created', dept: 'DEPT-PRESS',
        lines: [
          { mat: 'MAT-005', qty: 21000, price: 55, need: -12, vendor: 'VND-003', st: 'Sourced' }
        ],
        approvals: [
          { seq: 1, days: 47, status: 'Approved', c: 'For Ashok Leyland cross-member run on the 250T line — S. Menon' },
          { seq: 2, days: 46, status: 'Approved', c: 'Approved against Q2 steel budget — R. Kumar, Purchase' }
        ]
      },
      {
        n: '3003', raised: 40, status: 'Approved', dept: 'DEPT-PRESS',
        lines: [
          { mat: 'MAT-006', qty: 9000, price: 68, need: -4, vendor: 'VND-005', st: 'Sourced' }
        ],
        approvals: [
          { seq: 1, days: 39, status: 'Approved', c: 'Heat shield schedule for Lucas-TVS — A. Iyer' },
          { seq: 2, days: 38, status: 'Approved', c: 'Approved — R. Kumar, Purchase' }
        ]
      },
      {
        n: '3004', raised: 33, status: 'Approved', dept: 'DEPT-WELD',
        lines: [
          { mat: 'MAT-007', qty: 2200, price: 245, need: 5, vendor: 'VND-002', st: 'Sourced' }
        ],
        approvals: [
          { seq: 1, days: 32, status: 'Approved', c: 'SS 304 for the Bosch exhaust bracket program — V. Reddy' },
          { seq: 2, days: 31, status: 'Approved', c: 'Sealed bid RFQ floated, three mills invited — R. Kumar' }
        ]
      },
      {
        n: '3005', raised: 28, status: 'Needs_CFO_Approval', dept: 'DEPT-TOOL',
        lines: [
          { mat: 'MAT-010', qty: 4200, price: 340, need: 12, vendor: 'VND-009', st: 'Pending' }
        ],
        approvals: [
          { seq: 1, days: 27, status: 'Approved', c: 'D2 blocks for the new blanking die (Wheels India) — D. Prakash, Tool Room' },
          { seq: 2, days: 26, status: 'Approved', c: 'Technically cleared. Value crosses ₹10L, routing to CFO — R. Kumar' },
          { seq: 3, days: null, status: 'Pending', c: null }
        ]
      },
      {
        n: '3006', raised: 21, status: 'Approved', dept: 'DEPT-WELD',
        lines: [
          { mat: 'MAT-009', qty: 900, price: 135, need: -6, vendor: 'VND-007', st: 'Sourced' }
        ],
        approvals: [
          { seq: 1, days: 20, status: 'Approved', c: 'Welding wire for the assembly cell — P. Nair' },
          { seq: 2, days: 20, status: 'Approved', c: 'Approved, call-off against Ador rate contract — R. Kumar' }
        ]
      },
      {
        n: '3007', raised: 14, status: 'In_Approval', dept: 'DEPT-PRESS',
        lines: [
          { mat: 'MAT-008', qty: 1400, price: 280, need: 16, vendor: 'VND-004', st: 'Pending' }
        ],
        approvals: [
          { seq: 1, days: 13, status: 'Approved', c: 'Trial batch for the Titan light bracket enquiry — A. Iyer' },
          { seq: 2, days: null, status: 'Pending', c: null }
        ]
      },
      {
        n: '3008', raised: 6, status: 'In_Approval', dept: 'DEPT-STORE',
        lines: [
          { mat: 'MAT-001', qty: 12000, price: 62, need: -1, vendor: 'VND-001', st: 'Pending' }
        ],
        approvals: [
          { seq: 1, days: 5, status: 'Approved', c: 'URGENT — 0.8mm coil short for the TVS bracket schedule, line stops Friday — M. Selvam' },
          { seq: 2, days: null, status: 'Pending', c: null }
        ]
      },
      {
        n: '3009', raised: 3, status: 'Draft', dept: 'DEPT-STORE',
        lines: [
          { mat: 'MAT-004', qty: 15000, price: 56, need: 21, vendor: null, st: 'Pending' }
        ],
        approvals: []
      },
      {
        n: '3010', raised: 11, status: 'Rejected', dept: 'DEPT-WELD',
        lines: [
          { mat: 'MAT-007', qty: 3000, price: 262, need: 9, vendor: 'VND-002', st: 'Pending' }
        ],
        approvals: [
          { seq: 1, days: 10, status: 'Approved', c: 'Buffer stock request — V. Reddy' },
          { seq: 2, days: 9, status: 'Rejected', c: 'Rejected — ₹262/kg is 7% over last landed rate. Re-float the RFQ — K. Rajan, Plant Head' }
        ]
      },
      {
        n: '3011', raised: 9, status: 'Approved', dept: 'DEPT-TOOL',
        lines: [
          { mat: 'MAT-010', qty: 700, price: 340, need: 4, vendor: 'VND-009', st: 'Pending' }
        ],
        approvals: [
          { seq: 1, days: 8, status: 'Approved', c: 'Die insert replacement, Rane tool — D. Prakash' },
          { seq: 2, days: 8, status: 'Approved', c: 'Approved — R. Kumar' }
        ]
      }
    ];

    const prByNumber = {};
    let prLineCount = 0;
    let approvalCount = 0;

    for (let i = 0; i < PRS.length; i++) {
      const p = PRS[i];
      const total = p.lines.reduce((s, l) => s + l.qty * l.price, 0);
      const header = await PRHeader.create({
        prNumber: `PR-${YEAR}-${p.n}`,
        requesterId: who(i),
        costCenterId: DEPT[p.dept] ? DEPT[p.dept]._id : undefined,
        totalValue: total,
        currency: 'INR',
        submissionDate: daysAgo(p.raised),
        status: p.status,
        companyId: COMPANY,
        plantId: PLANT,
        createdBy: ADMIN
      });
      prByNumber[p.n] = header;

      for (const l of p.lines) {
        await PRLineItem.create({
          prHeaderId: header._id,
          itemId: MAT[l.mat]._id,
          supplierId: l.vendor ? V[l.vendor]._id : undefined,
          qty: l.qty,
          unitPrice: l.price,
          requiredDate: l.need < 0 ? daysAgo(-l.need) : daysAhead(l.need),
          lineStatus: l.st,
          companyId: COMPANY,
          plantId: PLANT,
          createdBy: ADMIN
        });
        prLineCount++;
      }

      for (const a of p.approvals) {
        await ApprovalRoutingLog.create({
          prHeaderId: header._id,
          approverUserId: who(i + a.seq),
          sequence: a.seq,
          status: a.status,
          actionTimestamp: a.days === null ? undefined : daysAgo(a.days),
          comments: a.c || undefined,
          companyId: COMPANY,
          plantId: PLANT,
          createdBy: ADMIN
        });
        approvalCount++;
      }
    }
    counts.prheaders = PRS.length;
    counts.prlineitems = prLineCount;
    counts.approvalroutinglogs = approvalCount;

    // =======================================================================
    // 2. VENDOR SCORECARDS + KPI EVENT LOG
    //    Values are derived with the controller's own formula:
    //      otif  = 100 + Σ(delivery impacts)
    //      ppm   = -100 × Σ(quality impacts)
    //      score = 0.4·otif + 0.4·max(0, 100 - ppm/100) + (Blocked ? 0 : 20)
    // =======================================================================
    const KPI = [
      {
        v: 'VND-001', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5006`, cat: 'Delivery', impact: -5, d: 12, note: 'CRCA 1.6mm coil arrived 1 day past promised date.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7101`, cat: 'Quality', impact: -1.2, d: 11, note: 'Minor edge burr on 2 coils, dressed in-house.' }
        ]
      },
      {
        v: 'VND-002', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5014`, cat: 'Delivery', impact: -10, d: 6, note: 'Two days late — mill dispatch backlog at Vijayanagar.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7104`, cat: 'Quality', impact: -3.5, d: 5, note: 'Thickness at lower tolerance band on one coil.' }
        ]
      },
      {
        v: 'VND-003', risk: 'Probation', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5001`, cat: 'Delivery', impact: -15, d: 30, note: 'HR coil 3 days late against PO-2026-2001.' },
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5003`, cat: 'Delivery', impact: -20, d: 22, note: 'D2 block consignment 4 days late, 270 kg short-shipped.' },
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5005`, cat: 'Delivery', impact: -25, d: 4, note: 'PO-2026-2002 balance still not dispatched, 5 days overdue.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7102`, cat: 'Quality', impact: -12, d: 12, note: 'Rust patches on 2 of 9 coils, conditional acceptance.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7103`, cat: 'Quality', impact: -10, d: 2, note: 'Wrong grade delivered against PO-2026-2003, lot returned.' }
        ]
      },
      {
        v: 'VND-004', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5009`, cat: 'Delivery', impact: -10, d: 18, note: 'Two days late, transporter breakdown near Krishnagiri.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7105`, cat: 'Quality', impact: -30, d: 17, note: 'Surface scoring on CRCA — 4.2% of the lot scrapped.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7106`, cat: 'Quality', impact: -12, d: 7, note: 'Repeat surface defect. 8D requested from mill.' }
        ]
      },
      {
        v: 'VND-005', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5011`, cat: 'Delivery', impact: -5, d: 20, note: 'One day late, otherwise in full.' }
        ]
      },
      {
        v: 'VND-006', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5010`, cat: 'Delivery', impact: -15, d: 9, note: 'Three days late against PO-2026-2004.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7107`, cat: 'Quality', impact: -7.5, d: 9, note: '320 kg rejected for edge damage and rust.' }
        ]
      },
      {
        v: 'VND-007', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5013`, cat: 'Delivery', impact: -5, d: 15, note: 'Welding wire delivered a day late.' }
        ]
      },
      {
        v: 'VND-009', risk: 'Approved', events: [
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5008`, cat: 'Delivery', impact: -20, d: 25, note: 'Import consignment held 4 days at Chennai customs.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7108`, cat: 'Quality', impact: -2, d: 24, note: 'Hardness marginally below spec on one block.' }
        ]
      },
      {
        v: 'VND-010', risk: 'Blocked', events: [
          { m: 'Compliance_Monitor', ref: `CERT-EXP-${YEAR}-01`, cat: 'Compliance', impact: -100, d: 8, note: 'ISO 9001 certificate expired 08-Aug. Vendor blocked, CAPA raised with K. Rajan.' },
          { m: 'Goods_Receipt', ref: `GRN-${YEAR}-5012`, cat: 'Delivery', impact: -20, d: 26, note: 'Heat-treated batch returned 4 days late.' },
          { m: 'QA_Inspection', ref: `QA-${YEAR}-7109`, cat: 'Quality', impact: -30, d: 26, note: 'Case depth out of spec on 3% of the batch.' }
        ]
      }
    ];

    const scoreByVendor = {};
    let kpiCount = 0;
    for (const row of KPI) {
      const vendor = V[row.v];
      if (!vendor) continue;
      let delivery = 0;
      let quality = 0;
      for (const e of row.events) {
        await KPIEventLog.create({
          vendorId: vendor._id,
          sourceModule: e.m,
          referenceDocId: e.ref,
          kpiCategory: e.cat,
          impactValue: e.impact,
          notes: e.note,
          createdAt: daysAgo(e.d),
          updatedAt: daysAgo(e.d)
        });
        kpiCount++;
        if (e.cat === 'Delivery') delivery += e.impact;
        if (e.cat === 'Quality') quality += e.impact;
      }
      const otif = Math.max(0, 100 + delivery);
      const ppm = Math.max(0, quality * -100);
      const compliance = row.risk === 'Blocked' ? 0 : 20;
      const overall = Math.min(100, Math.max(0,
        (otif * 0.4) + (Math.max(0, 100 - (ppm / 100)) * 0.4) + compliance));
      // Purchase price variance against the standard rate, in %.
      const ppv = row.v === 'VND-003' ? 2.8 : row.v === 'VND-004' ? -1.4 : row.v === 'VND-001' ? -0.8 : 0.6;

      const sc = await VendorScorecard.create({
        vendorId: vendor._id,
        currentOverallScore: Number(overall.toFixed(1)),
        rollingOtifPct: Number(otif.toFixed(1)),
        rollingDefectPpm: Math.round(ppm),
        rollingPpvPct: ppv,
        riskStatus: row.risk,
        lastCalculated: daysAgo(1)
      });
      scoreByVendor[row.v] = sc;
    }
    counts.kpieventlogs = kpiCount;
    counts.vendorscorecards = Object.keys(scoreByVendor).length;

    const multiplier = (vCode) => {
      const sc = scoreByVendor[vCode];
      return sc ? Math.max(0.1, sc.currentOverallScore / 100) : 1.0;
    };

    // =======================================================================
    // 3. RFQs + line items + vendor bids + scoring matrix
    // =======================================================================
    const RFQS = [
      {
        n: '4001', title: 'CRCA 1.2mm coil — 24 MT quarterly call-off', type: 'Standard RFQ',
        pub: 50, deadline: -40, status: 'Awarded', pr: '3001',
        mat: 'MAT-002', qty: 24000, target: 18,
        invited: ['VND-001', 'VND-002', 'VND-003', 'VND-004'],
        bids: [
          { v: 'VND-001', price: 60.5, lead: 12, st: 'Awarded' },
          { v: 'VND-002', price: 62.0, lead: 14, st: 'Disqualified' },
          { v: 'VND-003', price: 59.8, lead: 26, st: 'Disqualified' },
          { v: 'VND-004', price: 61.4, lead: 16, st: 'Disqualified' }
        ],
        qa: [
          { from: 'VND-002', msg: 'Please confirm whether coil width is 1250mm slit or mother coil.' },
          { from: 'user', msg: '1250mm slit, edge trimmed. Test certificate per heat is mandatory.' }
        ]
      },
      {
        n: '4002', title: 'HR coil 3.0mm — 21 MT for Ashok Leyland cross-member', type: 'Standard RFQ',
        pub: 44, deadline: -36, status: 'Awarded', pr: '3002',
        mat: 'MAT-005', qty: 21000, target: 12,
        invited: ['VND-002', 'VND-003', 'VND-004'],
        bids: [
          { v: 'VND-003', price: 54.2, lead: 15, st: 'Awarded' },
          { v: 'VND-002', price: 55.6, lead: 13, st: 'Disqualified' },
          { v: 'VND-004', price: 56.1, lead: 18, st: 'Disqualified' }
        ],
        qa: []
      },
      {
        n: '4003', title: 'GI sheet 1.0mm — heat shield stock for Lucas-TVS', type: 'Standard RFQ',
        pub: 30, deadline: -22, status: 'Scoring', pr: '3003',
        mat: 'MAT-006', qty: 9000, target: 6,
        invited: ['VND-005', 'VND-002', 'VND-004'],
        bids: [
          { v: 'VND-005', price: 67.4, lead: 10, st: 'Submitted' },
          { v: 'VND-002', price: 66.9, lead: 17, st: 'Submitted' },
          { v: 'VND-004', price: 69.2, lead: 9, st: 'Submitted' }
        ],
        qa: [
          { from: 'VND-005', msg: 'Can we offer 120 GSM zinc coating instead of 180 GSM? Rate is ₹2.10 lower.' }
        ]
      },
      {
        n: '4004', title: 'SS 304 1.0mm — Bosch exhaust bracket program', type: 'Sealed Bid',
        pub: 12, deadline: 4, status: 'Published', pr: '3004',
        mat: 'MAT-007', qty: 2200, target: 20,
        invited: ['VND-002', 'VND-004', 'VND-006'],
        bids: [
          { v: 'VND-002', price: 243.0, lead: 20, st: 'Submitted' },
          { v: 'VND-004', price: 248.5, lead: 16, st: 'Submitted' },
          { v: 'VND-006', price: 241.2, lead: 24, st: 'Submitted' }
        ],
        qa: [
          { from: 'VND-006', msg: 'Confirming this is a sealed bid — will rates stay masked till the deadline?' },
          { from: 'user', msg: 'Yes. Prices unseal automatically on 23rd. No revisions after submission.' }
        ]
      },
      {
        n: '4005', title: 'Tool steel D2 blocks — Wheels India blanking die', type: 'Standard RFQ',
        pub: 20, deadline: 2, status: 'Scoring', pr: '3005',
        mat: 'MAT-010', qty: 4200, target: 25,
        invited: ['VND-009', 'VND-006', 'VND-002'],
        bids: [
          { v: 'VND-009', price: 336.0, lead: 28, st: 'Submitted' },
          { v: 'VND-006', price: 348.0, lead: 18, st: 'Submitted' }
        ],
        qa: []
      },
      {
        n: '4006', title: 'Aluminium sheet 1.5mm — Titan trial batch', type: 'Standard RFQ',
        pub: 2, deadline: 10, status: 'Draft', pr: '3007',
        mat: 'MAT-008', qty: 1400, target: 22,
        invited: ['VND-004', 'VND-005'],
        bids: [],
        qa: []
      },
      {
        n: '4007', title: 'CRCA 0.8mm — spot buy against TVS schedule', type: 'Standard RFQ',
        pub: 24, deadline: -15, status: 'Cancelled', pr: null,
        mat: 'MAT-001', qty: 12000, target: 3,
        invited: ['VND-001', 'VND-002'],
        bids: [
          { v: 'VND-002', price: 64.8, lead: 21, st: 'Disqualified' }
        ],
        qa: [
          { from: 'user', msg: 'Cancelled — requirement re-raised on PR-2026-3008 with a firmer schedule.' }
        ]
      }
    ];

    let rfqLineCount = 0;
    let bidCount = 0;
    let scoreCount = 0;

    for (const r of RFQS) {
      const header = await RFQHeader.create({
        rfqNumber: `RFQ-${YEAR}-${r.n}`,
        title: r.title,
        sourcingType: r.type,
        publishDate: daysAgo(r.pub),
        submissionDeadline: r.deadline < 0 ? daysAgo(-r.deadline) : daysAhead(r.deadline),
        status: r.status,
        invitedVendors: r.invited.map((c) => V[c]._id),
        qaThreads: r.qa.map((q, k) => ({
          senderId: q.from === 'user' ? ADMIN : V[q.from]._id,
          senderModel: q.from === 'user' ? 'User' : 'Vendor',
          message: q.msg,
          timestamp: daysAgo(r.pub - 1 - k)
        })),
        companyId: COMPANY,
        plantId: PLANT,
        createdBy: ADMIN
      });

      const line = await RFQLineItem.create({
        rfqId: header._id,
        materialId: MAT[r.mat]._id,
        requisitionId: r.pr && prByNumber[r.pr] ? prByNumber[r.pr]._id : undefined,
        requestedQty: r.qty,
        targetDeliveryDate: daysAhead(r.target),
        companyId: COMPANY,
        plantId: PLANT,
        createdBy: ADMIN
      });
      rfqLineCount++;

      if (!r.bids.length) continue;
      const minPrice = Math.min(...r.bids.map((b) => b.price));
      const minLead = Math.min(...r.bids.map((b) => b.lead));

      for (const b of r.bids) {
        const bid = await VendorBid.create({
          rfqLineId: line._id,
          vendorId: V[b.v]._id,
          offeredUnitPrice: b.price,
          offeredLeadTimeDays: b.lead,
          totalValue: Math.round(b.price * r.qty),
          status: b.st,
          createdAt: daysAgo(Math.max(1, r.pub - 4)),
          updatedAt: daysAgo(Math.max(1, r.pub - 4)),
          companyId: COMPANY,
          plantId: PLANT,
          createdBy: ADMIN
        });
        bidCount++;

        const priceScore = (minPrice / b.price) * 100;
        const leadTimeScore = (minLead / b.lead) * 100;
        const mult = multiplier(b.v);
        await BidScoringMatrix.create({
          bidId: bid._id,
          priceScore: Number(priceScore.toFixed(2)),
          leadTimeScore: Number(leadTimeScore.toFixed(2)),
          vendorRatingMultiplier: Number(mult.toFixed(3)),
          finalWeightedScore: Number((((priceScore * 0.7) + (leadTimeScore * 0.3)) * mult).toFixed(2))
        });
        scoreCount++;
      }
    }
    counts.rfqheaders = RFQS.length;
    counts.rfqlineitems = rfqLineCount;
    counts.vendorbids = bidCount;
    counts.bidscoringmatrixes = scoreCount;

    // =======================================================================
    // 4. GOODS RECEIPTS against the six existing POs
    // =======================================================================
    const GRNS = [
      { n: '5001', po: 'PO-2026-2001', mat: 'MAT-004', recd: 4000, d: 30, status: 'Posted',
        note: 'Lorry TN-20-BC-4471. 3 days late against promise. Unloaded at RM store — M. Selvam.' },
      { n: '5002', po: 'PO-2026-2001', mat: 'MAT-004', recd: 3577, d: 24, status: 'Posted',
        note: 'Balance quantity received in full. PO line closed.' },
      { n: '5003', po: 'PO-2026-2001', mat: 'MAT-010', recd: 7100, d: 22, status: 'Posted', short: true,
        note: 'SHORT SHIPMENT — 270 kg short against PO. Short-close agreed with SAIL, debit note DN-2026-118 raised.' },
      { n: '5004', po: 'PO-2026-2002', mat: 'MAT-006', recd: 2500, d: 16, status: 'Posted',
        note: 'Part consignment. Balance 2805 kg still in transit from the mill.' },
      { n: '5005', po: 'PO-2026-2002', mat: 'MAT-005', recd: 3800, d: 4, status: 'Inspecting',
        note: 'Held at incoming bay for IQC — sampling by A. Iyer, Quality.' },
      { n: '5006', po: 'PO-2026-2003', mat: 'MAT-003', recd: 5000, d: 12, status: 'Posted',
        note: 'Coils weighed on the weighbridge, 5 coils. Test certificates attached.' },
      { n: '5007', po: 'PO-2026-2003', mat: 'MAT-002', recd: 3600, d: 2, status: 'Received',
        note: 'Awaiting inspection allocation. Stored in bay B-4.' },
      { n: '5008', po: 'PO-2026-2003', mat: 'MAT-003', recd: 2200, d: 2, status: 'Cancelled',
        note: 'WRONG GRADE — 1.2mm supplied against a 1.6mm line. Full lot returned on the same vehicle, GRN cancelled.' },
      { n: '5009', po: 'PO-2026-2004', mat: 'MAT-005', recd: 4200, d: 18, status: 'Posted',
        note: 'Received against Kalyani despatch advice KSL/2026/3391.' },
      { n: '5010', po: 'PO-2026-2004', mat: 'MAT-003', recd: 4749, d: 9, status: 'Posted', reject: 320,
        note: 'REJECTION — 320 kg rejected for edge damage and rust. Balance accepted. Rejection note RJ-2026-046.' },
      { n: '5011', po: 'PO-2026-2005', mat: 'MAT-004', recd: 9098, d: 20, status: 'Posted', lineQty: 9098,
        note: 'Full line quantity received in one lot. Storekeeper: M. Selvam.' },
      { n: '5012', po: 'PO-2026-2005', mat: 'MAT-004', recd: 2074, d: 8, status: 'Posted', lineQty: 2074,
        note: 'Second line closed. PO fully delivered.' },
      { n: '5013', po: 'PO-2026-2006', mat: 'MAT-010', recd: 2500, d: 5, status: 'Received',
        note: 'HELD — PO is still pending approval. Material quarantined in the bonded area, not posted to stock.' },
      { n: '5014', po: 'PO-2026-2006', mat: 'MAT-003', recd: 5200, d: 1, status: 'Inspecting',
        note: 'Two days late from JSW. Under IQC, dimensional check pending.' }
    ];

    let grnCount = 0;
    const grnSkipped = [];
    for (const g of GRNS) {
      const hit = poLine(g.po, g.mat);
      if (!hit) { grnSkipped.push(`${g.n}/${g.po}`); continue; }
      // A PO can carry two lines of the same material — pin the receipt to the
      // intended line, otherwise take the first line that covers the quantity.
      const line = (g.lineQty && hit.lines.find((l) => l.orderQty === g.lineQty))
        || hit.lines.find((l) => l.orderQty >= g.recd)
        || hit.lines[0];
      const accepted = g.reject ? g.recd - g.reject : g.recd;
      await GoodsReceipt.create({
        grnNumber: `GRN-${YEAR}-${g.n}`,
        receiptDate: daysAgo(g.d),
        purchaseOrderId: hit.po._id,
        vendorId: hit.po.vendorId,
        materialId: hit.mat._id,
        poQuantity: line.orderQty,
        receivedQuantity: g.recd,
        status: g.status,
        notes: g.note,
        lineItems: [{
          materialId: hit.mat._id,
          poLineItemId: line._id,
          quantity: g.recd,
          acceptedQuantity: g.status === 'Cancelled' ? 0 : accepted,
          returnedQty: g.status === 'Cancelled' ? g.recd : (g.reject || 0)
        }],
        createdAt: daysAgo(g.d),
        updatedAt: daysAgo(g.d),
        companyId: COMPANY,
        plantId: PLANT,
        createdBy: ADMIN
      });
      grnCount++;
    }
    counts.goodsreceipts = grnCount;

    // =======================================================================
    // 5. PO CHANGE HISTORY on the existing POs
    // =======================================================================
    const CHANGES = [
      { po: 'PO-2026-2001', v: 2, f: 'unitPrice', o: '58', n: '56', d: 40, re: true },
      { po: 'PO-2026-2001', v: 2, f: 'orderQty', o: '7000', n: '7577', d: 40, re: true },
      { po: 'PO-2026-2002', v: 2, f: 'incoterms', o: 'EXW', n: 'DDP', d: 33, re: false },
      { po: 'PO-2026-2003', v: 2, f: 'promisedDeliveryDate', o: '24-Aug-2026', n: '31-Aug-2026', d: 15, re: false },
      { po: 'PO-2026-2003', v: 3, f: 'orderQty', o: '9336', n: '7136', d: 2, re: true },
      { po: 'PO-2026-2004', v: 2, f: 'paymentTerms', o: 'Due on Receipt', n: 'Net30', d: 26, re: true },
      { po: 'PO-2026-2005', v: 2, f: 'promisedDeliveryDate', o: '18-Aug-2026', n: '22-Aug-2026', d: 12, re: false },
      { po: 'PO-2026-2006', v: 2, f: 'orderQty', o: '8500', n: '9985', d: 3, re: true },
      { po: 'PO-2026-2006', v: 2, f: 'totalAmount', o: '3201900', n: '3706900', d: 3, re: true }
    ];
    let changeCount = 0;
    for (const c of CHANGES) {
      const po = poByNumber[c.po];
      if (!po) continue;
      await POChangeHistory.create({
        poId: po._id,
        changedBy: ADMIN,
        changeTimestamp: daysAgo(c.d),
        version: c.v,
        fieldChanged: c.f,
        oldValue: c.o,
        newValue: c.n,
        requiresReapproval: c.re
      });
      changeCount++;
    }
    counts.pochangehistories = changeCount;

    if (grnSkipped.length) counts._grnSkipped = grnSkipped.join(',');
    return counts;
  }
};
