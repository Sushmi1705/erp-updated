import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Plus, Edit2, Trash2, CheckCircle, ArrowRight, Shield, CheckCircle2,
  Layers, Search, Sparkles, MoveUp, MoveDown, FileCheck, Building2,
  ShoppingCart, Factory, AlertCircle, RefreshCw, Play, Clock,
  ToggleLeft, ToggleRight, Zap, Check, AlertTriangle, HelpCircle,
  TrendingUp, Award, Sliders, ChevronRight, X, BookOpen, ExternalLink,
  ChevronDown, Filter, Eye, ArrowUp, Users, UserCheck, Calendar,
  Wrench, ClipboardCheck, Briefcase, BadgeCheck, ArrowDownRight,
  FileText, CornerDownRight, CheckSquare, Sparkle
} from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Categorized ERP Document & Record Definitions Across All Business Functions */
export const RECORD_GROUPS = [
  {
    category: 'HR, Payroll & People Services',
    icon: Users,
    color: '#8b5cf6',
    items: [
      { key: 'EmployeeLeave', label: 'Employee Leave Application', desc: 'Casual, sick, earned leave & comp-off sign-off' },
      { key: 'OvertimeAuthorization', label: 'Overtime (OT) Authorization', desc: 'Press shop extended shift and operator OT allowances' },
      { key: 'EmployeeAttendance', label: 'Attendance Regularization', desc: 'Biometric missing punch and shift attendance correction' }
    ]
  },
  {
    category: 'Procurement & Supply Chain',
    icon: ShoppingCart,
    color: '#2563eb',
    items: [
      { key: 'PurchaseOrder', label: 'Purchase Order (PO)', desc: 'Raw material, tooling and bought-out procurement' },
      { key: 'PurchaseRequisition', label: 'Purchase Request / Indent', desc: 'Internal indents from MRP or plant departments' },
      { key: 'MasterVendor', label: 'Supplier / Vendor Onboarding', desc: 'New supplier qualification and master profile' }
    ]
  },
  {
    category: 'Sales & Commercial',
    icon: FileCheck,
    color: '#059669',
    items: [
      { key: 'SalesOrder', label: 'Sales Order (SO)', desc: 'Customer PO confirmation and delivery commitments' },
      { key: 'SalesQuotation', label: 'Sales Quotation', desc: 'Price proposals, margin approvals and tooling quotes' },
      { key: 'MasterCustomer', label: 'Customer Onboarding', desc: 'New customer setup and commercial credit limits' }
    ]
  },
  {
    category: 'Manufacturing & Shop Floor',
    icon: Factory,
    color: '#d97706',
    items: [
      { key: 'WorkOrder', label: 'Production Work Order (WO)', desc: 'Release of stamping and assembly jobs to the floor' },
      { key: 'EngineeringBOM', label: 'Bill of Materials (BOM) Revision', desc: 'Engineering drawing consumption ratios and scrap allowance' },
      { key: 'MasterProduct', label: 'Product Master', desc: 'New automotive part numbers and finished assemblies' },
      { key: 'MasterMaterial', label: 'Raw Material Specification', desc: 'Steel coil grades, blank sizes and strip specs' }
    ]
  },
  {
    category: 'Quality & IATF 16949',
    icon: AlertCircle,
    color: '#dc2626',
    items: [
      { key: 'QualityNonConformance', label: 'Quality Non-Conformance (NCR)', desc: 'Internal or customer defect containment and 8D' },
      { key: 'EngineeringChange', label: 'Engineering Change (ECR)', desc: 'Customer drawing revisions and tool modifications' }
    ]
  },
  {
    category: 'Maintenance & Asset Reliability',
    icon: Wrench,
    color: '#ea580c',
    items: [
      { key: 'BreakdownMaintenance', label: 'Breakdown Maintenance Requisition', desc: 'Emergency press breakdown, hydraulic repair and spares' },
      { key: 'PreventiveMaintenance', label: 'Preventive Maintenance (PM) Sign-off', desc: 'Monthly/quarterly press service and sensor calibration' }
    ]
  },
  {
    category: 'Inventory, Scrap & Stores',
    icon: Layers,
    color: '#0891b2',
    items: [
      { key: 'ScrapManagement', label: 'Scrap Disposal / Write-Off', desc: 'Floor scrap authorization and batch disposal' },
      { key: 'InventoryAdjustment', label: 'Stock Cycle Count Adjustment', desc: 'Physical inventory ledger reconciliation write-down' },
      { key: 'Warehouse', label: 'Store / Warehouse Bay Setup', desc: 'Storage locations, raw material bays and bins' }
    ]
  },
  {
    category: 'Company & Master Organization',
    icon: Building2,
    color: '#475569',
    items: [
      { key: 'Plant', label: 'Plant / Facility', desc: 'Manufacturing plant units and addresses' },
      { key: 'Branch', label: 'Branch Office', desc: 'Regional commercial sales and branch offices' },
      { key: 'User', label: 'User Login & Access', desc: 'Employee login credentials and access rights' },
      { key: 'Role', label: 'Role & Permissions', desc: 'RBAC module and screen permission profiles' }
    ]
  }
];

// Flat lookup dictionaries for quick display rendering
export const RECORD_LABEL = RECORD_GROUPS.reduce((acc, grp) => {
  grp.items.forEach(it => { acc[it.key] = it.label; });
  return acc;
}, {
  EmployeeLeave: 'Employee Leave Application',
  OvertimeAuthorization: 'Overtime (OT) Authorization',
  EmployeeAttendance: 'Attendance Regularization',
  EngineeringBOM: 'Bill of Materials (BOM) Revision',
  BreakdownMaintenance: 'Breakdown Maintenance Requisition',
  PreventiveMaintenance: 'Preventive Maintenance (PM) Sign-off',
  InventoryAdjustment: 'Stock Cycle Count Adjustment',
  Plant: 'Plant / Facility',
  Branch: 'Branch Office',
  Warehouse: 'Store / Warehouse',
  User: 'User Login & Access',
  Role: 'Role & Permissions'
});

export const ACTION_LABEL = {
  create: 'Creation',
  update: 'Update',
  delete: 'Deletion'
};

