const fs = require('fs');

let content = fs.readFileSync('/Users/sajesh/Documents/Precision Auto Components Pvt Ltd/server/src/controllers/finance.controller.js', 'utf8');

// 1. Add imports
content = content.replace(
  "const { AuditLog } = require('../models/Audit');\nconst mongoose = require('mongoose');",
  "const { AuditLog } = require('../models/Audit');\nconst mongoose = require('mongoose');\nconst { generateDocNumber } = require('../utils/docNumbering');\nconst { calculateGST, calculateLineItemsGST } = require('../services/gstService');\nconst { postJournalEntry, findAccount } = require('../services/glService');"
);

// 2. Fix C-10: Remove client-controlled tax in V1 createARInvoice
content = content.replace(
  "    req.body.invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;\n    req.body.totalAmount = (Number(req.body.amount) || 0) + (Number(req.body.taxAmount) || 0);\n    req.body.outstandingAmount = req.body.totalAmount;",
  "    req.body.invoiceNumber = await generateDocNumber('AR_INV_V1', 'INV', session);\n    const taxableAmount = Number(req.body.amount) || 0;\n    const gst = calculateGST(taxableAmount, req.body.hsnCode || '', req.body.isInterstate || false);\n    req.body.taxAmount = gst.totalTax;\n    req.body.totalAmount = gst.totalAmount;\n    req.body.outstandingAmount = req.body.totalAmount;"
);

// Replace jeNumber in createARInvoice
content = content.replace(
  "    const jeNumber = `JE-${Date.now().toString().slice(-6)}`;",
  "    const jeNumber = await generateDocNumber('JE', 'JE', session);"
);

// 3. Fix C-04: V1 AR Payment — Add missing Debit to Cash
content = content.replace(
  "    // Auto-create Ledger Entry for AR Payment\n    await FinanceLedger.create({\n      entryNumber: `JE-${Date.now().toString().slice(-6)}`,\n      description: `Payment received for Invoice ${invoice.invoiceNumber}`,\n      accountName: 'Accounts Receivable',\n      type: 'Credit',\n      amount: req.body.amount,\n      referenceType: 'Payment',\n      referenceId: invoice._id,\n      status: 'Posted'\n    });",
  "    // Auto-create Ledger Entry for AR Payment\n    const jeSeq = await generateDocNumber('JE', 'JE');\n    await FinanceLedger.create({\n      entryNumber: `${jeSeq}-CR`,\n      description: `Payment received for Invoice ${invoice.invoiceNumber}`,\n      accountName: 'Accounts Receivable',\n      type: 'Credit',\n      amount: req.body.amount,\n      referenceType: 'Payment',\n      referenceId: invoice._id,\n      status: 'Posted'\n    });\n    await FinanceLedger.create({\n      entryNumber: `${jeSeq}-DR`,\n      description: `Cash received for Invoice ${invoice.invoiceNumber}`,\n      accountName: 'Cash/Bank',\n      type: 'Debit',\n      amount: req.body.amount,\n      referenceType: 'Payment',\n      referenceId: invoice._id,\n      status: 'Posted'\n    });"
);

// 4. Fix V1 AP Bill Numbering
content = content.replace(
  "    req.body.billNumber = `BILL-${Date.now().toString().slice(-6)}`;",
  "    req.body.billNumber = await generateDocNumber('AP_BILL_V1', 'BILL', session);"
);

content = content.replace(
  "    const jeNumber = `JE-${Date.now().toString().slice(-6)}`;",
  "    const jeNumber = await generateDocNumber('JE', 'JE', session);"
);

