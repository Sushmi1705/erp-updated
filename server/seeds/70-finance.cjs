/* FINANCE — Laxmi Balaji Automotive Products, Hosur.
 *
 * One coherent money story for the demo:
 *   • an Indian chart of accounts (the account numbers the AP posting service
 *     expects are kept verbatim so live postings still resolve),
 *   • customer invoices raised against the sales orders already seeded, with
 *     18% GST — CGST+SGST for the Tamil Nadu customers, IGST for Bosch
 *     (Bengaluru, Karnataka),
 *   • receipts that are partial, full, one on-account advance and one bounced
 *     cheque, so real money is still outstanding,
 *   • vendor bills from the steel suppliers against the open POs, part paid,
 *   • a balanced journal behind all of it (every entry's debits == credits).
 *
 * FinanceAR/FinanceAP (the V1 tables) mirror the same documents as
 * CustomerInvoice/VendorBill (the V2 tables) — the dashboard's A/R tiles read
 * the V1 tables while the Finance screens read the V2 ones, so both have to
 * carry the same ledger or the two disagree.
 */

module.exports = {
  name: 'Finance',
  run: async (ctx) => {
    const {
      col, M, customers, vendors, products, materials, soheaders, poheaders,
      plant, company, admin, daysAgo, daysAhead
    } = ctx;

    const { CustomerInvoice, InvoiceLineItem, PaymentReceipt, PaymentApplication } = M('AccountsReceivable');
    const { VendorBill, BillLineItem, VendorPayment, BillPaymentApplication } = M('AccountsPayable');
    const { ChartOfAccounts, JournalEntry, JournalEntryLine } = M('GeneralLedger');
    const { TaxConfigurationMaster, TaxLedger, TaxReport } = M('TaxManagement');
    const { CostingPeriodHeader } = M('CostAccounting');
    const { ReportTemplateHeader } = M('FinancialStatements');
    const FinanceAR = M('FinanceAR');
    const FinanceAP = M('FinanceAP');
    const FinanceLedger = M('FinanceLedger');
    const FinanceTax = M('FinanceTax');

    // ── house-keeping ─────────────────────────────────────────────────────
    const MINE = [
      'chartofaccounts', 'journalentries', 'journalentrylines',
      'customerinvoices', 'invoicelineitems', 'paymentreceipts', 'paymentapplications',
      'vendorbills', 'billlineitems', 'vendorpayments', 'billpaymentapplications',
      'financears', 'financeaps', 'financeledgers',
      'taxconfigurationmasters', 'taxledgers', 'taxreports', 'financetaxes',
      'costingperiodheaders', 'reporttemplateheaders'
    ];
    for (const c of MINE) await col(c).deleteMany({});

    const r2 = (n) => Math.round(n * 100) / 100;
    // GST and invoice totals are raised in whole rupees — no paise anywhere,
    // which also keeps the sub-ledger arithmetic free of float residue.
    const rup = (n) => Math.round(n);
    const audit = { createdBy: admin?._id, companyId: company?._id, plantId: plant?._id };
    const byCode = (list, code) => list.find((x) => x.code === code);
    const byName = (list, needle) => list.find((x) => new RegExp(needle, 'i').test(x.name));
    const cust = (code) => byCode(customers, code);
    const so = (num) => soheaders.find((s) => s.orderNumber === num);
    const po = (num) => poheaders.find((p) => p.poNumber === num);

    // Indian fiscal period label, matching the model's own default helper.
    const period = (d) => {
      const y = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
      const q = Math.floor(((d.getMonth() - 3 + 12) % 12) / 3) + 1;
      return `FY${y}-Q${q}`;
    };

    // ══ 1. CHART OF ACCOUNTS ══════════════════════════════════════════════
    // 1000/1200/1500/2000/3000/4000/5000/5200 keep the exact codes and names
    // finance.controller.js posts through — renaming them breaks live AP.
    const coaSpec = [
      ['1000', 'Operating Cash & Bank', 'Asset', false],
      ['1200', 'Accounts Receivable (Sub-ledger Control)', 'Asset', true],
      ['1400', 'GST Input Tax Credit (ITC)', 'Asset', false],
      ['1500', 'Raw Materials & Parts Inventory', 'Asset', true],
      ['1550', 'Finished Goods Inventory', 'Asset', false],
      ['1600', 'Plant & Machinery — Press Shop', 'Asset', false],
      ['1610', 'Press Tools & Dies', 'Asset', false],
      ['2000', 'Accounts Payable (Sub-ledger Control)', 'Liability', true],
      ['2100', 'GST Output Tax Payable', 'Liability', false],
      ['2200', 'TDS, PF & Statutory Payables', 'Liability', false],
      ['2500', 'Term Loan — Machinery (SBI)', 'Liability', false],
      ['3000', 'Shareholders Equity & Retained Earnings', 'Equity', false],
      ['4000', 'Auto Components Sales Revenue', 'Revenue', false],
      ['4100', 'Press Tool & Die Sales', 'Revenue', false],
      ['4200', 'Scrap & Skeleton Sales', 'Revenue', false],
      ['5000', 'Cost of Goods Sold (COGS)', 'Expense', false],
      ['5100', 'Direct Wages & Contract Labour', 'Expense', false],
      ['5200', 'Plant Machinery & Utility Operating Expense', 'Expense', false],
      ['5300', 'Power & Fuel (TANGEDCO)', 'Expense', false],
      ['5400', 'Freight Outward & Packing', 'Expense', false],
      ['5500', 'Depreciation', 'Expense', false],
      ['5600', 'Tooling Maintenance & Job Work', 'Expense', false]
    ];
    const coaDocs = await ChartOfAccounts.insertMany(coaSpec.map(([num, name, type, ctrl]) => ({
      Account_ID: num, Account_Number: num, Account_Name: name,
      Account_Type: type, Is_Control_Account: ctrl, Status: 'Active',
      Plant_ID: plant?._id, ...audit
    })));
    const acc = Object.fromEntries(coaDocs.map((a) => [a.Account_Number, a._id]));

    // ══ 2. TAX CONFIGURATION ══════════════════════════════════════════════
    // Tax_Codes match the controller's lazy defaults so it never double-seeds.
    const taxSpec = [
      ['CGST-9', 'Central GST 9% (Intra-State, TN)', 'CGST', 9, 'Active', '2100'],
      ['SGST-9', 'State GST 9% (Intra-State, TN)', 'SGST', 9, 'Active', '2100'],
      ['IGST-18', 'Integrated GST 18% (Inter-State)', 'IGST', 18, 'Active', '2100'],
      ['CGST-6', 'Central GST 6% (Job Work)', 'CGST', 6, 'Active', '2100'],
      ['SGST-6', 'State GST 6% (Job Work)', 'SGST', 6, 'Active', '2100'],
      ['IGST-12', 'Integrated GST 12% (Job Work, Inter-State)', 'IGST', 12, 'Active', '2100'],
      ['CGST-2.5', 'Central GST 2.5% (Concessional)', 'CGST', 2.5, 'Active', '2100'],
      ['SGST-2.5', 'State GST 2.5% (Concessional)', 'SGST', 2.5, 'Active', '2100'],
      ['IGST-28', 'Integrated GST 28% (pre-2018 auto parts rate)', 'IGST', 28, 'Inactive', '2100'],
      ['CESS-1', 'Compensation Cess 1%', 'CESS', 1, 'Inactive', '2100']
    ];
    const taxDocs = await TaxConfigurationMaster.insertMany(taxSpec.map(([code, desc, type, rate, status, gl], i) => ({
      Tax_ID: `TAX-${String(i + 1).padStart(2, '0')}`,
      Tax_Code: code, Description: desc, Tax_Type: type, Rate_Percentage: rate,
      Effective_From_Date: new Date('2025-04-01'), Status: status,
      GL_Account_ID: acc[gl], Plant_ID: plant?._id,
      Maintained_By: 'D. Prakash (Sr. Accounts Officer)', ...audit
    })));
    const tax = Object.fromEntries(taxDocs.map((t) => [t.Tax_Code, t._id]));

    // V1 tax master — the legacy screen reads this one.
    await FinanceTax.insertMany([
      { taxCode: 'GST18-CGST', description: 'CGST 9% on 18% intra-state supply', ratePercentage: 9, type: 'CGST', isActive: true },
      { taxCode: 'GST18-SGST', description: 'SGST 9% on 18% intra-state supply', ratePercentage: 9, type: 'SGST', isActive: true },
      { taxCode: 'GST18-IGST', description: 'IGST 18% inter-state supply', ratePercentage: 18, type: 'IGST', isActive: true },
      { taxCode: 'GST12-IGST', description: 'IGST 12% job work, inter-state', ratePercentage: 12, type: 'IGST', isActive: true },
      { taxCode: 'GST5-CGST', description: 'CGST 2.5% concessional', ratePercentage: 2.5, type: 'CGST', isActive: true },
      { taxCode: 'TCS-0.1', description: 'TCS 0.1% u/s 206C(1H) on sale of goods', ratePercentage: 0.1, type: 'Custom', isActive: false }
    ]);

    // ══ 3. JOURNAL PLUMBING ═══════════════════════════════════════════════
    const jeHeaders = [];
    const jeLines = [];
    let jeSeq = 0;
    /** Books one balanced entry. Throws rather than writing a lopsided journal. */
    const je = ({ date, module = 'Manual', desc, status = 'Posted', lines, reversedFrom = null }) => {
      const dr = r2(lines.filter((l) => l.d).reduce((s, l) => s + l.d, 0));
      const cr = r2(lines.filter((l) => l.c).reduce((s, l) => s + l.c, 0));
      if (Math.abs(dr - cr) > 0.01) throw new Error(`Unbalanced JE "${desc}": Dr ${dr} vs Cr ${cr}`);
      jeSeq += 1;
      const num = `JE-${String(jeSeq).padStart(4, '0')}`;
      const _id = new ctx.mongoose.Types.ObjectId();
      jeHeaders.push({
        _id, Entry_ID: num, Entry_Number: num, Entry_Date: date, Source_Module: module,
        Description: desc, Financial_Period_ID: period(date), Status: status,
        Reversed_From_ID: reversedFrom, ...audit
      });
      lines.forEach((l, i) => {
        const amount = r2(l.d || l.c);
        jeLines.push({
          Line_ID: `${num}-L${i + 1}`, Entry_ID: _id, Line_Sequence: i + 1,
          Account_ID: acc[l.a], Type: l.d ? 'Debit' : 'Credit', Amount: amount,
          Base_Currency_Amount: amount,
          Reference_Type: l.rt || 'General', Reference_ID: l.rid || '', ...audit
        });
      });
      return { _id, num };
    };

    // Opening balances carried into FY2026-27.
    je({
      date: daysAgo(70), desc: 'Opening balances carried forward into FY2026-27', module: 'System',
      lines: [
        { a: '1000', d: 4250000 }, { a: '1500', d: 2860000 }, { a: '1600', d: 12400000 },
        { a: '1610', d: 3150000 }, { a: '3000', c: 18160000 }, { a: '2500', c: 4500000 }
      ]
    });

    // ══ 4. CUSTOMER INVOICES (A/R) ════════════════════════════════════════
    // Billing plan: fraction of each seeded sales order that has actually been
    // dispatched and invoiced, plus three invoices raised outside the order book.
    const soLines = await col('solineitems').find({}).toArray();
    const linesFor = (soDoc, fraction) => soLines
      .filter((l) => String(l.orderId) === String(soDoc._id))
      .map((l) => {
        const qty = Math.max(1, Math.round(l.orderedQuantity * fraction));
        return { productId: l.productId, qty, price: l.unitPrice, total: r2(qty * l.unitPrice) };
      });
    const prodName = (id) => (products.find((p) => String(p._id) === String(id)) || {}).name || 'Pressed component';
    const prodHsn = (id) => (products.find((p) => String(p._id) === String(id)) || {}).hsnCode || '8708';

    const KARNATAKA = new Set(['CUST-008']); // Bosch Ltd, Bengaluru — inter-state, IGST.

    const invSpec = [
      // [custCode, soNumber|null, fraction, issuedDaysAgo, termDays, status, manualLines]
      { c: 'CUST-003', so: 'SO-2026-1005', f: 1.00, ago: 42, terms: 45, st: 'Sent' },
      { c: 'CUST-005', so: 'SO-2026-1001', f: 1.00, ago: 30, terms: 45, st: 'Sent' },
      { c: 'CUST-012', so: 'SO-2026-1003', f: 0.60, ago: 25, terms: 60, st: 'Sent' },
      { c: 'CUST-009', so: 'SO-2026-1006', f: 1.00, ago: 22, terms: 45, st: 'Sent' },
      { c: 'CUST-007', so: 'SO-2026-1008', f: 1.00, ago: 15, terms: 45, st: 'Sent' },
      { c: 'CUST-006', so: 'SO-2026-1002', f: 0.50, ago: 10, terms: 30, st: 'Sent' },
      { c: 'CUST-009', so: 'SO-2026-1007', f: 0.40, ago: 8, terms: 45, st: 'Sent' },
      { c: 'CUST-001', so: 'SO-2026-1009', f: 1.00, ago: 6, terms: 30, st: 'Sent' },
      { c: 'CUST-002', so: 'SO-2026-1010', f: 0.55, ago: 3, terms: 45, st: 'Sent' },
      // Press tool sale to Bengaluru — inter-state, so IGST, and it is overdue.
      { c: 'CUST-008', so: null, ago: 55, terms: 30, st: 'Sent', tooling: true,
        manual: [{ code: 'PRD-014', qty: 2, price: 185000 }] },
      { c: 'CUST-011', so: null, ago: 48, terms: 30, st: 'Sent',
        manual: [{ code: 'PRD-015', qty: 24000, price: 12 }] },
      { c: 'CUST-010', so: null, ago: 12, terms: 60, st: 'Draft',
        manual: [{ code: 'PRD-013', qty: 3200, price: 95 }, { code: 'PRD-010', qty: 900, price: 210 }] }
    ];

    const invDocs = [];
    const invLineDocs = [];
    const taxLedgerDocs = [];
    const arMirror = [];
    let invSeq = 0;

    for (const spec of invSpec) {
      invSeq += 1;
      const customer = cust(spec.c);
      const soDoc = spec.so ? so(spec.so) : null;
      const issue = daysAgo(spec.ago);
      const due = new Date(issue.getTime() + spec.terms * 864e5);
      const lines = spec.manual
        ? spec.manual.map((m) => {
            const p = byCode(products, m.code);
            return { productId: p._id, qty: m.qty, price: m.price, total: r2(m.qty * m.price) };
          })
        : linesFor(soDoc, spec.f);
      const taxable = rup(lines.reduce((s, l) => s + l.total, 0));
      const gstTotal = rup(taxable * 0.18);
      const inter = KARNATAKA.has(spec.c);
      const cgst = inter ? 0 : rup(taxable * 0.09);
      const sgst = inter ? 0 : gstTotal - cgst;
      const igst = inter ? gstTotal : 0;
      const total = taxable + gstTotal;
      const num = `LBAP/26-27/${String(1000 + invSeq)}`;

      const _id = new ctx.mongoose.Types.ObjectId();
      invDocs.push({
        _id, Invoice_ID: num, Invoice_Number: num, Customer_ID: customer._id,
        Issue_Date: issue, Due_Date: due, Total_Amount: total, Currency_ID: 'INR',
        Terms_ID: `Net ${spec.terms}`, Status: spec.st, Plant_ID: plant?._id, ...audit
      });
      lines.forEach((l, i) => invLineDocs.push({
        Line_Item_ID: `${num}-${i + 1}`, Invoice_ID: _id, Line_Sequence: i + 1,
        Item_ID: l.productId, Description: prodName(l.productId),
        Quantity: l.qty, Unit_Price: l.price, Line_Total: l.total,
        Tax_Code_ID: inter ? 'IGST-18' : 'CGST-9+SGST-9',
        HSN_Code: prodHsn(l.productId), ...audit
      }));

      const pushTax = (code, base, amount) => taxLedgerDocs.push({
        Source_Document_ID: num, Source_Module: 'Accounts Receivable',
        Transaction_Date: issue, Tax_ID: tax[code], Base_Amount: base,
        Tax_Amount: amount, Tax_Nature: 'Output',
        Place_Of_Supply: inter ? 'Karnataka (29)' : 'Tamil Nadu (33)', ...audit
      });
      if (inter) pushTax('IGST-18', taxable, igst);
      else { pushTax('CGST-9', taxable, cgst); pushTax('SGST-9', taxable, sgst); }

      je({
        date: issue, module: 'AR', status: spec.st === 'Draft' ? 'Draft' : 'Posted',
        desc: `Sales invoice ${num} — ${customer.name}`,
        lines: [
          { a: '1200', d: total, rt: 'Invoice', rid: num },
          { a: spec.tooling ? '4100' : '4000', c: taxable, rt: 'Invoice', rid: num },
          { a: '2100', c: gstTotal, rt: 'Invoice', rid: num }
        ]
      });

      invDocs[invDocs.length - 1]._plan = {
        num, customer, soDoc, issue, due, taxable, gstTotal, total, terms: spec.terms
      };
      arMirror.push({ num, customer, soDoc, issue, due, taxable, gstTotal, total, _id });
    }

    const plans = invDocs.map((d) => d._plan);
    invDocs.forEach((d) => { delete d._plan; });
    await CustomerInvoice.insertMany(invDocs);
    await InvoiceLineItem.insertMany(invLineDocs);
    const invByNum = Object.fromEntries(plans.map((p, i) => [p.num, invDocs[i]._id]));

    // ══ 5. RECEIPTS & APPLICATIONS ════════════════════════════════════════
    // ago = days ago the money landed; applied = null means the full amount
    // clears the invoice.
    const recSpec = [
      { inv: 'LBAP/26-27/1001', ago: 8, method: 'RTGS', ref: 'NEFT/HDFC/8841207', by: 'R. Kumar', status: 'Cleared' },
      { inv: 'LBAP/26-27/1002', ago: 6, method: 'RTGS', ref: 'RTGS/ICIC/5520914', by: 'R. Kumar', status: 'Cleared', applied: 250000 },
      { inv: 'LBAP/26-27/1003', ago: 11, method: 'RTGS', ref: 'NEFT/AXIS/3390771', by: 'S. Menon', status: 'Cleared', applied: 500000 },
      { inv: 'LBAP/26-27/1004', ago: 4, method: 'RTGS', ref: 'RTGS/HDFC/9014663', by: 'S. Menon', status: 'Cleared' },
      // Wheels India paid a round figure — the balance sits on account.
      { inv: 'LBAP/26-27/1005', ago: 2, method: 'RTGS', ref: 'RTGS/SBIN/7742318', by: 'A. Iyer', status: 'Cleared', received: 300000, applied: 200000 },
      { inv: 'LBAP/26-27/1006', ago: 1, method: 'RTGS', ref: 'NEFT/HDFC/9917452', by: 'A. Iyer', status: 'Cleared' },
      { inv: 'LBAP/26-27/1008', ago: 1, method: 'Cash', ref: 'CASH/COLL/0416', by: 'M. Selvam', status: 'Cleared' },
      { inv: 'LBAP/26-27/1011', ago: 20, method: 'Cheque', ref: 'CHQ 442119 / Karur Vysya', by: 'V. Reddy', status: 'Cleared', applied: 150000 },
      // Bosch's cheque bounced — the invoice stays fully overdue, and nothing
      // is left "unapplied" because no money ever reached the bank.
      { inv: 'LBAP/26-27/1010', ago: 9, method: 'Cheque', ref: 'CHQ 771043 — returned, funds insufficient', by: 'V. Reddy', status: 'Bounced', applied: 0, faceValue: true }
    ];

    const recDocs = [];
    const appDocs = [];
    const paidByInvoice = {};
    let recSeq = 0;
    for (const spec of recSpec) {
      recSeq += 1;
      const plan = plans.find((p) => p.num === spec.inv);
      const received = spec.faceValue || spec.received == null && spec.applied == null
        ? plan.total
        : r2(spec.received != null ? spec.received : spec.applied);
      const applied = r2(spec.applied != null ? spec.applied : plan.total);
      const when = daysAgo(spec.ago);
      const num = `RCPT-26-${String(1000 + recSeq)}`;
      const _id = new ctx.mongoose.Types.ObjectId();
      recDocs.push({
        _id, Receipt_ID: num, Receipt_Number: num, Customer_ID: plan.customer._id,
        Payment_Date: when, Total_Received: received,
        // The CEO cash-flow tile sums Total_Amount; a bounced cheque brought no cash.
        Total_Amount: spec.status === 'Bounced' ? 0 : received,
        Payment_Method: spec.method === 'Wire' ? 'NEFT' : spec.method === 'Check' ? 'Cheque' : spec.method, Reference_Number: spec.ref,
        Unapplied_Amount: spec.status === 'Bounced' ? 0 : r2(received - applied),
        Status: spec.status,
        Received_By: spec.by, Currency_ID: 'INR', ...audit
      });
      if (applied > 0) {
        appDocs.push({
          Application_ID: `APP-26-${String(1000 + recSeq)}`, Receipt_ID: _id,
          Invoice_ID: invByNum[spec.inv], Applied_Amount: applied, Application_Date: when,
          Applied_By: spec.by, ...audit
        });
        paidByInvoice[spec.inv] = r2((paidByInvoice[spec.inv] || 0) + applied);
        je({
          date: when, module: 'AR', desc: `Receipt ${num} — ${plan.customer.name} (${spec.ref})`,
          lines: [
            { a: '1000', d: received, rt: 'Payment', rid: num },
            { a: '1200', c: received, rt: 'Payment', rid: num }
          ]
        });
      }
    }
    await PaymentReceipt.insertMany(recDocs);
    await PaymentApplication.insertMany(appDocs);

    // Invoice statuses now follow the money (the API recomputes these on read,
    // but the stored value should already be right for anything reading raw).
    for (const p of plans) {
      const paid = paidByInvoice[p.num] || 0;
      const doc = await CustomerInvoice.findOne({ Invoice_Number: p.num });
      if (doc.Status === 'Draft') continue;
      if (paid >= doc.Total_Amount - 0.01) doc.Status = 'Paid';
      else if (paid > 0) doc.Status = 'Partially Paid';
      else if (doc.Due_Date < new Date()) doc.Status = 'Overdue';
      await doc.save();
    }

    // ══ 6. FINANCE A/R (V1 mirror — the dashboard tiles read this) ════════
    const modeFor = (m) => (m === 'Check' ? 'Cheque' : m === 'Cash' ? 'Cash' : 'Bank Transfer');
    let arCount = 0;
    for (const p of plans) {
      const pays = recSpec
        .filter((s) => s.inv === p.num && s.status !== 'Bounced')
        .map((s) => ({
          paymentDate: daysAgo(s.ago),
          amount: r2(s.applied != null ? s.applied : p.total),
          paymentMode: modeFor(s.method),
          referenceNumber: s.ref
        }))
        .filter((x) => x.amount > 0);
      const doc = new FinanceAR({
        invoiceNumber: p.num, customerId: p.customer._id,
        salesOrderId: p.soDoc ? p.soDoc._id : undefined,
        invoiceDate: p.issue, dueDate: p.due,
        amount: p.taxable, taxAmount: p.gstTotal, totalAmount: p.total,
        outstandingAmount: p.total, payments: pays
      });
      await doc.save(); // pre('save') recomputes paid / outstanding / status
      arCount += 1;
    }

    // ══ 7. VENDOR BILLS (A/P) ═════════════════════════════════════════════
    const mat = (code) => byCode(materials, code);
    const billSpec = [
      { v: 'VND-003', po: 'PO-2026-2001', ago: 38, terms: 30, inter: true, st: 'Open',
        lines: [{ m: 'MAT-003', qty: 15830, price: 60, d: 'CRCA Coil 1.6mm — lot 1 against blanket PO' }] },
      { v: 'VND-003', po: 'PO-2026-2001', ago: 25, terms: 30, inter: true, st: 'Open',
        lines: [{ m: 'MAT-004', qty: 13930, price: 56, d: 'HR Coil 2.0mm — lot 2 against blanket PO' }] },
      { v: 'VND-005', po: 'PO-2026-2005', ago: 14, terms: 30, inter: false, st: 'Open',
        lines: [{ m: 'MAT-006', qty: 9200, price: 68, d: 'GI Sheet 1.0mm — full PO quantity' }] },
      // Tool steel bill went past due while the tool room disputed hardness certs.
      { v: 'VND-009', po: null, ago: 33, terms: 30, inter: true, st: 'Open',
        lines: [{ m: 'MAT-010', qty: 1470, price: 340, d: 'Tool Steel D2 Block — die inserts, cert dispute open' }] },
      { v: 'VND-007', po: null, ago: 20, terms: 30, inter: false, st: 'Open',
        lines: [{ m: 'MAT-009', qty: 1800, price: 135, d: 'MIG Welding Wire ER70S — 15kg spools' }] },
      { v: 'VND-010', po: null, ago: 4, terms: 15, inter: false, st: 'Pending Approval',
        lines: [{ m: null, qty: 5500, price: 30, d: 'Heat treatment job work — bracket sub-assemblies' }] },
      { v: 'VND-008', po: null, ago: 11, terms: 30, inter: false, st: 'Open',
        lines: [{ m: null, qty: 1200, price: 80, d: 'Press lubricants & VCI packing consumables' }] },
      { v: 'VND-006', po: 'PO-2026-2004', ago: 9, terms: 45, inter: true, st: 'Open',
        lines: [{ m: 'MAT-005', qty: 7270, price: 55, d: 'HR Coil 3.0mm — partial despatch against PO' }] }
    ];

    const billDocs = [];
    const billLineDocs = [];
    const billPlans = [];
    let billSeq = 0;
    for (const spec of billSpec) {
      billSeq += 1;
      const vendor = byCode(vendors, spec.v);
      const poDoc = spec.po ? po(spec.po) : null;
      const billDate = daysAgo(spec.ago);
      const due = new Date(billDate.getTime() + spec.terms * 864e5);
      const lines = spec.lines.map((l) => ({ ...l, total: r2(l.qty * l.price) }));
      const taxable = rup(lines.reduce((s, l) => s + l.total, 0));
      const gstTotal = rup(taxable * 0.18);
      const total = taxable + gstTotal;
      const num = `${vendor.code}/INV/26-27/${String(300 + billSeq)}`;
      const _id = new ctx.mongoose.Types.ObjectId();

      billDocs.push({
        _id, Bill_ID: num, Bill_Number: num, Vendor_ID: vendor._id,
        Bill_Date: billDate, Due_Date: due, Total_Amount: total, Currency_ID: 'INR',
        Terms_ID: `Net ${spec.terms}`, Status: spec.st, Plant_ID: plant?._id, ...audit
      });
      lines.forEach((l, i) => billLineDocs.push({
        Line_Item_ID: `${num}-${i + 1}`, Bill_ID: _id,
        PO_Reference_ID: poDoc ? poDoc._id : undefined, Line_Sequence: i + 1,
        Item_ID: l.m ? mat(l.m)._id : undefined, Description: l.d,
        Quantity: l.qty, Unit_Price: l.price, Line_Total: l.total,
        Tax_Code_ID: spec.inter ? 'IGST-18' : 'CGST-9+SGST-9', ...audit
      }));

      const pushTax = (code, base, amount) => taxLedgerDocs.push({
        Source_Document_ID: num, Source_Module: 'Accounts Payable',
        Transaction_Date: billDate, Tax_ID: tax[code], Base_Amount: base,
        Tax_Amount: amount, Tax_Nature: 'Input',
        Place_Of_Supply: spec.inter ? 'Inter-state' : 'Tamil Nadu (33)', ...audit
      });
      if (spec.inter) pushTax('IGST-18', taxable, gstTotal);
      else {
        const cgst = rup(taxable * 0.09);
        pushTax('CGST-9', taxable, cgst);
        pushTax('SGST-9', taxable, gstTotal - cgst);
      }

      je({
        date: billDate, module: 'AP', status: spec.st === 'Pending Approval' ? 'Draft' : 'Posted',
        desc: `Vendor bill ${num} — ${vendor.name}`,
        lines: [
          { a: '1500', d: taxable, rt: 'Bill', rid: num },
          { a: '1400', d: gstTotal, rt: 'Bill', rid: num },
          { a: '2000', c: total, rt: 'Bill', rid: num }
        ]
      });

      billPlans.push({ num, vendor, poDoc, billDate, due, taxable, gstTotal, total, _id });
    }
    await VendorBill.insertMany(billDocs);
    await BillLineItem.insertMany(billLineDocs);

    // ── vendor payments ───────────────────────────────────────────────────
    const payAgainst = [
      { bill: 0, ago: 6, method: 'RTGS', ref: 'RTGS/HDFC/OUT/551209', status: 'Cleared', by: 'K. Rajan' },
      { bill: 1, ago: 3, method: 'RTGS', ref: 'RTGS/HDFC/OUT/551477', status: 'Cleared', by: 'K. Rajan', amount: 500000 },
      { bill: 4, ago: 5, method: 'NEFT', ref: 'NEFT/HDFC/OUT/548812', status: 'Cleared', by: 'P. Nair' },
      { bill: 2, ago: 2, method: 'RTGS', ref: 'RTGS/HDFC/OUT/552030', status: 'Cleared', by: 'P. Nair', amount: 300000 },
      { bill: 7, ago: 1, method: 'RTGS', ref: 'RTGS/HDFC/OUT/552118 — awaiting clearing', status: 'Pending Clearing', by: 'K. Rajan', amount: 250000 }
    ];
    const payDocs = [];
    const billAppDocs = [];
    const paidByBill = {};
    let paySeq = 0;
    for (const spec of payAgainst) {
      paySeq += 1;
      const bp = billPlans[spec.bill];
      const amount = r2(spec.amount != null ? spec.amount : bp.total);
      const when = daysAgo(spec.ago);
      const num = `VP-26-${String(1000 + paySeq)}`;
      const _id = new ctx.mongoose.Types.ObjectId();
      payDocs.push({
        _id, Payment_ID: num, Payment_Number: num, Vendor_ID: bp.vendor._id,
        Payment_Date: when, Total_Paid: amount, Payment_Method: spec.method === 'Wire' ? 'RTGS' : spec.method === 'ACH' ? 'NEFT' : spec.method,
        Bank_Account_ID: 'HDFC-HOSUR-CA-004411', Reference_Number: spec.ref,
        Unapplied_Amount: 0, Status: spec.status, ...audit
      });
      billAppDocs.push({
        Application_ID: `BAPP-26-${String(1000 + paySeq)}`, Payment_ID: _id,
        Bill_ID: bp._id, Applied_Amount: amount, Application_Date: when, ...audit
      });
      paidByBill[bp.num] = r2((paidByBill[bp.num] || 0) + amount);
      je({
        date: when, module: 'AP', status: spec.status === 'Pending Clearing' ? 'Pending Approval' : 'Posted',
        desc: `Vendor payment ${num} — ${bp.vendor.name} (${spec.by})`,
        lines: [
          { a: '2000', d: amount, rt: 'Payment', rid: num },
          { a: '1000', c: amount, rt: 'Payment', rid: num }
        ]
      });
    }
    await VendorPayment.insertMany(payDocs);
    await BillPaymentApplication.insertMany(billAppDocs);

    for (const bp of billPlans) {
      const paid = paidByBill[bp.num] || 0;
      const doc = await VendorBill.findOne({ Bill_Number: bp.num });
      if (doc.Status === 'Pending Approval') continue;
      if (paid >= doc.Total_Amount - 0.01) doc.Status = 'Paid';
      else if (paid > 0) doc.Status = 'Partially Paid';
      else if (doc.Due_Date < new Date()) doc.Status = 'Overdue';
      await doc.save();
    }

    // ══ 8. FINANCE A/P (V1 mirror) ════════════════════════════════════════
    let apCount = 0;
    for (const bp of billPlans) {
      const pays = payAgainst
        .filter((s) => billPlans[s.bill].num === bp.num)
        .map((s) => ({
          paymentDate: daysAgo(s.ago),
          amount: r2(s.amount != null ? s.amount : bp.total),
          paymentMode: s.method === 'Check' ? 'Cheque' : 'Bank Transfer',
          referenceNumber: s.ref
        }));
      const doc = new FinanceAP({
        billNumber: bp.num, vendorId: bp.vendor._id,
        purchaseOrderId: bp.poDoc ? bp.poDoc._id : undefined,
        billDate: bp.billDate, dueDate: bp.due,
        amount: bp.taxable, taxAmount: bp.gstTotal, totalAmount: bp.total,
        outstandingAmount: bp.total, payments: pays
      });
      await doc.save();
      apCount += 1;
    }

    // ══ 9. MANUAL / PERIOD-END JOURNALS ═══════════════════════════════════
    je({
      date: daysAgo(19), desc: 'Payroll July 2026 — 84 staff & contract operators',
      lines: [{ a: '5100', d: 1240000 }, { a: '2200', c: 96000 }, { a: '1000', c: 1144000 }]
    });
    je({
      date: daysAgo(17), desc: 'TANGEDCO HT power bill July 2026 — 246 MWh',
      lines: [{ a: '5300', d: 486000 }, { a: '1000', c: 486000 }]
    });
    je({
      date: daysAgo(16), desc: 'Press line AMC & hydraulic overhaul — 250T Aida',
      lines: [{ a: '5200', d: 145000 }, { a: '1000', c: 145000 }]
    });
    je({
      date: daysAgo(12), desc: 'Skeleton scrap sale to Hosur trader — 18.4 MT',
      lines: [{ a: '1000', d: 267860 }, { a: '4200', c: 227000 }, { a: '2100', c: 40860 }]
    });
    const wrong = je({
      date: daysAgo(14), status: 'Reversed',
      desc: 'Outward freight to Chennai wrongly booked to Power & Fuel',
      lines: [{ a: '5300', d: 82000 }, { a: '1000', c: 82000 }]
    });
    je({
      date: daysAgo(13), desc: `Reversal of ${wrong.num} — freight misposting`, reversedFrom: wrong._id,
      lines: [{ a: '1000', d: 82000 }, { a: '5300', c: 82000 }]
    });
    je({
      date: daysAgo(13), desc: 'Outward freight — Chennai & Bengaluru despatches, correctly booked',
      lines: [{ a: '5400', d: 82000 }, { a: '1000', c: 82000 }]
    });
    je({
      date: daysAgo(2), status: 'Pending Approval',
      desc: 'Provision for die amortisation Q2 — awaiting CFO approval',
      lines: [{ a: '5000', d: 340000 }, { a: '1610', c: 340000 }]
    });
    je({
      date: daysAgo(1), status: 'Draft',
      desc: 'Depreciation Aug 2026 (SLM) — plant, tools & utilities',
      lines: [{ a: '5500', d: 726000 }, { a: '1600', c: 486000 }, { a: '1610', c: 240000 }]
    });

    await JournalEntry.insertMany(jeHeaders);
    await JournalEntryLine.insertMany(jeLines);

    // ══ 10. V1 SUMMARY LEDGER (legacy costing / statements screens) ═══════
    const ledgerSpec = [
      ['GL-26-0101', 22, 'July 2026 despatch value — auto components', 'Sales Revenue', 'Credit', 3860000, 'Invoice', 'Posted'],
      ['GL-26-0102', 22, 'July 2026 steel coil consumption at standard', 'Raw Material Cost', 'Debit', 2180000, 'Bill', 'Posted'],
      ['GL-26-0103', 21, 'July 2026 direct wages — press & tool room', 'Direct Labor Cost', 'Debit', 640000, 'Manual', 'Posted'],
      ['GL-26-0104', 21, 'July 2026 absorbed factory overhead', 'Manufacturing Overhead', 'Debit', 412000, 'Manual', 'Posted'],
      ['GL-26-0105', 20, 'July 2026 power & utility overhead', 'Manufacturing Overhead', 'Debit', 486000, 'Manual', 'Posted'],
      ['GL-26-0106', 20, 'Collections banked July 2026', 'Cash/Bank', 'Debit', 2840000, 'Payment', 'Posted'],
      ['GL-26-0107', 19, 'Vendor payments released July 2026', 'Cash/Bank', 'Credit', 1960000, 'Payment', 'Posted'],
      ['GL-26-0108', 18, 'Steel purchases booked July 2026', 'Purchase Expense', 'Debit', 2350000, 'Bill', 'Posted'],
      ['GL-26-0109', 12, 'Tool room job work — outsourced heat treatment', 'Manufacturing Overhead', 'Debit', 165000, 'Bill', 'Posted'],
      ['GL-26-0110', 11, 'Skeleton scrap realisation', 'Sales Revenue', 'Credit', 227000, 'Manual', 'Posted'],
      ['GL-26-0111', 8, 'Rework at Sundaram Clayton — labour charged back', 'Direct Labor Cost', 'Debit', 74000, 'Manual', 'Posted'],
      ['GL-26-0112', 5, 'August 2026 provisional overhead accrual', 'Manufacturing Overhead', 'Debit', 305000, 'Manual', 'Draft'],
      ['GL-26-0113', 3, 'August 2026 despatch value — provisional', 'Sales Revenue', 'Credit', 1420000, 'Invoice', 'Draft'],
      ['GL-26-0114', 2, 'Diesel genset fuel — August load shedding', 'Manufacturing Overhead', 'Debit', 88000, 'Manual', 'Draft']
    ];
    await FinanceLedger.insertMany(ledgerSpec.map(([num, ago, desc, account, type, amount, refType, status]) => ({
      entryNumber: num, date: daysAgo(ago), description: desc, accountName: account,
      type, amount, referenceType: refType, status
    })));

    // ══ 11. TAX LEDGER & GST RETURNS ══════════════════════════════════════
    await TaxLedger.insertMany(taxLedgerDocs);

    const outputTax = r2(taxLedgerDocs.filter((t) => t.Tax_Nature === 'Output').reduce((s, t) => s + t.Tax_Amount, 0));
    const inputTax = r2(taxLedgerDocs.filter((t) => t.Tax_Nature === 'Input').reduce((s, t) => s + t.Tax_Amount, 0));
    const salesValue = r2(plans.reduce((s, p) => s + p.total, 0));
    const purchaseValue = r2(billPlans.reduce((s, b) => s + b.total, 0));

    await TaxReport.insertMany([
      { Report_ID: 'GSTR3B-2026-06', Report_Number: 'GSTR-3B / JUN-2026',
        Period_Start_Date: new Date('2026-06-01'), Period_End_Date: new Date('2026-06-30'),
        Generated_Date: new Date('2026-07-08'),
        Total_Sales_Value: 5124000, Total_Purchase_Value: 3810000,
        Total_Output_Tax: 922320, Total_Input_Tax: 685800, Net_Tax_Payable: 236520,
        Status: 'Filed', Filed_By: 'D. Prakash', ARN: 'AA330726004112X', ...audit },
      { Report_ID: 'GSTR3B-2026-07', Report_Number: 'GSTR-3B / JUL-2026',
        Period_Start_Date: new Date('2026-07-01'), Period_End_Date: new Date('2026-07-31'),
        Generated_Date: new Date('2026-08-06'),
        Total_Sales_Value: r2(salesValue * 0.62), Total_Purchase_Value: r2(purchaseValue * 0.58),
        Total_Output_Tax: r2(outputTax * 0.62), Total_Input_Tax: r2(inputTax * 0.58),
        Net_Tax_Payable: r2(outputTax * 0.62 - inputTax * 0.58),
        Status: 'Finalized', Filed_By: 'D. Prakash', ...audit },
      { Report_ID: 'GSTR3B-2026-08', Report_Number: 'GSTR-3B / AUG-2026 (in progress)',
        Period_Start_Date: new Date('2026-08-01'), Period_End_Date: new Date('2026-08-31'),
        Generated_Date: new Date(),
        Total_Sales_Value: salesValue, Total_Purchase_Value: purchaseValue,
        Total_Output_Tax: outputTax, Total_Input_Tax: inputTax,
        Net_Tax_Payable: r2(outputTax - inputTax),
        Status: 'Draft', ...audit }
    ]);

    // ══ 12. COSTING PERIODS & STATEMENT TEMPLATES ═════════════════════════
    // Exactly one Open period — getV2CostingData picks the newest open one.
    await CostingPeriodHeader.insertMany([
      { Period_ID: 'FY2025-26-Q3', Fiscal_Year: '2025-26', Fiscal_Quarter: 'Q3',
        Start_Date: new Date('2025-10-01'), End_Date: new Date('2025-12-31'), Status: 'Closed',
        Closed_By: 'D. Prakash', ...audit },
      { Period_ID: 'FY2025-26-Q4', Fiscal_Year: '2025-26', Fiscal_Quarter: 'Q4',
        Start_Date: new Date('2026-01-01'), End_Date: new Date('2026-03-31'), Status: 'Closed',
        Closed_By: 'D. Prakash', ...audit },
      { Period_ID: 'FY2026-27-Q1', Fiscal_Year: '2026-27', Fiscal_Quarter: 'Q1',
        Start_Date: new Date('2026-04-01'), End_Date: new Date('2026-06-30'), Status: 'Reconciling',
        Note: 'Steel price variance and WIP revaluation still under reconciliation', ...audit },
      { Period_ID: 'FY2026-27-Q2', Fiscal_Year: '2026-27', Fiscal_Quarter: 'Q2',
        Start_Date: new Date('2026-07-01'), End_Date: new Date('2026-09-30'), Status: 'Open', ...audit }
    ]);

    await ReportTemplateHeader.insertMany([
      { Template_ID: 'RPT-01', Template_Code: 'RPT-PNL-01', Template_Name: 'Income Statement (Profit & Loss)',
        Report_Type: 'Profit_Loss', Default_Period_Type: 'Current_Fiscal_Year', Is_Active: true, ...audit },
      { Template_ID: 'RPT-02', Template_Code: 'RPT-BS-01', Template_Name: 'Balance Sheet (Statement of Financial Position)',
        Report_Type: 'Balance_Sheet', Default_Period_Type: 'As_Of_Today', Is_Active: true, ...audit },
      { Template_ID: 'RPT-03', Template_Code: 'RPT-CF-01', Template_Name: 'Cash Flow Statement',
        Report_Type: 'Cash_Flow', Default_Period_Type: 'YTD', Is_Active: true, ...audit },
      { Template_ID: 'RPT-04', Template_Code: 'RPT-PNL-02', Template_Name: 'Monthly P&L — Press Shop vs Tool Room',
        Report_Type: 'Profit_Loss', Default_Period_Type: 'YTD', Is_Active: true, ...audit },
      { Template_ID: 'RPT-05', Template_Code: 'RPT-BS-02', Template_Name: 'Balance Sheet — Schedule III (Companies Act) format',
        Report_Type: 'Balance_Sheet', Default_Period_Type: 'As_Of_Today', Is_Active: false, ...audit }
    ]);

    return {
      chartofaccounts: coaDocs.length,
      journalentries: jeHeaders.length,
      journalentrylines: jeLines.length,
      customerinvoices: invDocs.length,
      invoicelineitems: invLineDocs.length,
      paymentreceipts: recDocs.length,
      paymentapplications: appDocs.length,
      vendorbills: billDocs.length,
      billlineitems: billLineDocs.length,
      vendorpayments: payDocs.length,
      billpaymentapplications: billAppDocs.length,
      financears: arCount,
      financeaps: apCount,
      financeledgers: ledgerSpec.length,
      taxconfigurationmasters: taxDocs.length,
      taxledgers: taxLedgerDocs.length,
      taxreports: 3,
      financetaxes: 6,
      costingperiodheaders: 4,
      reporttemplateheaders: 5
    };
  }
};