/* Complete Role Authority & Responsibility Matrix ("Which Role Does What") */
export const ROLE_AUTHORITY_DIRECTORY = [
  {
    roleName: 'HR Executive',
    department: 'Human Resources & Workforce',
    badgeColor: '#8b5cf6',
    avatarText: 'HR',
    tagline: 'Employee lifecycle, leave entitlements, shift attendance & overtime governance',
    primaryModule: 'EmployeeLeave',
    canInitiate: [
      { title: 'New Staff / Operator Clearance', desc: 'Onboarding compliance, biometric enrollment, and ESI/PF registration' },
      { title: 'Personnel Policy Revisions', desc: 'Shift timing changes, leave quotas, and holiday schedules' }
    ],
    tier1Approvals: [
      { title: 'Employee Leave Application', desc: 'Verifies remaining leave balance (CL/SL/EL), attendance records, and company leave policy compliance', sla: '24h' },
      { title: 'Overtime (OT) Authorization', desc: 'Audits press shop overtime hours against biometric punch logs and statutory caps', sla: '12h' },
      { title: 'Attendance Regularization', desc: 'Reviews biometric punch misses, late mark waivers, and on-duty plant visits', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'Staff Departmental Clearance', desc: 'Final exit sign-off and leave encashment authorization', sla: '48h' }
    ]
  },
  {
    roleName: 'Plant Manager',
    department: 'Plant Operations & Manufacturing Executive',
    badgeColor: '#2563eb',
    avatarText: 'PM',
    tagline: 'Overall operational sanction for shop floor schedules, machine uptime, staffing & expenditures',
    primaryModule: 'WorkOrder',
    canInitiate: [
      { title: 'Plant Facility Modifications', desc: 'Manufacturing bay expansion, stamping line re-tooling, and layout changes' },
      { title: 'Capital Machinery Indents', desc: 'Hydraulic press replacements, heavy uncoilers, and die cranes' }
    ],
    tier1Approvals: [
      { title: 'Production Work Order Batch Release', desc: 'Press line capacity validation, blank steel allocation, and tooling sign-off', sla: '12h' },
      { title: 'Preventive Maintenance Schedule', desc: 'Sanctions scheduled machine stoppage for mechanical & hydraulic servicing', sla: '24h' },
      { title: 'Material Indent Requisitions', desc: 'Validates MRP shop-floor indent justification prior to PO issuance (> ₹50k)', sla: '24h' },
      { title: 'High-Value POs (Tier 1)', desc: 'Operations approval for production raw material and tooling orders ≥ ₹25,000', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'Employee Leave Application (Tier 2)', desc: 'Operational clearance verifying shift coverage and machine line staffing', sla: '24h' },
      { title: 'Overtime & Shift Allowance (Tier 2)', desc: 'Executive authorization for weekend production and emergency press runs', sla: '24h' },
      { title: 'Emergency Press Breakdown Repairs', desc: 'Sanctions immediate spare replacement and external machining to resume press', sla: '12h' },
      { title: 'Engineering Change Requests (ECRs)', desc: 'Sanctions die modifications, PPAP level 3 re-validation, and part revisions', sla: '48h' },
      { title: 'Quality NCR Defect Containment', desc: 'Sanctions customer defect quarantine, lot segregation, and 8D resolution', sla: '24h' },
      { title: 'Floor Scrap Disposal (Tier 2)', desc: 'Authorizes scrap offcut sales & rejected stamping disposal ≥ ₹20,000', sla: '24h' },
      { title: 'Automotive Tooling Quotation (Tier 1)', desc: 'Press piece rates, die amortization, and margin sign-off ≥ ₹50k', sla: '24h' }
    ]
  },
  {
    roleName: 'Quality Inspector',
    department: 'Quality Assurance & IATF 16949 Compliance',
    badgeColor: '#dc2626',
    avatarText: 'QI',
    tagline: 'Automotive quality standards, defect containment, PPAP, calibration & scrap verification',
    primaryModule: 'QualityNonConformance',
    canInitiate: [
      { title: 'Quality NCR Defect Report', desc: 'Raises formal defect containment when stamping burrs or cracks are detected' },
      { title: 'Supplier Inward Rejection Note', desc: 'Rejects out-of-spec steel coils or hardware at gate inspection' }
    ],
    tier1Approvals: [
      { title: 'Engineering Change Request (ECR)', desc: 'Customer drawing revisions, die modifications, and PPAP level 3 re-validation', sla: '24h' },
      { title: 'Supplier / Vendor Onboarding (IATF)', desc: 'Quality audit score and ISO/IATF certificates validation prior to vendor master activation', sla: '48h' },
      { title: 'Bill of Materials (BOM) Revision', desc: 'Checks steel grade specs, blank yield, and scrap allowance percentages', sla: '24h' },
      { title: 'Floor Scrap Disposal (Tier 1)', desc: 'Metallurgical inspection verifying rejected parts cannot be reworked', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'Certificate of Analysis (COA) Sign-off', desc: 'Final outgoing quality release before dispatch loading', sla: '6h' }
    ]
  },
  {
    roleName: 'Purchase Officer',
    department: 'Procurement & Supply Chain',
    badgeColor: '#0284c7',
    avatarText: 'PO',
    tagline: 'Steel coil sourcing, supplier RFQ, commercial pricing & bought-out hardware orders',
    primaryModule: 'PurchaseOrder',
    canInitiate: [
      { title: 'Purchase Order (PO)', desc: 'Creates POs for raw material coils, bought-out fasteners, and press tooling' },
      { title: 'Vendor Onboarding Request', desc: 'Submits new commercial vendor profile for supplier audit' },
      { title: 'Supplier RFQ Inquiries', desc: 'Issues price requests against approved engineering drawings' }
    ],
    tier1Approvals: [
      { title: 'Shop Floor Material Indent', desc: 'Validates MRP suggestion before generating commercial supplier inquiries', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'Routine Hardware POs (< ₹25,000)', desc: 'Direct commercial sanction for standard shop consumables and lubricants', sla: '12h' }
    ]
  },
  {
    roleName: 'Accounts Executive',
    department: 'Finance, Accounts & Commercial Credit',
    badgeColor: '#059669',
    avatarText: 'AC',
    tagline: 'Customer credit limits, invoicing, payment reconciliations and asset write-downs',
    primaryModule: 'SalesOrder',
    canInitiate: [
      { title: 'Customer Credit Limit Revision', desc: 'Proposes increased credit line or payment terms for key OEM clients' },
      { title: 'Vendor Payment Run', desc: 'Batches approved bills for electronic bank transfer' }
    ],
    tier1Approvals: [
      { title: 'Customer Sales Order Credit Release', desc: 'Validates customer outstanding balances, credit limit, and overdue invoices', sla: '24h' },
      { title: 'Stock Cycle Count Variance', desc: 'Reconciles physical inventory count discrepancies with General Ledger book values', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'Commercial Invoice Dispatch Release', desc: 'Clears GST e-way bill generation for scheduled truck dispatches', sla: '6h' }
    ]
  },
  {
    roleName: 'Shop Floor Supervisor',
    department: 'Press Shop & Stamping Operations',
    badgeColor: '#d97706',
    avatarText: 'SS',
    tagline: 'Press line throughput, die setup, shift operators, output logging and scrap sorting',
    primaryModule: 'WorkOrder',
    canInitiate: [
      { title: 'Shift Overtime Authorization', desc: 'Requests extra hours for stamping operators to meet rush dispatch schedules' },
      { title: 'Emergency Breakdown Work Request', desc: 'Alerts maintenance when hydraulic press or die experiences failure' },
      { title: 'Daily Press Output & Scrap Log', desc: 'Logs blank consumption, good parts produced, and offcut scrap' }
    ],
    tier1Approvals: [
      { title: 'Production Work Order Execution', desc: 'Verifies press die readiness and operator staffing before starting job run', sla: '12h' },
      { title: 'Emergency Breakdown Triage', desc: 'First-line operational impact verification when a press stops', sla: '6h' }
    ],
    finalSanctions: [
      { title: 'Shift Handover Reconciliation', desc: 'Sanctions completed part bins transfer to inspection holding bay', sla: '2h' }
    ]
  },
  {
    roleName: 'Maintenance Engineer',
    department: 'Plant Maintenance & Machine Reliability',
    badgeColor: '#ea580c',
    avatarText: 'ME',
    tagline: 'Press reliability, hydraulic maintenance, die servicing, sensor calibration & spare parts',
    primaryModule: 'BreakdownMaintenance',
    canInitiate: [
      { title: 'Emergency Breakdown Work Order', desc: 'Logs root-cause, diagnostic breakdown, and required replacement parts' },
      { title: 'Critical Press Spare Requisition', desc: 'Indents hydraulic valves, die springs, proximity sensors, and bearings' },
      { title: 'Preventive Maintenance Service Record', desc: 'Submits completed monthly servicing checklist and oil analysis' }
    ],
    tier1Approvals: [
      { title: 'Emergency Machine Breakdown (Tier 1)', desc: 'Authorizes diagnostic action, die disassembly, and spare part consumption', sla: '6h' }
    ],
    finalSanctions: [
      { title: 'Machine Safety Re-commissioning', desc: 'Signs off safety light curtains and emergency stops before handing press back to production', sla: '4h' }
    ]
  },
  {
    roleName: 'Store Keeper',
    department: 'Raw Material Stores & Warehouse',
    badgeColor: '#0891b2',
    avatarText: 'SK',
    tagline: 'Coil receiving at gate, warehouse bays, issuing steel blanks, and scrap holding',
    primaryModule: 'PurchaseRequisition',
    canInitiate: [
      { title: 'Material Indent / Purchase Requisition', desc: 'Raises replenishment indents when coil stock reaches reorder level' },
      { title: 'Scrap Disposal Manifest', desc: 'Prepares weighbridge documentation for collected offcut scrap' },
      { title: 'Inventory Variance Discrepancy', desc: 'Reports cycle count differences discovered during physical stock audits' }
    ],
    tier1Approvals: [
      { title: 'Warehouse Bay & Store Setup', desc: 'Validates storage bay load capacity before configuring coil racks', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'Store Issue Material Release', desc: 'Authorizes transfer of coil raw material to press shop floor', sla: '4h' }
    ]
  },
  {
    roleName: 'Production Planner',
    department: 'Production Planning & Control (PPC)',
    badgeColor: '#6366f1',
    avatarText: 'PP',
    tagline: 'Sales order MRP planning, machine line balancing, work orders & BOM structures',
    primaryModule: 'WorkOrder',
    canInitiate: [
      { title: 'Production Work Order Batch', desc: 'Generates work orders from sales orders to execute in stamping lines' },
      { title: 'BOM Engineering Revision', desc: 'Updates part consumption formulas and raw material specification' }
    ],
    tier1Approvals: [
      { title: 'Sales Order Delivery Commitment', desc: 'Validates press machine capacity before customer dispatch promise is locked', sla: '12h' }
    ],
    finalSanctions: [
      { title: 'Master Production Schedule (MPS)', desc: 'Freezes monthly manufacturing envelope for material planning', sla: '24h' }
    ]
  },
  {
    roleName: 'Sales Executive',
    department: 'Sales & Customer Accounts',
    badgeColor: '#10b981',
    avatarText: 'SE',
    tagline: 'Customer RFQs, tooling quotations, order booking, delivery schedules & invoicing advice',
    primaryModule: 'SalesOrder',
    canInitiate: [
      { title: 'Customer Sales Order (SO)', desc: 'Books confirmed OEM purchase orders against approved part numbers' },
      { title: 'Automotive Tooling Quotation', desc: 'Creates price proposals including die amortization and piece price' },
      { title: 'Customer Master Onboarding', desc: 'Submits new client GST, PAN, and commercial details for setup' }
    ],
    tier1Approvals: [],
    finalSanctions: [
      { title: 'Commercial Dispatch Advice', desc: 'Signs off customer billing instructions and delivery location', sla: '6h' }
    ]
  },
  {
    roleName: 'Super Admin',
    department: 'Corporate Governance & Executive Administration',
    badgeColor: '#1e293b',
    avatarText: 'SA',
    tagline: 'Statutory compliance, capital expenditures, user access security & ultimate authority',
    primaryModule: 'PurchaseOrder',
    canInitiate: [
      { title: 'System Security Role Definitions', desc: 'Creates role permission profiles and access control policies' },
      { title: 'Company Facility Governance', desc: 'Registers new plant branches, GSTNs, and corporate profiles' }
    ],
    tier1Approvals: [
      { title: 'User Account Provisioning & Roles', desc: 'Sanctions user creation and module access privileges', sla: '24h' }
    ],
    finalSanctions: [
      { title: 'High-Value Purchase Orders (> ₹100k)', desc: 'Capex and high-value expenditure executive release', sla: '48h' },
      { title: 'High-Value Scrap Write-Off (> ₹100k)', desc: 'Corporate asset write-off sign-off for financial audits', sla: '48h' },
      { title: 'Large Tooling Quotations (> ₹250k)', desc: 'OEM pricing margin sign-off and executive commercial clearance', sla: '48h' },
      { title: 'Supplier Vendor Master Activation', desc: 'Authorizes new supplier into ERP vendor directory', sla: '48h' }
    ]
  }
];