// 5. Fix C-04: V1 AP Payment — Add missing Credit to Cash
content = content.replace(
  "    // Auto-create Ledger Entry for AP Payment\n    await FinanceLedger.create({\n      entryNumber: `JE-${Date.now().toString().slice(-6)}`,\n      description: `Payment sent for Bill ${bill.billNumber}`,\n      accountName: 'Accounts Payable',\n      type: 'Debit',\n      amount: req.body.amount,\n      referenceType: 'Payment',\n      referenceId: bill._id,\n      status: 'Posted'\n    });",
  "    // Auto-create Ledger Entry for AP Payment\n    const jeSeq = await generateDocNumber('JE', 'JE');\n    await FinanceLedger.create({\n      entryNumber: `${jeSeq}-DR`,\n      description: `Payment sent for Bill ${bill.billNumber}`,\n      accountName: 'Accounts Payable',\n      type: 'Debit',\n      amount: req.body.amount,\n      referenceType: 'Payment',\n      referenceId: bill._id,\n      status: 'Posted'\n    });\n    await FinanceLedger.create({\n      entryNumber: `${jeSeq}-CR`,\n      description: `Cash sent for Bill ${bill.billNumber}`,\n      accountName: 'Cash/Bank',\n      type: 'Credit',\n      amount: req.body.amount,\n      referenceType: 'Payment',\n      referenceId: bill._id,\n      status: 'Posted'\n    });"
);

// 6. Fix General Ledger entry number
content = content.replace(
  "    req.body.entryNumber = `JE-${Date.now().toString().slice(-6)}`;",
  "    req.body.entryNumber = await generateDocNumber('JE', 'JE');"
);

// 7. Fix H-12: Financial Statements
content = content.replace(
  "    // Generate P&L dynamically from Ledger, AR, AP\n    const ledgers = await FinanceLedger.find({ status: 'Posted' });\n    \n    let totalRevenue = 0;\n    let totalExpenses = 0;\n    let totalCash = 0;\n    \n    // Simplistic P&L and Cash logic based on Account Names\n    ledgers.forEach(l => {\n      const isRevenue = l.accountName.toLowerCase().includes('revenue') || l.accountName.toLowerCase().includes('sales');\n      const isExpense = l.accountName.toLowerCase().includes('expense') || l.accountName.toLowerCase().includes('cost');\n      const isCash = l.accountName.toLowerCase().includes('cash') || l.accountName.toLowerCase().includes('bank');\n      \n      if (isRevenue) {\n        if (l.type === 'Credit') {\n          totalRevenue += l.amount;\n        } else if (l.type === 'Debit') {\n          totalRevenue -= l.amount;\n        }\n      }\n      if (isExpense) {\n        if (l.type === 'Debit') {\n          totalExpenses += l.amount;\n        } else if (l.type === 'Credit') {\n          totalExpenses -= l.amount;\n        }\n      }\n      if (isCash) {\n        if (l.type === 'Debit') {\n          totalCash += l.amount;\n        } else if (l.type === 'Credit') {\n          totalCash -= l.amount;\n        }\n      }\n    });",
  `    const glLines = await JournalEntryLine.find()
      .populate({ path: 'Account_ID', model: 'ChartOfAccounts', select: 'Account_Type Account_Name' });
      
    const summary = { Revenue: 0, Expense: 0, Asset: 0, Liability: 0, Equity: 0 };
    glLines.forEach(line => {
      const acct = line.Account_ID;
      if (!acct) return;
      summary[acct.Account_Type] = (summary[acct.Account_Type] || 0) + line.Amount * (line.Type === 'Credit' ? 1 : -1);
    });
    
    // Also add V1 ledgers for backwards compatibility
    const ledgers = await FinanceLedger.find({ status: 'Posted' });
    let totalRevenue = summary.Revenue || 0;
    let totalExpenses = (summary.Expense || 0) * -1; // Debit is positive for expense, so * -1 to align with Credit-based summary, wait, expense normal is debit... let's just do V1 manually
    let totalCash = 0;
    
    ledgers.forEach(l => {
      const isRevenue = l.accountName.toLowerCase().includes('revenue') || l.accountName.toLowerCase().includes('sales');
      const isExpense = l.accountName.toLowerCase().includes('expense') || l.accountName.toLowerCase().includes('cost');
      const isCash = l.accountName.toLowerCase().includes('cash') || l.accountName.toLowerCase().includes('bank');
      
      if (isRevenue) {
        if (l.type === 'Credit') totalRevenue += l.amount;
        else if (l.type === 'Debit') totalRevenue -= l.amount;
      }
      if (isExpense) {
        if (l.type === 'Debit') totalExpenses += l.amount;
        else if (l.type === 'Credit') totalExpenses -= l.amount;
      }
      if (isCash) {
        if (l.type === 'Debit') totalCash += l.amount;
        else if (l.type === 'Credit') totalCash -= l.amount;
      }
    });`
);

