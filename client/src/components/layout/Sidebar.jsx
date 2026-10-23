import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { canAccess, MODULES as M } from '../../utils/permissions';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  LayoutDashboard,
  Settings,
  Users,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Activity,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardCheck,
  Wrench,
  ShoppingCart,
  TrendingUp,
  Settings2,
  CalendarDays,
  Truck,
  PackageCheck,
  Boxes,
  Hammer,
  Stethoscope,
  Factory,
  Database,
  FileText,
  IndianRupee,
  BarChart3,
  LifeBuoy
} from 'lucide-react';

/*
 * One source of truth for the menu. Header.jsx reads it too, so the page name
 * in the toolbar always matches the menu entry the user clicked.
 *
 * Wording rule: plain words first, the trade acronym in brackets only where
 * the shop floor genuinely says it (BOM, GRN, PO, RFQ, MRP, GST). Every entry
 * carries a `hint` - it becomes the tooltip and the screen-reader label, which
 * is the only explanation available once the menu is collapsed to icons.
 *
 * `path` values are routes. Never edit them - only labels and hints.
 */

/* Shown above the module groups.
 *
 * `module` decides who sees the entry — see canAccess() in utils/permissions.js.
 * Dashboard and Pending Approvals carry none on purpose: the first is the
 * universal landing page, the second is a personal inbox ("documents waiting
 * for YOUR approval") that could apply to anyone regardless of department, not
 * a configuration screen. The other four are exactly the plant-manager-level
 * setup screens a job-function login has no reason to open — a Store Keeper
 * does not set approval limits, add staff, or edit roles. */
const TOP_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', hint: 'Key numbers for the whole plant today', icon: LayoutDashboard },
  { path: '/approvals', label: 'Pending Approvals', hint: 'Documents waiting for your approval', icon: ClipboardCheck },
  { path: '/approval-rights', label: 'Who Can Approve What', hint: 'Set the approval limit for each role', icon: ShieldAlert, module: M.APPROVALS },
  { path: '/company', label: 'Company Setup', hint: 'Company name, GSTIN, plants and addresses', icon: Settings, module: M.COMPANY_SETUP },
  { path: '/users', label: 'Users & Logins', hint: 'Add staff and reset their logins', icon: Users, module: M.USERS },
  { path: '/roles', label: 'Roles & Access', hint: 'Which role can open which screen', icon: Shield, module: M.ROLES }
];

/* Shown below the module groups. */
const BOTTOM_ITEMS = [
  { path: '/issues', label: 'Reported Problems', hint: 'What people hit while using the system, and what was said back', icon: LifeBuoy, module: M.AUDIT },
  { path: '/audit', label: 'Change History (Audit)', hint: 'Who changed what, and when', icon: Activity, module: M.AUDIT }
];

/* Every section below carries a `module` — see canAccess() in
 * utils/permissions.js. A section with no visible child (none of its items'
 * module, or the section's own, passes canAccess) is left out of the menu
 * entirely rather than shown as an empty header.
 *
 * 'dashboards' is the one exception with no single section-level module: each
 * report belongs to a different department, so each child carries its own
 * tag and the section shows if any one of them does. Company Overview ties to
 * Finance because that is literally what it shows — revenue, profit, cash,
 * stock value — which is also why a Plant Manager (Finance: read) still sees
 * it alongside Accounts Executive and Super Admin. */