// Ready-to-use automotive approval presets
const PRESET_TEMPLATES = [
  {
    title: 'Employee Leave Application',
    category: 'HR & People',
    desc: 'Employee leave: HR Executive (24h Quota) ➔ Plant Manager (24h Shift Clearance)',
    module: 'EmployeeLeave',
    action: 'create',
    minAmount: 0,
    priority: 'ALL',
    name: 'Employee Leave Application & Sanction',
    ruleDesc: 'Mandatory 2-stage sign-off: HR verifies quota & policy, then Manager clears operational shift coverage.',
    rolesToMatch: [
      { name: 'HR Executive', sla: 24, threshold: 0 },
      { name: 'Plant Manager', sla: 24, threshold: 0 }
    ]
  },
  {
    title: 'Overtime & Shift Allowance',
    category: 'HR & People',
    desc: 'Shop floor overtime: HR Executive (12h) ➔ Plant Manager (24h)',
    module: 'OvertimeAuthorization',
    action: 'create',
    minAmount: 0,
    priority: 'ALL',
    name: 'Overtime & Shift Allowance Authorization',
    ruleDesc: 'Extended press shop production shift overtime and operator allowance sign-off.',
    rolesToMatch: [
      { name: 'HR Executive', sla: 12, threshold: 0 },
      { name: 'Plant Manager', sla: 24, threshold: 0 }
    ]
  },
  {
    title: 'Emergency Breakdown Maintenance',
    category: 'Maintenance',
    desc: 'Unplanned press breakdown: Maintenance Engineer (6h) ➔ Plant Manager (12h)',
    module: 'BreakdownMaintenance',
    action: 'create',
    minAmount: 0,
    priority: 'CRITICAL',
    name: 'Emergency Press Breakdown & Repair Sign-off',
    ruleDesc: 'Unplanned machine breakdown, hydraulic press downtime, and urgent spare drawal.',
    rolesToMatch: [
      { name: 'Maintenance Engineer', sla: 6, threshold: 0 },
      { name: 'Plant Manager', sla: 12, threshold: 0 }
    ]
  },
  {
    title: 'PO Multi-Tier Sign-off',
    category: 'Procurement',
    desc: 'Purchase orders: Plant Manager (24h) ➔ Super Admin (48h)',
    module: 'PurchaseOrder',
    action: 'create',
    minAmount: 25000,
    priority: 'ALL',
    name: 'PO Multi-Tier Sign-off',
    ruleDesc: 'Standard 2-tier sign-off for raw material, tooling and bought-out procurement.',
    rolesToMatch: [
      { name: 'Plant Manager', sla: 24, threshold: 25000 },
      { name: 'Super Admin', sla: 48, threshold: 100000 }
    ]
  },
  {
    title: 'Supplier Onboarding (IATF 16949)',
    category: 'Procurement',
    desc: 'New vendor: Quality Inspector (48h) ➔ Super Admin (48h)',
    module: 'MasterVendor',
    action: 'create',
    minAmount: 0,
    priority: 'ALL',
    name: 'Supplier / Vendor Onboarding (IATF 16949)',
    ruleDesc: 'Quality audit and commercial qualification before vendor master activation.',
    rolesToMatch: [
      { name: 'Quality Inspector', sla: 48, threshold: 0 },
      { name: 'Super Admin', sla: 48, threshold: 0 }
    ]
  },
  {
    title: 'Sales Order Approval',
    category: 'Sales',
    desc: 'Sales orders: Accounts Executive (24h) ➔ Super Admin (48h)',
    module: 'SalesOrder',
    action: 'create',
    minAmount: 50000,
    priority: 'ALL',
    name: 'Customer Sales Order & Credit Release',
    ruleDesc: 'Customer delivery commitments and commercial credit limits verification.',
    rolesToMatch: [
      { name: 'Accounts Executive', sla: 24, threshold: 0 },
      { name: 'Super Admin', sla: 48, threshold: 150000 }
    ]
  },
  {
    title: 'Engineering Change (ECR)',
    category: 'Quality & IATF',
    desc: 'Drawing revisions: Quality Inspector (24h) ➔ Plant Manager (48h)',
    module: 'EngineeringChange',
    action: 'create',
    minAmount: 0,
    priority: 'CRITICAL',
    name: 'Engineering Change Request (ECR) Governance',
    ruleDesc: 'Customer drawing revisions, die modifications, and PPAP level 3 re-validation.',
    rolesToMatch: [
      { name: 'Quality Inspector', sla: 24, threshold: 0 },
      { name: 'Plant Manager', sla: 48, threshold: 0 }
    ]
  },
  {
    title: 'Quality NCR Scrap Write-off',
    category: 'Quality & Scrap',
    desc: 'Scrap disposal: Quality Inspector ➔ Plant Manager ➔ Super Admin',
    module: 'ScrapManagement',
    action: 'create',
    minAmount: 10000,
    priority: 'ALL',
    name: 'Floor Scrap Disposal & Metallurgical Write-off',
    ruleDesc: 'Press shop offcut scrap disposal authorization and rejected stamping write-off.',
    rolesToMatch: [
      { name: 'Quality Inspector', sla: 24, threshold: 0 },
      { name: 'Plant Manager', sla: 24, threshold: 20000 },
      { name: 'Super Admin', sla: 48, threshold: 100000 }
    ]
  },
  {
    title: 'Material Indent Indents',
    category: 'Procurement',
    desc: 'Shop indents: Purchase Officer (24h) ➔ Plant Manager (24h)',
    module: 'PurchaseRequisition',
    action: 'create',
    minAmount: 0,
    priority: 'ALL',
    name: 'Material Indent Sign-off',
    ruleDesc: 'Internal purchase requisitions from MRP & shop-floor prior to PO issuance.',
    rolesToMatch: [
      { name: 'Purchase Officer', sla: 24, threshold: 0 },
      { name: 'Plant Manager', sla: 24, threshold: 50000 }
    ]
  },
  {
    title: 'Production Batch Release',
    category: 'Manufacturing',
    desc: 'Work Orders: Shop Floor Supervisor (12h) ➔ Plant Manager (12h)',
    module: 'WorkOrder',
    action: 'create',
    minAmount: 0,
    priority: 'ALL',
    name: 'Production Work Order Batch Release',
    ruleDesc: 'Press line capacity validation, blank steel allocation, and tooling sign-off.',
    rolesToMatch: [
      { name: 'Shop Floor Supervisor', sla: 12, threshold: 0 },
      { name: 'Plant Manager', sla: 12, threshold: 0 }
    ]
  },
  {
    title: 'Bill of Materials (BOM) Revision',
    category: 'Manufacturing',
    desc: 'BOM updates: Quality Inspector (24h) ➔ Plant Manager (24h)',
    module: 'EngineeringBOM',
    action: 'create',
    minAmount: 0,
    priority: 'ALL',
    name: 'Bill of Materials (BOM) Revision Release',
    ruleDesc: 'Engineering drawing consumption ratios, raw material specs, and scrap allowance sign-off.',
    rolesToMatch: [
      { name: 'Quality Inspector', sla: 24, threshold: 0 },
      { name: 'Plant Manager', sla: 24, threshold: 0 }
    ]
  },
  {
    title: 'User Security Clearance',
    category: 'Organization',
    desc: 'User Provisioning: Plant Manager (24h) ➔ Super Admin (24h)',
    module: 'User',
    action: 'create',
    minAmount: 0,
    priority: 'CRITICAL',
    name: 'User Account Provisioning & Security Clearance',
    ruleDesc: 'New employee ERP login credentials, role privilege assignment and branch clearance.',
    rolesToMatch: [
      { name: 'Plant Manager', sla: 24, threshold: 0 },
      { name: 'Super Admin', sla: 24, threshold: 0 }
    ]
  }
];