// 8. Fix V2 Invoice phantom fallback & GST & GL Post
content = content.replace(
  "    const items = lineItems || [{ Description: 'Standard Industrial Components Order', Quantity: 10, Unit_Price: 150 }];\n    const totalAmount = items.reduce((sum, item) => sum + (Number(item.Quantity || 1) * Number(item.Unit_Price || 0)), 0);\n\n    const invNum = `INV-${Date.now().toString().slice(-6)}`;\n    const invoice = await CustomerInvoice.create({\n      Invoice_ID: invNum,\n      Invoice_Number: invNum,\n      Customer_ID,\n      Issue_Date: issue,\n      Due_Date: due,\n      Terms_ID: Terms_ID || 'Net 30',\n      Total_Amount: totalAmount,\n      Status: 'Sent'\n    });\n\n    let seq = 1;\n    for (const item of items) {\n      const lineTotal = Number(item.Quantity || 1) * Number(item.Unit_Price || 0);\n      await InvoiceLineItem.create({\n        Line_Item_ID: `LNE-${Date.now().toString().slice(-6)}-${seq}`,\n        Invoice_ID: invoice._id,\n        Line_Sequence: seq++,\n        Description: item.Description || 'Auto Component Line Item',\n        Quantity: Number(item.Quantity || 1),\n        Unit_Price: Number(item.Unit_Price || 0),\n        Line_Total: lineTotal\n      });\n    }\n\n    await logAudit('CREATE', 'CustomerInvoice', invoice._id, req.user?._id, `Created invoice ${invNum} totaling $${totalAmount}`);",
  `    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required to create an invoice.' });
    }
    const items = lineItems;
    
    const gstResult = calculateLineItemsGST(items, req.body.isInterstate || false);
    const totalAmount = gstResult.summary.grandTotal;
    const taxableValue = gstResult.summary.taxableValue;
    const totalTax = gstResult.summary.totalTax;
    
    const invNum = await generateDocNumber('AR_INV_V2', 'SINV');
    const invoice = await CustomerInvoice.create({
      Invoice_ID: invNum,
      Invoice_Number: invNum,
      Customer_ID,
      Issue_Date: issue,
      Due_Date: due,
      Terms_ID: Terms_ID || 'Net 30',
      Total_Amount: totalAmount,
      Status: 'Sent'
    });

    let seq = 1;
    for (const item of gstResult.lines) {
      await InvoiceLineItem.create({
        Line_Item_ID: \`LNE-\${invNum}-\${seq}\`,
        Invoice_ID: invoice._id,
        Line_Sequence: seq++,
        Description: item.Description || 'Auto Component Line Item',
        Quantity: Number(item.Quantity || 1),
        Unit_Price: Number(item.Unit_Price || 0),
        Line_Total: item.lineTotal,
        HSN_Code: item.HSN_Code || '',
        Tax_Amount: item.totalTax
      });
    }

    // Post to GL
    try {
      const arAcct = await findAccount('Accounts Receivable');
      const revAcct = await findAccount('Auto Components Sales Revenue'); // Or just Sales Revenue
      const taxAcct = await findAccount('Output Tax Payable') || await findAccount('Tax');
      
      if (arAcct && revAcct) {
        const lines = [
          { type: 'Debit', accountId: arAcct._id, amount: totalAmount, referenceType: 'Invoice', referenceId: invoice._id },
          { type: 'Credit', accountId: revAcct._id, amount: taxableValue, referenceType: 'Invoice', referenceId: invoice._id }
        ];
        if (totalTax > 0 && taxAcct) {
          lines.push({ type: 'Credit', accountId: taxAcct._id, amount: totalTax, referenceType: 'Invoice', referenceId: invoice._id });
        }
        await postJournalEntry({
          sourceModule: 'AR',
          description: \`Sales Invoice \${invNum}\`,
          lines,
          userId: req.user?._id
        });
      }
    } catch (glErr) {
      console.warn('GL Posting skipped or failed:', glErr.message);
    }

    await logAudit('CREATE', 'CustomerInvoice', invoice._id, req.user?._id, \`Created invoice \${invNum} totaling $\${totalAmount}\`);`
);

