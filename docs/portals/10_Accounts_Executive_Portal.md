# Portal Documentation: Accounts Executive
**Finance, Accounts Receivable (AR), Accounts Payable (AP), GST & Costing Portal**

---

## 1. Portal Identity & Authentication
- **Role Title:** Accounts Executive
- **Login Email:** `accounts.executive@lbap.in`
- **Default Password:** `password123`
- **Assigned Persona:** Meenakshi Krishnan (Chief Financial Accountant & Accounts Lead)
- **Target Demo Audience:** Chief Financial Officer (CFO), Financial Controller, Finance Managers, Statutory Auditors
- **Access Level:** Full Access to `Finance`; Read-Only Access to `Sales`, `Procurement`, `Inventory`, and `MasterData`.

---

## 2. Portal Overview & Value Proposition
In manufacturing, financial integrity relies on seamless operational integration. Traditional accounting software requires manual re-typing of dispatch challans and supplier invoices, creating reconciliation delays, missed Input Tax Credit (ITC), and inaccurate product costing.

The Accounts Executive Portal connects physical shopfloor events directly to financial ledgers: auto-generating GST tax invoices when goods leave the dispatch dock, executing automated 3-way matching (PO + GRN + Vendor Bill) to prevent overpayment, managing statutory Indian GST returns (GSTR-1, GSTR-2B, GSTR-3B), generating real-time Profit & Loss statements, and computing part-level costing variance.

---

## 3. Complete Navigation & Detailed Menu Breakdown

### A. Finance & Accounting Operations (`/finance`)

#### 1. Money In / Accounts Receivable (AR) (`/finance/ar`)
- **Purpose:** Customer invoicing, payment collections, and debtor credit management.
- **Key Capabilities & Workflows:**
  - *Sales Invoicing against Dispatch:* Select confirmed Delivery Challan (DC) ➔ System auto-populates part quantities, agreed contract prices, HSN codes, and GST rates (CGST+SGST or IGST).
  - *Customer Payment Receipts:* Log inbound wire payments (NEFT, RTGS, Cheque) with bank reference number and transaction date.
  - *Invoice Matching / Knock-off:* Settle received payment amounts against specific open invoices.
  - *Customer Credit & Ageing Analysis:* Live debtor ageing breakdown:
    - Current (Not Due), 1-30 Days, 31-60 Days, 61-90 Days, >90 Days Overdue.
    - Automatic credit limit alerts preventing dispatch to customers with delinquent balances.
- **Actions:**
  - `Generate Tax Invoice`: Produces formal GST invoice compliant with e-Invoicing QR standards.
  - `Record Payment Receipt`: Payment voucher creation form.
  - `Issue Credit / Debit Note`: Commercial adjustment memo for rate differences or quality rejection returns.

#### 2. Money Out / Accounts Payable (AP) (`/finance/ap`)
- **Purpose:** Vendor bill verification, supplier payments, and statutory TDS compliance.
- **Automotive 3-Way Match Verification:**
  - 1. **Purchase Order (PO):** Verified agreed purchase rate and commercial terms.
  - 2. **Goods Receipt Note (GRN):** Verified physical weight and quantity accepted by the store.
  - 3. **Supplier Invoice:** Enters supplier bill number, date, and tax amount.
  - *Discrepancy Guard:* Flags price variances (>0.5%) or quantity variances, preventing payment release without manager sign-off.
- **Vendor Payment Batches:**
  - Consolidate approved bills for batch bank transfer.
  - Automatic deduction of statutory Tax Deducted at Source (TDS under Section 194C / 194Q).
- **Actions:**
  - `Book Vendor Bill`: 3-way matching voucher screen.
  - `Process Payment Voucher`: Generates payment advice and bank upload format.

