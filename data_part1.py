# -*- coding: utf-8 -*-
"""
Data Part 1: Front matter, Agenda, Global Controls, Executive Menus, Reports & Analytics
"""

PART_1_DATA = {
    "title": "Precision ERP — Complete Super Admin Client Demo Speaking Guide",
    "subtitle": "Word-for-Word Presenter Playbook in Easy Tanglish for Automotive Stamping & Precision Components",
    "metadata": {
        "client": "Precision Auto Components Pvt Ltd / Laxmi Balaji Automotive",
        "url": "http://169.58.171.158:8083/ (and http://localhost:5173/)",
        "role": "Super Admin",
        "email": "admin@example.com",
        "domain": "Sheet Metal Stamping, Press Shop, Welded Assemblies & Automotive Components",
        "version": "Enterprise Release 2026.1"
    },
    "agenda": [
        ("00 - 05 Mins", "Opening, Executive Vision & Global UI Features", "Dashboard (/dashboard), Theme toggle, Command Palette, Help Hotline"),
        ("05 - 12 Mins", "Company Governance, Security & Multi-Tier Approvals", "Company Setup (/company), Roles & Access (/roles), Who Can Approve What (/approval-rights)"),
        ("12 - 20 Mins", "Commercial Cycle & Product Engineering", "Customers, Products, BOM (/engineering/bom), Inquiries, Quotations, Sales Orders (/sales/order)"),
        ("20 - 28 Mins", "Demand Planning & Intelligent Material MRP", "Demand Forecasting, Net Consolidation, MRP Execution (/mrp/execution), Shortage Matrix"),
        ("28 - 36 Mins", "Procurement, Goods Receipt & Inventory Traceability", "Purchase Orders (/procurement/po), GRN (/receipt/grn), Heat-No Batch Traceability (/inventory/traceability)"),
        ("36 - 44 Mins", "Press Shop Production Execution & Shop Floor Monitoring", "Work Orders (/production/wo), Material Allocation, Machine Downtime, Scrap PPM Logging"),
        ("44 - 52 Mins", "Quality Gates, Maintenance & Customer Dispatch", "Incoming/Final QA, NCR CAPA, Preventive Maintenance, Dispatch Execution (/dispatch/execution)"),
        ("52 - 60 Mins", "Financial Integration, CEO Analytics & Client Q&A", "Accounts Receivable/Payable, General Ledger, CEO Cockpit (/dashboards/ceo), Audit Logs (/audit)")
    ],
    "global_controls": [
        {
            "name": "Global Header Bar & Screen Identification",
            "icon": "Top Header",
            "desc": "Displays dynamic breadcrumb trail (e.g. Purchasing > Purchase Orders), ensuring presenter and client never get lost.",
            "script": "Screen top-la irukkura breadcrumb path namma ippo endha module and sub-screen-la irukkom nu clean-ah kaatum. Idhu demo time-la client-ku screen navigation romba clear-ah puriya vaikkum."
        },
        {
            "name": "Command Palette (Ctrl + K / ⌘ + K)",
            "icon": "Search Keyboard Shortcut",
            "desc": "Instant spotlight search across all 70+ screens, parts, customers, and order numbers without browsing menus.",
            "script": "Namma keyboard-la Ctrl + K press panna, instant command palette open aagum. Menu-la poi search panna vendiya thevaiye illa; part number, supplier name, illa 'Work Order' nu type panna direct-ah andha page-ku one second-la jump pannalaam."
        },
        {
            "name": "Report a Problem / Support Hotline (LifeBuoy)",
            "icon": "LifeBuoy Icon",
            "desc": "Direct employee hotline to log questions or UI issues straight into the central /issues queue.",
            "script": "Shop floor-la irukkura supervisor-o illa office staff-o edhavadhu issue face panna, top bar-la irukkura LifeBuoy icon-ai click panni udane problem report pannalaam. Idhu direct-ah Admin-oda Issues Queue-ku vandhudum."
        },
        {
            "name": "Theme Toggle (Dark Mode / Light Mode)",
            "icon": "Sun / Moon Icon",
            "desc": "Seamless toggle between Dark Mode (control room & low light) and Light Mode (boardroom & bright shop floor).",
            "script": "Inga irukkura Sun/Moon icon click panna Dark Mode and Light Mode instantly switch aagum. Plant control room-la night shift-ku Dark Mode romba comfortable, presentation hall-la Light Mode clean-ah irukkum."
        },
        {
            "name": "Password Change Modal (KeyRound)",
            "icon": "KeyRound Icon",
            "desc": "Self-service password update with current password validation and secure encryption.",
            "script": "KeyRound icon click panni, logged-in admin thannoda password-ai current password verify panni seconds-la safe-ah update pannிக்கலாம்."
        },
        {
            "name": "User Profile Pill & Secure Sign-Out",
            "icon": "User Initials Badge",
            "desc": "Displays user initials (SA) and provides instant session revocation.",
            "script": "Corner-la Super Admin initials irukku. Demo mudinjadhum single click-la safe-ah token revoke panni logout aagalaam."
        }
    ],
    "executive_menus": [
        {
            "num": "1.1",
            "title": "Dashboard",
            "route": "/dashboard",
            "intro": "Dashboard dhaan ERP-oda master landing cockpit. Stamping plant-oda daily production volume, scrap PPM, active work orders, and billing realization-ai single screen-la summarize panni kaattum.",
            "problem": "Daily plant status therinjuka plant head பல register and Excel files theda vendiyadhilla. Real-time factory pulse instant-ah theriyum.",
            "users": "Managing Director, Plant Head, Super Admin, Production Head.",
            "visible": [
                "Daily Production Volume card: Live press stroke count and parts produced today",
                "Live Scrap & PPM card: Current shop floor rejection PPM against benchmark (<1.5%)",
                "Active Work Orders status breakdown: Draft, Released, In Production, Completed",
                "Revenue & Order Intake card: Monthly invoiced value vs target in Lakhs/Crores",
                "Quick Launchpad Buttons: 1-click modal triggers to create Quotations, Sales Orders, Work Orders, and GRNs",
                "Date Range Filter: Today, This Week, This Month, Fiscal Year"
            ],
            "demo_steps": [
                "1. Click top-level 'Dashboard' in sidebar.",
                "2. Point to the top 4 KPI summary cards (Production strokes, Scrap PPM, Active WOs, Monthly Revenue).",
                "3. Explain the Work Order status bar chart showing orders currently running on press lines.",
                "4. Point out Quick Launchpad buttons showing shortcuts to common transactions.",
                "5. Change the date filter from 'Today' to 'This Month' to show real-time aggregate recalculation."
            ],
            "script": "Now, namma Dashboard module pathi paaka porom. Dashboard is the starting point for understanding the overall plant situation. Inga daily press stroke volume, scrap percentage, and active work orders live-ah update aagudhu. Shift mudiyura varaikkum wait panni Excel sheet paaka vendiya thevaiye illa; MD and Plant Head-ku total factory status single screen-la live-ah theriyum. Edhavadhu bottleneck irundha udane identify panni action edukkalaam.",
            "example": "Hosur stamping plant-la 250T press line-la TVS Lower Control Arm Bracket stamp panrom. Innaiku 12,000 parts target-ku 8,500 parts mudinjurukku, scrap PPM 1.1%-la control-la irukku nu dashboard KPI-la immediate-ah paathukalaam.",
            "admin_benefit": "Plant throughput and scrap level monitor panni, production schedule delays-ai prevent pannalaam. Commercial billing targets reach aagudha nu immediate financial visibility kedaikkum.",
            "advantages": [
                "Real-time operational pulse across all press lines without waiting for shift reports",
                "Instant scrap PPM visibility prevents batch rejection before dispatch",
                "Direct drill-down into underlying work orders and invoices with one click",
                "Quick launchpad saves time by bypassing multi-level navigation for daily tasks"
            ],
            "transition": "Dashboard-la overall plant status paathuttom. Ippo, action thevai padura transactions-ku approval epdi handle pannuvom nu Pending Approvals module-la paapom."
        },
        {
            "num": "1.2",
            "title": "Pending Approvals",
            "route": "/approvals",
            "intro": "Pending Approvals screen dhaan company-oda universal executive inbox. Multi-department transactions authorization-kaaga wait pannum podhu inga aggregate aagum.",
            "problem": "Purchase Orders, Sales discounts, and Scrap write-offs physical file sign-off-kaaga delay aagaradha thaduthu digital workflow tharudhu.",
            "users": "Super Admin, Plant Manager, Purchase Head, Finance Controller.",
            "visible": [
                "Summary status badges: All, Pending, Approved, Rejected count",
                "Document Stream filter: Purchase Order, Sales Order, Engineering Change, Scrap Write-off",
                "Approval Queue Table: Request ID, Document Ref, Submitter Name, Department, Value (INR), Submission Date",
                "Action buttons: 'Approve' (green check), 'Reject' (red cross), and 'View Document' modal preview button"
            ],
            "demo_steps": [
                "1. Click 'Pending Approvals' under Top Items.",
                "2. Show the active list of 12 pending approval requests in the table.",
                "3. Click 'View Document' on a high-value Steel Coil Purchase Order (e.g. PO for Tata Steel ₹12,50,000).",
                "4. Highlight the line items, unit rates, and submitter notes in the preview modal.",
                "5. Explain the 'Approve' button which applies digital sign-off and advances the PO status."
            ],
            "script": "Now, namma Pending Approvals screen paakkirom. Company-la different departments-la raise aagura high-value Purchase Orders, special sales discounts, engineering changes, and scrap write-offs ellaame indha single inbox-la queue aagum. Admin-ku inga complete document preview kedaikkum — items, price, tax and justification paathutu, single click-la 'Approve' panna mudiyum. Reject panna mandatory reason enter pannanum, so full accountability irukkum.",
            "example": "Purchase Officer JSW Steel kitta irundhu ₹15 Lakhs value-ku CRCA Coils order poda try panraaru. Avaroda limit ₹2 Lakhs dhaan. So system automatically andha PO-vai hold panni Super Admin-oda approval inbox-ku anuppidum. Admin inga approve panna dhaan supplier-ku PO generate aagum.",
            "admin_benefit": "Unauthorized purchases and unbudgeted capital spending-ai 100% block pannum. Every sign-off carries digital timestamp and user identity for audit trail.",
            "advantages": [
                "Zero physical paperwork — instant digital approvals from any device",
                "Enforces financial discipline and prevents rogue procurement commitments",
                "Mandatory rejection comments eliminate ambiguity between departments",
                "Full integration with downstream supplier release and accounting"
            ],
            "transition": "Pending approvals epdi approve panradhu nu paathom. Aana indha approval limits yaaru set pannuvaanga? Adha configure panna dhaan Who Can Approve What screen use aagudhu."
        },
        {
            "num": "1.3",
            "title": "Who Can Approve What",
            "route": "/approval-rights",
            "intro": "Who Can Approve What screen dhaan enterprise multi-level approval policy engine. Company-oda authority matrix and spending limit rules inga configure aagum.",
            "problem": "Department heads-ku clear approval thresholds illama confusion and unauthorized orders prevent panna idhu thevai.",
            "users": "Super Admin, Managing Director, Head of HR & Compliance.",
            "visible": [
                "Cockpit KPI cards: Active Rules (14), Multi-Level Chains (8), Governed Document Types (14), Engaged Roles (10)",
                "Document selector: PO, PR, Sales Order, Quotation, ECR, Work Order, Vendor Onboarding, Scrap Write-off, etc.",
                "Multi-Tier Stage Flow: Level 1 Approver role, Level 2 Approver role, Escalation threshold amount",
                "Visual Pipeline Flowchart: Step boxes with role badges and progression arrows",
                "Quick Automotive Presets: 'PO Multi-Tier Sign-off', 'Supplier Onboarding', 'Engineering Change', 'Scrap Write-off'",
                "Action buttons: '+ New Approval Rule', 'Save Configuration', 'Reset Defaults'"
            ],
            "demo_steps": [
                "1. Click 'Who Can Approve What' in sidebar.",
                "2. Show the top 4 KPI cards demonstrating active governance coverage.",
                "3. Select 'Purchase Order (PO)' from the document type dropdown.",
                "4. Point out the visual pipeline: Level 1 (Purchase Officer up to ₹1L) ➔ Level 2 (Plant Manager ₹1L to ₹10L) ➔ Level 3 (Super Admin above ₹10L).",
                "5. Show the 'Automotive Quick Presets' buttons that load standard industry workflows with 1 click."
            ],
            "script": "Now, namma Who Can Approve What screen paakkirom. Indha screen dhaan company-oda corporate governance engine. Inga 14 different documents-ku multi-tier approval rules set pannalaam. Example-ku PO amount ₹1 Lakh kulla irundha Purchase Officer approve pannalaam; ₹1 Lakh to ₹10 Lakhs na Plant Manager approve pannanum; ₹10 Lakhs mela pona Super Admin dhaan sign-off pannanum. Indha visual pipeline preview-la step-by-step flow neat-ah kaattum.",
            "example": "Shop floor-la oru press tool breakdown aagi ₹4,50,000 capex repair indent varudhu. System automtically detects the amount exceeds Level 1, and routes it sequentially through Plant Manager and Director according to this rule matrix.",
            "admin_benefit": "Company-oda money and capital expenditure-ai strict internal controls kulla vekkalaam. Role-based escalation automated-ah nadakkum.",
            "advantages": [
                "Fully configurable thresholds without requiring any software code changes",
                "Visual pipeline makes complex multi-level escalation easy to understand",
                "Quick automotive presets allow 1-click standard manufacturing workflow deployment",
                "Governs both financial transactions and engineering/quality sign-offs"
            ],
            "transition": "Approval rules configure panniyachu. Next, namma company-oda multi-plant structure, departments and cost centers epdi setup panrom nu Company Setup module-la paapom."
        },
        {
            "num": "1.4",
            "title": "Company Setup",
            "route": "/company",
            "intro": "Company Setup module dhaan multi-entity and multi-plant architecture master. Stamping plants, business divisions, departments and cost centers inga maintain aagum.",
            "problem": "Single company multi-location operations run pannum podhu, separate plant GSTIN, address, and cost allocation manage panna idhu thevai.",
            "users": "Super Admin, Corporate CFO, IT Administrator.",
            "visible": [
                "Tab Navigation: Corporate Entity, Plants, Business Units, Departments, Cost Centers",
                "Corporate Details: Company Legal Name (Precision Auto Components Pvt Ltd), CIN, PAN, Registered HQ Address",
                "Plants Tab Table: Plant Code (LBAP-HOSUR), Plant Name, State, Factory License No, GSTIN, Plant Head",
                "Business Units Tab: Stamped Components Division (LBAP-SMD), Tool Room Division",
                "Departments Tab: Press Shop (DEPT-PRESS), Welding & Assembly (DEPT-WELD), Tool Room, QA/QC, Stores, Maintenance, Sales, Accounts",
                "Cost Centers Tab: Press Shop Line 1 Cost Center, Tool Maintenance Cost Center, Warehouse Logistics Center",
                "Action buttons: '+ Add Plant', '+ Add Department', '+ Add Cost Center', 'Save Details'"
            ],
            "demo_steps": [
                "1. Click 'Company Setup' in sidebar.",
                "2. Show the Corporate Entity profile with GSTIN and registered address.",
                "3. Click 'Plants' tab: Show 'LBAP-HOSUR' stamping facility with factory license and state GST details.",
                "4. Click 'Departments' tab: Show the 8 active departments spanning manufacturing and office administration.",
                "5. Click 'Cost Centers' tab: Show machine-level and department-level cost centers used for finance allocation."
            ],
            "script": "Now, namma Company Setup screen-la irukkom. Precision ERP natively multi-plant architecture support pannum. Inga namma corporate legal entity details, multiple manufacturing plants (e.g. Hosur Stamping Plant), business divisions, and individual departments setup pannalaam. Future-la puthusa oru plant Coimbatore-la open panna kooda, simply '+ Add Plant' click panni add pannikalam. Ovvoru plant-kum separate GSTIN, address and factory license define pannalaam.",
            "example": "Hosur-la irukkura main press shop plant (LBAP-HOSUR) sheet metal stamping pannudhu, pakkathula irukkura Tool Room unit dies manufacture pannudhu. Rendum separate plants-ah configure panni, common corporate ledger kulla consolidate panna mudiyum.",
            "admin_benefit": "Multi-location operations-ai single ERP platform-la centralize panni, plant-wise performance and separate GST filing data aggregate panna mudiyum.",
            "advantages": [
                "Native multi-plant and multi-division hierarchy modeling",
                "Accurate statutory compliance with plant-specific GSTIN and factory licenses",
                "Cost center mapping enables granular product costing and variance tracking",
                "Scalable architecture ready for future factory expansion"
            ],
            "transition": "Company plants and departments ready. Aana idhula work panra employees and avangala credentials epdi manage panradhu nu Users & Logins module-la paapom."
        },
        {
            "num": "1.5",
            "title": "Users & Logins",
            "route": "/users",
            "intro": "Users & Logins module dhaan staff identity and credential provisioning directory. Company-oda all 11 ERP role personas and employee logins inga manage aagum.",
            "problem": "Uncontrolled employee access and credential leaks prevent panna, central user lifecycle governance thevai.",
            "users": "Super Admin, HR Head, IT Security Admin.",
            "visible": [
                "User Statistics Cards: Total Staff (11), Active Users (11), Suspended (0), Multi-Factor Enabled (11)",
                "Search and Department filters: Filter by Press Shop, Stores, Quality, Sales, Accounts, etc.",
                "User Directory Table: Name, Email Address, Department, Assigned Plant, RBAC Role, Status (Active badge), Last Login",
                "Action Buttons: '+ Add User', 'Status Toggle' (Active/Inactive), 'Reset Password' key icon, 'Edit Profile'"
            ],
            "demo_steps": [
                "1. Click 'Users & Logins' in sidebar.",
                "2. Show the active directory of 11 role personas (Sales Executive, Store Keeper, Quality Inspector, Plant Manager, etc.).",
                "3. Point to the 'Status Toggle' switch next to a user showing instant activation/deactivation.",
                "4. Click 'Reset Password' on any user to demonstrate generating a secure temporary credential.",
                "5. Open '+ Add User' modal to show fields: First/Last Name, Email, Department, Plant attachment, and Role."
            ],
            "script": "Now, namma Users & Logins screen paakkirom. Inga company-oda complete staff directory irukku. Ovvoru employee-kum avanga name, email, department, plant attachment, and specific role assign panni logins create pannalaam. Oru employee company-ai vittu leave aana, single second-la status toggle-ai 'Inactive'-nu switch panna, avangala login access immediately block aagidum. Admin-ku password reset and MFA policy control inga direct-ah irukku.",
            "example": "Puthusa join panna Store Keeper-ku login create panrom. Avaroda email 'store.keeper@lbap.in' and role 'Store Keeper' nu select panni save panna, avar Stores and GRN screens mattum dhaan access panna mudiyum; Finance-o PO rates-o avarukku hide aagidum.",
            "admin_benefit": "Zero security loopholes. Employee onboarding and offboarding instant-ah nadakkum, credential security Super Admin control-la irukkum.",
            "advantages": [
                "Instant one-click account suspension prevents unauthorized data access",
                "Direct in-app password reset eliminates IT helpdesk delays",
                "Tight coupling with plant location ensures staff only operate within their assigned plant",
                "Full integration with audit logging records who logged in and when"
            ],
            "transition": "Users create panniyachu. Aana ovvoru user-kum enna screen theriyanum, yaaru edit panna mudiyum nu access control define panna Roles & Access module-la paapom."
        },
        {
            "num": "1.6",
            "title": "Roles & Access",
            "route": "/roles",
            "intro": "Roles & Access module dhaan enterprise Role-Based Access Control (RBAC) security builder. Modules and screen-level permissions inga enforce aagum.",
            "problem": "Shop floor operators sensitive financial data paaka koodadhu, stores staff customer pricing paaka koodadhu — strict Separation of Duties (SoD) enforce panna idhu thevai.",
            "users": "Super Admin, Chief Information Security Officer (CISO), IT Head.",
            "visible": [
                "Roles List: Super Admin, Plant Manager, Sales Executive, Purchase Officer, Store Keeper, Production Planner, Shop Floor Supervisor, Quality Inspector, Maintenance Engineer, Dispatch Coordinator, Accounts Executive",
                "Role Details pane: Role Name, Description, User count assigned",
                "Granular 16-Module Permissions Grid: Checkbox matrix for Create, Read, Update, Delete across all modules",
                "Screen Visibility Toggles: Enable/Disable individual navigation links per role",
                "Action buttons: '+ Create Custom Role', 'Clone Role', 'Save Permissions'"
            ],
            "demo_steps": [
                "1. Click 'Roles & Access' in sidebar.",
                "2. Select 'Store Keeper' role from the left list.",
                "3. Show how Goods Receipt and Stock on Hand have 'Read/Write' access, while Sales, Finance, and Roles have 0 access (completely locked).",
                "4. Select 'Super Admin' role to show the complete green wildcard access across all 16 modules.",
                "5. Explain how creating a custom role (e.g. 'Shift Supervisor Trainee') takes less than two minutes."
            ],
            "script": "Now, namma Roles & Access screen-la irukkom. Indha screen dhaan ERP-oda security backbone. Automotive manufacturing-la Separation of Duties romba mukkiyam. Store Keeper-ku stock and GRN mattum dhaan theriyanum; customer sales price-o company balance sheet-o avarukku theriyakoodadhu. Inga namma 16 modules-kum Create, Read, Update, Delete permissions checkbox level-la granular-ah control pannalaam. Super Admin-ku mattum dhaan full unrestricted access irukku.",
            "example": "Shop Floor Supervisor login panna, avarukku Machines, Work Orders and Scrap screen mattum dhaan sidebar-la kaattum. Accounting, Tax and Purchase Order screens sidebar-laye hide aagidum, url-la type panna kooda unauthorized error varum.",
            "admin_benefit": "Enterprise data protection, internal fraud prevention, and ISO/IATF security audit compliance guarantees.",
            "advantages": [
                "Granular 4-tier CRUD (Create, Read, Update, Delete) permissions per module",
                "Automatic sidebar menu filtering based on logged-in user permissions",
                "Cloning feature allows creating new shift roles in seconds without rebuilding from scratch",
                "Guarantees compliance with automotive customer non-disclosure and quality audits"
            ],
            "transition": "Governance and administration master controls paathuttom. Ippo management decisions-ku thevaiyaana deep analytics and charts paaka Reports & Analytics module-ku move aavom."
        }
    ],
    "reports_analytics": [
        {
            "num": "2.1",
            "title": "All Reports",
            "route": "/dashboards",
            "intro": "All Reports hub dhaan company-oda centralized reports library. All 7 departmental executive reports and analytics summaries inga direct-ah access pannalaam.",
            "problem": "Different departments-oda reports thedi alaiya vendiyadhilla; single directory-la consolidated view kedaikkum.",
            "users": "Managing Director, General Managers, Functional Heads.",
            "visible": [
                "Departmental Report Cards: CEO Overview, Sales, Purchasing, Stock, Production, Quality, Maintenance",
                "Live Metric Snippets: Revenue run-rate, active PO spend, stock valuation, press OEE, scrap PPM",
                "Direct 'Open Report' launch buttons on each card"
            ],
            "demo_steps": [
                "1. Click 'Reports & Analytics' section in sidebar and open 'All Reports'.",
                "2. Show the clean executive grid of 7 departmental report launch cards.",
                "3. Explain that clicking any card opens the deep analytical dashboard for that specific function."
            ],
            "script": "Now, namma All Reports hub paakkirom. Idhu company-oda complete analytics directory. Production, Quality, Sales, Stores, Maintenance, and CEO overview-nu ellaa department reports-um inga single place-la organize aagi irukku. Management ovvoru department-oda health indicator-ai inga instantaneous-ah review pannalaam.",
            "example": "Monthly review meeting-la MD ovvoru department heads kitta data kekka thevaiyilla. All Reports open panni, sales target vs actual output and scrap percentage live-ah projector-la present pannalaam.",
            "admin_benefit": "Single-click navigation to any departmental analytics without menu hunting.",
            "advantages": [
                "Unified directory for all cross-functional business intelligence",
                "Visual health badges provide instant status check",
                "Role-filtered access ensures executives see what is relevant to them"
            ],
            "transition": "All reports hub paathuttom. Ippo company-oda highest-level executive dashboard aana Company Overview (CEO) report-ai open pannuvom."
        },
        {
            "num": "2.2",
            "title": "Company Overview (CEO)",
            "route": "/dashboards/ceo",
            "intro": "Company Overview (CEO) dashboard dhaan highest executive strategic view. Revenue, gross margin, stock value, cash flow and factory OEE summary inga live-ah reflect aagum.",
            "problem": "Top leadership-ku operational details-la muzhugama, high-level business health and profitability quick-ah puriya idhu thevai.",
            "users": "CEO, Managing Director, Board Members, CFO.",
            "visible": [
                "Net Revenue & Gross Operating Margin (%) KPI cards",
                "Total Inventory Valuation (INR Lakhs/Crores) across RM, WIP and FG",
                "Monthly Order Intake vs Actual Billing Bar Graph",
                "Customer Revenue Concentration Pie Chart (TVS, Ashok Leyland, Tata Motors)",
                "Overall Equipment Effectiveness (OEE) gauge chart"
            ],
            "demo_steps": [
                "1. Click 'Company Overview (CEO)' under Reports & Analytics.",
                "2. Highlight the Net Revenue and Gross Margin cards.",
                "3. Show the Customer Concentration chart highlighting top OEM clients.",
                "4. Point out the Total Inventory Valuation card showing capital tied up in stock.",
                "5. Show the overall plant OEE rating reflecting machine performance."
            ],
            "script": "Now, namma Company Overview (CEO) dashboard paakkirom. Indha screen business owners and managing directors-kaaga build pannadhu. Company-oda net revenue, gross margin percentage, total stock value, and overall plant OEE ore screen-la theriyum. Entha customer kitta irundhu maximum revenue varudhu, cash flow trajectory epdi irukku nu strategic decisions edukka idhu periya asset.",
            "example": "MD board meeting-la Hosur plant profitability check panraaru. Monthly billing ₹1.8 Crores achieve aagirukku, stock turnover healthy-ah irukku, and TVS 42% revenue share contribute pannudhu nu live charts-la instant-ah confirm pannalaam.",
            "admin_benefit": "Consolidates finance, sales, and manufacturing into executive insights for strategic planning.",
            "advantages": [
                "Executive-level financial health summary in real time",
                "Customer concentration risk analysis protects revenue pipeline",
                "Direct correlation between factory OEE and gross operating margin"
            ],
            "transition": "CEO overview paathuttom. Ippo commercial pipeline and sales order intake analyze panna Sales Report-ku move aavom."
        },
        {
            "num": "2.3",
            "title": "Sales Report",
            "route": "/dashboards/sales",
            "intro": "Sales Report screen commercial order intake, quotation win-rate, customer revenue distribution and dispatch billing realization analyze panna use aagudhu.",
            "problem": "Pending orders backlog and customer-wise sales trends track panna sales teams face panra difficulty-ai solve pannudhu.",
            "users": "Head of Sales, Commercial Director, Sales Executives.",
            "visible": [
                "Total Confirmed Order Book Value (INR) card",
                "Quotation-to-Order Conversion Win Rate (%) card",
                "Pending Order Delivery Backlog quantity and value",
                "Monthly Sales Invoicing vs Target trend line",
                "Top 10 Selling Stamped Parts ranking table with dispatch counts"
            ],
            "demo_steps": [
                "1. Click 'Sales Report' in sidebar.",
                "2. Show the Order Book Value and pending delivery backlog.",
                "3. Highlight the Top Selling Automotive Parts table (e.g. PRD-LCA-01 Lower Control Arm Bracket).",
                "4. Explain the monthly billing realization chart comparing target vs achieved dispatches."
            ],
            "script": "Now, namma Sales Report paakkirom. Inga customer order intake, monthly revenue realization, and quotation win-rate clear-ah kaattum. Entha automotive part highest demand-la pogudhu, customer delivery backlog evlo irukku nu track pannalaam. Idhu sales team-ku future targets plan panna and delivery bottlenecks prevent panna romba help pannum.",
            "example": "Ashok Leyland kitta irundhu Chassis Reinforcement Gusset-ku ₹45 Lakhs confirmed order book irukku, adha weekly dispatches-ah divide panni target date meet panrom nu sales report-la review pannalaam.",
            "admin_benefit": "Ensures commercial order pipeline matches plant production throughput and revenue targets.",
            "advantages": [
                "Real-time visibility into open order backlog value",
                "Quotation conversion tracking reveals pricing competitiveness",
                "Identifies high-margin vs low-margin component sales patterns"
            ],
            "transition": "Sales report paathuttom. Ippo supplier spend and raw material steel coil purchasing efficiency paaka Purchasing Report-ku move aavom."
        },
        {
            "num": "2.4",
            "title": "Purchasing Report",
            "route": "/dashboards/procurement",
            "intro": "Purchasing Report module raw material supplier spend, purchase order cycle time, steel coil price trends and vendor on-time delivery ratings track pannudhu.",
            "problem": "Steel coil price fluctuations and vendor delivery delays plant production-ai stop pannama irukka procurement analytics thevai.",
            "users": "Purchase Head, SCM Manager, Materials Director.",
            "visible": [
                "Total Spend This Month (INR Lakhs) card",
                "Open Purchase Orders awaiting delivery count and value",
                "Vendor On-Time Delivery (OTD) Average Rating (%)",
                "Supplier Spend Breakdown (Tata Steel, JSW Steel, POSCO, etc.) pie chart",
                "Raw Steel Coil Price Trend graph (INR per Metric Tonne over 6 months)"
            ],
            "demo_steps": [
                "1. Click 'Purchasing Report' in sidebar.",
                "2. Show the monthly procurement spend total.",
                "3. Highlight the Supplier Spend chart showing major steel mill share.",
                "4. Show the Vendor On-Time Delivery metric reflecting supplier reliability."
            ],
            "script": "Now, namma Purchasing Report screen paakkirom. Stamping press shop-oda major cost raw steel coils dhaan. Inga month-wise supplier spend, steel price trends, open purchase orders, and supplier delivery performance live-ah monitor pannalaam. Tata Steel and JSW Steel delivery commitments on-time meet panraangala nu OTD metrics-la clear-ah therinjukalaam.",
            "example": "Tata Steel kitta irundhu CRCA 1.2mm coils ₹48,000/MT-ku contract potrukkom. Market price change aana kooda, namma PO rates and vendor compliance OTD 96%-la maintain aagudha nu report-la check pannalaam.",
            "admin_benefit": "Controls procurement expenditure, prevents costly material stockouts, and supports vendor rate negotiations.",
            "advantages": [
                "Accurate spend analytics per supplier prevents supplier dependency",
                "Historical raw material price trend analysis aids contract renewals",
                "On-time delivery (OTD) tracking holds suppliers accountable"
            ],
            "transition": "Purchasing analytics paathuttom. Ippo warehouse-la evlo stock irukku, adhan value enna nu Stock Report-la paapom."
        },
        {
            "num": "2.5",
            "title": "Stock Report",
            "route": "/dashboards/inventory",
            "intro": "Stock Report screen warehouse inventory valuation, raw material steel coil ageing, and slow-moving items analyze panna use aagudhu.",
            "problem": "Excess capital stock-la block aagaradha thaduthu, reorder levels and dead stock identify panna idhu thevai.",
            "users": "Store Keeper, Materials Manager, Cost Accountant.",
            "visible": [
                "Total Warehouse Stock Value (INR Crores) card",
                "Store-wise Breakdown: Raw Materials (WH-RM), WIP Press Shop (WH-WIP), Finished Goods (WH-FG)",
                "Inventory Ageing Matrix: < 30 Days, 30-60 Days, 60-90 Days, > 90 Days",
                "Low Stock & Critical Reorder Alerts list",
                "Top Value Inventory Parts table"
            ],
            "demo_steps": [
                "1. Click 'Stock Report' in sidebar.",
                "2. Show the Total Stock Valuation card.",
                "3. Explain the store-wise breakdown between raw coils, in-process blanks, and boxed finished parts.",
                "4. Point out the Inventory Ageing chart and the low-stock alert warnings."
            ],
            "script": "Now, namma Stock Report module paakkirom. Inga namma ellaa warehouses-la irukkura total stock value live-ah theriyum. Raw Material Coil Yard-la evlo value irukku, Press Shop WIP-la evlo irukku, and Finished Goods Store-la evlo ready parts irukku nu clear-ah split panni kaattum. Ageing analysis paathu slow-moving coils-ai udane production-ku consume panna plan pannalaam.",
            "example": "Raw material store-la 45 Metric Tonnes CRCA coils 60 days-ku mela irukku na, system ageing alert kaattum. Plant manager andha coils-ai immediate work order-ku allocate panni working capital idle-ah irukkaradha thadupparu.",
            "admin_benefit": "Minimizes working capital blockage and prevents coil rusting or obsolescence.",
            "advantages": [
                "Real-time rupee valuation of all warehouse assets for balance sheet accuracy",
                "Store-wise segregation pinpoints inventory bottlenecks",
                "Proactive stock ageing alerts eliminate dead inventory"
            ],
            "transition": "Stock analytics paathuttom. Ippo factory press floor-la planned vs actual output analyze panna Production Report-ku move aavom."
        },
        {
            "num": "2.6",
            "title": "Production Report",
            "route": "/dashboards/production",
            "intro": "Production Report module press shop output, work order cycle time efficiency, schedule adherence and machine utilization track pannudhu.",
            "problem": "Daily stamping plan achieve aacha illaiya, entha press line-la shortfall irukku nu identify panna idhu thevai.",
            "users": "Production Head, Planning Engineer, Plant Manager.",
            "visible": [
                "Gross Press Stroke Count today and this month",
                "Plan vs Actual Production Output comparison bar graph",
                "Work Order Adherence Rate (% On-Time Completion)",
                "Line-wise Output Breakdown: Heavy Press Line, Blanking Line, Welding Cell",
                "Shift-wise Output Summary: Shift A, Shift B, Shift C"
            ],
            "demo_steps": [
                "1. Click 'Production Report' in sidebar.",
                "2. Show the Gross Press Strokes counter.",
                "3. Highlight the Plan vs Actual graph showing output variance.",
                "4. Show the line-wise breakdown between mechanical presses and welding cells."
            ],
            "script": "Now, namma Production Report screen-la irukkom. Factory floor-la planned output vs actual output epdi perform aagudhu nu inga review pannalaam. Daily target 25,000 stamped parts-ku actual 24,100 pieces achieve aagirukku nu visual bar chart-la theriyum. Entha shift and entha press line maximum throughput deliver pannudhu nu line-wise analysis inga live-ah kedaikkum.",
            "example": "Heavy Press Line 1-la Brake Pedal Lever stamping 10,000 pieces target set pannom. Shift A-la 5,200 pieces, Shift B-la 4,600 pieces achieve aagi total schedule 98% on-time complete aagirukku nu report confirm pannudhu.",
            "admin_benefit": "Identifies press floor bottlenecks and boosts machine output efficiency.",
            "advantages": [
                "Direct plan vs actual variance tracking prevents customer delivery delays",
                "Shift-wise comparison fosters healthy shop floor productivity",
                "Line-wise throughput visibility helps balance plant workloads"
            ],
            "transition": "Production output paathuttom. Aana quality and rejection rate epdi irukku nu Quality Report-la paapom."
        },
        {
            "num": "2.7",
            "title": "Quality Report",
            "route": "/dashboards/quality",
            "intro": "Quality Report module incoming raw material rejection PPM, shop-floor defect trends, final inspection pass rate, and open NCR status monitor pannudhu.",
            "problem": "Automotive Tier-1 OEM standards (IATF 16949) meet panna strict scrap PPM and defect analysis thevai.",
            "users": "Quality Head (QA/QC), IATF Auditor, Plant Manager.",
            "visible": [
                "Overall Plant Scrap PPM card against benchmark (<1.5%)",
                "Incoming Material Inspection Acceptance Rate (%)",
                "Defect Pareto Chart: Burrs, Dents, Cracks, Thinning, Dimensional Inaccuracy",
                "First-Time-Right (FTR) Yield (%) trend line",
                "Open Non-Conformance Reports (NCR) and CAPA resolution status"
            ],
            "demo_steps": [
                "1. Click 'Quality Report' in sidebar.",
                "2. Show the Scrap PPM card meeting automotive benchmark.",
                "3. Point to the Defect Pareto Chart highlighting top rejection reasons.",
                "4. Show the First-Time-Right (FTR) yield trend line."
            ],
            "script": "Now, namma Quality Report screen paakkirom. Automotive customer-ku quality dhaan #1 priority. Inga namma plant-oda rejection PPM, incoming material acceptance rate, and defect Pareto analysis live-ah theriyum. Rejection burr nala varudha illa die wear nala varudha nu Pareto chart-la exact cause identify panni, corrective action edukkalaam. IATF 16949 audit inspection-ku indha reports directly ready-ah irukkum.",
            "example": "Floor Cross Member stamping-la innaiku 140 parts reject aachu. Pareto chart-la check panna 85% burr issues nala aagirukku nu therinjadhu. Udane tool room-ku intimation poi die regrinding panni defect-ai zero pannuvom.",
            "admin_benefit": "Protects company reputation, prevents customer rejections, and drives Cost of Poor Quality (COPQ) down.",
            "advantages": [
                "IATF 16949 compliant defect PPM tracking",
                "Pareto chart pinpoints root causes for targeted tooling maintenance",
                "First-Time-Right yield improvements reduce scrap metal financial loss"
            ],
            "transition": "Quality analytics paathuttom. Ippo machine breakdowns and preventive maintenance efficiency paaka Maintenance Report-ku move aavom."
        },
        {
            "num": "2.8",
            "title": "Maintenance Report",
            "route": "/dashboards/maintenance",
            "intro": "Maintenance Report module Mean Time Between Failures (MTBF), Mean Time To Repair (MTTR), breakdown downtime hours, and spare parts expenditure track pannudhu.",
            "problem": "Unplanned press stoppages plant production-ai stop pannama irukka machine health analytics thevai.",
            "users": "Maintenance Head, Plant Engineer, Operations Director.",
            "visible": [
                "Mean Time Between Failures (MTBF in Operating Hours) card",
                "Mean Time To Repair (MTTR in Minutes) card",
                "Preventive Maintenance (PM) Schedule Adherence (%)",
                "Breakdown Downtime Hours by Machine bar graph",
                "Monthly Spare Parts Replacement Cost trend"
            ],
            "demo_steps": [
                "1. Click 'Maintenance Report' in sidebar.",
                "2. Show the MTBF and MTTR reliability metrics.",
                "3. Highlight the Breakdown Downtime graph showing machine stoppage hours.",
                "4. Show the Preventive Maintenance compliance percentage."
            ],
            "script": "Now, namma Maintenance Report screen-la irukkom. Heavy stamping presses continuous-ah run aagum podhu machine reliability romba critical. Inga namma MTBF (Mean Time Between Failures) and MTTR (Mean Time To Repair) metrics track pannalaam. Preventive maintenance schedule 95% on-time complete aagirukku nu confirm panna, unplanned breakdowns drastically reduce aagum.",
            "example": "500T Hydraulic Press-la last month 2 breakdown incidents total 3.2 hours aachu, repair MTTR 48 minutes-la mudinjurukku. Next hydraulic oil and seal replacement date schedule adherence chart-la verify pannikalam.",
            "admin_benefit": "Minimizes press downtime, extends machine operating lifespan, and optimizes spare parts budget.",
            "advantages": [
                "Direct tracking of international reliability KPIs (MTBF & MTTR)",
                "Enforces preventive maintenance discipline to avoid catastrophic breakdowns",
                "Controls spare parts inventory spend across mechanical and electrical spares"
            ],
            "transition": "Reports and executive analytics muzhusa paathuttom. Ippo system-oda foundation aana Master Data Governance module-ku move aavom."
        }
    ]
}

print("Part 1 data prepared successfully.")