const NAV_SECTIONS = [
  {
    key: 'dashboards',
    label: 'Reports & Analytics',
    hint: 'Charts and summaries for each department',
    icon: BarChart3,
    items: [
      // `end`: the hub is the parent of every report path, and without it the
      // hub row would light up alongside whichever report is open.
      { path: '/dashboards', label: 'All Reports', hint: 'Every report in one place, with what needs attention', end: true },
      { path: '/dashboards/ceo', label: 'Company Overview (CEO)', hint: 'The whole business on one screen', module: M.FINANCE },
      { path: '/dashboards/sales', label: 'Sales Report', hint: 'Orders, value and customer trends', module: M.SALES },
      { path: '/dashboards/procurement', label: 'Purchasing Report', hint: 'Supplier spend and purchase order status', module: M.PROCUREMENT },
      { path: '/dashboards/inventory', label: 'Stock Report', hint: 'Stock value, ageing and slow movers', module: M.INVENTORY },
      { path: '/dashboards/production', label: 'Production Report', hint: 'Output, efficiency and work order status', module: M.PRODUCTION },
      { path: '/dashboards/quality', label: 'Quality Report', hint: 'Rejections, rework and inspection results', module: M.QUALITY },
      { path: '/dashboards/maintenance', label: 'Maintenance Report', hint: 'Breakdowns, downtime and machine health', module: M.MAINTENANCE }
    ]
  },
  {
    key: 'master',
    label: 'Master Data',
    hint: 'The standing lists every other screen uses',
    icon: Database,
    module: M.MASTER_DATA,
    items: [
      { path: '/master/customer', label: 'Customers', hint: 'Customer names, addresses and GSTIN' },
      { path: '/master/vendor', label: 'Suppliers (Vendors)', hint: 'Supplier names, addresses and GSTIN' },
      { path: '/master/product', label: 'Products We Make', hint: 'Finished parts with part number and HSN' },
      { path: '/master/material', label: 'Raw Materials', hint: 'Sheet, coil and bought-out items' },
      { path: '/master/uom', label: 'Units of Measure', hint: 'Nos, kg, metre and how they convert' },
      { path: '/master/warehouse', label: 'Stores & Warehouses', hint: 'Store locations, racks and bins' },
      { path: '/master/machine', label: 'Machines', hint: 'Presses and other machines on the floor' },
      { path: '/master/workcenter', label: 'Work Centres', hint: 'Groups of machines and their capacity' },
      { path: '/master/system-config', label: 'System Settings', hint: 'Number series, defaults and plant settings' }
    ]
  },
  {
    key: 'engineering',
    label: 'Engineering',
    hint: 'Parts lists, process steps and design changes',
    icon: Wrench,
    module: M.ENGINEERING,
    items: [
      { path: '/engineering/bom', label: 'Parts Lists (BOM)', hint: 'What goes into each finished part' },
      { path: '/engineering/routing', label: 'Process Steps (Routing)', hint: 'Operation order and cycle time per part' },
      { path: '/engineering/change', label: 'Design Change Requests', hint: 'Raise and track a change to a part' }
    ]
  },
  {
    key: 'sales',
    label: 'Sales',
    hint: 'Customer enquiries, quotations and orders',
    icon: FileText,
    module: M.SALES,
    items: [
      { path: '/sales/inquiry', label: 'Customer Inquiries', hint: 'What customers have asked us to quote' },
      { path: '/sales/quotation', label: 'Quotations', hint: 'Prices we have offered to customers' },
      { path: '/sales/order', label: 'Sales Orders', hint: 'Confirmed customer orders to deliver' }
    ]
  },
  {
    key: 'demand',
    label: 'Demand Planning',
    hint: 'What customers will need in the coming months',
    icon: TrendingUp,
    module: M.DEMAND_PLANNING,
    items: [
      { path: '/demand/forecasting', label: 'Demand Forecast', hint: 'Expected customer demand ahead' },
      { path: '/demand/consolidation', label: 'Combined Demand', hint: 'All demand added up, part by part' }
    ]
  },
  {
    key: 'mrp',
    label: 'Material Planning (MRP)',
    hint: 'Works out what to buy and make, and by when',
    icon: Settings2,
    module: M.MRP,
    items: [
      { path: '/mrp/execution', label: 'Run Material Plan', hint: 'Start the calculation for a plant and period' },
      { path: '/mrp/shortages', label: 'Material Shortages', hint: 'Parts that will run short, and the date' },
      { path: '/mrp/recommendations', label: 'Suggested Orders', hint: 'Buy and make suggestions for you to approve' }
    ]
  },
  {
    key: 'capacity',
    label: 'Capacity Planning',
    hint: 'Machine and manpower load against the plan',
    icon: CalendarDays,
    module: M.CAPACITY,
    items: [
      { path: '/capacity/machine', label: 'Machine Capacity', hint: 'Hours available against hours needed' },
      { path: '/capacity/labor', label: 'Manpower Capacity', hint: 'Operators available against work planned' },
      { path: '/capacity/schedule', label: 'Production Schedule', hint: 'Day by day plan for each work centre' }
    ]
  },
  {
    key: 'procurement',
    label: 'Purchasing',
    hint: 'Purchase requests, supplier prices and orders',
    icon: ShoppingCart,
    module: M.PROCUREMENT,
    items: [
      { path: '/procurement/requisition', label: 'Purchase Requests', hint: 'Internal requests to buy material' },
      { path: '/procurement/rfq', label: 'Supplier Price Requests (RFQ)', hint: 'Ask suppliers to quote a price' },
      { path: '/procurement/po', label: 'Purchase Orders (PO)', hint: 'Orders placed on suppliers' },
      { path: '/procurement/performance', label: 'Supplier Performance', hint: 'On-time delivery and quality by supplier' }
    ]
  },
  {
    key: 'receipt',
    label: 'Goods Receiving',
    hint: 'Material arriving from suppliers',
    icon: PackageCheck,
    module: M.GOODS_RECEIPT,
    items: [
      { path: '/receipt/grn', label: 'Goods Received (GRN)', hint: 'Record material received against a PO' },
      { path: '/receipt/inspection', label: 'Inspect Received Goods', hint: 'Accept or reject what came in' },
      { path: '/receipt/inventory', label: 'Move Into Stock', hint: 'Post accepted material into the store' }
    ]
  },
  {
    key: 'inventory',
    label: 'Stock (Inventory)',
    hint: 'What is lying in the store right now',
    icon: Boxes,
    module: M.INVENTORY,
    items: [
      { path: '/inventory/control', label: 'Stock on Hand', hint: 'Quantity in each store and bin' },
      { path: '/inventory/transactions', label: 'Stock Movements', hint: 'Every issue, receipt and transfer' },
      { path: '/inventory/optimization', label: 'Reorder Levels', hint: 'Minimum, maximum and safety stock' },
      { path: '/inventory/valuation', label: 'Stock Value', hint: 'What the stock is worth in rupees' },
      { path: '/inventory/traceability', label: 'Batch & Lot Tracking', hint: 'Trace a batch from coil to dispatch' }
    ]
  },
  {
    key: 'production',
    label: 'Production',
    hint: 'Work orders and what the presses are making',
    icon: Hammer,
    module: M.PRODUCTION,
    items: [
      { path: '/production/plan', label: 'Production Plan', hint: 'What to make, and in what order' },
      { path: '/production/wo', label: 'Work Orders', hint: 'Job cards released to the shop floor' },
      { path: '/production/allocation', label: 'Allocate Material', hint: 'Reserve material for each work order' },
      { path: '/production/execution', label: 'Run Production', hint: 'Start, pause and finish a job' },
      { path: '/production/output', label: 'Production Output', hint: 'Good pieces produced against target' }
    ]
  },
  {
    key: 'shopfloor',
    label: 'Shop Floor',
    hint: 'Operators, machine usage, downtime and scrap',
    icon: Factory,
    module: M.SHOP_FLOOR,
    items: [
      { path: '/shopfloor/operator', label: 'Operators', hint: 'Who is working on which machine' },
      { path: '/shopfloor/machine', label: 'Machine Usage', hint: 'How much each machine is running' },
      { path: '/shopfloor/downtime', label: 'Machine Downtime', hint: 'Stoppages and the reason for each' },
      { path: '/shopfloor/scrap', label: 'Scrap & Rejections', hint: 'Rejected pieces and the reason' }
    ]
  },
  {
    key: 'quality',
    label: 'Quality',
    hint: 'Inspections, rejections and corrective action',
    icon: ShieldCheck,
    module: M.QUALITY,
    items: [
      { path: '/quality/incoming', label: 'Incoming Material Checks', hint: 'Inspect material received from suppliers' },
      { path: '/quality/in-process', label: 'In-Process Checks', hint: 'Checks taken while the job is running' },
      { path: '/quality/final', label: 'Final Inspection', hint: 'Check finished parts before dispatch' },
      { path: '/quality/parameters', label: 'Inspection Parameters', hint: 'What to measure and the allowed limits' },
      { path: '/quality/ncr', label: 'Quality Problems & Fixes', hint: 'Log a problem and the corrective action' },
      { path: '/quality/analytics', label: 'Quality Reports', hint: 'Rejection trends by part and reason' }
    ]
  },
  {
    key: 'maintenance',
    label: 'Maintenance',
    hint: 'Keeping the machines running',
    icon: Stethoscope,
    module: M.MAINTENANCE,
    items: [
      { path: '/maintenance/preventive', label: 'Planned Maintenance', hint: 'Service done before a breakdown' },
      { path: '/maintenance/breakdown', label: 'Breakdown Repairs', hint: 'Report and close machine breakdowns' },
      { path: '/maintenance/sparepart', label: 'Spare Parts', hint: 'Spares stock held for machine repairs' },
      { path: '/maintenance/analytics', label: 'Maintenance Reports', hint: 'Downtime and repair cost trends' }
    ]
  },
  {
    key: 'dispatch',
    label: 'Dispatch & Delivery',
    hint: 'Sending finished goods to customers',
    icon: Truck,
    module: M.DISPATCH,
    items: [
      { path: '/dispatch/planning', label: 'Dispatch Plan', hint: 'What goes out, to whom, on which day' },
      { path: '/dispatch/execution', label: 'Record Dispatch', hint: 'Book the vehicle and send the goods' },
      { path: '/dispatch/tracking', label: 'Delivery Tracking', hint: 'Where each dispatch has reached' }
    ]
  },
  {
    key: 'finance',
    label: 'Finance & Accounts',
    hint: 'Money in, money out and the books',
    icon: IndianRupee,
    module: M.FINANCE,
    items: [
      { path: '/finance/ar', label: 'Money In (Receivable)', hint: 'Customer invoices and payments due to us' },
      { path: '/finance/ap', label: 'Money Out (Payable)', hint: 'Supplier bills and payments we must make' },
      { path: '/finance/ledger', label: 'General Ledger', hint: 'All accounting entries in one place' },
      { path: '/finance/tax', label: 'Tax & GST', hint: 'GST returns and tax working' },
      { path: '/finance/statements', label: 'Financial Statements', hint: 'Profit and loss, and balance sheet' },
      { path: '/finance/costing', label: 'Cost Accounting', hint: 'Cost per part and where the money goes' }
    ]
  }
];