#### 3. General Ledger (`/finance/ledger`)
- **Purpose:** Double-entry accounting core and complete Chart of Accounts.
- **Capabilities:**
  - Standard hierarchical Chart of Accounts: Assets, Liabilities, Equity, Revenue, Direct Expenses, Indirect Expenses.
  - Automatic journal vouchers created by sales dispatches, supplier bills, payment receipts, and inventory valuation adjustments.
  - Manual Journal Vouchers (JV) for depreciation, accruals, and month-end closing adjustments.
  - Drill-down from Trial Balance line directly into underlying ledger transaction journals.

#### 4. Tax & GST Management (`/finance/tax`)
- **Purpose:** Indian GST compliance, e-Invoicing reconciliation, and return preparation.
- **Tax Tables Supported:**
  - *GSTR-1 Outward Supplies:* Tax invoice summaries organized by B2B, B2C, HSN summary, and credit notes.
  - *GSTR-2B Input Tax Credit (ITC):* Raw steel and bought-out hardware purchase tax reconciliation.
  - *GSTR-3B Monthly Return Working:* Net GST payable calculation (Output Tax Liability minus Eligible ITC).

#### 5. Financial Statements (`/finance/statements`)
- **Purpose:** Executive balance sheets and profitability reporting.
- **Reports Generated in Real Time:**
  - *Profit & Loss Statement (P&L):* Gross revenue, Cost of Goods Sold (COGS), Gross Profit, Operating Expenses (Power, Fuel, Die Maintenance, Labor), EBITDA, and Net Profit.
  - *Balance Sheet:* Current Assets (Inventory, Debtors, Cash), Fixed Assets (Presses, Tooling, Buildings), Current Liabilities (Creditors, Taxes), Equity.
  - *Cash Flow Summary:* Operational, investing, and financing cash flows.

#### 6. Cost Accounting & Unit Part Costing (`/finance/costing`)
- **Purpose:** Part-level standard vs actual manufacturing cost variance analysis.
- **Automotive Cost Breakdown per Part:**
  - Direct Material Cost (Blank weight × Steel coil rate/kg).
  - Less: Scrap Realization Credit (Skeleton off-cut weight × Scrap price/kg).
  - Direct Press Machine Overhead (Machine hour rate × cycle time / SPM).
  - Press Tool / Die Wear Amortization Cost.
  - Direct Assembly Labor Cost.
  - Secondary Plating / Subcontract Processing Cost.
- **Variance Analysis:** Highlights parts operating below budgeted gross margin.

---

### B. Executive Reporting & Cross-Module Visibility

#### 1. Company Overview / CEO Dashboard (`/dashboards/ceo`)
- Consolidated executive cockpit showing Total Monthly Revenue, Gross Margin %, Operating Cash Flow, Accounts Receivable vs Payable ratio, and Working Capital turnover.

#### 2. Stock Valuation (`/inventory/valuation`)
- Live book value of raw material coils, work-in-progress stampings, and finished goods warehouse stock for balance sheet inventory asset reporting.

---

## 4. Live Client Demonstration Script (10-Minute Walkthrough)

1. **Log in as `accounts.executive@lbap.in`**:
   - Point out that this portal combines operational speed with accounting rigor, eliminating separate offline accounting spreadsheets.
2. **Open Money In / Accounts Receivable (`/finance/ar`)**:
   - Show how a completed Dispatch Challan is converted into a GST Tax Invoice with zero manual re-entry.
   - Show the Customer Ageing report and point out how payment collections are tracked.
3. **Open Money Out / Accounts Payable (`/finance/ap`)**:
   - Demonstrate the **3-Way Match Verification** (PO + GRN + Vendor Bill). Explain: *"The system ensures the finance department never pays a rupee more than what the purchase order agreed and what the store keeper weighed."*
4. **Open Tax & GST (`/finance/tax`)**:
   - Display the GSTR-1 and GSTR-3B tax preparation sheets. Show how HSN summaries and GST rates are pre-aggregated for seamless monthly filing.
5. **Open Cost Accounting (`/finance/costing`)**:
   - Walk through the part-level cost breakdown showing raw material cost, scrap credit, machine press hour absorption, and actual profit margin per stamped component.