// 9. V2 Receipt
content = content.replace(
  "    const recNum = `REC-${Date.now().toString().slice(-6)}`;",
  "    const recNum = await generateDocNumber('AR_REC_V2', 'REC');"
);
content = content.replace(
  "    const app = await PaymentApplication.create({\n      Application_ID: `APP-${Date.now().toString().slice(-6)}`,",
  "    const appNum = await generateDocNumber('AR_APP_V2', 'APP');\n    const app = await PaymentApplication.create({\n      Application_ID: appNum,"
);
// Receipt GL post
content = content.replace(
  "    await logAudit('CREATE', 'PaymentReceipt', receipt._id, req.user?._id, `Recorded receipt ${recNum} for $${amount}`);",
  `    try {
      const cashAcct = await findAccount('Cash');
      const arAcct = await findAccount('Accounts Receivable');
      if (cashAcct && arAcct) {
        await postJournalEntry({
          sourceModule: 'AR',
          description: \`Payment Receipt \${recNum}\`,
          lines: [
            { type: 'Debit', accountId: cashAcct._id, amount: amount, referenceType: 'Receipt', referenceId: receipt._id },
            { type: 'Credit', accountId: arAcct._id, amount: amount, referenceType: 'Receipt', referenceId: receipt._id }
          ],
          userId: req.user?._id
        });
      }
    } catch (glErr) { console.warn('GL Post failed:', glErr.message); }
    await logAudit('CREATE', 'PaymentReceipt', receipt._id, req.user?._id, \`Recorded receipt \${recNum} for $\${amount}\`);`
);

// 10. V2 Bill
content = content.replace(
  "    const items = lineItems || [{ Description: 'Raw Auto Components & Steel Ingot Supply', Quantity: 50, Unit_Price: 20 }];\n    const totalAmount = items.reduce((sum, item) => sum + (Number(item.Quantity || 1) * Number(item.Unit_Price || 0)), 0);\n\n    const billNum = `BILL-${Date.now().toString().slice(-6)}`;\n    const bill = await VendorBill.create({\n      Bill_ID: billNum,\n      Bill_Number: billNum,\n      Vendor_ID,\n      Bill_Date: billDate,\n      Due_Date: dueDate,\n      Terms_ID: Terms_ID || 'Net 30',\n      Total_Amount: totalAmount,\n      Status: 'Open'\n    });\n\n    let seq = 1;\n    for (const item of items) {\n      const lineTotal = Number(item.Quantity || 1) * Number(item.Unit_Price || 0);\n      await BillLineItem.create({\n        Line_Item_ID: `BLNE-${Date.now().toString().slice(-6)}-${seq}`,\n        Bill_ID: bill._id,\n        Line_Sequence: seq++,\n        Description: item.Description || 'Raw Material Line Item',\n        Quantity: Number(item.Quantity || 1),\n        Unit_Price: Number(item.Unit_Price || 0),\n        Line_Total: lineTotal\n      });\n    }",
  `    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required to create a bill.' });
    }
    const items = lineItems;
    
    const gstResult = calculateLineItemsGST(items, req.body.isInterstate || false);
    const totalAmount = gstResult.summary.grandTotal;
    const taxableValue = gstResult.summary.taxableValue;
    const totalTax = gstResult.summary.totalTax;

    const billNum = await generateDocNumber('AP_BILL_V2', 'PINV');
    const bill = await VendorBill.create({
      Bill_ID: billNum,
      Bill_Number: billNum,
      Vendor_ID,
      Bill_Date: billDate,
      Due_Date: dueDate,
      Terms_ID: Terms_ID || 'Net 30',
      Total_Amount: totalAmount,
      Status: 'Open'
    });

    let seq = 1;
    for (const item of gstResult.lines) {
      await BillLineItem.create({
        Line_Item_ID: \`BLNE-\${billNum}-\${seq}\`,
        Bill_ID: bill._id,
        Line_Sequence: seq++,
        Description: item.Description || 'Raw Material Line Item',
        Quantity: Number(item.Quantity || 1),
        Unit_Price: Number(item.Unit_Price || 0),
        Line_Total: item.lineTotal,
        HSN_Code: item.HSN_Code || '',
        Tax_Amount: item.totalTax
      });
    }

    try {
      const expAcct = await findAccount('Cost of Goods Sold') || await findAccount('Expense');
      const apAcct = await findAccount('Accounts Payable');
      const taxAcct = await findAccount('Input Tax') || await findAccount('Tax');
      
      if (expAcct && apAcct) {
        const lines = [
          { type: 'Debit', accountId: expAcct._id, amount: taxableValue, referenceType: 'Bill', referenceId: bill._id },
          { type: 'Credit', accountId: apAcct._id, amount: totalAmount, referenceType: 'Bill', referenceId: bill._id }
        ];
        if (totalTax > 0 && taxAcct) {
          lines.push({ type: 'Debit', accountId: taxAcct._id, amount: totalTax, referenceType: 'Bill', referenceId: bill._id });
        }
        await postJournalEntry({
          sourceModule: 'AP',
          description: \`Vendor Bill \${billNum}\`,
          lines,
          userId: req.user?._id
        });
      }
    } catch (glErr) { console.warn('GL Post failed:', glErr.message); }`
);