/* Longest path first, so /master/system-config wins over /master. */
const PATH_INDEX = [
  ...TOP_ITEMS.map(i => ({ path: i.path, page: i.label, section: null })),
  ...BOTTOM_ITEMS.map(i => ({ path: i.path, page: i.label, section: null })),
  ...NAV_SECTIONS.flatMap(s => s.items.map(i => ({ path: i.path, page: i.label, section: s.label })))
].sort((a, b) => b.path.length - a.path.length);

const titleCase = (segment) =>
  segment.replace(/[-_]+/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase());

/* Used by Header.jsx to name the screen the user is looking at. The menu data
   above should eventually live in its own module so both files can import it;
   until then this single export keeps the two in step. */
// eslint-disable-next-line react-refresh/only-export-components
export const getPageLabel = (pathname) => {
  const clean = String(pathname || '').replace(/\/+$/, '') || '/';
  const hit = PATH_INDEX.find(e => clean === e.path || clean.startsWith(e.path + '/'));
  if (hit) return { section: hit.section, page: hit.page };
  const last = clean.split('/').filter(Boolean).pop();
  return { section: null, page: last ? titleCase(last) : 'Dashboard' };
};

/* Every screen in the menu, flat, for the header's search. Each entry keeps
   the group it sits under and the module that gates it, so the palette can
   show "Sales › Quotations" and hide what the signed-in role cannot open. */
