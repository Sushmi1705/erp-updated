# -*- coding: utf-8 -*-
"""
Data Part 2B: Demand Planning, MRP, Capacity Planning, Purchasing, Goods Receiving
"""

PART_2B_DATA = {
    "demand": [
        {
            "num": "6.1",
            "title": "Demand Forecast",
            "route": "/demand/forecasting",
            "intro": "Demand Forecast screen rolling 3-to-6 month customer production projections, seasonal trends, and uncommitted forecast schedules maintain panra repository.",
            "problem": "OEM customers weekly firm orders mattum tharaama monthly rolling forecasts tharuvaanga. Steel coil procurement lead time 3-4 weeks aaguradhala forecast thevai.",
            "users": "Supply Chain Planner, Commercial Manager, Plant Head.",
            "visible": [
                "Forecast Matrix Table: Part Code, Customer Name, Month 1 Forecast (October 25,000 Nos), Month 2 (November 28,000 Nos), Month 3 (December 30,000 Nos), Confidence Level (%)",
                "Customer Filter: TVS Motor, Ashok Leyland, Tata Motors",
                "Forecast Trend Graph showing projected demand growth",
                "Action buttons: '+ Upload Forecast', 'Adjust Figures', 'Export Plan'"
            ],
            "demo_steps": [
                "1. Click 'Demand Planning' in sidebar and open 'Demand Forecast'.",
                "2. Show the rolling 3-month forecast table for key stamped parts.",
                "3. Highlight TVS Lower Control Arm Bracket forecast: Oct (25,000), Nov (28,000), Dec (30,000).",
                "4. Explain how this forward visibility enables long-lead steel coil ordering from mills before firm PO arrives."
            ],
            "script": "Now, namma Demand Planning-la Demand Forecast screen paakkirom. Automotive industry-la steel coils Tata Steel or JSW kitta order panna 3 to 4 weeks lead time edukkum. But customer firm PO 1 week munnadi dhaan tharuvaanga. So OEM customer anuppura 3 months rolling forecast-ai inga enter panrom. Indha projection base panni namma advance-ah steel coil indents plan panna mudiyum, stockout aagaama prevent pannalaam.",
            "example": "TVS next quarter-ku 83,000 parts forecast kudukuraanga. Indha forecast namma system-la enter panni, 87 Metric Tonnes CRCA steel coil requirement-ai advance-ah steel mill kitta advance booking pannikalam.",
            "admin_benefit": "Eliminates raw material stockout crises caused by long steel mill procurement lead times.",
            "advantages": [
                "Forward-looking rolling demand visibility over 3 to 6 months",
                "Enables proactive raw material steel coil bulk contract booking",
                "Prevents sudden plant downtime caused by surprise customer volume spikes"
            ],
            "transition": "Customer forecast paathuttom. Ippo firm sales orders-um rolling forecast-um combine panni net demand calculate panra Combined Demand screen-ku move aavom."
        },
        {
            "num": "6.2",
            "title": "Combined Demand",
            "route": "/demand/consolidation",
            "intro": "Combined Demand (Demand Consolidation) screen confirmed Sales Orders and uncommitted customer forecasts merge panni net production demand derive panra engine.",
            "problem": "Double counting prevent panna and uncommitted forecast-oda firm orders consume panna consolidation algorithm thevai.",
            "users": "Master Production Scheduler (MPS), SCM Head, Plant Manager.",
            "visible": [
                "Consolidated Demand Table: Part Number, Product Description, Total Net Demand (Nos), Confirmed Firm Orders (Nos), Forecast Buffer (Nos), Month & Year, Status",
                "Net Demand Comparison Chart: Firm SO vs Forecasted Quantity",
                "Action buttons: 'Run Demand Consolidation', 'Release to MRP' (green button)"
            ],
            "demo_steps": [
                "1. Click 'Combined Demand' in sidebar.",
                "2. Show the 2 consolidated runs across October and November.",
                "3. Point out how Part PRD-LCA-01 shows: 10,000 Firm SO + 15,000 Forecast Buffer = 25,000 Total Net Demand.",
                "4. Explain the 'Release to MRP' button which hands over this consolidated net requirement to the MRP material engine."
            ],
            "script": "Now, namma Combined Demand screen-la irukkom. Inga system firm Sales Orders and uncommitted customer forecast rendathayum merge panni net demand calculate pannum. Forecast-la irundhu confirmed orders consume aagidum, double-counting 100% prevent aagum. Resulting net demand dhaan factory-oda Master Production Schedule (MPS). Inga irundhu single click-la 'Release to MRP' kudutha, material planning calculation automatic-ah trigger aagidum.",
            "example": "PRD-LCA-01 bracket-ku 10,000 firm SO irukku, 15,000 balance forecast irukku. Total 25,000 pieces net demand calculate aagi MRP-ku pass aagudhu, zero human calculation errors.",
            "admin_benefit": "Provides a single, verified master demand schedule driving both plant purchasing and press scheduling.",
            "advantages": [
                "Automated forecast consumption eliminates double counting of demand",
                "Unified master demand schedule links commercial sales to plant shop floor",
                "Direct 1-click handoff to MRP accelerates production planning cycles"
            ],
            "transition": "Master demand consolidate panniyachu. Ippo indha demand-ku evlo steel coils thevai, stock evlo irukku nu calculate panra Material Planning (MRP) module-ku move aavom."
        }
    ],
    "mrp": [
        {
            "num": "7.1",
            "title": "Run Material Plan",
            "route": "/mrp/execution",
            "intro": "Run Material Plan (MRP Execution) screen multi-level BOM explosion engine. Consolidated demand against warehouse stock and open POs calculate panni net material requirements compute pannudhu.",
            "problem": "Manual calculation-la raw material shortfall miss aagi press line ninnu poora danger-ai thadukka automated MRP thevai.",
            "users": "Production Planner, Materials Head, SCM Director.",
            "visible": [
                "MRP Execution Controls: Plant Selector (LBAP-HOSUR), Planning Horizon (30 / 60 / 90 Days), Demand Batch selection",
                "Execution History Table: Run ID (MRP-RUN-2026-003), Execution Date, Demand Source, Total Items Exploded (25 Parts), Shortages Identified (9 Shortages), Status (Completed)",
                "Action buttons: 'Execute MRP Run' (blue button), 'View Exploded Requirements'"
            ],
            "demo_steps": [
                "1. Click 'Material Planning (MRP)' section and open 'Run Material Plan'.",
                "2. Show the 3 completed MRP runs in the execution table.",
                "3. Open 'MRP-RUN-2026-003'.",
                "4. Highlight the exploded components: 25 finished parts exploded across 10 steel raw materials and hardware items.",
                "5. Show how the engine compared required quantity against on-hand warehouse inventory."
            ],
            "script": "Now, namma Material Planning (MRP)-la Run Material Plan screen paakkirom. Idhu manufacturing ERP-oda intelligent brain. Inga namma planning period select panni 'Execute MRP Run' click panna, system consolidated demand-ai eduthu, BOM explode panni, warehouse stock and already order panna PO-vai deduct panni, net steel coil requirement evlo kilograms nu calculate pannidum. Seconds-la complete factory-oda material plan ready aagidum.",
            "example": "25,000 Lower Control Arm Brackets manufacture panna 26,250 Kg CRCA coil thevai. Warehouse-la 12,000 Kg irukku, open PO-la 5,000 Kg varudhu na, net deficit 9,250 Kg nu MRP instantly calculate pannidum.",
            "admin_benefit": "Replaces days of tedious spreadsheet calculations with automated, error-free material computation.",
            "advantages": [
                "Multi-level BOM explosion accounts for gross weight and scrap allowances",
                "Deducts on-hand stock and incoming PO deliveries to prevent over-purchasing",
                "Runs in seconds across the entire plant product catalog"
            ],
            "transition": "MRP run aagiyachu. Ippo system identify panna material deficits paaka Material Shortages screen-ku move aavom."
        },
        {
            "num": "7.2",
            "title": "Material Shortages",
            "route": "/mrp/shortages",
            "intro": "Material Shortages screen steel coil shortages, expected stockout dates, affected work orders, and required replenishment quantities pinpoint panra matrix.",
            "problem": "Production start pannadhukku aparam coil illama press line stoppages aavatha thadukka proactive shortage detection thevai.",
            "users": "Materials Manager, Purchase Officer, Production Planner.",
            "visible": [
                "Shortages Matrix Table: Material Code (MAT-CRCA-1.2), Material Name, Required Qty (26,250 Kg), Available Stock (17,000 Kg), Net Shortage (-9,250 Kg), Stockout Date (24-Oct), Impacted Work Orders (WO-2026-001, 002), Severity (High Red Badge)",
                "Search and Severity filter (High, Medium, Low)",
                "Action buttons: 'Export Shortage List', 'Generate Purchase Indent'"
            ],
            "demo_steps": [
                "1. Click 'Material Shortages' in sidebar.",
                "2. Show the 9 identified material shortages.",
                "3. Highlight 'MAT-CRCA-1.2' showing a deficit of 9,250 Kg with a projected stockout date of 24-Oct.",
                "4. Point out the impacted work orders column showing which customer jobs will stall if steel is not procured.",
                "5. Explain how this early warning gives procurement 2 weeks to arrange delivery."
            ],
            "script": "Now, namma Material Shortages screen-la irukkom. MRP run aana aparam, entha raw steel coil short aagum nu inga red alerts-oda kaattum. Example-ku CRCA 1.2mm coil-la 9,250 Kg shortage irukku, and 24-Oct-kulla material illana TVS work order ninnu pooidum nu exact date and affected work orders koodave warn pannum. Idhu purchase team-ku 2 weeks munnadiye alarm kuduthu line stoppage-ai 100% prevent pannum.",
            "example": "MAT-CRCA-1.2 shortage 9,250 Kg detect aagudhu. Purchase officer udane Tata Steel kitta expedited delivery request panni 22-Oct-kulla material inward panna arrangement pannuvom.",
            "admin_benefit": "Provides early-warning shortage intelligence that completely eliminates line-down penalties from OEM customers.",
            "advantages": [
                "Exact kilogram-level deficit calculation avoids guesswork",
                "Predictive stockout dates establish precise procurement deadlines",
                "Direct visibility into impacted customer work orders prioritizes purchasing"
            ],
            "transition": "Shortages paathuttom. Ippo indha shortages-ai solve panna system suggest panra Suggested Orders screen-ku move aavom."
        },
        {
            "num": "7.3",
            "title": "Suggested Orders",
            "route": "/mrp/recommendations",
            "intro": "Suggested Orders (MRP Recommendations) screen AI/Algorithmic purchase orders and production work orders suggestions review panni 1-click release panra engine.",
            "problem": "Shortage data paathu manual-ah ovvoru PO and Work Order create panra administrative delay-ai eliminate panna idhu thevai.",
            "users": "Purchase Officer, Production Planner, Super Admin.",
            "visible": [
                "Recommendations Table: Rec ID (REC-2026-012), Action Type (Buy / Make), Item Code, Description, Recommended Quantity, Suggested Vendor / Workcentre, Need By Date, Status (Pending / Released)",
                "Buy vs Make Tab filters",
                "Action buttons: 'Release Selected Orders' (green 1-click button), 'Modify Quantity', 'Reject Suggestion'"
            ],
            "demo_steps": [
                "1. Click 'Suggested Orders' in sidebar.",
                "2. Show the 12 actionable recommendations (7 Buy suggestions for steel/hardware, 5 Make suggestions for stamping).",
                "3. Open a 'Buy' recommendation for MAT-CRCA-1.2 suggesting a PO for 10,000 Kg to Tata Steel by 20-Oct.",
                "4. Point to the 'Release Selected Orders' button which converts this recommendation directly into a draft Purchase Order.",
                "5. Open a 'Make' recommendation suggesting a Work Order for 5,000 brackets on Heavy Press Line 1."
            ],
            "script": "Now, namma Suggested Orders screen paakkirom. Indha screen dhaan automation-oda peak. System shortages paathu mattum nikkama, 'Tata Steel kitta 10,000 Kg CRCA coil PO podunga' and 'Heavy Press Line 1-la 5,000 brackets Work Order podunga' nu concrete suggestions kudukkum. Namma simply checkbox tick panni 'Release Selected Orders' click panna, automated-ah Purchase Order and Work Order generate aagidum. Manual data entry-ye thevaiyilla.",
            "example": "REC-2026-012 Buy recommendation: 10,000 Kg CRCA coil from Tata Steel. Single click release panna, PO-2026-004 draft create aagi approval inbox-ku pooidum.",
            "admin_benefit": "Automates the bridge from demand planning to live purchasing and shop floor execution.",
            "advantages": [
                "Eliminates hours of manual PO and Work Order creation",
                "Economic order quantity (EOQ) alignment prevents fragmented small orders",
                "One-click release maintains unbroken traceability back to MRP run"
            ],
            "transition": "Material requirements schedule aachu. Ippo factory press lines-la machine hours and manpower availability check panna Capacity Planning module-ku move aavom."
        }
    ],
    "capacity": [
        {
            "num": "8.1",
            "title": "Machine Capacity",
            "route": "/capacity/machine",
            "intro": "Machine Capacity screen press machine load vs available shift operating hours analyze panni bottleneck presses identify panra planning screen.",
            "problem": "Heavy stamping press overload aagi schedule crash aavatha thadukka machine-wise capacity load analysis thevai.",
            "users": "Industrial Engineer, Production Planner, Plant Manager.",
            "visible": [
                "Press Load Table: Machine Code (MCH-PR-250T), Machine Name, Available Hours (160 Hrs/Month), Planned Load Hours (184 Hrs), Load Percentage (115% Overloaded Red Alert), Bottleneck Status",
                "Press Capacity Load Bar Chart: Visual comparison of available vs required hours per press",
                "Shift filter and Date Range selector",
                "Action buttons: 'Rebalance Load', 'Add Overtime Shift'"
            ],
            "demo_steps": [
                "1. Click 'Capacity Planning' section and open 'Machine Capacity'.",
                "2. Show the machine capacity table across all 10 stamping presses.",
                "3. Highlight 'MCH-PR-250T' showing 115% load (overloaded bottleneck).",
                "4. Point out adjacent press 'MCH-PR-500T' running at only 65% capacity.",
                "5. Explain how the planner uses this screen to reroute suitable secondary dies or add a weekend shift."
            ],
            "script": "Now, namma Capacity Planning-la Machine Capacity screen paakkirom. Material irundhalum machines-la time irukkannum. Inga ovvoru stamping press-oda available hours vs planned load hours calculate aagum. Chart-la 250T press 115% load-la overload aagi bottleneck alert kaattudhu; aana 500T press 65% load-la free-ah irukku. Idha paathu planner jobs-ai secondary press-ku divert pannalaam illa Sunday overtime shift schedule panni bottleneck resolve pannalaam.",
            "example": "MCH-PR-250T-la 24 hours excess load irukku. Planner 2 work orders-ai 500T press-ku reassign panni load percentage 92%-ku kondu vandhu schedule balance panraaru.",
            "admin_benefit": "Prevents press line over-commitment and optimizes capital machine asset utilization.",
            "advantages": [
                "Visual load percentages instantly expose manufacturing bottlenecks",
                "Prevents machine wear-and-tear caused by chronic unmonitored overloading",
                "Enables realistic customer delivery promise dates based on machine availability"
            ],
            "transition": "Machine capacity paathuttom. Ippo press operators and die setters manpower availability paaka Manpower Capacity screen-ku move aavom."
        },
        {
            "num": "8.2",
            "title": "Manpower Capacity",
            "route": "/capacity/labor",
            "intro": "Manpower Capacity screen press operators, die setters, and welders availability vs required labor hours evaluate panra workforce planning screen.",
            "problem": "Shift-la skilled press operators shortage aagi machines idle-ah nikkatha thadukka workforce planning thevai.",
            "users": "HR Manager, Shift In-charge, Production Head.",
            "visible": [
                "Labor Capacity Table: Skill Category (Grade A Press Operator, Die Setter, Robotic Welder, QA Inspector), Available Man-Hours, Required Hours, Variance (+/- Hours), Headcount Deficit",
                "Shift Manning Chart: Shift A, Shift B, Shift C headcount distribution",
                "Action buttons: 'Adjust Shift Manning', 'Request Contract Labor'"
            ],
            "demo_steps": [
                "1. Click 'Manpower Capacity' in sidebar.",
                "2. Show the skill categories: Press Operators, Die Setters, Robotic Welders.",
                "3. Highlight the Die Setter row showing a deficit of 18 hours in the upcoming week.",
                "4. Explain how this early visibility allows HR and shift in-charges to arrange contract die setters before shifts stall."
            ],
            "script": "Now, namma Manpower Capacity screen-la irukkom. Stamping shop floor-la skilled operators and die setters romba mukkiyam. Inga planned work orders-ku thevaiyaana labor hours vs available operators calculate aagum. Example-ku Die Setters category-la 18 hours deficit irukku nu system warn pannum. Idha paathu shift supervisor trainee operators-ai assign pannalaam illa extra shift allocate panni smooth production maintain pannalaam.",
            "example": "Next week 4 die changeovers planned. Die Setters required 32 hours, available 24 hours. Supervisor advance-ah extra setter arrange panni die changeover delay-ai zero pannuvaaru.",
            "admin_benefit": "Eliminates machine idle time caused by operator or die setter absenteeism.",
            "advantages": [
                "Skill-based labor requirement forecasting matches operator capabilities to jobs",
                "Prevents shift under-manning during high-volume production schedules",
                "Supports accurate direct labor cost estimation in product accounting"
            ],
            "transition": "Machines and manpower capacity verify panniyachu. Ippo daily press sequencing schedule build panra Production Schedule screen-ku move aavom."
        },
        {
            "num": "8.3",
            "title": "Production Schedule",
            "route": "/capacity/schedule",
            "intro": "Production Schedule screen Gantt-style daily sequencing of work orders on specific press lines to minimize die changeover times and optimize shop floor throughput.",
            "problem": "Frequent die changeovers-la press idle time waste aavatha thadukka optimal daily sequencing schedule thevai.",
            "users": "Master Scheduler, Production Head, Shift Supervisors.",
            "visible": [
                "Production Schedule Gantt Board: Press Lines on vertical axis, Days/Hours on horizontal axis",
                "Scheduled Work Order Blocks: WO-2026-001 (08:00 to 14:00 on MCH-PR-250T), Die Setup Block (14:00 to 15:00), WO-2026-002 (15:00 to 22:00)",
                "Capacity Utilization indicator per line",
                "Action buttons: 'Auto-Sequence Schedule', 'Lock Day Schedule', 'Publish to Shop Floor'"
            ],
            "demo_steps": [
                "1. Click 'Production Schedule' in sidebar.",
                "2. Show the interactive scheduling timeline board.",
                "3. Point out how Work Orders are sequenced on Heavy Press Line 1 to group similar coil thicknesses together, minimizing die changeover time.",
                "4. Highlight the dedicated 'Die Setup' block between jobs.",
                "5. Explain the 'Publish to Shop Floor' button which pushes the daily plan to supervisors."
            ],
            "script": "Now, namma Production Schedule screen paakkirom. Idhu daily press shop operations-oda timetable. Heavy press lines-la work orders-ai Gantt board-la sequence panrom. Similar coil thickness irukkura jobs-ai serthu schedule panna, die changeover time save aagum. Ovvoru work order-kum start time, run hours, and die setup block clear-ah assign aagi, 'Publish to Shop Floor' click panna supervisors mobile and terminal-ku daily target push aagidum.",
            "example": "Heavy Press Line 1-la morning shift Lower Control Arm bracket, evening shift Floor Cross Member schedule panrom. Central die setup 45 minutes block pottu, press utilization 94%-la maximize panrom.",
            "admin_benefit": "Minimizes non-productive die changeover downtime and guarantees predictable daily output.",
            "advantages": [
                "Visual timeline prevents scheduling conflicts across machines",
                "Smart sequencing minimizes die changeovers and scrap setup losses",
                "Instant electronic publishing aligns shift supervisors with management targets"
            ],
            "transition": "Production schedule locked. Ippo raw steel coils procurement execute panna Purchasing module-ku move aavom."
        }
    ],
    "procurement": [
        {
            "num": "9.1",
            "title": "Purchase Requests",
            "route": "/procurement/requisition",
            "intro": "Purchase Requests (PR / Indents) screen internal material and consumable requisitions raised from MRP shortages or workshop maintenance needs manage panra repository.",
            "problem": "Shop floor staff direct-ah supplier kitta order poda mudiyaama, authorized internal requisition workflow enforce panna idhu thevai.",
            "users": "Store Keeper, Maintenance Engineer, Purchase Officer.",
            "visible": [
                "Purchase Requisitions Table: PR No (PR-2026-005), Department (Press Shop), Requester Name, Material (Hydraulic Press Oil ISO 68), Required Qty (200 Litres), Estimated Value (₹38,000), Status (Approved / Pending), Date",
                "Department filter and Urgency badge (Urgent / Normal)",
                "Action buttons: '+ New Purchase Request', 'Approve PR', 'Convert to PO' (blue launch button)"
            ],
            "demo_steps": [
                "1. Click 'Purchasing' section and open 'Purchase Requests'.",
                "2. Show the list of 11 active internal purchase indents.",
                "3. Open 'PR-2026-005' (Hydraulic Stamping Oil for maintenance).",
                "4. Highlight the Department attachment, estimated value, and approval audit status.",
                "5. Show how approved PRs can be converted into Supplier Price Requests (RFQ) or direct Purchase Orders."
            ],
            "script": "Now, namma Purchasing-la Purchase Requests (PR) screen paakkirom. Shop floor-ko stores-ko puthusa raw steel-o illa maintenance oil-o thevai na, direct-ah supplier kitta pesa koodadhu. Inga formal internal indent (PR) raise pannanum. Department head and plant manager approve panna aparam dhaan idhu purchase team-ku PO generate panna pass aagum. Idhu unauthorized spending-ai 100% control pannum.",
            "example": "Maintenance team 500T press oil change-ku 200 Litres Hydraulic Oil PR-2026-005 raise panraanga. Plant manager approve pannadhukku aparam purchase officer PO create panraaru.",
            "admin_benefit": "Enforces strict spending discipline and ensures all purchases originate from authorized business requirements.",
            "advantages": [
                "Eliminates rogue offline purchasing across factory departments",
                "Automates department-level budget checks before commitments are made",
                "Seamless conversion into supplier RFQs or confirmed POs"
            ],
            "transition": "Purchase requests paathuttom. Ippo multiple suppliers kitta competitive price quotations kekkra Supplier Price Requests (RFQ) screen-ku move aavom."
        },
        {
            "num": "9.2",
            "title": "Supplier Price Requests (RFQ)",
            "route": "/procurement/rfq",
            "intro": "Supplier Price Requests (RFQ) screen multi-vendor quotation requests, comparative price quote evaluation matrix, and payment term comparison repository.",
            "problem": "Single vendor dependency and inflated prices thadukka transparent multi-vendor competitive bidding thevai.",
            "users": "Purchase Officer, SCM Head, Finance Auditor.",
            "visible": [
                "RFQ Directory: RFQ No (RFQ-2026-007), Item (CRCA Coil 1.2mm x 250mm), Total Qty (50 MT), Vendors Invited (Tata Steel, JSW Steel, POSCO), Status (Quotes Received), Due Date",
                "Comparative Evaluation Matrix Table: Side-by-side comparison of Vendor A vs Vendor B vs Vendor C (Base Rate per MT, Freight, GST, Net Landed Cost, Delivery Lead Time, Payment Terms)",
                "Action buttons: '+ New RFQ', 'Compare Quotes', 'Award PO' (green button)"
            ],
            "demo_steps": [
                "1. Click 'Supplier Price Requests (RFQ)' in sidebar.",
                "2. Show the list of 7 RFQ tenders.",
                "3. Open 'RFQ-2026-007' (CRCA Steel Coil 50 MT).",
                "4. Highlight the Comparative Evaluation Matrix: Tata Steel (₹48,200/MT, 10 days), JSW Steel (₹47,900/MT, 14 days), POSCO (₹49,100/MT, 7 days).",
                "5. Show how the system calculates Total Landed Cost including freight and taxes.",
                "6. Point to the 'Award PO' button that instantly issues a Purchase Order to the winning vendor."
            ],
            "script": "Now, namma Supplier Price Requests (RFQ) screen-la irukkom. Procurement integrity and cost savings-ku multi-vendor quotation comparison romba mukkiyam. Inga 50 MT steel coil-ku Tata Steel, JSW and POSCO kitta quote kekrom. System side-by-side comparative matrix-la base rate, freight, payment credit days, and net landed cost compare panni kaattum. Best commercial and delivery terms kudukkura vendor-ku 'Award PO' click panni single second-la PO issue pannikalam.",
            "example": "JSW Steel ₹47,900/MT quote kudukuraanga, Tata Steel ₹48,200/MT kudukuraanga. Net savings ₹15,000 calculate aagudhu, JSW-ku order award panrom.",
            "admin_benefit": "Guarantees procurement transparency, prevents supplier favoritism, and secures the lowest landed material cost.",
            "advantages": [
                "Side-by-side landed cost comparison includes freight and tax nuances",
                "Audit-ready vendor bidding history complies with ISO/IATF procurement audits",
                "One-click PO awarding saves administrative time"
            ],
            "transition": "RFQ compare panni supplier select panniyachu. Ippo formal legally-binding order issue panra Purchase Orders screen-ku move aavom."
        },
        {
            "num": "9.3",
            "title": "Purchase Orders (PO)",
            "route": "/procurement/po",
            "intro": "Purchase Orders (PO) screen legally-binding supplier purchase orders, steel coil rate contracts, delivery milestones, GST tax breakdown, and multi-tier approval tracking repository.",
            "problem": "Oral supplier orders nala price disputes and wrong delivery delivery issues avoid panna formal PO thevai.",
            "users": "Purchase Officer, Plant Manager, Super Admin, Accounts Payable.",
            "visible": [
                "Purchase Orders Register: PO No (PO-2026-001), Vendor (Tata Steel Limited), Total Value (₹12,50,000), Status (Approved / Issued / Pending Delivery), PO Date, Expected Delivery Date",
                "Line Items Drill-Down: Material Code, Description, Ordered Qty (25 MT), Unit Rate (₹50,000/MT), GST (18%), Line Total",
                "Terms & Conditions Tab: Delivery Term (FOR Hosur), Payment Terms (45 Days LC/RTGS), Quality Inspection Clause",
                "Approval Audit Trail: Created by Purchase Officer -> Approved by Plant Manager -> Signed by Super Admin",
                "Action buttons: '+ New PO', 'Download PDF', 'Send Email to Supplier', 'View Goods Receipts'"
            ],
            "demo_steps": [
                "1. Click 'Purchase Orders (PO)' in sidebar.",
                "2. Show the list of 6 confirmed POs totaling over ₹75 Lakhs.",
                "3. Open 'PO-2026-001' (Tata Steel Limited).",
                "4. Highlight the line items: 25 Metric Tonnes CRCA steel coil, rate ₹50,000/MT, GST 18%, Total ₹14,75,000.",
                "5. Show the multi-tier digital approval signatures stamped on the document.",
                "6. Show the 'Download PDF' and 'Send Email' buttons.",
                "7. Explain how Goods Receiving and Finance 3-way matching depend on this PO."
            ],
            "script": "Now, namma Purchase Orders (PO) screen paakkirom. Idhu supplier-ku namma release panra formal legally-binding contract. Inga steel coil specifications, ordered tonnage, agreed rate, GST tax, and delivery terms clean-ah store aagum. High-value order-ah irundha approval matrix padi Plant Manager and Super Admin approve panna aparam dhaan official PDF generate aagi supplier-ku email pogum. Inward store-la indha PO number illama endha coil truck-um gate kulla enter aaga mudiyaadhu.",
            "example": "PO-2026-001 issued to Tata Steel for 25 MT CRCA coil. Value ₹14.75 Lakhs. Super Admin digital sign-off mudinjadhum Tata Steel dispatch schedule release pannuvaanga.",
            "admin_benefit": "Eliminates pricing disputes with steel mills and ensures 100% financial sign-off before vendor commitments are made.",
            "advantages": [
                "Comprehensive terms and conditions protect against quality and transit disputes",
                "Digital approval signatures enforce company authority delegation limits",
                "Provides the baseline contract for 3-way matching in Accounts Payable"
            ],
            "transition": "Purchase orders release panniyachu. Ippo namma suppliers delivery and quality rating track panra Supplier Performance screen-ku move aavom."
        },
        {
            "num": "9.4",
            "title": "Supplier Performance",
            "route": "/procurement/performance",
            "intro": "Supplier Performance screen vendor rating scorecard tracking On-Time In-Full (OTIF) delivery %, rejection PPM rate, and commercial competitiveness.",
            "problem": "Poor quality steel coils and delayed deliveries repeat panra vendors-ai identify panna objective supplier scorecard thevai.",
            "users": "Vendor Development Head, Quality Manager, Purchase Head.",
            "visible": [
                "Supplier Scorecard Table: Vendor Name, Total Dispatches Received, On-Time In-Full (OTIF %), Quality Rejection PPM, Price Competitiveness Score, Overall Rating Grade (Grade A / B / C)",
                "Performance Radar Chart: Comparing Quality, Delivery, Cost, and Service",
                "Vendor Performance Audit Status: Approved / On Watchlist / Disqualified",
                "Action buttons: 'Generate Scorecard Report', 'Send Vendor Assessment Letter'"
            ],
            "demo_steps": [
                "1. Click 'Supplier Performance' in sidebar.",
                "2. Show the vendor rating scorecard across all 10 active suppliers.",
                "3. Highlight 'Tata Steel Limited' holding Grade A rating with 96% OTIF and 0.4% rejection.",
                "4. Point out a lower-ranked vendor on 'Watchlist' due to repeat delivery delays.",
                "5. Explain how IATF audits require this documented annual supplier evaluation."
            ],
            "script": "Now, namma Supplier Performance screen-la irukkom. Automotive IATF 16949 audit-ku annual vendor evaluation mandatory. Inga system every supplier-oda On-Time In-Full (OTIF) delivery percentage, incoming quality rejection PPM, and pricing score automatically calculate pannum. Tata Steel 96% OTIF-oda Grade A-la irukku. Repeat-ah delay panra supplier watchlist-la alert aagiduvaaru. Idhu annual vendor rate contracts renew panna solid factual data tharudhu.",
            "example": "Tata Steel 24 dispatches-la 23 on-time, scrap PPM 0.4% kulla irundhadhala Grade A preferred vendor status kedaikkum.",
            "admin_benefit": "Holds steel suppliers accountable to quality and delivery commitments with tamper-proof data.",
            "advantages": [
                "Objective, automated scoring eliminates personal bias in vendor ratings",
                "IATF 16949 audit-compliant annual supplier evaluation documentation",
                "Supports strategic vendor rationalization and volume allocation decisions"
            ],
            "transition": "Procurement performance paathuttom. Ippo factory gate-la steel coil lorry deliver aagum podhu entry panra Goods Receiving module-ku move aavom."
        }
    ],
    "receipt": [
        {
            "num": "10.1",
            "title": "Goods Received (GRN)",
            "route": "/receipt/grn",
            "intro": "Goods Received (GRN) screen gate entry and physical receipt of goods against open Purchase Orders. Supplier invoice, coil heat number, bundle weight, and Mill Test Certificate (MTC) capture pannudhu.",
            "problem": "PO quantity-ai vida excess-ah vandhadho illa PO illama lorry inward aavatha gate level-laye block panna GRN thevai.",
            "users": "Security Gate Officer, Store Keeper, Inward Inspector.",
            "visible": [
                "Goods Receipt Register: GRN No (GRN-2026-007), PO Ref (PO-2026-001), Vendor (Tata Steel), Supplier Invoice No (INV-TS-9912), Vehicle Registration (KA-51-AB-1234), Received Weight (24,850 Kg), Heat Number (HEAT-88214), Status (Received / Quarantined for QA), Date",
                "Received Lines Drill-Down: Material, Ordered vs Delivered Qty, Weight Slip Attachment",
                "Action buttons: '+ New Goods Receipt', 'Attach Weighbridge Slip', 'Release to Quality Inspection' (blue button)"
            ],
            "demo_steps": [
                "1. Click 'Goods Receiving' section and open 'Goods Received (GRN)'.",
                "2. Show the register of 7 inward GRN transactions.",
                "3. Open 'GRN-2026-007' (Tata Steel Coil Delivery).",
                "4. Highlight the Supplier DC/Invoice Number, Lorry Number (KA-51-AB-1234), Delivered Weight (24,850 Kg), and Mill Heat Number (HEAT-88214).",
                "5. Show the status 'Quarantined for QA' — stock is not yet usable in production.",
                "6. Explain how this gate record prevents supplier billing discrepancies."
            ],
            "script": "Now, namma Goods Receiving-la Goods Received (GRN) screen paakkirom. Lorry plant gate-la steel coil bundle unload pannum podhu inga entry panrom. Open PO number select panna, supplier details auto-fill aagum. Lorry number, weighbridge weight slip, supplier DC invoice number, and steel mill-oda Heat Number (HEAT-88214) inga enter panrom. Inward aana udane stock automatically 'Quarantined for QA' status-la irukkum — quality inspect panni approve panra varaikkum press shop-la yaarum idhula oru piece kooda use panna mudiyaadhu.",
            "example": "Tata Steel lorry-la 25 MT coil varudhu, weighbridge-la 24,850 Kg actual weight kedaikkudhu. GRN-2026-007 pottu Heat Number HEAT-88214 tag panni QA inspection-ku move panrom.",
            "admin_benefit": "Blocks unauthorized deliveries at the factory gate and establishes the heat number pedigree for full automotive traceability.",
            "advantages": [
                "Strict validation against open PO prevents over-deliveries and billing errors",
                "Captures supplier mill heat numbers at the earliest entry point",
                "Automatic quality quarantine protects production from unverified raw material"
            ],
            "transition": "GRN inward aachu. Ippo incoming steel coil chemical and physical properties verify panra Inspect Received Goods screen-ku move aavom."
        },
        {
            "num": "10.2",
            "title": "Inspect Received Goods",
            "route": "/receipt/inspection",
            "intro": "Inspect Received Goods screen quality gating check at inward stores. Coil thickness, hardness (HRB), surface finish, visual defect checks, and Mill Test Certificate (MTC) verification repository.",
            "problem": "Defective raw steel coil press-la feed aagi progressive die damage aavatha and batch rejection aavatha gate-la prevent panna idhu thevai.",
            "users": "Quality Inspector (Inward QA), Quality Manager.",
            "visible": [
                "Inward Inspection Queue Table: Inspection ID (INS-2026-009), GRN Ref (GRN-2026-007), Material (CRCA Coil 1.2mm), Heat No (HEAT-88214), Sample Size Tested, Thickness Measured (1.21 mm vs 1.20±0.03mm Spec), Hardness Measured (52 HRB), Visual Status (No Rust / No Scratches), Verdict (Accepted / Rejected / Conditional)",
                "Action buttons: 'Record Inspection Verdict', 'Attach MTC Lab Report', 'Approve & Move to Stock' (green button)"
            ],
            "demo_steps": [
                "1. Click 'Inspect Received Goods' in sidebar.",
                "2. Show the queue of inward materials awaiting inspection.",
                "3. Open 'INS-2026-009' (Inspection for GRN-2026-007).",
                "4. Highlight the measured parameters: Thickness 1.21mm (within ±0.03mm tolerance), Hardness 52 HRB (within spec), Surface free of rust/scale.",
                "5. Show the Mill Test Certificate (MTC) attachment.",
                "6. Point to the 'Approve & Move to Stock' button which certifies the material for production."
            ],
            "script": "Now, namma Inspect Received Goods screen-la irukkom. Inward aana raw steel coil-ai quality team vernier micrometer and hardness tester vachu check panraanga. Thickness 1.20mm-ku actual 1.21mm irukka, hardness 50-55 HRB kulla irukka, coil surface-la rust-o scratches-o illama irukka nu test panrom. Supplier-oda Mill Test Certificate (MTC) compare panni verify panna aparam, inspector 'Accepted' sign-off kudupaaru. Reject aana material separate rejection bay-ku shift aagi vendor-ku debit note trigger aagidum.",
            "example": "HEAT-88214 coil inspection pass aachu. Thickness 1.21mm, hardness 52 HRB. Inspector digital sign-off kuduthu 'Approve & Move to Stock' click panraaru.",
            "admin_benefit": "Guarantees zero substandard steel enters the stamping plant, protecting multi-lakh progressive press tooling from damage.",
            "advantages": [
                "Strict tolerance verification eliminates raw material quality failures",
                "Mill Test Certificate digital archiving complies with IATF 16949 clause 8.4",
                "Instant rejection workflow triggers automated supplier debit notes"
            ],
            "transition": "Quality inspection approve panniyachu. Ippo indha accepted steel coil-ai live store inventory-la post panna Move Into Stock screen-ku move aavom."
        },
        {
            "num": "10.3",
            "title": "Move Into Stock",
            "route": "/receipt/inventory",
            "intro": "Move Into Stock (Inventory Posting) screen accepted raw material warehouse bin-la stock update panni, unique lot barcode generate panni, General Ledger-la inventory value post panra transaction engine.",
            "problem": "Physical goods warehouse-la irundhum ERP-la update aagadha 'blind stock' situation-ai eliminate panna immediate inventory posting thevai.",
            "users": "Store Keeper, Inventory Controller, Accounts Officer.",
            "visible": [
                "Inventory Posting Queue: GRN No (GRN-2026-007), Material (CRCA Coil 1.2mm), Accepted Qty (24,850 Kg), Target Warehouse (WH-RM), Target Bin (BIN-RM-A03), Lot Number Generated (LOT-CRCA-2026-081), Posting Status (Posted to GL)",
                "General Ledger Voucher Snippet: Debit Inventory Asset (Account 1520 - ₹12,42,500) / Credit GR/IR Clearing (Account 2050 - ₹12,42,500)",
                "Action buttons: 'Confirm Stock Movement', 'Print Lot Barcode Label'"
            ],
            "demo_steps": [
                "1. Click 'Move Into Stock' in sidebar.",
                "2. Show the posting record for GRN-2026-007.",
                "3. Point out the auto-assigned Bin Location: 'WH-RM / BIN-RM-A03'.",
                "4. Highlight the generated tracking lot: 'LOT-CRCA-2026-081' carrying the supplier heat number.",
                "5. Show the automated double-entry accounting voucher posting into General Ledger.",
                "6. Click 'Print Lot Barcode Label' to demonstrate barcode sticker generation."
            ],
            "script": "Now, namma Move Into Stock screen paakkirom. Quality approve panna udane, store keeper material-ai Raw Material Yard-la Bin BIN-RM-A03-ku shift panni inga confirm pannuvaaru. System automatically puthu Lot Barcode (LOT-CRCA-2026-081) generate pannum, adha print panni coil bundle mela ottiduvom. Idhey second-la background-la General Ledger-la Inventory Account debit aagi financial valuation live-ah update aagidum. Ippo indha coil production work orders-ku allocate panna 100% ready.",
            "example": "24,850 Kg CRCA coil Bin A03-la stock add aachu. Inventory asset account-la ₹12,42,500 value post aagi balance sheet-la stock value instant-ah reflect aagudhu.",
            "admin_benefit": "Synchronizes physical warehouse bin locations with real-time financial inventory balance sheet accounting.",
            "advantages": [
                "Instant lot barcode generation ensures physical-to-digital traceability",
                "Automated GL inventory posting eliminates manual month-end journal entries",
                "Immediately releases available stock to production allocation algorithms"
            ],
            "transition": "Material stock-la add aagiyachu. Ippo overall factory inventory, stock movements, and batch traceability analyze panna Stock (Inventory) module-ku move aavom."
        }
    ]
}

print("Part 2B data prepared successfully.")