const ApprovalRights = () => {
  const [configs, setConfigs] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Active Selected Record State (for highlighting and direct syncing with simulator/details)
  const [selectedRuleId, setSelectedRuleId] = useState(null);
  const simulatorRef = useRef(null);

  // Search & category filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, PAUSED

  // Primary View Mode: 'PROCESSES' (Process matrix for all functions) vs 'ROLE_MATRIX' (Which role does what)
  const [viewMode, setViewMode] = useState('PROCESSES');
  const [activeRolePersona, setActiveRolePersona] = useState('HR Executive');

  // Workflow Route Simulator Drawer State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simModule, setSimModule] = useState('EmployeeLeave');
  const [simAction, setSimAction] = useState('create');
  const [simAmount, setSimAmount] = useState('150000');
  const [simRequesterRole, setSimRequesterRole] = useState('Shop Floor Supervisor');
  const [simPriority, setSimPriority] = useState('STANDARD');

  // Dynamic Context-Aware Simulator Inputs (Non-amount enterprise workflows)
  const [simLeaveType, setSimLeaveType] = useState('Casual Leave (CL)');
  const [simLeaveDays, setSimLeaveDays] = useState('3');
  const [simOvertimeHours, setSimOvertimeHours] = useState('4h');
  const [simBreakdownUrgency, setSimBreakdownUrgency] = useState('Critical Line Stoppage: Press #3 Hydraulic Die Jam');
  const [simECRScope, setSimECRScope] = useState('PPAP Level 3 Drawing Modification');
  const [simNCRSeverity, setSimNCRSeverity] = useState('Critical Lot Quarantine (5,000 Pcs Blank)');

  // Form State for Add / Edit Rule Modal
  const [formData, setFormData] = useState({
    module: '',
    action: 'create',
    name: '',
    description: '',
    minAmount: 0,
    priority: 'ALL',
    isActive: true,
    levels: []
  });

  useEffect(() => {
    fetchConfigs();
    fetchRoles();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/approvals/config');
      setConfigs(res.data.data || []);
    } catch (err) {
      console.error(err);
      notify.error('Failed to load approval rules');
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/roles');
      setRoles(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Find currently selected rule object
  const selectedRule = useMemo(() => {
    return configs.find(c => c._id === selectedRuleId) || null;
  }, [configs, selectedRuleId]);

  // Find active role persona for Role Authority Directory
  const selectedPersona = useMemo(() => {
    return ROLE_AUTHORITY_DIRECTORY.find(p => p.roleName === activeRolePersona) || ROLE_AUTHORITY_DIRECTORY[0];
  }, [activeRolePersona]);

  // 1-Click Auto-Seed Recommended Automotive Matrix
  const handleSeedDefaults = async () => {
    if (!await confirmAction('Synchronize standard automotive approval matrix? This populates complete IATF 16949 / ISO 9001 compliant sign-off chains across HR & Leave, Maintenance, Procurement, Sales, Quality, Engineering, and Master records.')) return;
    setSeeding(true);
    try {
      const res = await axios.post('/approvals/config/seed-defaults');
      notify.success(res.data.message || 'Automotive approval rules synchronized successfully.');
      fetchConfigs();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error seeding default approval rules');
    }
    setSeeding(false);
  };

  // Toggle active/paused state directly
  const toggleRuleStatus = async (config) => {
    const nextState = !config.isActive;
    try {
      await axios.patch(`/approvals/config/${config._id}/toggle`, { isActive: nextState });
      setConfigs(prev => prev.map(c => c._id === config._id ? { ...c, isActive: nextState } : c));
      notify.success(`Rule "${config.name || RECORD_LABEL[config.module] || config.module}" ${nextState ? 'activated' : 'paused'}.`);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to toggle rule status');
    }
  };

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const total = configs.length;
    const activeCount = configs.filter(c => c.isActive !== false).length;
    const pausedCount = total - activeCount;
    const multiLevel = configs.filter(c => c.levels && c.levels.length > 1).length;
    const distinctModules = new Set(configs.map(c => c.module)).size;
    
    let totalSla = 0;
    let countedLevels = 0;
    configs.forEach(c => {
      (c.levels || []).forEach(l => {
        totalSla += (l.slaHours || 24);
        countedLevels++;
      });
    });
    const avgSla = countedLevels > 0 ? Math.round(totalSla / countedLevels) : 24;

    const activeRoles = new Set();
    configs.forEach(c => {
      (c.levels || []).forEach(l => {
        const rName = l.roleId?.name || (typeof l.roleId === 'string' ? l.roleId : '');
        if (rName) activeRoles.add(rName);
      });
    });

    return { total, activeCount, pausedCount, multiLevel, distinctModules, avgSla, activeRolesCount: Math.max(activeRoles.size, ROLE_AUTHORITY_DIRECTORY.length) };
  }, [configs]);

  // Filtered configs based on Search, Category, and Status
  const filteredConfigs = useMemo(() => {
    return configs.filter(cfg => {
      const label = (RECORD_LABEL[cfg.module] || cfg.module).toLowerCase();
      const action = (cfg.action || '').toLowerCase();
      const name = (cfg.name || '').toLowerCase();
      const desc = (cfg.description || '').toLowerCase();
      const approverNames = (cfg.levels || []).map(l => (l.roleId?.name || '').toLowerCase()).join(' ');
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q ||
        label.includes(q) ||
        action.includes(q) ||
        name.includes(q) ||
        desc.includes(q) ||
        approverNames.includes(q) ||
        cfg.module.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Status Filter
      if (statusFilter === 'ACTIVE' && cfg.isActive === false) return false;
      if (statusFilter === 'PAUSED' && cfg.isActive !== false) return false;

      // Category Filter
      if (selectedCategory === 'ALL') return true;
      const grp = RECORD_GROUPS.find(g => g.items.some(it => it.key === cfg.module));
      if (!grp) {
        return selectedCategory === 'Company';
      }
      return grp.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });
  }, [configs, searchQuery, selectedCategory, statusFilter]);

  // Workflow Route Simulator Reactive Computation
  const simulationResult = useMemo(() => {
    const matchedRule = configs.find(c => c.module === simModule && c.action === simAction);
    const isAmountBased = ['PurchaseOrder', 'PurchaseRequisition', 'SalesOrder', 'SalesQuotation', 'ScrapManagement'].includes(simModule);
    const amountVal = parseFloat(simAmount) || 0;

    if (!matchedRule) {
      return {
        hasRule: false,
        isActive: false,
        isAmountBased,
        ruleName: 'Direct Bypass',
        statusText: 'No Rule Defined (Immediate Execution)',
        statusColor: '#d97706',
        description: `Changes to ${RECORD_LABEL[simModule] || simModule} (${simAction}) execute immediately without sign-off.`,
        triggeredLevels: [],
        totalSla: 0,
        sodCompliant: true,
        reasons: ['No policy configured for this module & action combination.']
      };
    }

    if (matchedRule.isActive === false) {
      return {
        hasRule: true,
        isActive: false,
        isAmountBased,
        ruleName: matchedRule.name || RECORD_LABEL[matchedRule.module],
        statusText: 'Rule Paused (Direct Bypass)',
        statusColor: '#ef4444',
        description: 'This approval rule is temporarily paused. Transactions take effect immediately.',
        triggeredLevels: [],
        totalSla: 0,
        sodCompliant: true,
        reasons: ['Rule status is toggled to Paused.']
      };
    }

    const levels = matchedRule.levels || [];
    let triggeredLevels = [];
    let totalSla = 0;
    let sodWarning = false;

    levels.forEach(lvl => {
      const threshold = lvl.thresholdAmount || 0;
      const roleName = lvl.roleId?.name || 'Assigned Role';
      // For non-amount based modules, every tier is a mandatory process policy!
      const isTriggered = !isAmountBased || (amountVal >= threshold);
      
      if (isTriggered) {
        const sla = lvl.slaHours || 24;
        totalSla += sla;

        let stepFocus = 'Standard Sign-off';
        if (simModule === 'EmployeeLeave') {
          stepFocus = lvl.level === 1 ? 'Quota & Balance Check' : 'Shift Operational Sanction';
        } else if (simModule === 'OvertimeAuthorization') {
          stepFocus = lvl.level === 1 ? 'Biometric Punch Audit' : 'Shift Budget Clearance';
        } else if (simModule === 'BreakdownMaintenance') {
          stepFocus = lvl.level === 1 ? 'Diagnostic & Spares Clearance' : 'Urgent Repair Sanction';
        } else if (simModule === 'WorkOrder') {
          stepFocus = lvl.level === 1 ? 'Line Capacity & Die Readiness' : 'Batch Release Sanction';
        } else if (simModule === 'EngineeringChange') {
          stepFocus = lvl.level === 1 ? 'PPAP Drawing Review' : 'Die Modification Sanction';
        } else if (simModule === 'QualityNonConformance') {
          stepFocus = lvl.level === 1 ? 'Defect Lot Quarantine' : 'Customer 8D Sanction';
        } else if (simModule === 'PurchaseOrder') {
          stepFocus = lvl.level === 1 ? 'Requirement Verification' : 'Capex Financial Sanction';
        } else if (simModule === 'ScrapManagement') {
          stepFocus = lvl.level === 1 ? 'Metallurgical Inspection' : lvl.level === 2 ? 'Disposal Authorization' : 'Executive Write-off';
        }

        triggeredLevels.push({
          level: lvl.level,
          roleName,
          sla,
          threshold,
          stepFocus,
          notifyEscalation: lvl.notifyEscalation !== false
        });
      }

      if (roleName.toLowerCase() === simRequesterRole.toLowerCase()) {
        sodWarning = true;
      }
    });

    let reasons = [];
    if (isAmountBased) {
      reasons = [
        `Transaction Value: ₹${amountVal.toLocaleString('en-IN')}`,
        `Document Priority: ${simPriority}`,
        `Sequential multi-tier authorization required prior to database commit`
      ];
    } else if (simModule === 'EmployeeLeave') {
      reasons = [
        `Leave Type: ${simLeaveType} (${simLeaveDays} Days requested)`,
        `Stage 1 (HR Executive): Verifies remaining leave quota (CL/SL/EL) and attendance balance`,
        `Stage 2 (Plant Manager): Verifies shift roster coverage and grants operational sanction`
      ];
    } else if (simModule === 'OvertimeAuthorization') {
      reasons = [
        `Overtime Request: ${simOvertimeHours}`,
        `Stage 1 (HR Executive): Audits overtime against biometric shift logs & statutory rules`,
        `Stage 2 (Plant Manager): Authorizes production shift budget`
      ];
    } else if (simModule === 'BreakdownMaintenance') {
      reasons = [
        `Urgency: ${simBreakdownUrgency}`,
        `Stage 1 (Maintenance): Authorizes machine diagnostic and spare replacement`,
        `Stage 2 (Plant Manager): Sanctions line stoppage and emergency repair`
      ];
    } else {
      reasons = [
        `Process Hierarchy: Mandatory ${triggeredLevels.length}-Stage Enterprise Workflow`,
        `Separation of duties enforced between applicant and approving roles`
      ];
    }

    return {
      hasRule: true,
      isActive: true,
      isAmountBased,
      ruleName: matchedRule.name || RECORD_LABEL[matchedRule.module],
      statusText: isAmountBased
        ? `Active Policy Enforced (${triggeredLevels.length} Tier${triggeredLevels.length > 1 ? 's' : ''})`
        : `Mandatory Process Hierarchy (${triggeredLevels.length} Tier${triggeredLevels.length > 1 ? 's' : ''})`,
      statusColor: '#059669',
      description: matchedRule.description || `Approval chain for ${RECORD_LABEL[simModule] || simModule}`,
      triggeredLevels,
      totalSla,
      sodCompliant: !sodWarning,
      sodNote: sodWarning ? `SoD Advisory: Submitter (${simRequesterRole}) matches an approval tier. 4-Eyes rule requires secondary peer review.` : 'Segregation of Duties (SoD) verified: Requester cannot self-approve their submission.',
      reasons
    };
  }, [configs, simModule, simAction, simAmount, simRequesterRole, simPriority, simLeaveType, simLeaveDays, simOvertimeHours, simBreakdownUrgency]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.module) {
      return notify.error('Please select which record requires approval.');
    }
    if (formData.levels.length === 0) {
      return notify.error('You must add at least one approval level.');
    }
    if (formData.levels.some(l => !l.roleId)) {
      return notify.error('Please assign a specific role for each approval step.');
    }
    const selectedRoles = formData.levels.map(l => l.roleId);
    const uniqueRoles = new Set(selectedRoles);
    if (uniqueRoles.size !== selectedRoles.length) {
      return notify.info('Duplicate roles are not allowed within the same approval rule. Each level must be a distinct role.');
    }

    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        minAmount: parseFloat(formData.minAmount) || 0,
        levels: formData.levels.map(l => ({
          ...l,
          slaHours: parseInt(l.slaHours, 10) || 24,
          thresholdAmount: parseFloat(l.thresholdAmount) || 0
        }))
      };

      if (editingId) {
        await axios.put(`/approvals/config/${editingId}`, payload);
        notify.success('Approval rule updated successfully.');
      } else {
        await axios.post('/approvals/config', payload);
        notify.success('Approval rule created successfully.');
      }
      setIsModalOpen(false);
      resetFormData();
      setEditingId(null);
      fetchConfigs();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error saving approval configuration');
    }
    setSaving(false);
  };

  const deleteConfig = async (config) => {
    const recordName = RECORD_LABEL[config.module] || config.module;
    if (!await confirmAction(`Delete approval rule for "${recordName}" (${ACTION_LABEL[config.action] || config.action})? Changes will take effect immediately without sign-off.`)) return;
    try {
      await axios.delete(`/approvals/config/${config._id}`);
      notify.success('Approval rule removed.');
      if (selectedRuleId === config._id) {
        setSelectedRuleId(null);
      }
      fetchConfigs();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting configuration');
    }
  };

  const resetFormData = () => {
    setFormData({
      module: '',
      action: 'create',
      name: '',
      description: '',
      minAmount: 0,
      priority: 'ALL',
      isActive: true,
      levels: []
    });
  };

  const handleEdit = (config) => {
    setSelectedRuleId(config._id);
    const formattedLevels = (config.levels || []).map(l => ({
      level: l.level,
      roleId: l.roleId?._id || l.roleId,
      slaHours: l.slaHours || 24,
      thresholdAmount: l.thresholdAmount || 0,
      notifyEscalation: l.notifyEscalation !== false
    }));
    setFormData({
      module: config.module,
      action: config.action,
      name: config.name || '',
      description: config.description || '',
      minAmount: config.minAmount || 0,
      priority: config.priority || 'ALL',
      isActive: config.isActive !== false,
      levels: formattedLevels
    });
    setEditingId(config._id);
    setIsModalOpen(true);
  };

  const addLevel = () => {
    setFormData(prev => ({
      ...prev,
      levels: [
        ...prev.levels,
        {
          level: prev.levels.length + 1,
          roleId: '',
          slaHours: 24,
          thresholdAmount: 0,
          notifyEscalation: true
        }
      ]
    }));
  };

  const removeLevel = async (index) => {
    if (!(await confirmAction('Remove this approval step?'))) return;
    setFormData(prev => {
      const newLevels = prev.levels
        .filter((_, i) => i !== index)
        .map((l, i) => ({ ...l, level: i + 1 }));
      return { ...prev, levels: newLevels };
    });
  };

  const moveLevel = (index, direction) => {
    setFormData(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.levels.length) return prev;
      const copy = [...prev.levels];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return {
        ...prev,
        levels: copy.map((l, i) => ({ ...l, level: i + 1 }))
      };
    });
  };

  const updateLevelField = (index, field, value) => {
    setFormData(prev => {
      const newLevels = [...prev.levels];
      newLevels[index] = { ...newLevels[index], [field]: value };
      return { ...prev, levels: newLevels };
    });
  };

  const openCreate = () => {
    setFormData({
      module: '',
      action: 'create',
      name: '',
      description: '',
      minAmount: 0,
      priority: 'ALL',
      isActive: true,
      levels: [
        { level: 1, roleId: '', slaHours: 24, thresholdAmount: 0, notifyEscalation: true }
      ]
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const applyPreset = (preset) => {
    const matchedLevels = [];
    preset.rolesToMatch.forEach((item, i) => {
      const matched = roles.find(r => r.name.toLowerCase() === item.name.toLowerCase());
      if (matched) {
        matchedLevels.push({
          level: i + 1,
          roleId: matched._id,
          slaHours: item.sla || 24,
          thresholdAmount: item.threshold || 0,
          notifyEscalation: true
        });
      }
    });

    const existing = configs.find(c => c.module === preset.module && c.action === preset.action);

    setFormData({
      module: preset.module,
      action: preset.action,
      name: preset.name || preset.title,
      description: preset.ruleDesc || preset.desc,
      minAmount: preset.minAmount || 0,
      priority: preset.priority || 'ALL',
      isActive: true,
      levels: matchedLevels.length > 0 ? matchedLevels : [{ level: 1, roleId: '', slaHours: 24, thresholdAmount: 0, notifyEscalation: true }]
    });
    setEditingId(existing ? existing._id : null);
    setIsPresetsModalOpen(false);
    setIsModalOpen(true);
    notify.info(`Loaded template: ${preset.title}. Review and save.`);
  };

  // Select a record: highlights it, opens simulator at top, and auto-scrolls smoothly so the user sees it immediately
  const handleSelectRecord = (rule, autoScroll = true) => {
    setSelectedRuleId(rule._id);
    setSimModule(rule.module);
    setSimAction(rule.action);
    setSimAmount(rule.minAmount ? String(rule.minAmount * 1.5) : '150000');
    setIsSimulatorOpen(true);

    if (autoScroll) {
      setTimeout(() => {
        if (simulatorRef.current) {
          simulatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    }
  };

  // Jump to row in table below
  const scrollToSelectedRow = (id) => {
    const el = document.getElementById(`rule-row-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const getCategoryForModule = (modKey) => {
    return RECORD_GROUPS.find(g => g.items.some(it => it.key === modKey)) || RECORD_GROUPS[4];
  };

  // DataTable column configuration
  const columns = [
    {
      header: 'Governed Document / Record',
      render: row => {
        const cat = getCategoryForModule(row.module);
        const IconComponent = cat.icon || Shield;
        const isSelected = selectedRuleId === row._id;

        return (
          <div
            id={`rule-row-${row._id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: '240px',
              position: 'relative'
            }}
          >
            {/* Visual indicator dot if selected */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '6px',
              backgroundColor: isSelected ? 'var(--accent-primary)' : `${cat.color}14`,
              border: isSelected ? '1px solid var(--accent-primary)' : `1px solid ${cat.color}25`,
              color: isSelected ? '#fff' : cat.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}>
              <IconComponent size={16} color={isSelected ? '#fff' : cat.color} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontWeight: isSelected ? 800 : 600,
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '13px'
                }}>
                  {row.name || RECORD_LABEL[row.module] || row.module}
                </span>

                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  backgroundColor: row.action === 'create' ? 'rgba(16, 185, 129, 0.1)' : row.action === 'delete' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                  color: row.action === 'create' ? '#059669' : row.action === 'delete' ? '#dc2626' : '#2563eb'
                }}>
                  {row.action}
                </span>

                {row.minAmount > 0 ? (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'var(--surface-sunken)',
                    color: 'var(--text-secondary)'
                  }}>
                    ≥ ₹{(row.minAmount / 1000).toFixed(0)}k
                  </span>
                ) : (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(139, 92, 246, 0.08)',
                    color: '#7c3aed'
                  }}>
                    Mandatory Policy
                  </span>
                )}

                {/* Highly visible OPEN / SELECTED badge */}
                {isSelected && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--accent-primary)',
                    color: '#fff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: '0 0 6px rgba(37, 99, 235, 0.4)'
                  }}>
                    ● OPEN ABOVE
                  </span>
                )}
              </div>

              <div style={{
                fontSize: '11px',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px'
              }}>
                {row.description || (RECORD_LABEL[row.module] ? `${RECORD_LABEL[row.module]} sign-off` : row.module)}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      header: 'Approval Sequence Pipeline',
      render: row => {
        const lvls = row.levels || [];
        if (lvls.length === 0) return <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Direct execution (No sign-off)</span>;

        return (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            overflowX: 'auto',
            padding: '2px 0'
          }}>
            {/* Submitter Initiator Node */}
            <span style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--surface-sunken)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              flexShrink: 0
            }}>
              Submitter
            </span>

            <span style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>➔</span>

            {/* Stepped Approver Nodes */}
            {lvls.map((l, idx) => {
              const roleName = l.roleId?.name || (typeof l.roleId === 'string' ? l.roleId : 'Assigned Role');
              return (
                <React.Fragment key={l.level || idx}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    flexShrink: 0
                  }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {l.level || (idx + 1)}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {roleName}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '0 4px',
                      borderRadius: '2px',
                      backgroundColor: 'var(--surface-sunken)',
                      color: 'var(--text-muted)'
                    }}>
                      {l.slaHours || 24}h
                    </span>
                    {l.thresholdAmount > 0 && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '0 4px',
                        borderRadius: '2px',
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                        color: 'var(--accent-primary)'
                      }}>
                        ≥ ₹{(l.thresholdAmount / 1000).toFixed(0)}k
                      </span>
                    )}
                  </div>
                  {idx < lvls.length - 1 && <span style={{ color: 'var(--accent-primary)', fontSize: '12px', flexShrink: 0 }}>➔</span>}
                </React.Fragment>
              );
            })}

            <span style={{ color: 'var(--text-muted)', fontSize: '12px', flexShrink: 0 }}>➔</span>

            {/* Final Outcome Node */}
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              flexShrink: 0
            }}>
              ✓ Enacted
            </span>
          </div>
        );
      }
    },
    {
      header: 'Enforcement',
      render: row => {
        const isActive = row.isActive !== false;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleRuleStatus(row);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: isActive ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-sunken)',
              color: isActive ? '#059669' : 'var(--text-muted)'
            }}
            title={isActive ? 'Rule is active. Click to pause.' : 'Rule is paused. Click to activate.'}
          >
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isActive ? '#10b981' : 'var(--text-muted)'
            }} />
            <span style={{ fontSize: '11px', fontWeight: 600 }}>
              {isActive ? 'Active' : 'Paused'}
            </span>
          </button>
        );
      }
    },
    {
      header: 'Actions',
      render: row => {
        const isSelected = selectedRuleId === row._id;
        return (
          <div
            onClick={e => e.stopPropagation()}
            style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', alignItems: 'center' }}
          >
            <button
              onClick={() => handleSelectRecord(row, true)}
              title="Test & inspect this approval rule above"
              style={{
                background: isSelected ? 'var(--accent-primary)' : 'none',
                border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                borderRadius: '4px',
                color: isSelected ? '#fff' : 'var(--accent-primary)',
                cursor: 'pointer',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: isSelected ? 700 : 500,
                boxShadow: isSelected ? '0 1px 4px rgba(37, 99, 235, 0.3)' : 'none'
              }}
            >
              <Play size={11} fill="currentColor" /> {isSelected ? 'Active' : 'Test'}
            </button>
            <button
              onClick={() => handleEdit(row)}
              title="Edit rule"
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 7px'
              }}
            >
              <Edit2 size={12} />
            </button>
            <button
              onClick={() => deleteConfig(row)}
              title="Delete rule"
              style={{
                background: 'none',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                color: '#dc2626',
                cursor: 'pointer',
                padding: '4px 7px'
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', position: 'relative' }}>
      {/* Executive Clean Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Approval Matrix &amp; Governance
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              color: 'var(--accent-primary)',
              letterSpacing: '0.3px',
              textTransform: 'uppercase'
            }}>
              IATF 16949 Compliant
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '2px', margin: 0 }}>
            Click any row to test &amp; simulate route above. Configure multi-tier sign-off workflows, SLA turnaround timers, and separation of duties.
          </p>
        </div>

        {/* Global Toolbar Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={`btn ${isSimulatorOpen ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setIsSimulatorOpen(prev => !prev);
              if (!isSimulatorOpen) {
                setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }
            }}
            title="Open Interactive Route Simulator"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
          >
            <Zap size={13} /> {isSimulatorOpen ? 'Close Simulator' : 'Workflow Simulator'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => setIsPresetsModalOpen(true)}
            title="Browse automotive sign-off templates"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
          >
            <BookOpen size={13} /> Templates Library
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleSeedDefaults}
            disabled={seeding || loading}
            title="Sync all standard IATF-16949 rules"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 12px' }}
          >
            <Sparkles size={13} color="#d97706" className={seeding ? 'spin' : ''} />
            {seeding ? 'Syncing…' : 'Sync Matrix'}
          </button>

          <button
            className="btn btn-primary"
            onClick={openCreate}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', padding: '6px 14px' }}
          >
            <Plus size={14} /> New Rule
          </button>
        </div>
      </div>

      {/* Streamlined Executive Summary Strip (Single Sleek Bar) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 18px',
        borderRadius: '6px',
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Metric 1: Rules */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.activeCount}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {stats.total} Active</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Enforced Rules
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

        {/* Metric 2: Multi-Level */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2563eb' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.multiLevel}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chains</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Multi-Tier 4-Eyes
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

        {/* Metric 3: Avg SLA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d97706' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.avgSla}h</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Response</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Average SLA Target
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

        {/* Metric 4: Personas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#7c3aed' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.activeRolesCount}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Roles</span>
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Sign-off Personas
            </div>
          </div>
        </div>

        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border-subtle)' }} />

        {/* Quick Link to Template Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Automotive Presets:</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '10px' }}>
            ✓ 6 Installed
          </span>
        </div>
      </div>

      {/* Simulator Cockpit (Clean & Focused Panel with Active Record Banner) */}
      {isSimulatorOpen && (
        <div
          ref={simulatorRef}
          style={{
            borderRadius: '6px',
            backgroundColor: 'var(--surface-raised)',
            border: selectedRule ? '2px solid var(--accent-primary)' : '1px solid var(--accent-primary)',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.12)',
            padding: '14px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Active Record Banner identifying which row is open and being tested/edited */}
          {selectedRule && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '5px',
              backgroundColor: 'rgba(37, 99, 235, 0.08)',
              border: '1px solid rgba(37, 99, 235, 0.25)',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-primary)',
                  boxShadow: '0 0 6px var(--accent-primary)'
                }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  CURRENTLY INSPECTING RECORD:
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  backgroundColor: 'var(--surface-raised)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-default)'
                }}>
                  {selectedRule.name || RECORD_LABEL[selectedRule.module] || selectedRule.module}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  ({ACTION_LABEL[selectedRule.action] || selectedRule.action})
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleEdit(selectedRule)}
                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit2 size={12} /> Edit This Rule
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => scrollToSelectedRow(selectedRule._id)}
                  style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  title="Scroll to this row in the table below"
                >
                  Jump to Row Below ↓
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="var(--accent-primary)" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Workflow Route Simulator (Dry-Run Engine)
              </span>
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '3px', backgroundColor: 'rgba(37, 99, 235, 0.08)', color: 'var(--accent-primary)', fontWeight: 600 }}>
                Instant Evaluation
              </span>
            </div>
            <button
              onClick={() => setIsSimulatorOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
              title="Close simulator"
            >
              <X size={15} />
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            alignItems: 'start'
          }}>
            {/* Left Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Document</label>
                  <select
                    className="input-field"
                    value={simModule}
                    onChange={e => {
                      setSimModule(e.target.value);
                      const matching = configs.find(c => c.module === e.target.value && c.action === simAction);
                      if (matching) setSelectedRuleId(matching._id);
                    }}
                    style={{ fontSize: '12px', padding: '5px 8px', margin: 0 }}
                  >
                    {RECORD_GROUPS.map((grp, gIdx) => (
                      <optgroup key={gIdx} label={grp.category}>
                        {grp.items.map(it => (
                          <option key={it.key} value={it.key}>{it.label}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>Action</label>
                  <select
                    className="input-field"
                    value={simAction}
                    onChange={e => {
                      setSimAction(e.target.value);
                      const matching = configs.find(c => c.module === simModule && c.action === e.target.value);
                      if (matching) setSelectedRuleId(matching._id);
                    }}
                    style={{ fontSize: '12px', padding: '5px 8px', margin: 0 }}
                  >
                    <option value="create">Creation (New)</option>
                    <option value="update">Update (Modifying)</option>
                    <option value="delete">Deletion (Voiding)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {simulationResult.isAmountBased ? (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      {simModule === 'ScrapManagement' ? 'Scrap Batch Value (₹)' : 'Order / Doc Value (₹)'}
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={simAmount}
                      onChange={e => setSimAmount(e.target.value)}
                      placeholder="150000"
                      style={{ fontSize: '12px', padding: '5px 8px', margin: 0 }}
                    />
                  </div>
                ) : simModule === 'EmployeeLeave' ? (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      Leave Type &amp; Duration
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <select
                        className="input-field"
                        value={simLeaveType}
                        onChange={e => setSimLeaveType(e.target.value)}
                        style={{ fontSize: '11px', padding: '5px 6px', margin: 0, flex: 2 }}
                      >
                        <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                        <option value="Sick Leave (SL)">Sick Leave (SL)</option>
                        <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                        <option value="Compensatory Off (CO)">Comp-Off (CO)</option>
                      </select>
                      <select
                        className="input-field"
                        value={simLeaveDays}
                        onChange={e => setSimLeaveDays(e.target.value)}
                        style={{ fontSize: '11px', padding: '5px 6px', margin: 0, flex: 1 }}
                      >
                        <option value="1">1 Day</option>
                        <option value="2">2 Days</option>
                        <option value="3">3 Days</option>
                        <option value="5">5 Days</option>
                        <option value="10">10+ Days</option>
                      </select>
                    </div>
                  </div>
                ) : simModule === 'OvertimeAuthorization' ? (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      OT Duration &amp; Shift Scope
                    </label>
                    <select
                      className="input-field"
                      value={simOvertimeHours}
                      onChange={e => setSimOvertimeHours(e.target.value)}
                      style={{ fontSize: '11px', padding: '5px 8px', margin: 0 }}
                    >
                      <option value="2h">2 Hours (Post-Shift Stamping)</option>
                      <option value="4h">4 Hours (Rush Customer Dispatch)</option>
                      <option value="8h">8 Hours (Sunday Weekend Production)</option>
                    </select>
                  </div>
                ) : simModule === 'BreakdownMaintenance' ? (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      Machine Urgency &amp; Diagnostic
                    </label>
                    <select
                      className="input-field"
                      value={simBreakdownUrgency}
                      onChange={e => setSimBreakdownUrgency(e.target.value)}
                      style={{ fontSize: '11px', padding: '5px 8px', margin: 0 }}
                    >
                      <option value="Critical Line Stoppage: Press #3 Hydraulic Die Jam">Critical: Press #3 Hydraulic Die Jam</option>
                      <option value="Major Leak: Uncoiler Motor Station #1">Major: Uncoiler Motor Station #1</option>
                      <option value="Routine Sensor Calibration Stoppage">Routine: Sensor Calibration Stoppage</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                      Operational Trigger Scope
                    </label>
                    <div style={{
                      padding: '5px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(139, 92, 246, 0.08)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#7c3aed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span>● Mandatory Process Policy</span>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '3px' }}>
                    Requester / Submitter Persona
                  </label>
                  <select
                    className="input-field"
                    value={simRequesterRole}
                    onChange={e => setSimRequesterRole(e.target.value)}
                    style={{ fontSize: '12px', padding: '5px 8px', margin: 0 }}
                  >
                    {roles.map(r => (
                      <option key={r._id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Right Output */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: 'var(--surface-sunken)',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Resolution:
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: simulationResult.statusColor
                }}>
                  ● {simulationResult.statusText}
                </span>
              </div>

              {/* Stepped sequence with verification focus */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '6px',
                padding: '8px 10px',
                backgroundColor: 'var(--surface-raised)',
                borderRadius: '4px',
                border: '1px solid var(--border-default)',
                fontSize: '11px'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>{simRequesterRole}</span>
                <span style={{ color: 'var(--text-muted)' }}>➔</span>

                {simulationResult.triggeredLevels.length === 0 ? (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    Immediate Enactment (No Approval Required)
                  </span>
                ) : (
                  simulationResult.triggeredLevels.map((tl, i) => (
                    <React.Fragment key={i}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                        border: '1px solid rgba(37, 99, 235, 0.2)',
                        color: 'var(--accent-primary)',
                        fontWeight: 600
                      }}>
                        <span>{tl.level}. {tl.roleName} ({tl.sla}h)</span>
                        {tl.stepFocus && (
                          <span style={{
                            fontSize: '9px',
                            padding: '1px 4px',
                            borderRadius: '3px',
                            backgroundColor: 'var(--surface-raised)',
                            color: 'var(--text-secondary)',
                            fontWeight: 500
                          }}>
                            {tl.stepFocus}
                          </span>
                        )}
                      </span>
                      {i < simulationResult.triggeredLevels.length - 1 && <span style={{ color: 'var(--accent-primary)' }}>➔</span>}
                    </React.Fragment>
                  ))
                )}

                <span style={{ color: 'var(--text-muted)' }}>➔</span>
                <span style={{ color: '#059669', fontWeight: 600 }}>✓ Enacted</span>
              </div>

              {/* Explanatory notes */}
              <div style={{
                padding: '6px 8px',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                fontSize: '10px',
                color: 'var(--text-secondary)'
              }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Hierarchy Execution Logic:
                </span>
                {simulationResult.reasons.map((r, ri) => (
                  <span key={ri} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: 'var(--accent-primary)' }}>•</span> {r}
                  </span>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <span>{simulationResult.sodCompliant ? '🛡 SoD: Verified Compliant' : '⚠️ SoD: Reviewer match'}</span>
                <span>Max Target: <strong>{simulationResult.totalSla} Hours</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary View Mode Switcher: Process Matrix vs Role Authority Hierarchy */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '6px 0',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('PROCESSES')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: viewMode === 'PROCESSES' ? 700 : 500,
              backgroundColor: viewMode === 'PROCESSES' ? 'var(--accent-primary)' : 'var(--surface-raised)',
              color: viewMode === 'PROCESSES' ? '#fff' : 'var(--text-secondary)',
              border: viewMode === 'PROCESSES' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
              cursor: 'pointer',
              boxShadow: viewMode === 'PROCESSES' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ClipboardCheck size={14} /> Process Approval Workflows ({configs.length} Governed)
          </button>

          <button
            type="button"
            onClick={() => setViewMode('ROLE_MATRIX')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: viewMode === 'ROLE_MATRIX' ? 700 : 500,
              backgroundColor: viewMode === 'ROLE_MATRIX' ? 'var(--accent-primary)' : 'var(--surface-raised)',
              color: viewMode === 'ROLE_MATRIX' ? '#fff' : 'var(--text-secondary)',
              border: viewMode === 'ROLE_MATRIX' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
              cursor: 'pointer',
              boxShadow: viewMode === 'ROLE_MATRIX' ? '0 2px 6px rgba(37,99,235,0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Users size={14} /> Role Authority Hierarchy ("Which Role Does What") ({ROLE_AUTHORITY_DIRECTORY.length} Roles)
          </button>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {viewMode === 'PROCESSES' ? 'Multi-tier sign-off pipelines across all ERP business functions' : 'Clear mapping of who initiates, who reviews at Tier 1, and who grants final sanction'}
        </span>
      </div>

      {/* VIEW MODE 2: ROLE AUTHORITY MATRIX ("WHICH ROLE DOES WHAT") */}
      {viewMode === 'ROLE_MATRIX' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeIn 0.2s ease' }}>
          {/* Role Persona Horizontal Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {ROLE_AUTHORITY_DIRECTORY.map(persona => {
              const isSelected = activeRolePersona === persona.roleName;
              return (
                <button
                  key={persona.roleName}
                  type="button"
                  onClick={() => setActiveRolePersona(persona.roleName)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isSelected ? `2px solid ${persona.badgeColor}` : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'var(--surface-raised)' : 'var(--surface-sunken)',
                    boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{
                    width: 22,
                    height: 22,
                    borderRadius: '4px',
                    backgroundColor: persona.badgeColor,
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {persona.avatarText}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {persona.roleName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Role Dossier Card */}
          {selectedPersona && (
            <div style={{
              backgroundColor: 'var(--surface-raised)',
              borderRadius: '8px',
              border: '1px solid var(--border-default)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {/* Dossier Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '8px',
                    backgroundColor: selectedPersona.badgeColor,
                    color: '#fff',
                    fontSize: '18px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {selectedPersona.avatarText}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {selectedPersona.roleName}
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: `${selectedPersona.badgeColor}15`,
                        color: selectedPersona.badgeColor
                      }}>
                        {selectedPersona.department}
                      </span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {selectedPersona.tagline}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      const targetMod = selectedPersona.primaryModule;
                      const matchRule = configs.find(c => c.module === targetMod);
                      if (matchRule) {
                        handleSelectRecord(matchRule, true);
                      } else {
                        setSimModule(targetMod);
                        setIsSimulatorOpen(true);
                        setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                      }
                    }}
                    style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Zap size={13} /> Simulate {selectedPersona.roleName}'s Workflows Above ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setViewMode('PROCESSES');
                      setSearchQuery(selectedPersona.roleName);
                    }}
                    style={{ fontSize: '11px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Filter size={13} /> Filter Table for {selectedPersona.roleName}
                  </button>
                </div>
              </div>

              {/* 3-Column Authority Breakdown: Initiates | Tier 1 Reviews | Final Sanctions */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px'
              }}>
                {/* Column 1: What this role initiates */}
                <div style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <FileText size={14} color="var(--accent-primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                      1. What This Role Initiates (Submits)
                    </span>
                  </div>
                  {selectedPersona.canInitiate.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                      Does not directly initiate documents; strictly conducts reviews or sanctions.
                    </span>
                  ) : (
                    selectedPersona.canInitiate.map((item, i) => (
                      <div key={i} style={{
                        backgroundColor: 'var(--surface-raised)',
                        borderRadius: '5px',
                        border: '1px solid var(--border-default)',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {item.desc}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Column 2: Tier 1 Reviews */}
                <div style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <CheckSquare size={14} color="#059669" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
                      2. Tier 1 Approvals (First-Line Clearance)
                    </span>
                  </div>
                  {selectedPersona.tier1Approvals.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                      No first-line review duties assigned to this persona.
                    </span>
                  ) : (
                    selectedPersona.tier1Approvals.map((item, i) => (
                      <div key={i} style={{
                        backgroundColor: 'var(--surface-raised)',
                        borderRadius: '5px',
                        border: '1px solid var(--border-default)',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#059669', backgroundColor: 'rgba(5, 150, 105, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                            {item.sla} SLA
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {item.desc}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                {/* Column 3: Final Sanctions */}
                <div style={{
                  backgroundColor: 'var(--surface-sunken)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                    <Award size={14} color="#d97706" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase' }}>
                      3. Tier 2 / Executive Sanctions (Final Approval)
                    </span>
                  </div>
                  {selectedPersona.finalSanctions.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
                      Escalates to executive management for final sign-off.
                    </span>
                  ) : (
                    selectedPersona.finalSanctions.map((item, i) => (
                      <div key={i} style={{
                        backgroundColor: 'var(--surface-raised)',
                        borderRadius: '5px',
                        border: '1px solid var(--border-default)',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.title}
                          </span>
                          <span style={{ fontSize: '10px', fontWeight: 600, color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', padding: '1px 5px', borderRadius: '3px' }}>
                            {item.sla} SLA
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {item.desc}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 1: PROCESS APPROVAL WORKFLOWS MATRIX */}
      {viewMode === 'PROCESSES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'fadeIn 0.2s ease' }}>
          {/* Unified Filter & Search Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            {/* Category Pills (All 8 Domains) */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
              {[
                { id: 'ALL', label: 'All', count: configs.length },
                { id: 'HR', label: 'HR & People', count: configs.filter(c => ['EmployeeLeave', 'OvertimeAuthorization', 'EmployeeAttendance'].includes(c.module)).length },
                { id: 'Procurement', label: 'Procurement', count: configs.filter(c => ['PurchaseOrder', 'PurchaseRequisition', 'MasterVendor'].includes(c.module)).length },
                { id: 'Sales', label: 'Sales', count: configs.filter(c => ['SalesOrder', 'SalesQuotation', 'MasterCustomer'].includes(c.module)).length },
                { id: 'Manufacturing', label: 'Production', count: configs.filter(c => ['WorkOrder', 'EngineeringBOM', 'MasterProduct', 'MasterMaterial'].includes(c.module)).length },
                { id: 'Quality', label: 'Quality & IATF', count: configs.filter(c => ['QualityNonConformance', 'EngineeringChange'].includes(c.module)).length },
                { id: 'Maintenance', label: 'Maintenance', count: configs.filter(c => ['BreakdownMaintenance', 'PreventiveMaintenance'].includes(c.module)).length },
                { id: 'Inventory', label: 'Inventory & Scrap', count: configs.filter(c => ['ScrapManagement', 'InventoryAdjustment', 'Warehouse'].includes(c.module)).length },
                { id: 'Company', label: 'Organization', count: configs.filter(c => ['Plant', 'Branch', 'User', 'Role'].includes(c.module)).length }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id)}
                  style={{
                    fontSize: '12px',
                    fontWeight: selectedCategory === tab.id ? 600 : 500,
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: selectedCategory === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: selectedCategory === tab.id ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface-raised)',
                    color: selectedCategory === tab.id ? 'var(--accent-primary-text)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span>{tab.label}</span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '0 4px',
                    borderRadius: '8px',
                    backgroundColor: selectedCategory === tab.id ? 'var(--accent-primary)' : 'var(--surface-sunken)',
                    color: selectedCategory === tab.id ? '#fff' : 'var(--text-muted)'
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

        {/* Right side: Status toggle pills + Search input */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Status Pills */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--surface-sunken)',
            borderRadius: '4px',
            padding: '2px',
            border: '1px solid var(--border-subtle)'
          }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'ACTIVE', label: 'Active' },
              { id: 'PAUSED', label: 'Paused' }
            ].map(st => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatusFilter(st.id)}
                style={{
                  fontSize: '11px',
                  fontWeight: statusFilter === st.id ? 600 : 500,
                  padding: '3px 8px',
                  borderRadius: '3px',
                  border: 'none',
                  backgroundColor: statusFilter === st.id ? 'var(--surface-raised)' : 'transparent',
                  color: statusFilter === st.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: statusFilter === st.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer'
                }}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            minWidth: 220
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search matrix…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div id="matrix-table-container" style={{ width: '100%' }}>
        <DataTable
          columns={columns}
          data={filteredConfigs}
          isLoading={loading}
          onRetry={fetchConfigs}
          onRowClick={(row) => handleSelectRecord(row, true)}
          selectedRowId={selectedRuleId}
          emptyTitle="No matching approval rules found"
          emptyMessage={
            searchQuery || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
              ? 'Try adjusting your search query, status, or category filter.'
              : 'Without an approval rule, changes execute immediately without sign-off. Click "Sync Matrix" to auto-configure standard sign-off chains, or "New Rule" to create one.'
          }
          emptyAction={
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button className="btn btn-secondary" onClick={handleSeedDefaults} disabled={seeding}>
                <Sparkles size={13} color="#d97706" /> Sync Standard Matrix
              </button>
              <button className="btn btn-primary" onClick={openCreate}>
                <Plus size={13} /> New Approval Rule
              </button>
            </div>
          }
        />
      </div>
      </div>
      )}

      {/* Floating Sticky Docked Bar when a Record is Open & Selected */}
      {selectedRule && (
        <div style={{
          position: 'fixed',
          bottom: '22px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          padding: '8px 18px',
          borderRadius: '30px',
          backgroundColor: 'var(--surface-raised)',
          border: '1.5px solid var(--accent-primary)',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981'
            }} />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Selected Record:</span>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedRule.name || RECORD_LABEL[selectedRule.module] || selectedRule.module}
            </span>
          </div>

          <div style={{ width: 1, height: 16, backgroundColor: 'var(--border-subtle)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                if (simulatorRef.current) {
                  simulatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  setIsSimulatorOpen(true);
                  setTimeout(() => simulatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                }
              }}
              style={{ fontSize: '11px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ArrowUp size={11} /> View Simulator Above
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleEdit(selectedRule)}
              style={{ fontSize: '11px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Edit2 size={11} /> Edit Rule
            </button>

            <button
              type="button"
              onClick={() => setSelectedRuleId(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px 4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Close selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Templates & Presets Library Modal (Accessible on Demand) */}
      <Modal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        title="Automotive Sign-off Templates (IATF 16949 / ISO 9001)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            Standard industrial sign-off templates pre-configured with multi-level roles and SLA turnaround times for automotive manufacturing.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {PRESET_TEMPLATES.map((tmpl, idx) => {
              const isConfigured = configs.some(c => c.module === tmpl.module && c.action === tmpl.action && c.isActive !== false);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border-default)',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tmpl.title}
                      </span>
                      <span style={{ fontSize: '10px', padding: '1px 5px', borderRadius: '3px', backgroundColor: 'var(--surface-sunken)', color: 'var(--text-secondary)' }}>
                        {tmpl.category}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {tmpl.desc}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isConfigured && (
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={12} /> Active
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => applyPreset(tmpl)}
                      className="btn btn-secondary"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      {isConfigured ? 'Edit Template' : 'Apply Template'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsPresetsModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Create / Edit Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Approval Rule' : 'Configure Approval Rule'}
      >
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Target Document & Action */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                Governed Record / Document *
              </label>
              <select
                className="input-field"
                required
                value={formData.module}
                onChange={e => setFormData({ ...formData, module: e.target.value })}
                style={{ fontSize: '12px', padding: '6px 8px' }}
              >
                <option value="" disabled>Select document type</option>
                {RECORD_GROUPS.map((grp, gIdx) => (
                  <optgroup key={gIdx} label={grp.category}>
                    {grp.items.map(it => (
                      <option key={it.key} value={it.key}>{it.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                Action Trigger *
              </label>
              <select
                className="input-field"
                required
                value={formData.action}
                onChange={e => setFormData({ ...formData, action: e.target.value })}
                style={{ fontSize: '12px', padding: '6px 8px' }}
              >
                <option value="create">Creation (Adding a new one)</option>
                <option value="update">Update (Modifying an existing one)</option>
                <option value="delete">Deletion (Voiding an existing one)</option>
              </select>
            </div>
          </div>

          {/* Rule Title & Policy Description */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                Rule Display Title
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Raw Material PO Sign-off"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={{ fontSize: '12px', padding: '6px 8px' }}
              />
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontWeight: 600, fontSize: '12px' }}>
                Policy Description &amp; Compliance Notes
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. IATF 16949 compliant sign-off prior to persistence"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ fontSize: '12px', padding: '6px 8px' }}
              />
            </div>
          </div>

          {/* Threshold & Status */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            gap: '12px',
            alignItems: 'center',
            padding: '8px 12px',
            borderRadius: '4px',
            backgroundColor: 'var(--surface-sunken)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                Min Value Threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                className="input-field"
                placeholder="0 = All"
                value={formData.minAmount}
                onChange={e => setFormData({ ...formData, minAmount: e.target.value })}
                style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                Priority Filter
              </label>
              <select
                className="input-field"
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value })}
                style={{ margin: 0, padding: '4px 8px', fontSize: '12px' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="STANDARD">Standard</option>
                <option value="URGENT">Urgent</option>
                <option value="CRITICAL">Critical Only</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: formData.isActive ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-raised)',
                  color: formData.isActive ? '#059669' : 'var(--text-muted)'
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: formData.isActive ? '#10b981' : 'var(--text-muted)' }} />
                <span style={{ fontSize: '11px', fontWeight: 600 }}>{formData.isActive ? 'Active' : 'Paused'}</span>
              </button>
            </div>
          </div>

          {/* Sequential Approvers Builder */}
          <div style={{
            padding: '12px',
            borderRadius: '6px',
            backgroundColor: 'var(--surface-sunken)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Approver Sequence
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  (Requests flow from Level 1 onwards)
                </span>
              </div>
              <button
                type="button"
                onClick={addLevel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: 'none',
                  border: '1px solid var(--accent-primary)',
                  borderRadius: '4px',
                  color: 'var(--accent-primary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} /> Add Tier
              </button>
            </div>

            {formData.levels.length === 0 ? (
              <div style={{
                padding: '1rem',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}>
                No approval tiers added. Click "+ Add Tier" to add the first approver.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {formData.levels.map((level, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      border: '1px solid var(--border-default)',
                      borderRadius: '4px',
                      backgroundColor: 'var(--surface-raised)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#fff',
                      fontSize: '10px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {level.level}
                    </span>

                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', minWidth: '45px' }}>
                      Tier {level.level}:
                    </span>

                    <select
                      className="input-field"
                      required
                      style={{ flex: 1, minWidth: '160px', margin: 0, padding: '4px 6px', fontSize: '12px' }}
                      value={level.roleId}
                      onChange={e => updateLevelField(index, 'roleId', e.target.value)}
                    >
                      <option value="" disabled>Select role</option>
                      {roles.map(r => (
                        <option key={r._id} value={r._id}>{r.name}</option>
                      ))}
                    </select>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>SLA:</span>
                      <select
                        value={level.slaHours || 24}
                        onChange={e => updateLevelField(index, 'slaHours', parseInt(e.target.value, 10))}
                        style={{
                          padding: '3px 6px',
                          borderRadius: '3px',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--surface-sunken)',
                          color: 'var(--text-primary)',
                          fontSize: '11px'
                        }}
                      >
                        <option value="12">12h</option>
                        <option value="24">24h</option>
                        <option value="48">48h</option>
                        <option value="72">72h</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>≥ ₹:</span>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={level.thresholdAmount || ''}
                        onChange={e => updateLevelField(index, 'thresholdAmount', e.target.value)}
                        style={{
                          width: '65px',
                          padding: '3px 5px',
                          borderRadius: '3px',
                          border: '1px solid var(--border-default)',
                          backgroundColor: 'var(--surface-sunken)',
                          color: 'var(--text-primary)',
                          fontSize: '11px'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginLeft: 'auto' }}>
                      <button
                        type="button"
                        onClick={() => moveLevel(index, -1)}
                        disabled={index === 0}
                        style={{ background: 'none', border: 'none', cursor: index === 0 ? 'not-allowed' : 'pointer', color: index === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', padding: '2px' }}
                      >
                        <MoveUp size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLevel(index, 1)}
                        disabled={index === formData.levels.length - 1}
                        style={{ background: 'none', border: 'none', cursor: index === formData.levels.length - 1 ? 'not-allowed' : 'pointer', color: index === formData.levels.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)', padding: '2px' }}
                      >
                        <MoveDown size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeLevel(index)}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visual Live Preview */}
          {formData.levels.length > 0 && (
            <div style={{
              padding: '8px 12px',
              borderRadius: '4px',
              backgroundColor: 'var(--surface-raised)',
              border: '1px dashed var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              flexWrap: 'wrap'
            }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Flow:</span>
              <span style={{ color: 'var(--text-secondary)' }}>Submitter</span>
              <span style={{ color: 'var(--text-muted)' }}>➔</span>
              {formData.levels.map((l, i) => {
                const rObj = roles.find(r => r._id === l.roleId);
                return (
                  <React.Fragment key={i}>
                    <span style={{
                      fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(37, 99, 235, 0.08)',
                      color: 'var(--accent-primary)'
                    }}>
                      T{l.level}: {rObj ? rObj.name : '(Role)'} ({l.slaHours || 24}h)
                    </span>
                    {i < formData.levels.length - 1 && <span style={{ color: 'var(--text-muted)' }}>➔</span>}
                  </React.Fragment>
                );
              })}
              <span style={{ color: 'var(--text-muted)' }}>➔</span>
              <span style={{ color: '#059669', fontWeight: 600 }}>✓ Enacted</span>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '0.25rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '10px'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : editingId ? 'Update Rule' : 'Save Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ApprovalRights;