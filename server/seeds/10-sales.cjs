/* SALES PIPELINE — everything that happens before (and just after) the order.
 *
 * Story: enquiries land from the TN/Karnataka auto belt, engineering checks
 * feasibility on the new parts, some get quoted (with revisions when the
 * customer pushes back on price), a handful are won and turn into the sales
 * orders that already exist, a couple are lost or left to expire. The won
 * orders then get delivery releases and stock allocations — including some
 * that are already past due.
 *
 * Owns: inquiryheaders, inquirylineitems, crossreferences, feasibilityreviews,
 *       followups, quotationheaders, quotationrevisions, quotationlineitems,
 *       quotetaxdiscounts, quoteapprovals, sodeliveryschedules, soallocations.
 * Reads (never writes): customers, products, uoms, currencies, users, roles,
 *       soheaders, solineitems, inventorystocks.
 */

const GST = 18; // IGST/CGST+SGST headline rate on auto components

module.exports = {
  name: 'Sales Pipeline',

  run: async (ctx) => {
    const { col, M, daysAgo, daysAhead, YEAR } = ctx;

    const { InquiryHeader, InquiryLineItem, CrossReference, FeasibilityReview, FollowUp } =
      M('SalesInquiry');
    const { QuotationHeader, QuotationRevision, QuotationLineItem, QuoteTaxDiscount, QuoteApproval } =
      M('SalesQuotation');
    const { SODeliverySchedule, SOAllocation } = M('SalesOrder');

    // ── re-runnable: wipe only our own collections ───────────────────────────
    for (const c of ['inquiryheaders', 'inquirylineitems', 'crossreferences',
                     'feasibilityreviews', 'followups', 'quotationheaders',
                     'quotationrevisions', 'quotationlineitems', 'quotetaxdiscounts',
                     'quoteapprovals', 'sodeliveryschedules', 'soallocations']) {
      await col(c).deleteMany({});
    }

    // ── shared refs ──────────────────────────────────────────────────────────
    const audit = {
      createdBy: ctx.admin?._id, updatedBy: ctx.admin?._id,
      companyId: ctx.company?._id, plantId: ctx.plant?._id
    };
    const cust = Object.fromEntries(ctx.customers.map((c) => [c.code, c]));
    const prod = Object.fromEntries(ctx.products.map((p) => [p.code, p]));
    const ea = ctx.uomEa?._id || null;

    const roles = await col('roles').find({}).toArray();
    const salesMgrRole = roles.find((r) => /sales/i.test(r.name || '')) ||
                         roles.find((r) => /admin/i.test(r.name || '')) || roles[0];
    const plantHeadRole = roles.find((r) => /admin/i.test(r.name || '')) || salesMgrRole;

    // Sales reps / engineers — the ERP only has a handful of real user rows, so
    // the human names live in the narrative fields and the refs reuse what exists.
    const staff = ctx.users.length ? ctx.users : [ctx.admin];
    const who = (i) => staff[i % staff.length]?._id || ctx.admin?._id;

    // ═══════════════════════════════════════════════════════════════════════
    // A. ENQUIRIES
    // ═══════════════════════════════════════════════════════════════════════
    const INQ = [
      { n: 1, c: 'CUST-001', type: 'RFQ', status: 'Closed-Won', recv: 54, target: 44, win: 100, rep: 0,
        lines: [
          { s: 10, cp: 'TVS-BRK-44710', oem: '44710-KWB-900', p: 'PRD-001', q: 48000, tp: 46, st: 'Quoted' },
          { s: 20, cp: 'TVS-CLU-44712', oem: '44712-KWB-900', p: 'PRD-002', q: 36000, tp: 50, st: 'Quoted' }
        ] },
      { n: 2, c: 'CUST-002', type: 'RFQ', status: 'Closed-Won', recv: 47, target: 38, win: 100, rep: 1,
        lines: [
          { s: 10, cp: 'AL-CRM-90112', oem: 'ALX-90112', p: 'PRD-010', q: 6500, tp: 205, st: 'Quoted' },
          { s: 20, cp: 'AL-BTR-90118', oem: 'ALX-90118', p: 'PRD-011', q: 9000, tp: 86, st: 'Quoted' },
          { s: 30, cp: 'AL-HSH-90124', oem: 'ALX-90124', p: 'PRD-013', q: 4200, tp: 92, st: 'Quoted' }
        ] },
      { n: 3, c: 'CUST-003', type: 'Standard', status: 'Quoted', recv: 31, target: 22, win: 65, rep: 2,
        lines: [
          { s: 10, cp: 'BI-PED-2201', oem: 'BI-2201-A', p: 'PRD-001', q: 26000, tp: 45, st: 'Quoted' },
          { s: 20, cp: 'BI-STY-2208', oem: 'BI-2208-A', p: 'PRD-006', q: 40000, tp: 27, st: 'Quoted' }
        ] },
      // Overdue: promised a quote 6 days ago, still sitting in Active.
      { n: 4, c: 'CUST-004', type: 'Blanket Contract', status: 'Active', recv: 26, target: 6, win: 55, rep: 0,
        lines: [
          { s: 10, cp: 'SFL-FTM-7714', oem: 'SF-7714', p: 'PRD-005', q: 72000, tp: 54, st: 'Evaluating' },
          { s: 20, cp: 'SFL-FRB-7719', oem: 'SF-7719', p: 'PRD-008', q: 55000, tp: 42, st: 'Open' }
        ] },
      { n: 5, c: 'CUST-005', type: 'RFQ', status: 'Closed-Won', recv: 42, target: 33, win: 100, rep: 1,
        lines: [
          { s: 10, cp: 'RML-SPC-3341', oem: 'RM-3341', p: 'PRD-015', q: 120000, tp: 11, st: 'Quoted' },
          { s: 20, cp: 'RML-MGS-3346', oem: 'RM-3346', p: 'PRD-006', q: 45000, tp: 28, st: 'Quoted' }
        ] },
      { n: 6, c: 'CUST-006', type: 'Sample Request', status: 'Feasibility Check', recv: 19, target: 5, win: 40, rep: 2,
        lines: [
          { s: 10, cp: 'LTVS-ALT-5510', oem: 'LT-5510', p: null, q: 250, tp: 320, st: 'Evaluating' },
          { s: 20, cp: 'LTVS-ENG-5514', oem: 'LT-5514', p: 'PRD-012', q: 8000, tp: 108, st: 'Evaluating' }
        ] },
      { n: 7, c: 'CUST-007', type: 'RFQ', status: 'Quoted', recv: 24, target: 16, win: 70, rep: 0,
        lines: [
          { s: 10, cp: 'WIL-SMB-8802', oem: 'WI-8802', p: 'PRD-004', q: 33000, tp: 39, st: 'Quoted' },
          { s: 20, cp: 'WIL-SMF-8807', oem: 'WI-8807', p: 'PRD-009', q: 7500, tp: 124, st: 'Quoted' }
        ] },
      // Lost on landed cost against a Pune supplier.
      { n: 8, c: 'CUST-008', type: 'Standard', status: 'Closed-Lost', recv: 58, target: 50, win: 0, rep: 1,
        lines: [
          { s: 10, cp: 'BOS-NPB-1120', oem: 'BO-1120', p: 'PRD-007', q: 90000, tp: 16, st: 'Rejected' },
          { s: 20, cp: 'BOS-SSB-1125', oem: 'BO-1125', p: 'PRD-003', q: 30000, tp: 31, st: 'Rejected' }
        ] },
      // Overdue: engineering feasibility has been open past the target date.
      { n: 9, c: 'CUST-009', type: 'RFQ', status: 'Feasibility Check', recv: 15, target: 3, win: 50, rep: 2,
        lines: [
          { s: 10, cp: 'SCL-ENG-6602', oem: 'SC-6602', p: 'PRD-012', q: 14000, tp: 106, st: 'Evaluating' },
          { s: 20, cp: 'SCL-XMB-6609', oem: 'SC-6609', p: null, q: 3000, tp: 240, st: 'Evaluating' }
        ] },
      { n: 10, c: 'CUST-010', type: 'RFQ', status: 'Quoted', recv: 21, target: 11, win: 45, rep: 0,
        lines: [
          { s: 10, cp: 'CAT-XMB-4405', oem: 'CAT-4405', p: 'PRD-010', q: 2800, tp: 198, st: 'Quoted' },
          { s: 20, cp: 'CAT-TOOL-4405', oem: 'CAT-4405-T', p: null, q: 1, tp: 190000, st: 'Quoted' }
        ] },
      { n: 11, c: 'CUST-011', type: 'Sample Request', status: 'New', recv: 4, target: -9, win: 25, rep: 1,
        lines: [
          { s: 10, cp: 'TTN-PRS-0091', oem: 'TT-0091', p: null, q: 500, tp: 145, st: 'Open' }
        ] },
      { n: 12, c: 'CUST-012', type: 'Blanket Contract', status: 'Active', recv: 12, target: -4, win: 60, rep: 2,
        lines: [
          { s: 10, cp: 'IYM-SSB-2210', oem: 'IY-2210', p: 'PRD-003', q: 88000, tp: 33, st: 'Evaluating' },
          { s: 20, cp: 'IYM-FRB-2214', oem: 'IY-2214', p: 'PRD-008', q: 64000, tp: 43, st: 'Open' }
        ] },
      { n: 13, c: 'CUST-001', type: 'Standard', status: 'New', recv: 2, target: -12, win: 35, rep: 0,
        lines: [
          { s: 10, cp: 'TVS-HSH-44890', oem: '44890-KWB-900', p: 'PRD-013', q: 15000, tp: 90, st: 'Open' }
        ] },
      // Lost by silence — the quote simply ran out of validity.
      { n: 14, c: 'CUST-003', type: 'RFQ', status: 'Closed-Lost', recv: 60, target: 52, win: 0, rep: 1,
        lines: [
          { s: 10, cp: 'BI-SMF-2240', oem: 'BI-2240', p: 'PRD-009', q: 5200, tp: 130, st: 'Rejected' }
        ] }
    ];

    const inqNo = (n) => `INQ-${YEAR}-${ctx.pad(n)}`;
    const qtNo = (n) => `QT-${YEAR}-${ctx.pad(n)}`;

    const inqDocs = INQ.map((i) => ({
      inquiryNumber: inqNo(i.n),
      customerId: cust[i.c]._id,
      contactPersonId: who(i.n),
      dateReceived: daysAgo(i.recv),
      targetQuotationDate: i.target >= 0 ? daysAgo(i.target) : daysAhead(-i.target),
      inquiryType: i.type,
      status: i.status,
      salesRepId: who(i.rep),
      probabilityOfWin: i.win,
      quotationId: null,
      ...audit
    }));
    const inqRows = await InquiryHeader.insertMany(inqDocs);
    const inqById = Object.fromEntries(inqRows.map((r) => [r.inquiryNumber, r]));

    const lineDocs = [];
    for (const i of INQ) {
      for (const l of i.lines) {
        lineDocs.push({
          inquiryId: inqById[inqNo(i.n)]._id,
          lineSequence: l.s,
          customerPartNumber: l.cp,
          oemPartNumber: l.oem,
          productId: l.p ? prod[l.p]._id : null,
          requestedQuantity: l.q,
          uomId: ea,
          targetUnitPrice: l.tp,
          lineStatus: l.st,
          isLocked: l.st === 'Quoted',
          ...audit
        });
      }
    }
    const lineRows = await InquiryLineItem.insertMany(lineDocs);
    // key: "<inquiry n>#<sequence>"
    const lineKey = {};
    lineRows.forEach((r) => {
      const parent = inqRows.find((h) => String(h._id) === String(r.inquiryId));
      lineKey[`${Number(parent.inquiryNumber.slice(-4))}#${r.lineSequence}`] = r;
    });
    const L = (n, s) => lineKey[`${n}#${s}`]._id;

    // ═══════════════════════════════════════════════════════════════════════
    // B. CROSS-REFERENCE / FITMENT — customer part vs. our part number
    // ═══════════════════════════════════════════════════════════════════════
    const XREF = [
      { n: 1, s: 10, p: 'PRD-001', m: 'Exact Match', primary: true, note: 'Same blank, same 4-hole PCD. Runs on the 250T line as-is.' },
      { n: 1, s: 20, p: 'PRD-002', m: 'Exact Match', primary: true, note: 'Existing TVS tool T-0442, no change.' },
      { n: 2, s: 10, p: 'PRD-010', m: 'Form-Fit-Function', primary: true, note: 'Weld nut position differs 3 mm from our standard; fixture shim covers it.' },
      { n: 2, s: 20, p: 'PRD-011', m: 'Exact Match', primary: true, note: 'Drop-in for ALX-90118.' },
      { n: 2, s: 30, p: 'PRD-013', m: 'Modification Required', primary: true, note: 'Aluminised steel spec instead of CRCA — needs blank size change.' },
      { n: 3, s: 10, p: 'PRD-001', m: 'Exact Match', primary: true, note: 'Brakes India drawing matches our PRD-001 rev C.' },
      { n: 3, s: 20, p: 'PRD-006', m: 'Form-Fit-Function', primary: true, note: 'Stay length 4 mm longer; trim die insert change only.' },
      { n: 5, s: 10, p: 'PRD-015', m: 'Exact Match', primary: true, note: 'Turned spacer, identical to Rane 3341 already supplied.' },
      { n: 6, s: 20, p: 'PRD-012', m: 'Modification Required', primary: true, note: 'Lucas-TVS wants an extra M8 boss — new pierce station needed.' },
      { n: 7, s: 10, p: 'PRD-004', m: 'Exact Match', primary: true, note: 'Wheels India silencer bracket, existing tool.' },
      { n: 7, s: 20, p: 'PRD-009', m: 'Form-Fit-Function', primary: true, note: 'Seat frame profile matches; different e-coat spec.' },
      { n: 9, s: 10, p: 'PRD-012', m: 'Form-Fit-Function', primary: true, note: 'Sundaram Clayton 6602 is our engine bracket with a mirrored bend.' },
      { n: 9, s: 10, p: 'PRD-010', m: 'Modification Required', primary: false, note: 'Alternative if customer accepts the heavier cross member.' },
      { n: 10, s: 10, p: 'PRD-010', m: 'Modification Required', primary: true, note: 'Caterpillar spec is 3.0 mm HR — beyond current die clearance, needs regrind.' },
      { n: 12, s: 10, p: 'PRD-003', m: 'Exact Match', primary: true, note: 'Yamaha side stand bracket, same as IY-2210 supplied in FY25.' }
    ];
    const xrefRows = await CrossReference.insertMany(XREF.map((x) => ({
      inquiryLineId: L(x.n, x.s),
      internalProductId: prod[x.p]._id,
      matchType: x.m,
      fitmentNotes: x.note,
      isPrimaryMatch: x.primary,
      ...audit
    })));

    // ═══════════════════════════════════════════════════════════════════════
    // C. ENGINEERING FEASIBILITY (one per enquiry line, unique index)
    // ═══════════════════════════════════════════════════════════════════════
    const FEAS = [
      { n: 1, s: 10, tool: false, cost: 0, lead: 21, st: 'Approved',
        note: 'Existing tool T-0442. 250T press, 14 SPM. Cleared by A. Iyer.' },
      { n: 2, s: 30, tool: true, cost: 185000, lead: 45, st: 'Conditional',
        note: 'Aluminised steel heat shield needs a new blanking die. Approved subject to customer funding the tool. — V. Reddy' },
      { n: 4, s: 10, tool: false, cost: 0, lead: 28, st: 'Approved',
        note: 'Blanket schedule of 72k/yr fits the 160T line at 2 shifts. — R. Kumar' },
      { n: 4, s: 20, tool: true, cost: 145000, lead: 50, st: 'Pending',
        note: 'Footrest LH/RH needs a progressive tool; tool room loaded till month end.' },
      { n: 6, s: 10, tool: true, cost: 210000, lead: 60, st: 'Pending',
        note: 'Alternator mounting sample — no drawing revision from Lucas-TVS yet, awaiting 3D model.' },
      { n: 6, s: 20, tool: false, cost: 32000, lead: 30, st: 'Conditional',
        note: 'Extra M8 boss possible with an insert change; needs PPAP re-submission. — S. Menon' },
      { n: 9, s: 10, tool: false, cost: 0, lead: 25, st: 'Approved',
        note: 'Mirrored bend achievable on the press brake. — M. Selvam' },
      // The deliberate no: not enough tonnage.
      { n: 9, s: 20, tool: true, cost: 260000, lead: 75, st: 'Rejected',
        note: '3.2 mm HR cross member at this blank size needs ~310T. Highest press on floor is 250T. Declining.' },
      { n: 10, s: 20, tool: true, cost: 185000, lead: 55, st: 'Approved',
        note: 'Blanking die quoted at 1.85 lakh, 8 weeks from PO. Tool room slot booked. — D. Prakash' },
      { n: 11, s: 10, tool: true, cost: 95000, lead: 40, st: 'Pending',
        note: 'Titan precision pressing — tolerance band ±0.05 mm, needs a trial before we commit. — K. Rajan' },
      { n: 12, s: 20, tool: false, cost: 0, lead: 22, st: 'Approved',
        note: 'Yamaha footrest runs on the same tool as SFL-7719. — P. Nair' }
    ];
    const feasRows = await FeasibilityReview.insertMany(FEAS.map((f) => ({
      inquiryLineId: L(f.n, f.s),
      engineeringTaskId: null,
      isToolingRequired: f.tool,
      estimatedToolingCost: f.cost,
      estimatedLeadTimeDays: f.lead,
      approvalStatus: f.st,
      engineeringNotes: f.note,
      ...audit
    })));

    // ═══════════════════════════════════════════════════════════════════════
    // D. QUOTATIONS — headers, revisions, lines, taxes, approvals
    // ═══════════════════════════════════════════════════════════════════════
    // ln: [lineType, productCode|null, description, qty, unitPrice, unitCost, discount%]
    const QUOTES = [
      { n: 1, inq: 1, created: 48, rep: 0, revs: [
        { r: 1, from: 48, to: 18, st: 'Rejected', locked: true, margin: false,
          ln: [['Standard Part', 'PRD-001', 'Brake pedal bracket, CRCA 2.5 mm, e-coat', 48000, 52, 41, 0],
               ['Standard Part', 'PRD-002', 'Clutch pedal bracket, CRCA 2.5 mm, e-coat', 36000, 56, 44, 0]],
          td: [['Tax', GST], ['Shipping', 0, 18000]],
          appr: [{ role: 'sales', act: 'Approved', ago: 47, note: 'Standard margin, cleared. — R. Kumar' }] },
        { r: 2, from: 44, to: 30, st: 'Accepted', locked: true, margin: true,
          ln: [['Standard Part', 'PRD-001', 'Brake pedal bracket, CRCA 2.5 mm, e-coat', 48000, 48, 41, 2],
               ['Standard Part', 'PRD-002', 'Clutch pedal bracket, CRCA 2.5 mm, e-coat', 36000, 52, 44, 2]],
          td: [['Tax', GST], ['Discount', 2], ['Shipping', 0, 18000]],
          appr: [{ role: 'sales', act: 'Requested Changes', ago: 45, note: 'Margin below 15% after the cut — needs plant head sign-off.' },
                 { role: 'plant', act: 'Approved', ago: 44, note: 'Approved on volume. Converted to SO-2026-1001. — V. Reddy' }] }
      ] },
      { n: 2, inq: 2, created: 41, rep: 1, revs: [
        { r: 1, from: 41, to: 25, st: 'Accepted', locked: true, margin: false,
          ln: [['Standard Part', 'PRD-010', 'Cross member assembly, HR 3.0 mm, welded', 6500, 210, 168, 0],
               ['Standard Part', 'PRD-011', 'Battery tray assembly, CRCA 2.0 mm', 9000, 88, 68, 0],
               ['Tooling Cost', null, 'Blanking die for aluminised heat shield ALX-90124', 1, 185000, 152000, 0]],
          td: [['Tax', GST], ['Shipping', 0, 26000]],
          appr: [{ role: 'sales', act: 'Approved', ago: 40, note: 'Tooling recovered in full. Converted to SO-2026-1002. — S. Menon' }] }
      ] },
      { n: 3, inq: 3, created: 27, rep: 2, revs: [
        { r: 1, from: 27, to: 13, st: 'Sent to Customer', locked: true, margin: false,
          ln: [['Standard Part', 'PRD-001', 'Brake pedal bracket for BI-2201-A', 26000, 47, 38, 0],
               ['Standard Part', 'PRD-006', 'Mudguard stay, CRCA 1.6 mm', 40000, 29, 23, 0]],
          td: [['Tax', GST]],
          appr: [{ role: 'sales', act: 'Approved', ago: 26, note: 'Sent to Brakes India purchase, awaiting confirmation. — A. Iyer' }] }
      ] },
      { n: 4, inq: 5, created: 38, rep: 1, revs: [
        { r: 1, from: 38, to: 20, st: 'Rejected', locked: true, margin: false,
          ln: [['Standard Part', 'PRD-015', 'Precision turned spacer, EN8', 120000, 13, 10, 0],
               ['Standard Part', 'PRD-006', 'Mudguard stay for RM-3346', 45000, 30, 23, 0]],
          td: [['Tax', GST]],
          appr: [{ role: 'sales', act: 'Approved', ago: 37, note: 'First offer, Rane asked for a 10% reduction on the spacer.' }] },
        { r: 2, from: 34, to: 22, st: 'Accepted', locked: true, margin: true,
          ln: [['Standard Part', 'PRD-015', 'Precision turned spacer, EN8 — revised price', 120000, 11, 10, 0],
               ['Standard Part', 'PRD-006', 'Mudguard stay for RM-3346', 45000, 29, 23, 0]],
          td: [['Tax', GST], ['Discount', 1.5]],
          appr: [{ role: 'sales', act: 'Requested Changes', ago: 35, note: 'Spacer margin down to 9% — below the 12% floor.' },
                 { role: 'plant', act: 'Approved', ago: 34, note: 'Taken on volume, spacer runs unattended on night shift. Converted to SO-2026-1005. — P. Nair' }] }
      ] },
      { n: 5, inq: 7, created: 20, rep: 0, revs: [
        { r: 1, from: 20, to: 10, st: 'Sent to Customer', locked: true, margin: false,
          ln: [['Standard Part', 'PRD-004', 'Silencer mounting bracket, CRCA 2.0 mm', 33000, 41, 32, 0],
               ['Standard Part', 'PRD-009', 'Seat mounting frame, welded sub-assembly', 7500, 128, 101, 0]],
          td: [['Tax', GST], ['Shipping', 0, 12000]],
          appr: [{ role: 'sales', act: 'Approved', ago: 19, note: 'Quote with Wheels India since last week. — R. Kumar' }] }
      ] },
      { n: 6, inq: 8, created: 55, rep: 1, revs: [
        { r: 1, from: 55, to: 40, st: 'Rejected', locked: true, margin: true,
          ln: [['Standard Part', 'PRD-007', 'Number plate bracket, CRCA 1.6 mm', 90000, 18, 16, 0],
               ['Standard Part', 'PRD-003', 'Side stand bracket, CRCA 2.5 mm', 30000, 34, 28, 0]],
          td: [['Tax', GST]],
          appr: [{ role: 'sales', act: 'Rejected', ago: 54, note: 'Bosch landed price from the Pune supplier is Rs 15.40. We cannot go below Rs 17.20. Walking away. — M. Selvam' }] }
      ] },
      // Sitting in approval for 12 days — margin flag never cleared.
      { n: 7, inq: 10, created: 17, rep: 0, revs: [
        { r: 1, from: 17, to: 13, st: 'Pending Approval', locked: false, margin: true,
          ln: [['Standard Part', 'PRD-010', 'Cross member, HR 3.0 mm, Caterpillar spec', 2800, 205, 186, 0],
               ['Tooling Cost', null, 'Blanking die CAT-4405-T, 8 weeks lead', 1, 185000, 168000, 0],
               ['NRE/Engineering', null, 'PPAP level 3 documentation and layout inspection', 1, 45000, 30000, 0]],
          td: [['Tax', GST]],
          appr: [{ role: 'sales', act: 'Approved', ago: 16, note: 'Sales cleared. Escalated for margin sign-off.' },
                 { role: 'plant', act: null, ago: 16, note: 'Awaiting plant head decision — cross member margin is 9.3%.' }] }
      ] },
      { n: 8, inq: 14, created: 56, rep: 1, revs: [
        { r: 1, from: 56, to: 26, st: 'Expired', locked: true, margin: false,
          ln: [['Standard Part', 'PRD-009', 'Seat mounting frame for BI-2240', 5200, 132, 104, 0]],
          td: [['Tax', GST]],
          appr: [{ role: 'sales', act: 'Approved', ago: 55, note: 'Quote issued; Brakes India never came back. Validity lapsed.' }] }
      ] },
      { n: 9, inq: 6, created: 8, rep: 2, revs: [
        { r: 1, from: 8, to: -22, st: 'Draft', locked: false, margin: false,
          ln: [['Custom Part', null, 'Alternator mounting bracket — sample lot of 250', 250, 340, 265, 0],
               ['NRE/Engineering', null, 'Sample tooling, fixture and first-article report', 1, 210000, 178000, 0],
               ['Standard Part', 'PRD-012', 'Engine mounting bracket with extra M8 boss', 8000, 112, 88, 0]],
          td: [['Tax', GST]],
          appr: [] }
      ] }
    ];

    const qhDocs = QUOTES.map((q) => ({
      quotationNumber: qtNo(q.n),
      customerId: inqById[inqNo(q.inq)].customerId,
      inquiryId: inqById[inqNo(q.inq)]._id,
      currencyId: ctx.inr?._id || null,
      salesRepId: who(q.rep),
      createdDate: daysAgo(q.created),
      ...audit
    }));
    const qhRows = await QuotationHeader.insertMany(qhDocs);
    const qhByNo = Object.fromEntries(qhRows.map((r) => [r.quotationNumber, r]));

    const revRows = [];
    const qlRows = [];
    const tdRows = [];
    const apRows = [];

    for (const q of QUOTES) {
      for (const rv of q.revs) {
        // price the lines first so the revision totals are real
        const lines = rv.ln.map(([type, pc, desc, qty, price, cost, disc]) => {
          const total = Math.round(qty * price * (1 - disc / 100));
          const gm = price > 0 ? Number((((price - cost) / price) * 100).toFixed(2)) : null;
          return {
            lineType: type,
            productId: pc ? prod[pc]._id : null,
            description: desc,
            quantity: qty,
            uomId: ea,
            unitCost: cost,
            unitPrice: price,
            lineDiscountPercentage: disc,
            lineTotal: total,
            grossMarginPct: gm,
            isBelowMarginThreshold: gm !== null && gm < 12
          };
        });
        const subTotal = lines.reduce((s, l) => s + l.lineTotal, 0);
        const discPct = (rv.td.find((t) => t[0] === 'Discount') || [])[1] || 0;
        const discAmt = Math.round(subTotal * discPct / 100);
        const shipAmt = (rv.td.find((t) => t[0] === 'Shipping') || [])[2] || 0;
        const taxAmt = Math.round((subTotal - discAmt) * GST / 100);

        const [rev] = await QuotationRevision.insertMany([{
          quotationId: qhByNo[qtNo(q.n)]._id,
          revisionNumber: rv.r,
          validFromDate: daysAgo(rv.from),
          validToDate: rv.to >= 0 ? daysAgo(rv.to) : daysAhead(-rv.to),
          subTotal,
          totalDiscountAmount: discAmt,
          totalTaxAmount: taxAmt,
          grandTotal: subTotal - discAmt + taxAmt + shipAmt,
          status: rv.st,
          isLocked: rv.locked,
          marginTriggered: rv.margin,
          ...audit
        }]);
        revRows.push(rev);

        const inserted = await QuotationLineItem.insertMany(lines.map((l, ix) => ({
          revisionId: rev._id,
          inquiryLineId: lineKey[`${q.inq}#${(ix + 1) * 10}`]?._id || null,
          ...l,
          ...audit
        })));
        qlRows.push(...inserted);

        for (const t of rv.td) {
          const [kind, rate, flat] = t;
          const amount = kind === 'Tax' ? taxAmt
            : kind === 'Discount' ? discAmt
            : kind === 'Shipping' ? shipAmt
            : Math.round(subTotal * (rate || 0) / 100);
          const [row] = await QuoteTaxDiscount.insertMany([{
            revisionId: rev._id,
            quoteLineId: null,          // header-level
            entryType: kind,
            taxCodeId: null,            // GST master not seeded in this module
            ratePercentage: kind === 'Shipping' ? 0 : (rate || 0),
            calculatedAmount: amount,
            ...audit
          }]);
          tdRows.push(row);
        }

        for (const a of rv.appr) {
          const [row] = await QuoteApproval.insertMany([{
            revisionId: rev._id,
            approverRoleId: (a.role === 'plant' ? plantHeadRole : salesMgrRole)._id,
            approverUserId: a.act ? who(q.rep + 1) : null,
            requestedAt: daysAgo(a.ago),
            actionTaken: a.act,
            actionAt: a.act ? daysAgo(a.ago) : null,
            approvalNotes: a.note,
            ...audit
          }]);
          apRows.push(row);
        }
      }
    }

    // point each quoted/won enquiry at its quotation header
    for (const q of QUOTES) {
      await InquiryHeader.updateOne(
        { _id: inqById[inqNo(q.inq)]._id },
        { $set: { quotationId: qhByNo[qtNo(q.n)]._id } }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // E. FOLLOW-UPS — some with next actions already past due
    // ═══════════════════════════════════════════════════════════════════════
    const FU = [
      { n: 1, ago: 53, m: 'Email', next: null, note: 'RFQ received from TVS purchase (Mr. R. Kumar). Drawings and volumes acknowledged.' },
      { n: 1, ago: 45, m: 'Meeting', next: null, note: 'Price review at Hosur plant. TVS asked for Rs 48 against our Rs 52; agreed to re-quote.' },
      { n: 1, ago: 43, m: 'Phone', next: null, note: 'Rev 2 accepted verbally by A. Iyer. PO to follow.' },
      { n: 2, ago: 46, m: 'Customer Portal', next: null, note: 'Ashok Leyland floated the RFQ on their supplier portal. Uploaded our offer including tooling.' },
      { n: 2, ago: 39, m: 'Email', next: null, note: 'Tooling amortisation accepted. PO expected within the week.' },
      { n: 3, ago: 25, m: 'Email', next: -2, note: 'Quote sent to Brakes India. Follow up with S. Menon on the pedal bracket volumes.' },
      // Past-due next actions — these should light up the dashboard.
      { n: 4, ago: 20, m: 'Phone', next: 7, note: 'Sundram Fasteners want an annual blanket rate. Costing not finished — chase engineering on the footrest tool.' },
      { n: 4, ago: 9, m: 'Email', next: 3, note: 'Second reminder from customer asking where the quote is. Still pending tool room input.' },
      { n: 5, ago: 40, m: 'Meeting', next: null, note: 'Rane commercial meeting at Madras. Spacer price is the only sticking point.' },
      { n: 5, ago: 33, m: 'Phone', next: null, note: 'Rev 2 accepted at Rs 11. Schedule to be released monthly.' },
      { n: 6, ago: 17, m: 'Email', next: 4, note: 'Lucas-TVS sample enquiry. Asked for the 3D model of the alternator bracket — not received yet.' },
      { n: 7, ago: 18, m: 'Customer Portal', next: -3, note: 'Wheels India acknowledged the quote. Decision expected at their next sourcing review.' },
      { n: 8, ago: 52, m: 'Phone', next: null, note: 'Bosch confirmed the business went to a Pune supplier on landed cost. Closing the enquiry.' },
      { n: 9, ago: 13, m: 'Meeting', next: 1, note: 'Sundaram Clayton technical discussion. Cross member tonnage is a problem — need to tell them we cannot press it.' },
      { n: 10, ago: 15, m: 'Email', next: -5, note: 'Caterpillar want the tooling quote separated from the part price. Revised layout sent.' },
      { n: 11, ago: 3, m: 'Email', next: -6, note: 'Titan sample enquiry logged. Awaiting tolerance clarification before we can quote.' },
      { n: 12, ago: 10, m: 'Customer Portal', next: -2, note: 'India Yamaha released the FY27 blanket RFQ. Side stand bracket is a repeat part.' },
      { n: 14, ago: 30, m: 'Email', next: null, note: 'Final reminder sent before validity lapsed. No response from Brakes India. Quote expired.' }
    ];
    const fuRows = await FollowUp.insertMany(FU.map((f) => ({
      inquiryId: inqById[inqNo(f.n)]._id,
      activityDate: daysAgo(f.ago),
      method: f.m,
      notes: f.note,
      nextActionDate: f.next === null ? null : (f.next >= 0 ? daysAgo(f.next) : daysAhead(-f.next)),
      ...audit
    })));

    // ═══════════════════════════════════════════════════════════════════════
    // F. DELIVERY SCHEDULES on the existing sales orders
    // ═══════════════════════════════════════════════════════════════════════
    const soHeaders = (await col('soheaders').find({}).toArray())
      .sort((a, b) => String(a.orderNumber).localeCompare(String(b.orderNumber)));
    const soLines = await col('solineitems').find({}).toArray();
    const custById = Object.fromEntries(ctx.customers.map((c) => [String(c._id), c]));

    const schedDocs = [];
    let li = 0;
    for (const so of soHeaders) {
      const lines = soLines.filter((l) => String(l.orderId) === String(so._id))
        .sort((a, b) => a.lineSequence - b.lineSequence);
      const c = custById[String(so.customerId)];
      const addr = `${c?.name || 'Customer'}, ${c?.shippingAddress || 'Tamil Nadu'} (Gate 2, stores)`;

      for (const l of lines) {
        li += 1;
        const commit = so.deliveryCommitmentDate ? new Date(so.deliveryCommitmentDate) : daysAhead(20);
        const daysOut = Math.round((commit - Date.now()) / 864e5);
        // Split roughly every other line into two monthly releases.
        const splits = li % 3 === 0
          ? [{ q: Math.round(l.orderedQuantity * 0.6), off: daysOut }, { q: l.orderedQuantity - Math.round(l.orderedQuantity * 0.6), off: daysOut + 21 }]
          : [{ q: l.orderedQuantity, off: daysOut }];

        splits.forEach((sp, k) => {
          let status = 'Pending';
          let shipped = 0;
          if (so.status === 'Completed') { status = 'Delivered'; shipped = sp.q; }
          else if (so.status === 'Partially Shipped') { status = k === 0 ? 'Delivered' : 'Picked'; shipped = k === 0 ? sp.q : 0; }
          else if (so.status === 'Processing') {
            status = k === 0 ? (li % 2 === 0 ? 'In Transit' : 'Picked') : 'Pending';
            shipped = status === 'In Transit' ? Math.round(sp.q * 0.5) : 0;
          } else if (so.status === 'Cancelled') { status = 'Pending'; }

          // A few deliberately past due: still Pending with the date behind us.
          const past = sp.off < 0 && status === 'Pending';
          schedDocs.push({
            soLineId: l._id,
            requestedDeliveryDate: sp.off >= 0 ? daysAhead(sp.off) : daysAgo(-sp.off),
            confirmedDeliveryDate: so.status === 'Draft' ? null
              : (sp.off >= 0 ? daysAhead(sp.off + (li % 4 === 0 ? 4 : 0)) : daysAgo(-sp.off)),
            scheduledQuantity: sp.q,
            shippedQuantity: shipped,
            shipToAddress: addr,
            dispatchStatus: status,
            isQuantityLocked: status !== 'Pending',
            ...audit,
            _past: past
          });
        });
      }
    }
    // Force a handful of genuinely overdue releases so the alert tiles have data.
    let forced = 0;
    for (const s of schedDocs) {
      if (forced < 4 && s.dispatchStatus === 'Pending' && s.shippedQuantity === 0 &&
          s.requestedDeliveryDate > new Date()) {
        s.requestedDeliveryDate = daysAgo(3 + forced * 5);
        s.confirmedDeliveryDate = daysAgo(3 + forced * 5);
        forced += 1;
      }
      delete s._past;
    }
    const schedRows = await SODeliverySchedule.insertMany(schedDocs);

    // ═══════════════════════════════════════════════════════════════════════
    // G. ALLOCATIONS against inventory batches
    // ═══════════════════════════════════════════════════════════════════════
    const batches = await col('inventorystocks').find({}).toArray();
    const allocDocs = [];
    if (batches.length) {
      schedRows.forEach((s, i) => {
        const committed = ['Picked', 'In Transit', 'Delivered'].includes(s.dispatchStatus);
        const reserveAnyway = !committed && i % 4 === 0;   // stock earmarked ahead of picking
        if (!committed && !reserveAnyway) return;
        const b = batches[i % batches.length];
        // One deliberate short allocation so the shortage tile has something real.
        const short = i % 7 === 3;
        const qty = Math.max(1, Math.round(s.scheduledQuantity * (short ? 0.45 : 1)));
        allocDocs.push({
          scheduleId: s._id,
          inventoryBatchId: b._id,
          allocatedQuantity: qty,
          allocationDate: s.dispatchStatus === 'Pending' ? daysAgo(2) : daysAgo(6 + (i % 9)),
          isHardReserved: committed,
          ...audit
        });
      });
    }
    const allocRows = allocDocs.length ? await SOAllocation.insertMany(allocDocs) : [];

    return {
      inquiryheaders: inqRows.length,
      inquirylineitems: lineRows.length,
      crossreferences: xrefRows.length,
      feasibilityreviews: feasRows.length,
      followups: fuRows.length,
      quotationheaders: qhRows.length,
      quotationrevisions: revRows.length,
      quotationlineitems: qlRows.length,
      quotetaxdiscounts: tdRows.length,
      quoteapprovals: apRows.length,
      sodeliveryschedules: schedRows.length,
      soallocations: allocRows.length
    };
  }
};