// eslint-disable-next-line react-refresh/only-export-components
export const getAllScreens = () => [
  ...TOP_ITEMS.map((i) => ({ ...i, section: null })),
  // A child entry has no icon of its own; it borrows its group's.
  ...NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ ...i, section: s.label, module: i.module || s.module, icon: i.icon || s.icon }))),
  ...BOTTOM_ITEMS.map((i) => ({ ...i, section: null }))
];

const tipFor = (entry) => (entry.hint ? entry.label + ' — ' + entry.hint : entry.label);

const sectionForPath = (pathname) =>
  NAV_SECTIONS.find(s => s.items.some(i => pathname === i.path || pathname.startsWith(i.path + '/')));

const Sidebar = ({ mobileOpen = false, onCloseDrawer }) => {
  const location = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  // Collapsing to icons is a desktop idea — on a phone the menu is either
  // over the page or not there at all.
  const [collapsed, setCollapsedState] = useState(false);
  const setCollapsed = (v) => { if (!isMobile) setCollapsedState(v); };
  // Only groups the user has clicked are recorded here. Everything else falls
  // back to "open if it holds the screen you are on", so landing on a page from
  // a bookmark or a link inside another page still shows you where you are.
  const [openSections, setOpenSections] = useState({});
  const activeSection = sectionForPath(location.pathname);
  const isOpen = (key) => (key in openSections ? openSections[key] : key === activeSection?.key);
  const collapsedNow = isMobile ? false : collapsed;

  // A Store Keeper has no reason to see "Who Can Approve What" any more than
  // a filing cabinet needs a cockpit switch. Each item and section above
  // carries the module it belongs to; canAccess() fails open (shows it) for
  // Super Admin's empty permissions array and for anything left untagged, so
  // this can only ever hide something, never lock a role out of a route it
  // can still reach directly — that boundary is requirePermission() on the
  // server, not this filter.
  const visibleTopItems = TOP_ITEMS.filter((item) => canAccess(user, item.module));
  const visibleBottomItems = BOTTOM_ITEMS.filter((item) => canAccess(user, item.module));
  const visibleSections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccess(user, item.module || section.module))
    }))
    .filter((section) => section.items.length > 0);

  const handleSectionClick = (key) => {
    // Collapsed to icons: one click should open both the menu and the group.
    const next = collapsed ? true : !isOpen(key);
    setOpenSections(prev => ({ ...prev, [key]: next }));
    if (collapsed) setCollapsed(false);
  };

  /* ── presentation ────────────────────────────────────────────────────────
     The menu sits on a ground one shade off the canvas. The current screen is
     a white card lifted off it — the same card every panel on the page is —
     so "where am I" is answered by the one raised shape in the column. A rule
     separates the everyday entries from the module groups, so twenty entries
     read as two short lists rather than one long one. */

  const GROUP_LABEL = {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    color: 'var(--nav-text-muted)',
    padding: '0 16px',
    margin: '0 0 6px'
  };

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '2px 10px',
    padding: '8px 10px',
    borderRadius: 'var(--radius-md)',
    color: isActive ? 'var(--nav-active-text)' : 'var(--nav-text)',
    backgroundColor: isActive ? 'var(--nav-active-bg)' : 'transparent',
    // A transparent border on the rest keeps every row the same height.
    border: `1px solid ${isActive ? 'var(--nav-border)' : 'transparent'}`,
    boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
    fontWeight: isActive ? 600 : 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    transition: 'background-color .12s ease, color .12s ease'
  });

  const iconSlot = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    flexShrink: 0
  };

  // minWidth 0 lets a long label shorten with an ellipsis instead of being
  // cut off mid-word by the flex row.
  const labelStyle = {
    fontSize: '13px',
    minWidth: 0,
    // Without this a long entry — "Material Planning (MRP)" — wraps onto a
    // second line and the row grows taller than every other one.
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  };

  const plainBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 26, height: 26, flexShrink: 0,
    background: 'var(--nav-bg-raised)',
    border: '1px solid var(--nav-border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--nav-text-muted)', cursor: 'pointer',
    transition: 'color .12s ease, border-color .12s ease'
  };

  const renderTopLevel = (item) => {
    const Icon = item.icon;
    const tip = tipFor(item);
    return (
      // NavLink adds the `active` class itself; app-shell.css uses that to
      // hover everything except the item you are already on.
      <NavLink
        key={item.path}
        to={item.path}
        className="nav-item"
        style={navLinkStyle}
        title={tip}
        aria-label={tip}
        onClick={isMobile ? () => onCloseDrawer?.() : undefined}
      >
        <span style={iconSlot}><Icon size={16} strokeWidth={1.9} /></span>
        {!collapsedNow && <span style={labelStyle}>{item.label}</span>}
      </NavLink>
    );
  };

  const renderChild = (item) => {
    const tip = tipFor(item);
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end === true}
        title={tip}
        aria-label={tip}
        onClick={isMobile ? () => onCloseDrawer?.() : undefined}
        className="nav-subitem"
        style={({ isActive }) => ({
          display: 'block',
          padding: '6px 10px',
          margin: '1px 0',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12.5px',
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          color: isActive ? 'var(--accent-primary-text)' : 'var(--nav-text)',
          backgroundColor: isActive ? 'var(--surface-selected)' : 'transparent',
          fontWeight: isActive ? 600 : 400
        })}
      >
        {item.label}
      </NavLink>
    );
  };

  const renderSection = (section) => {
    const Icon = section.icon;
    const open = isOpen(section.key);
    const tip = tipFor(section);
    const holdsActive = section.items.some(
      (i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/')
    );
    return (
      <div key={section.key}>
        <button
          onClick={() => handleSectionClick(section.key)}
          title={tip}
          aria-label={tip}
          aria-expanded={open}
          className="nav-item"
          style={{
            width: 'calc(100% - 20px)',
            border: '1px solid transparent',
            background: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '2px 10px',
            padding: '8px 10px',
            borderRadius: 'var(--radius-md)',
            // A collapsed group holding the current screen still says so.
            color: holdsActive ? 'var(--nav-active-text)' : 'var(--nav-text)',
            fontWeight: holdsActive ? 600 : 500,
            overflow: 'hidden',
            transition: 'background-color .12s ease, color .12s ease'
          }}
        >
          <span style={iconSlot}><Icon size={16} strokeWidth={1.9} /></span>
          {!collapsedNow && (
            <>
              <span style={{ ...labelStyle, flex: 1, textAlign: 'left' }}>{section.label}</span>
              <ChevronRight
                size={13}
                style={{ flexShrink: 0, opacity: 0.55, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}
              />
            </>
          )}
        </button>

        {open && !collapsedNow && (
          // The rule down the left ties the children to their parent, so an
          // indented list still reads as one group rather than loose entries.
          <div style={{
            margin: '2px 10px 8px 28px',
            paddingLeft: '10px',
            borderLeft: '1px solid var(--nav-border)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {section.items.map(renderChild)}
          </div>
        )}
      </div>
    );
  };

  const initials = [user?.firstName, user?.lastName]
    .filter(Boolean).map((n) => n[0]).join('').toUpperCase() || 'U';
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Signed in';
  const roleName = typeof user?.role === 'object' ? user.role?.name : null;

  const divider = <div aria-hidden="true" style={{ height: 1, background: 'var(--nav-border)', margin: '10px 20px' }} />;

  return (
    <div style={{
      width: collapsedNow ? '64px' : '244px',
      backgroundColor: 'var(--nav-bg)',
      borderRight: '1px solid var(--nav-border)',
      display: 'flex',
      flexDirection: 'column',
      transition: isMobile ? 'transform 0.22s ease' : 'width 0.2s ease',
      position: isMobile ? 'fixed' : 'relative',
      // Off-canvas until the user asks for it. Sliding rather than unmounting
      // keeps the scroll position of a long menu between openings.
      ...(isMobile ? {
        top: 0, bottom: 0, left: 0, zIndex: 40,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: mobileOpen ? 'var(--shadow-lg)' : 'none'
      } : null),
      height: '100%',
      color: 'var(--nav-text)'
    }}>
      {/* Brand lockup */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: collapsedNow ? '18px 0 12px' : '18px 16px 12px',
        justifyContent: collapsedNow ? 'center' : 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-primary-solid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Factory size={17} color="#ffffff" />
          </div>
          {!collapsedNow && (
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '15px', fontWeight: 700, letterSpacing: '-0.01em',
                color: 'var(--nav-active-text)', lineHeight: 1.15, whiteSpace: 'nowrap'
              }}>
                Precision
              </div>
              <div style={{ fontSize: '11px', color: 'var(--nav-text-muted)', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                Auto Parts ERP
              </div>
            </div>
          )}
        </div>
        {!collapsedNow && (
          <button
            onClick={() => (isMobile ? onCloseDrawer?.() : setCollapsed(true))}
            title={isMobile ? 'Close menu' : 'Collapse menu'}
            aria-label={isMobile ? 'Close menu' : 'Collapse menu'}
            aria-expanded
            className="nav-plain-btn"
            style={{ ...plainBtn, ...(isMobile ? { width: 34, height: 34 } : null) }}
          >
            {isMobile ? <X size={16} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>

      {collapsedNow && (
        <button
          onClick={() => setCollapsed(false)}
          title="Expand menu"
          aria-label="Expand menu"
          aria-expanded={false}
          className="nav-plain-btn"
          style={{ ...plainBtn, margin: '0 auto 8px' }}
        >
          <ChevronRight size={14} />
        </button>
      )}

      {/* Opening a screen should show that screen, not leave the drawer over
          it. The click that navigates is the click that closes — a group
          header opens its children instead and must not close anything. */}
      <nav
        className="nav-scroll"
        onClick={isMobile ? (e) => { if (e.target.closest('a')) onCloseDrawer?.(); } : undefined}
        style={{ flex: 1, padding: '6px 0 12px', overflowY: 'auto', overflowX: 'hidden' }}
        aria-label="Main menu"
      >
        {!collapsedNow && <p style={GROUP_LABEL}>Main</p>}
        {visibleTopItems.map(renderTopLevel)}
        {visibleSections.length > 0 && divider}
        {visibleSections.map(renderSection)}

        {visibleBottomItems.length > 0 && (
          <>
            {divider}
            {!collapsedNow && <p style={GROUP_LABEL}>Others</p>}
            {visibleBottomItems.map(renderTopLevel)}
          </>
        )}
      </nav>

      {/* Who is signed in. Display only — the header already owns sign-out, and
          a second control for it here would just be somewhere else to look. */}
      <div style={{
        borderTop: '1px solid var(--nav-border)',
        padding: collapsedNow ? '12px 0' : '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: collapsedNow ? 'center' : 'flex-start'
      }}>
        <div
          title={fullName}
          style={{
            width: 32, height: 32, flexShrink: 0, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-primary-solid), var(--accent-teal))',
            color: '#ffffff', fontSize: '12px', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {initials}
        </div>
        {!collapsedNow && (
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '13px', fontWeight: 600, color: 'var(--nav-active-text)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {fullName}
            </div>
            <div style={{
              fontSize: '11.5px', color: 'var(--nav-text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {roleName || user?.email || ''}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
