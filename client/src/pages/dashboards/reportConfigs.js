import {
  ShoppingCart, IndianRupee, Receipt, BookOpen, Truck, Clock, Boxes, PackageX, AlertTriangle, Hourglass,
  Factory, Percent, Timer, Gauge, ClipboardList, Search, XCircle, ShieldAlert, Wrench, Activity, CalendarClock,
  Wallet, Landmark, TrendingUp, Building2, BarChart3, Package, ClipboardCheck, HardHat, ShieldCheck, Zap
} from 'lucide-react';
import { MODULES as M } from '../../utils/permissions';
import { fmtUnit } from '../../utils/format';

/* One entry per department report: what it is for, who reads it, which
   figure gets which icon, how each breakdown is drawn, and the sentences the
   "in plain words" strip writes from the data. The hub reads the same list
   to draw its cards, so a report described here appears everywhere at once. */

const h = (data, key) => data.headline.find((x) => x.key === key) || {};
const money = (v) => fmtUnit(v, 'money');
const n = (v) => fmtUnit(v, 'count');
const dir = (d) => (d > 0 ? 'up' : 'down');

export const REPORTS = [
  {
    endpoint: 'ceo',
    path: '/dashboards/ceo',
    module: M.FINANCE,
    icon: Building2,
    title: 'Company Overview',
    subtitle: 'Strategic Financial, Order Book & Liquidity Cockpit',
    description: 'The whole business on one screen — what we billed, what we spent, what customers still owe, what we still owe, and what is sitting on the shelves.',
    who: 'Owner, Plant Manager, Head of Accounts',
    theme: {
      accent: '#1e40af',
      badge: 'Executive Cockpit',
      tagline: 'Strategic Financial & Liquidity Ledger',
      lightBg: '#eff6ff',
      border: '#bfdbfe',
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
      accentDark: '#172554',
      chipColor: '#1d4ed8'
    },
    icons: { revenue: IndianRupee, spend: Receipt, gross: TrendingUp, cash: Wallet, owed: Landmark, owe: Receipt, stock: Boxes, book: BookOpen, output: Factory },
    seriesGroups: [
      { title: 'Billed vs bought', keys: ['revenue', 'spend'], caption: 'What we invoiced customers against what suppliers billed us, month by month' },
      { title: 'Cash in vs cash out', keys: ['cashIn', 'cashOut'], caption: 'Money actually received against money actually paid' }
    ],
    readings: (d) => {
      const r = h(d, 'revenue'), s = h(d, 'spend'), g = h(d, 'gross'), o = h(d, 'owed'), w = h(d, 'owe');
      const out = [`We invoiced ${money(r.value)} ${d.period.label}${typeof r.delta === 'number' ? `, ${dir(r.delta)} ${Math.abs(r.delta)}% on the period before` : ''}, and suppliers billed us ${money(s.value)} — leaving ${money(g.value)}${r.value ? ` (${Math.round((g.value / r.value) * 100)}% of revenue)` : ''} before wages and overheads.`];
      out.push(`Customers owe us ${money(o.value)}${o.caption?.includes('past due') ? ` — ${o.caption}` : ''}; we owe suppliers ${money(w.value)}.`);
      const crit = d.attention.filter((a) => a.severity === 'critical');
      out.push(crit.length ? `${crit.length} thing${crit.length === 1 ? '' : 's'} need${crit.length === 1 ? 's' : ''} action now: ${crit.slice(0, 3).map((a) => a.title.toLowerCase()).join('; ')}.` : 'Nothing is critical right now.');
      return out;
    },
    explain: [
      ['Revenue invoiced', 'Customer invoices dated in the period. An order that has not been invoiced yet is in the order book, not here.'],
      ['Revenue less purchases', 'A rough margin: invoiced revenue minus supplier bills. It does not include wages, power or overheads.'],
      ['Customers owe us', 'Every invoice sent and not fully paid, less the receipts already applied to it.'],
      ['Stock on hand', 'Each live batch valued at its own purchase cost.']
    ]
  },
  {
    endpoint: 'sales',
    path: '/dashboards/sales',
    module: M.SALES,
    icon: ShoppingCart,
    title: 'Sales Report',
    subtitle: 'Commercial Velocity & Customer Delivery Commitments',
    description: 'Orders coming in, revenue going out on invoices, which customers drive it, and any promised delivery we are late on.',
    who: 'Sales Team, Plant Manager, Dispatch',
    theme: {
      accent: '#0284c7',
      badge: 'Commercial Engine',
      tagline: 'Order Velocity & Revenue Conversion Engine',
      lightBg: '#f0f9ff',
      border: '#bae6fd',
      gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
      accentDark: '#082f49',
      chipColor: '#0369a1'
    },
    icons: { orders: ShoppingCart, orderValue: IndianRupee, invoiced: Receipt, openBook: BookOpen },
    breakdowns: { customers: 'bars', status: 'donut' }, donutLabel: { status: 'Orders' },
    readings: (d) => {
      const o = h(d, 'orders'), v = h(d, 'orderValue'), i = h(d, 'invoiced'), b = h(d, 'openBook');
      const top = d.breakdowns.find((x) => x.key === 'customers')?.rows?.[0];
      const out = [`${n(o.value)} order${o.value === 1 ? '' : 's'} worth ${money(v.value)} came in ${d.period.label}${typeof v.delta === 'number' ? ` — ${dir(v.delta)} ${Math.abs(v.delta)}% on the period before` : ''}.`];
      out.push(`${money(i.value)} was invoiced in the same period${typeof i.delta === 'number' ? `, ${dir(i.delta)} ${Math.abs(i.delta)}%` : ''}; ${money(b.value)} of orders is still to be delivered.`);
      if (top) out.push(`${top.label} is the biggest customer this period at ${money(top.value)}${top.share ? ` (${Math.round(top.share)}% of the top eight)` : ''}.`);
      const late = d.attention.find((a) => a.title.includes('past the promised'));
      out.push(late ? `${late.title} — the customer is waiting.` : 'No order is past its promised delivery date.');
      return out;
    },
    explain: [
      ['Orders received', 'Sales orders dated in the period, whatever their status now (cancelled ones excluded).'],
      ['Revenue invoiced', 'Customer invoices dated in the period — the figure the accounts see.'],
      ['Open order book', 'Every order not yet completed or cancelled, all time. This is the work still owed to customers.']
    ]
  },
  {
    endpoint: 'procurement',
    path: '/dashboards/procurement',
    module: M.PROCUREMENT,
    icon: Truck,
    title: 'Purchasing Report',
    subtitle: 'Direct Material Spend & Supplier Deliveries',
    description: 'What we ordered from suppliers, what they have billed, what is still to arrive, and which deliveries are late.',
    who: 'Purchase Officer, Stores Manager, Accounts',
    theme: {
      accent: '#b45309',
      badge: 'Supply Chain',
      tagline: 'Direct Material Spend & Supplier Logistics Control',
      lightBg: '#fffbeb',
      border: '#fde68a',
      gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
      accentDark: '#451a03',
      chipColor: '#b45309'
    },
    icons: { spend: ShoppingCart, billed: Receipt, open: Truck, awaiting: Clock },
    breakdowns: { vendors: 'bars', delivery: 'donut' }, donutLabel: { delivery: 'POs' },
    readings: (d) => {
      const s = h(d, 'spend'), o = h(d, 'open'), a = h(d, 'awaiting');
      const top = d.breakdowns.find((x) => x.key === 'vendors')?.rows?.[0];
      const out = [`Purchase orders worth ${money(s.value)} were raised ${d.period.label}${typeof s.delta === 'number' ? `, ${dir(s.delta)} ${Math.abs(s.delta)}% on the period before` : ''}.`];
      out.push(`${money(o.value)} of ordered material is still to arrive${a.value ? `, and ${n(a.value)} PO${a.value === 1 ? '' : 's'} cannot go to the supplier until approved` : ''}.`);
      if (top) out.push(`${top.label} is the biggest supplier this period at ${money(top.value)}.`);
      const late = d.attention.find((a2) => a2.title.includes('late'));
      const low = d.attention.find((a2) => a2.title.includes('reorder'));
      out.push([late?.title, low?.title].filter(Boolean).join('; ') || 'No supplier delivery is late and nothing is below its reorder level.');
      return out;
    },
    explain: [
      ['Purchase orders raised', 'The value committed to suppliers in the period, rejected POs excluded.'],
      ['Billed by suppliers', 'Supplier bills dated in the period — what accounts will actually pay.'],
      ['Late deliveries', 'A PO line whose promised date has passed with quantity still not received.']
    ]
  },
  {
    endpoint: 'inventory',
    path: '/dashboards/inventory',
    module: M.INVENTORY,
    icon: Boxes,
    title: 'Stock Report',
    subtitle: 'Valuation, Safety Levels & Batch Aging Matrix',
    description: 'How much money is on the shelves, where it sits, what is running low, and what has not moved.',
    who: 'Store Keeper, Purchase Officer, Accounts',
    theme: {
      accent: '#047857',
      badge: 'Stores & Materials',
      tagline: 'Working Capital, Valuation & Batch Aging Matrix',
      lightBg: '#ecfdf5',
      border: '#a7f3d0',
      gradient: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
      accentDark: '#022c22',
      chipColor: '#047857'
    },
    icons: { value: Boxes, low: AlertTriangle, held: PackageX, slow: Hourglass },
    breakdowns: { type: 'donut', items: 'bars', low: 'bars', slow: 'bars' }, donutLabel: { type: 'On hand' },
    emptyText: { low: 'Every material is above its reorder level.', slow: 'Nothing has sat for more than 90 days.' },
    readings: (d) => {
      const v = h(d, 'value'), l = h(d, 'low'), q = h(d, 'held'), s = h(d, 'slow');
      const type = d.breakdowns.find((x) => x.key === 'type')?.rows || [];
      const biggest = [...type].sort((a, b) => b.value - a.value)[0];
      const out = [`Stock on hand is worth ${money(v.value)}${biggest ? `, ${Math.round(biggest.share || 0)}% of it ${biggest.label.toLowerCase()}` : ''}.`];
      out.push(l.value ? `${n(l.value)} material${l.value === 1 ? ' is' : 's are'} at or below the reorder level — a purchase order is due.` : 'Every material is above its reorder level.');
      out.push(`${money(q.value)} is held in quarantine waiting on quality; ${money(s.value)} has not moved in 90 days.`);
      return out;
    },
    explain: [
      ['Stock on hand', 'Live batches valued at their own purchase cost (standard cost where a batch has none).'],
      ['Below reorder level', 'Total on hand for a material is at or under the reorder level set in Master Data → Raw Materials.'],
      ['Not moved in 90 days', 'Batches received more than 90 days ago with quantity still on the shelf — money tied up.']
    ]
  },
  {
    endpoint: 'production',
    path: '/dashboards/production',
    module: M.PRODUCTION,
    icon: Factory,
    title: 'Production Report',
    subtitle: 'Press Shop OEE, Work Order Yield & Scrap Containment',
    description: 'What the presses made, how much was scrapped, how long they stood idle and why, and how busy each machine is.',
    who: 'Production Planner, Shop Floor Supervisor, Plant Manager',
    theme: {
      accent: '#c2410c',
      badge: 'Shop Floor OEE',
      tagline: 'Press Shop Execution Cockpit & Scrap Containment',
      lightBg: '#fff7ed',
      border: '#fed7aa',
      gradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 100%)',
      accentDark: '#431407',
      chipColor: '#c2410c'
    },
    icons: { good: Factory, scrap: Percent, downtime: Timer, utilisation: Gauge, wo: ClipboardList },
    seriesGroups: [
      { title: 'Output', keys: ['good', 'scrap'], caption: 'Good pieces against scrap and rejects, month by month' },
      { title: 'Downtime', keys: ['downtime'], caption: 'Hours the presses stood, month by month' }
    ],
    breakdowns: { reasons: 'bars', machines: 'bars', wo: 'donut' }, donutLabel: { wo: 'Work orders' },
    readings: (d) => {
      const g = h(d, 'good'), s = h(d, 'scrap'), t = h(d, 'downtime'), u = h(d, 'utilisation');
      const reason = d.breakdowns.find((x) => x.key === 'reasons')?.rows?.[0];
      const out = [`${n(g.value)} good pieces were made ${d.period.label}${typeof g.delta === 'number' ? `, ${dir(g.delta)} ${Math.abs(g.delta)}% on the period before` : ''}.`];
      out.push(s.value === null ? 'No output was recorded, so there is no scrap rate to report.' : `Scrap ran at ${fmtUnit(s.value, 'percent')}${typeof s.delta === 'number' ? ` — ${s.delta > 0 ? 'worse' : 'better'} by ${Math.abs(s.delta)} points` : ''}${s.value > 5 ? '. Above 5% is worth a look.' : '.'}`);
      out.push(`${fmtUnit(t.value, 'hours')} of downtime${reason ? `, most of it "${reason.label}" (${fmtUnit(reason.value, 'hours')})` : ''}${u.value !== null && u.value !== undefined ? `; machines averaged ${fmtUnit(u.value, 'percent')} utilisation` : ''}.`);
      return out;
    },
    explain: [
      ['Good pieces', 'Output posted on the Production Output screen, both the old and the new form of the record.'],
      ['Scrap rate', 'Scrapped plus rejected pieces as a share of everything made.'],
      ['Utilisation', 'As logged per machine on the Machine Utilization screen. Not recorded means nobody has logged it.']
    ]
  },
  {
    endpoint: 'quality',
    path: '/dashboards/quality',
    module: M.QUALITY,
    icon: ClipboardCheck,
    title: 'Quality Report',
    subtitle: 'IATF 16949 Assurance, Defect Pareto & Open NCRs',
    description: 'What was inspected at the gate, on the press and before dispatch; what failed; the defects that keep coming back; and the non-conformances still open.',
    who: 'Quality Inspector, Plant Manager, QA Head',
    theme: {
      accent: '#6d28d9',
      badge: 'IATF 16949 Assurance',
      tagline: 'Defect Pareto, Gate Rejections & Corrective Actions (CAPA)',
      lightBg: '#f5f3ff',
      border: '#ddd6fe',
      gradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
      accentDark: '#2e1065',
      chipColor: '#6d28d9'
    },
    icons: { inspections: Search, failRate: XCircle, incRate: PackageX, ncrOpen: ShieldAlert },
    breakdowns: { stages: 'bars', defects: 'bars', ncr: 'donut' }, donutLabel: { ncr: 'NCRs' },
    readings: (d) => {
      const i = h(d, 'inspections'), f = h(d, 'failRate'), r = h(d, 'incRate'), o = h(d, 'ncrOpen');
      const defect = d.breakdowns.find((x) => x.key === 'defects')?.rows?.[0];
      const out = [`${n(i.value)} inspections were done ${d.period.label}${f.value !== null ? `, and ${fmtUnit(f.value, 'percent')} failed or went for rework` : ''}.`];
      out.push(r.value === null ? 'No incoming quantities were recorded, so the incoming rejection rate cannot be reported.' : `${fmtUnit(r.value, 'percent')} of incoming material was rejected at the gate${typeof r.delta === 'number' ? ` — ${r.delta > 0 ? 'worse' : 'better'} by ${Math.abs(r.delta)} points` : ''}.`);
      if (defect) out.push(`The most common defect on record is "${defect.label}" (${n(defect.value)} times).`);
      out.push(o.value ? `${n(o.value)} non-conformance${o.value === 1 ? ' is' : 's are'} still open.` : 'No non-conformance is open.');
      return out;
    },
    explain: [
      ['Inspections failed', 'Inspections with a Fail or Rework result as a share of all inspections done in the period, across the three stages.'],
      ['Incoming material rejected', 'Rejected quantity as a share of received quantity on incoming inspections.'],
      ['Non-conformance (NCR)', 'A defect serious enough to need a root cause and a corrective action; open means that action is not closed.']
    ]
  },
  {
    endpoint: 'maintenance',
    path: '/dashboards/maintenance',
    module: M.MAINTENANCE,
    icon: Wrench,
    title: 'Maintenance Report',
    subtitle: 'Asset Health, Press Downtime, MTTR & PM Adherence',
    description: 'Breakdowns and the hours they cost, how long repairs take, which machines fail most, and whether planned service is on schedule.',
    who: 'Maintenance Engineer, Plant Manager, Toolroom Head',
    theme: {
      accent: '#be123c',
      badge: 'Asset Reliability',
      tagline: 'Equipment Uptime, Breakdown Elimination & Preventive Service',
      lightBg: '#fff1f2',
      border: '#fecdd3',
      gradient: 'linear-gradient(135deg, #9f1239 0%, #e11d48 100%)',
      accentDark: '#4c0519',
      chipColor: '#be123c'
    },
    icons: { breakdowns: Wrench, hours: Timer, mttr: Activity, pmOverdue: CalendarClock },
    breakdowns: { machines: 'bars', status: 'donut', pm: 'donut' }, donutLabel: { status: 'Breakdowns', pm: 'Tasks' },
    readings: (d) => {
      const b = h(d, 'breakdowns'), hr = h(d, 'hours'), m = h(d, 'mttr'), p = h(d, 'pmOverdue');
      const worst = d.breakdowns.find((x) => x.key === 'machines')?.rows?.[0];
      const out = [`${n(b.value)} breakdown${b.value === 1 ? '' : 's'} ${d.period.label} cost ${fmtUnit(hr.value, 'hours')} of press time${typeof hr.delta === 'number' ? ` — ${hr.delta > 0 ? 'more' : 'less'} than the period before by ${Math.abs(hr.delta)}%` : ''}.`];
      if (worst) out.push(`${worst.label} lost the most time (${fmtUnit(worst.value, 'hours')}).`);
      out.push(m.value === null || m.value === undefined ? 'No breakdown was resolved in the period, so there is no average repair time.' : `A repair took ${fmtUnit(m.value, 'hours')} on average.`);
      out.push(p.value ? `${n(p.value)} planned service task${p.value === 1 ? ' is' : 's are'} overdue — a breakdown waiting to happen.` : 'Planned service is on schedule.');
      return out;
    },
    explain: [
      ['Breakdowns', 'Breakdown reports dated in the period.'],
      ['Average time to repair', 'Downtime hours per resolved breakdown — how long a press is out once it fails.'],
      ['Planned service overdue', 'Preventive tasks scheduled before today and not marked done.']
    ]
  }
];

export const reportByEndpoint = (endpoint) => REPORTS.find((r) => r.endpoint === endpoint);
export { BarChart3, Package, HardHat };
