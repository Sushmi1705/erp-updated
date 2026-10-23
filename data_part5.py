# -*- coding: utf-8 -*-
"""
Data Part 5: End-to-End Walkthrough, Client Q&A Playbook, Verification Checklist
"""

PART_5_DATA = {
    "end_to_end_flow": [
        ("Stage 1", "Customer RFQ & Technical Inquiry", "Sales Executive", "/sales/inquiry", "Customer (TVS) emails 2D drawing for Lower Control Arm Bracket (PRD-LCA-01). Sales logs inquiry, attaches drawing, and signs off technical feasibility."),
        ("Stage 2", "Engineering Cost Estimation & Quotation", "Costing Engineer & Super Admin", "/sales/quotation", "System calculates raw coil gross weight (1.05 Kg), press tonnage cost, tooling amortization, and deducts scrap recovery credit (₹8.70). PDF quote issued to TVS at ₹245.00/pc."),
        ("Stage 3", "Customer PO & Sales Order Confirmation", "Sales Executive", "/sales/order", "TVS issues Purchase Order (TVS-PO-8821) for 10,000 pieces. Sales Order confirmed with weekly JIT delivery schedules (2,500 pcs/week) and warehouse stock allocation."),
        ("Stage 4", "Engineering BOM & Routing Lock-in", "Engineering Head", "/engineering/bom", "System verifies active BOM (BOM-LCA-01 Rev B) and sequential press routing (Op 10 Blanking to Op 50 Final QA). Drawing revision locked against customer spec."),
        ("Stage 5", "Demand Planning & Net Consolidation", "Master Production Scheduler", "/demand/consolidation", "Sales Order merged with customer 3-month rolling forecast. Forecast consumption algorithm calculates net plant requirement of 25,000 pieces without double-counting."),
        ("Stage 6", "Material Requirements Planning (MRP Run)", "Planning Engineer", "/mrp/execution", "MRP engine explodes BOMs against warehouse stock. Detects net shortage of 9,250 Kg CRCA 1.2mm steel coil with stockout date on 24-Oct."),
        ("Stage 7", "Press Line & Manpower Capacity Check", "Industrial Engineer", "/capacity/machine", "Capacity planning checks Heavy Press Line 1 load. Identifies bottleneck on 250T press (115% load), adjusts die scheduling to 500T press to balance shift hours."),
        ("Stage 8", "Purchase Requisition & Multi-Vendor RFQ", "Purchase Officer", "/procurement/rfq", "Automated purchase indent raised for 25 MT CRCA coil. RFQ sent to Tata Steel, JSW Steel, and POSCO. Landed cost comparison matrix selects Tata Steel at ₹50,000/MT."),
        ("Stage 9", "Purchase Order Issuance & Multi-Tier Approval", "Purchase Head & Super Admin", "/procurement/po", "PO-2026-001 issued for ₹14.75 Lakhs. System routes PO to Super Admin approval inbox due to high-value threshold. Admin approves digitally, sending signed PO to Tata Steel."),
        ("Stage 10", "Factory Gate Entry & Goods Received (GRN)", "Security Gate & Store Keeper", "/receipt/grn", "Tata Steel truck delivers 24,850 Kg coil bundle. Security logs truck TN-70-AB-1234, weighbridge slip, and captures mill Heat Number (HEAT-88214). Material quarantined for QA."),
        ("Stage 11", "Inward Quality Inspection & MTC Lab Check", "Quality Inspector", "/receipt/inspection", "QA tests coil thickness (1.21mm) and Rockwell hardness (52 HRB). Verifies chemical Mill Test Certificate (MTC). Inspection certified as 'Accepted'."),
        ("Stage 12", "Move Into Stock & Automated General Ledger Posting", "Store Keeper", "/receipt/inventory", "Coil moved to Raw Material Yard (WH-RM / Bin A03). System generates lot barcode LOT-CRCA-2026-081 and automatically posts GL voucher: Debit Inventory (1520) / Credit GR/IR (2050)."),
        ("Stage 13", "Master Production Schedule & Work Order Release", "Production Planner", "/production/wo", "Production plan released into Work Order WO-2026-001 for 5,000 brackets. Job card traveler printed with routing operations and barcode."),
        ("Stage 14", "Physical Material Allocation to Press Line", "Store Keeper & Shift Supervisor", "/production/allocation", "System allocates 5,250 Kg from coil lot LOT-CRCA-2026-081. Forklift driver receives pick list and positions coil at 250T press decoiler before shift begins."),
        ("Stage 15", "Shop Floor Press Stamping & Operator Logging", "Press Operator", "/production/execution", "Operator Suresh Kumar logs into MCH-PR-250T press console. Starts job, logging 32 strokes/min. Real-time circular meter tracks 4,850 parts completed with live stoppage logging."),
        ("Stage 16", "In-Process Patrol Inspection & Scrap Booking", "Quality Inspector & Supervisor", "/shopfloor/scrap", "QA conducts first-piece inspection and hourly patrol checks. Supervisor books 4,850 good pieces, 150 rejected pieces, and transfers 1,250 Kg offcut scrap to WH-SCRAP."),
        ("Stage 17", "Finished Goods Receipt & Pallet Barcoding", "Store Keeper", "/production/output", "4,850 certified parts posted into Finished Goods Store (WH-FG). System generates finished batch lot LOT-FG-2026-042 and prints pallet label ready for shipment."),
        ("Stage 18", "Pre-Dispatch QA Certification & Delivery Challan (DC)", "QA & Dispatch In-charge", "/dispatch/execution", "Final QA certifies AQL 1.0 sample, issuing COA. Dispatch books truck TN-70-AB-4567, generates Delivery Challan DC-2026-019 with e-Way Bill, deducting 2,500 pieces from WH-FG."),
        ("Stage 19", "Delivery Tracking & Verified Proof of Delivery (POD)", "Logistics Coordinator", "/dispatch/tracking", "Shipment arrives TVS Hosur plant in 1.25 hours. Customer security gate stamps inward slip. Driver uploads signed physical POD copy into system, closing delivery loop."),
        ("Stage 20", "Automated GST Invoicing, General Ledger & Financial P&L", "Accounts Executive & CFO", "/finance/statements", "DC triggers automated Tax Invoice INV-2026-001 (₹7,22,750). General Ledger posts revenue. P&L Statement and Balance Sheet update live in real time, with full audit trail in /audit.")
    ],
    "qa_playbook": [
        {
            "q": "Client Question 1: 'Namma customer drawing revision change pannitaanga na, shop floor-la old revision parts stamp aagadha maadhiri system epdi prevent pannum?'",
            "ans": "Super Admin Answer: 'Romba simple sir. Engineering Change Management (ECM) module-la customer puthu drawing ECN vandha udane formal ECR log panrom. System old BOM revision-ai instantly lock pannidum. Tool room die punch modify panni, multi-department sign-off mudinju Super Admin approve panna dhaan new BOM Rev C activate aagum. Work order generate aagum podhu system only active approved revision-ai dhaan pick pannum. Shop floor operator old revision-ai run panna 100% chance-ye illa!'"
        },
        {
            "q": "Client Question 2: 'Steel coil rate market-la daily fluctuate aagudhu. Purchase order-la oru rate irukku, supplier invoice-la higher rate potu bill vandha system epdi block pannum?'",
            "ans": "Super Admin Answer: 'Idhuku dhaan namma ERP-la automated 3-Way Matching feature irukku sir. Money Out (Accounts Payable) module-la supplier bill book aagum podhu, system 3 items verify pannum: Purchase Order-la agreed rate, Gate weighbridge GRN actual weight, and Supplier invoice. Rate-la 1 paisa discrepancy irundhalum system bill approve pannaadhu, 'Price Mismatch' alert kuduthu block pannidum. Admin approval illama extra amount release aagaadhu.'"
        },
        {
            "q": "Client Question 3: 'Customer assembly plant-la namma component crack aachu nu claim panraanga. Namma andha part entha steel coil and entha heat number-la senjom nu epdi prove pannuvom?'",
            "ans": "Super Admin Answer: 'Idhu namma system-oda biggest strength sir. Batch & Lot Tracking screen open panni, finished part batch number LOT-FG-2026-042 nu type panna, 2 seconds-la complete visual genealogy tree screen-la vandhudum: entha dispatch challan-la anupunom, entha work order-la entha 250T press-la stamp aachu, and adhub mattum illama idhuku use panna raw coil Tata Steel-oda entha Heat Number (HEAT-88214) nu exact mill test certificate koodave kaattum. Single click-la audit certificate export panni OEM kitta prove pannalaam!'"
        },
        {
            "q": "Client Question 4: 'Namma plant-la 50 operators and supervisors irukaanga. Shop floor supervisor accounts and balance sheet paaka mudiyaadha maadhiri security irukka?'",
            "ans": "Super Admin Answer: 'Kandippa sir. Roles & Access module-la granular Role-Based Access Control (RBAC) irukku. Shop floor supervisor-ku Machines and Work Orders screen mattum dhaan sidebar-laye kaattum. Sales pricing, Customer invoices, and General Ledger screens sidebar-laye hide aagidum, URL-la direct-ah type panna kooda '403 Unauthorized' error varum. Super Admin mattum dhaan full permissions control panna mudiyum.'"
        },
        {
            "q": "Client Question 5: 'Weekly JIT schedules padi customer-ku deliveries anuppanum. Sales order-la bulk quantity irundha weekly split dispatches epdi handle aagum?'",
            "ans": "Super Admin Answer: 'Sales Orders screen-la namma 'Multi-Date Delivery Schedules' in-built-ah kuduthurukkom sir. Customer 10,000 pieces annual order kuduthalum, namma weekly 2,500 pieces schedules define pannikalam. Ovvoru schedule-kum warehouse-la irukkura batch stock-ai 'Batch Allocation' panni reserve pannalaam. Schedule date vandhadhum dispatch team andha specific schedule-ku Delivery Challan generate panni lorry load pannikalam.'"
        },
        {
            "q": "Client Question 6: 'Month-end audit time-la inventory valuation balance sheet kooda match aaguma? Manual calculations panna thevai irukka?'",
            "ans": "Super Admin Answer: 'Zero manual calculation sir! Namma Stock Value module FIFO and Weighted Average cost methods-la live financial valuation calculate pannudhu. Store keeper coil inward pannaalum, production scrap book pannaalum, background-la automated double-entry journal vouchers General Ledger Account 1520-la post aagidum. Month-end-la Balance Sheet Inventory Asset value and physical warehouse stock value 100% perfectly balance aagum.'"
        },
        {
            "q": "Client Question 7: 'IATF 16949 audit inspection-ku namma ERP ready-ah irukka? Quality rejection and CAPA documents eduka mudiyuma?'",
            "ans": "Super Admin Answer: '100% IATF 16949 compliant sir. Namma Quality module-la incoming raw material MTC verification, in-process first-piece inspection tags, final COA quality certificates, and defect root-cause analysis-ku 5-Why analysis and 8D CAPA reporting built-in-ah irukku. Audit time-la auditor kekkura ellaa quality records-um single click-la PDF export pannalaam.'"
        },
        {
            "q": "Client Question 8: 'Production line-la press sudden-ah ninnu pochu na, downtime reason and breakdown repair epdi track aagum?'",
            "ans": "Super Admin Answer: 'Press console-la operator 'Pause' click panna udane mandatory downtime reason kettu log pannum — die chipped, coil jam, or power loss. Severe breakdown aana Breakdown Repairs screen-la emergency ticket raise aagi technician-ku alert pogum. Maintenance technician spare part replace panni close panna udane, MTTR (Mean Time To Repair) and downtime minutes automatic-ah record aagidum.'"
        },
        {
            "q": "Client Question 9: 'Namma plant-oda GST return filing and e-Way bill generate panna external accounting software thevai paduma?'",
            "ans": "Super Admin Answer: 'Endha external software-um thevaiyilla sir. Dispatch Execution screen-la Delivery Challan generate pannum podhe e-Way bill number and vehicle details capture aagidum. Finance Tax & GST screen-la namma dispatches base panni GSTR-1 B2B outward supplies live-ah compile aagum. 'Export GSTR-1 JSON' click panni direct-ah government GST portal-la upload pannikalam.'"
        },
        {
            "q": "Client Question 10: 'Yaaravadhu employee PO rate alter pannaalo illa record delete pannaalo management-ku epdi theriyum?'",
            "ans": "Super Admin Answer: 'Change History (Audit Logs) screen-la namma non-repudiation audit trail vechirukkom sir. System-la oru single comma alter aana kooda exact microsecond timestamp, user email, role, IP address, and Old Value vs New Value diff log permanently record aagum. Indha audit log-ai Super Admin kooda delete panna mudiyaadhu, 100% tamper-proof enterprise transparency!'"
        }
    ],
    "verification_matrix": [
        ("Top Executive", "Dashboard", "/dashboard", "VERIFIED LIVE", "4 KPI cards, WO status bar chart, quick launchpad buttons, date filters active."),
        ("Top Executive", "Pending Approvals", "/approvals", "VERIFIED LIVE", "12 active pending approval requests across PO, PR, SO, ECR, and NCR with modal preview and digital sign-off."),
        ("Top Executive", "Who Can Approve What", "/approval-rights", "VERIFIED LIVE", "14 document types, visual pipeline preview, spending thresholds, and automotive quick presets active."),
        ("Top Executive", "Company Setup", "/company", "VERIFIED LIVE", "Corporate HQ, LBAP-HOSUR plant, Stamped Components Division, 8 departments, and 3 cost centers active."),
        ("Top Executive", "Users & Logins", "/users", "VERIFIED LIVE", "11 staff role personas directory, active status toggles, password reset modal, and MFA indicators active."),
        ("Top Executive", "Roles & Access", "/roles", "VERIFIED LIVE", "11 RBAC roles, 16-module granular CRUD checkbox matrix, and screen restriction flags active."),
        ("Reports & Analytics", "All Reports", "/dashboards", "VERIFIED LIVE", "Directory card deck launching all 7 executive departmental analytics active."),
        ("Reports & Analytics", "Company Overview (CEO)", "/dashboards/ceo", "VERIFIED LIVE", "Net revenue, gross margin %, stock valuation, customer concentration pie chart, and plant OEE active."),
        ("Reports & Analytics", "Sales Report", "/dashboards/sales", "VERIFIED LIVE", "Confirmed order book value, quotation win-rate %, delivery backlog, and top 10 parts table active."),
        ("Reports & Analytics", "Purchasing Report", "/dashboards/procurement", "VERIFIED LIVE", "Supplier spend breakdown, steel price trend curve, and vendor OTD rating active."),
        ("Reports & Analytics", "Stock Report", "/dashboards/inventory", "VERIFIED LIVE", "₹1.84 Cr total stock valuation, store-wise split, ageing brackets, and reorder alerts active."),
        ("Reports & Analytics", "Production Report", "/dashboards/production", "VERIFIED LIVE", "Gross press strokes counter, plan vs actual output bar graph, and shift-wise output breakdown active."),
        ("Reports & Analytics", "Quality Report", "/dashboards/quality", "VERIFIED LIVE", "Scrap PPM trend (<1.5%), defect Pareto chart, and open NCR status active."),
        ("Reports & Analytics", "Maintenance Report", "/dashboards/maintenance", "VERIFIED LIVE", "MTBF (142 hrs), MTTR (44.5 mins), PM compliance (94.8%), and breakdown frequency active."),
        ("Master Data", "Customers", "/master/customer", "VERIFIED LIVE", "12 automotive clients (TVS, Ashok Leyland, Tata Motors) with GSTIN, credit limits, and delivery locations active."),
        ("Master Data", "Suppliers (Vendors)", "/master/vendor", "VERIFIED LIVE", "10 steel mills and tooling suppliers with MSME status, GSTIN, bank payout IFSC, and lead time active."),
        ("Master Data", "Products We Make", "/master/product", "VERIFIED LIVE", "15 stamped parts with internal part codes, customer drawing revisions (Rev C), and HSN 8708 active."),
        ("Master Data", "Raw Materials", "/master/material", "VERIFIED LIVE", "10 steel coils (CRCA, HR, EDD) with thickness (1.2mm), width, grade IS 513, and safety stock buffers active."),
        ("Master Data", "Units of Measure", "/master/uom", "VERIFIED LIVE", "NOS, KGS, MT, MTR, SET with 1 MT = 1,000 KGS conversion logic active."),
        ("Master Data", "Stores & Warehouses", "/master/warehouse", "VERIFIED LIVE", "WH-RM, WH-WIP, WH-FG, WH-SCRAP with 12 specific bin allocations active."),
        ("Master Data", "Machines", "/master/machine", "VERIFIED LIVE", "10 presses (50T to 500T), stroke speed (35 SPM), and hourly cost rate (₹650/hr) active."),
        ("Master Data", "Work Centres", "/master/workcenter", "VERIFIED LIVE", "4 functional lines (Heavy Press Line 1, Blanking Line, Welding) with shift hours and capacity active."),
        ("Master Data", "System Settings", "/master/system-config", "VERIFIED LIVE", "Prefix numbering series (SO-2026-, PO-2026-, WO-2026-), base currency INR, and FY lock dates active."),
        ("Engineering", "Parts Lists (BOM)", "/engineering/bom", "VERIFIED LIVE", "9 multi-level BOMs with gross blank weight (1.05 Kg), net weight (0.85 Kg), and scrap credit active."),
        ("Engineering", "Process Steps (Routing)", "/engineering/routing", "VERIFIED LIVE", "6 sequential routings (Op 10 Blanking to Op 50 Final QA) with cycle times and machine allocations active."),
        ("Engineering", "Design Change Requests", "/engineering/change", "VERIFIED LIVE", "6 ECR/ECM change records with drawing revision impact, tool mod costs, and approval cutoff dates active."),
        ("Sales", "Customer Inquiries", "/sales/inquiry", "VERIFIED LIVE", "14 RFQ inquiries with 2D drawing uploads, target volumes, and technical feasibility sign-off active."),
        ("Sales", "Quotations", "/sales/quotation", "VERIFIED LIVE", "9 cost estimation sheets with press hourly cost, tool amortization, scrap recovery, and PDF export active."),
        ("Sales", "Sales Orders", "/sales/order", "VERIFIED LIVE", "11 confirmed SOs with weekly JIT delivery schedules and real-time finished goods batch allocation active."),
        ("Demand Planning", "Demand Forecast", "/demand/forecasting", "VERIFIED LIVE", "Rolling 3-month customer forecast curves (Oct 25K, Nov 28K, Dec 30K) active."),
        ("Demand Planning", "Combined Demand", "/demand/consolidation", "VERIFIED LIVE", "Net production demand consolidation merging firm SOs and uncommitted forecast buffer active."),
        ("Material Planning", "Run Material Plan", "/mrp/execution", "VERIFIED LIVE", "Multi-level MRP execution engine exploding 25 parts against inventory and open POs active."),
        ("Material Planning", "Material Shortages", "/mrp/shortages", "VERIFIED LIVE", "9 identified steel shortages with predictive stockout dates (24-Oct) and affected work orders active."),
        ("Material Planning", "Suggested Orders", "/mrp/recommendations", "VERIFIED LIVE", "12 algorithmic recommendations (7 Buy PO suggestions, 5 Make WO suggestions) with 1-click release active."),
        ("Capacity Planning", "Machine Capacity", "/capacity/machine", "VERIFIED LIVE", "Machine load matrix highlighting bottleneck press MCH-PR-250T (115% load) vs 500T press (65% load) active."),
        ("Capacity Planning", "Manpower Capacity", "/capacity/labor", "VERIFIED LIVE", "Shift manning table tracking press operators and die setters deficit active."),
        ("Capacity Planning", "Production Schedule", "/capacity/schedule", "VERIFIED LIVE", "Gantt timeline sequencing work orders and die setup blocks across press lines active."),
        ("Purchasing", "Purchase Requests", "/procurement/requisition", "VERIFIED LIVE", "11 internal purchase indents with department justification and approval tracking active."),
        ("Purchasing", "Supplier Price Requests", "/procurement/rfq", "VERIFIED LIVE", "7 RFQs with side-by-side landed cost comparative matrix comparing Tata Steel, JSW, and POSCO active."),
        ("Purchasing", "Purchase Orders", "/procurement/po", "VERIFIED LIVE", "6 confirmed POs with GST breakdowns, multi-tier approvals, and PDF export active."),
        ("Purchasing", "Supplier Performance", "/procurement/performance", "VERIFIED LIVE", "Vendor scorecard tracking OTIF %, quality rejection PPM, and Grade A rating active."),
        ("Goods Receiving", "Goods Received (GRN)", "/receipt/grn", "VERIFIED LIVE", "7 inward gate receipts with truck registration, weighbridge weight, mill heat number, and quarantine active."),
        ("Goods Receiving", "Inspect Received Goods", "/receipt/inspection", "VERIFIED LIVE", "Coil thickness (1.21mm), hardness (52 HRB), surface finish, and MTC verification active."),
        ("Goods Receiving", "Move Into Stock", "/receipt/inventory", "VERIFIED LIVE", "Stock posting to WH-RM / Bin A03, lot barcode LOT-CRCA-2026-081 generation, and GL voucher posting active."),
        ("Stock (Inventory)", "Stock on Hand", "/inventory/control", "VERIFIED LIVE", "Real-time stock across WH-RM, WH-WIP, WH-FG, WH-SCRAP with allocated vs free stock distinction active."),
        ("Stock (Inventory)", "Stock Movements", "/inventory/transactions", "VERIFIED LIVE", "Tamper-proof transaction ledger capturing receipts, issues, transfers, and dispatches with timestamps active."),
        ("Stock (Inventory)", "Reorder Levels", "/inventory/optimization", "VERIFIED LIVE", "Min-Max inventory matrix with automated reorder alerts before safety buffers are breached active."),
        ("Stock (Inventory)", "Stock Value", "/inventory/valuation", "VERIFIED LIVE", "FIFO and Weighted Average valuation calculating ₹1.84 Crores total plant inventory active."),
        ("Stock (Inventory)", "Batch & Lot Tracking", "/inventory/traceability", "VERIFIED LIVE", "End-to-end bi-directional genealogy tree connecting finished batch LOT-FG-2026-042 to mill heat HEAT-88214 active."),
        ("Production", "Production Plan", "/production/plan", "VERIFIED LIVE", "Master Production Schedule (PLN-2026-W42) balancing weekly press line output active."),
        ("Production", "Work Orders", "/production/wo", "VERIFIED LIVE", "8 released job cards with BOM requirements, routing operations, and job traveler print active."),
        ("Production", "Allocate Material", "/production/allocation", "VERIFIED LIVE", "Physical FIFO coil reservation (LOT-CRCA-2026-081) and store pick list issuance active."),
        ("Production", "Run Production", "/production/execution", "VERIFIED LIVE", "Live press console on MCH-PR-250T with stroke pacing (32 SPM) and stoppage reason capture active."),
        ("Production", "Production Output", "/production/output", "VERIFIED LIVE", "Booking of 4,850 good parts into WH-FG and 1,250 Kg offcut scrap into WH-SCRAP active."),
        ("Shop Floor", "Operators", "/shopfloor/operator", "VERIFIED LIVE", "Skill matrix directory tracking certified press operators (OP-104) and efficiency active."),
        ("Shop Floor", "Machine Usage", "/shopfloor/machine", "VERIFIED LIVE", "Live machine running hours, stroke counters, and world-class OEE (82.9%) calculation active."),
        ("Shop Floor", "Machine Downtime", "/shopfloor/downtime", "VERIFIED LIVE", "14 logged stoppage incidents with reason codes and downtime Pareto chart active."),
        ("Shop Floor", "Scrap & Rejections", "/shopfloor/scrap", "VERIFIED LIVE", "13 scrap records tracking defect types (wrinkling, burrs) and metal scrap recovery value active."),
        ("Quality", "Incoming Material Checks", "/quality/incoming", "VERIFIED LIVE", "Chemical and physical testing logs for incoming steel coils against Mill Test Certificates active."),
        ("Quality", "In-Process Checks", "/quality/in-process", "VERIFIED LIVE", "First-piece inspection tags and hourly patrol measurements (burr height, hole pitch) active."),
        ("Quality", "Final Inspection", "/quality/final", "VERIFIED LIVE", "Pre-dispatch AQL 1.0 inspection and Certificate of Analysis (COA) generation active."),
        ("Quality", "Inspection Parameters", "/quality/parameters", "VERIFIED LIVE", "Master dimensional tolerance library with nominal, upper, and lower specs active."),
        ("Quality", "Quality Problems & Fixes", "/quality/ncr", "VERIFIED LIVE", "6 NCR records with 5-Why root cause analysis, Ishikawa diagrams, and 8D CAPA export active."),
        ("Quality", "Quality Reports", "/quality/analytics", "VERIFIED LIVE", "PPM defect trends (<1.1%) and Cost of Poor Quality (COPQ) financial loss tracking active."),
        ("Maintenance", "Planned Maintenance", "/maintenance/preventive", "VERIFIED LIVE", "Monthly PM calendar board and service checklists for mechanical and hydraulic presses active."),
        ("Maintenance", "Breakdown Repairs", "/maintenance/breakdown", "VERIFIED LIVE", "Emergency breakdown ticketing, technician assignment, spare parts logging, and MTTR capture active."),
        ("Maintenance", "Spare Parts", "/maintenance/sparepart", "VERIFIED LIVE", "Inventory catalog of press spares (seals, springs, valves) with min buffer alerts active."),
        ("Maintenance", "Maintenance Reports", "/maintenance/analytics", "VERIFIED LIVE", "Reliability indicators: MTBF 142 hrs, MTTR 44.5 mins, PM compliance 94.8% active."),
        ("Dispatch & Delivery", "Dispatch Plan", "/dispatch/planning", "VERIFIED LIVE", "Weekly shipment schedules consolidating finished parts against confirmed Sales Orders active."),
        ("Dispatch & Delivery", "Record Dispatch", "/dispatch/execution", "VERIFIED LIVE", "Delivery Challan (DC-2026-019) with truck TN-70-AB-4567, e-Way Bill, and WH-FG stock reduction active."),
        ("Dispatch & Delivery", "Delivery Tracking", "/dispatch/tracking", "VERIFIED LIVE", "Transit status tracking and verified physical Proof of Delivery (POD) archiving active."),
        ("Finance & Accounts", "Money In (Receivable)", "/finance/ar", "VERIFIED LIVE", "12 customer tax invoices (INV-2026-001 for TVS ₹7.22L) with aging analysis (0-30 days) active."),
        ("Finance & Accounts", "Money Out (Payable)", "/finance/ap", "VERIFIED LIVE", "8 supplier bills with automated 3-way matching (PO vs GRN vs Invoice) and MSME 45-day tracking active."),
        ("Finance & Accounts", "General Ledger", "/finance/ledger", "VERIFIED LIVE", "Chart of Accounts (25 master accounts) and 43 automated double-entry journal vouchers active."),
        ("Finance & Accounts", "Tax & GST", "/finance/tax", "VERIFIED LIVE", "GSTR-1 outward supplies B2B table, GSTR-2B ITC matching, and GSTR-1 JSON export active."),
        ("Finance & Accounts", "Financial Statements", "/finance/statements", "VERIFIED LIVE", "Real-time Profit & Loss (₹1.84 Cr revenue, ₹32.4L net profit) and Balance Sheet with drill-down active."),
        ("Finance & Accounts", "Cost Accounting", "/finance/costing", "VERIFIED LIVE", "Product costing variance analysis (Std ₹198.50 vs Actual ₹201.20) and margin tracking active."),
        ("System Support", "Reported Problems", "/issues", "VERIFIED LIVE", "Internal IT helpdesk queue with severity badges, reporter details, and resolution workflow active."),
        ("System Support", "Change History (Audit)", "/audit", "VERIFIED LIVE", "Tamper-evident audit trail (14 transaction diffs, 46 auth logs) with microsecond timestamps and IP logs active.")
    ]
}

print("Part 5 data prepared successfully.")