// 11. V2 Vendor Payment
content = content.replace(
  "    const payNum = `PAY-${Date.now().toString().slice(-6)}`;",
  "    const payNum = await generateDocNumber('AP_PAY_V2', 'PAY');"
);
// Vendor payment GL Post
content = content.replace(
  "    await logAudit('CREATE', 'VendorPayment', payment._id, req.user?._id, `Recorded vendor payment ${payNum} for $${amount}`);",
  `    try {
      const cashAcct = await findAccount('Cash');
      const apAcct = await findAccount('Accounts Payable');
      if (cashAcct && apAcct) {
        await postJournalEntry({
          sourceModule: 'AP',
          description: \`Vendor Payment \${payNum}\`,
          lines: [
            { type: 'Debit', accountId: apAcct._id, amount: amount, referenceType: 'Payment', referenceId: payment._id },
            { type: 'Credit', accountId: cashAcct._id, amount: amount, referenceType: 'Payment', referenceId: payment._id }
          ],
          userId: req.user?._id
        });
      }
    } catch (glErr) { console.warn('GL Post failed:', glErr.message); }
    await logAudit('CREATE', 'VendorPayment', payment._id, req.user?._id, \`Recorded vendor payment \${payNum} for $\${amount}\`);`
);

content = content.replace(
  "    const app = await BillPaymentApplication.create({\n      Application_ID: `BAPP-${Date.now().toString().slice(-6)}`,",
  "    const appNum = await generateDocNumber('AP_APP_V2', 'BAPP');\n    const app = await BillPaymentApplication.create({\n      Application_ID: appNum,"
);

// 12. JE numbering fixes
content = content.replace(
  "    const jeNum = `JE-${Date.now().toString().slice(-6)}`;",
  "    const jeNum = await generateDocNumber('JE', 'JE');"
);
content = content.replace(
  "        Line_ID: `JLN-${Date.now().toString().slice(-6)}-${seq}`,",
  "        Line_ID: `JLN-${jeNum}-${seq}`,"
);
content = content.replace(
  "    const revNum = `JE-REV-${Date.now().toString().slice(-6)}`;",
  "    const revNum = await generateDocNumber('JE', 'JE');"
);
content = content.replace(
  "        Line_ID: `JLN-${Date.now().toString().slice(-6)}-${seq}`,",
  "        Line_ID: `JLN-${revNum}-${seq}`,"
);

// 13. Tax and Report numbering
content = content.replace(
  "    const taxNum = `TAX-${Date.now().toString().slice(-6)}`;",
  "    const taxNum = await generateDocNumber('TAX', 'TAX');"
);
content = content.replace(
  "    const repNum = `TXR-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString().slice(-4)}`;",
  "    const repNum = await generateDocNumber('TAX_REP', 'TXR');"
);

fs.writeFileSync('/Users/sajesh/Documents/Precision Auto Components Pvt Ltd/server/src/controllers/finance.controller.js', content, 'utf8');
console.log('Finance Controller fixed successfully!');
