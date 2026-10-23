# -*- coding: utf-8 -*-
"""
Data Part 3: Stock (Inventory), Production, Shop Floor
"""

PART_3_DATA = {
    "inventory": [
        {
            "num": "11.1",
            "title": "Stock on Hand",
            "route": "/inventory/control",
            "intro": "Stock on Hand (Inventory Control) screen live multi-warehouse inventory balances (Raw Coils, Press Blanks, WIP, Finished Goods, Scrap) down to specific rack and bin locations manage panra screen.",
            "problem": "Physical stock count and ERP stock mismatch aagi production stop aavatha prevent panna real-time bin-level visibility thevai.",
            "users": "Store Keeper, Production Planner, Plant Manager.",
            "visible": [
                "Stock on Hand Grid: Item Code (MAT-CRCA-1.2), Item Description, Warehouse (WH-RM), Bin Location (BIN-RM-A03), On-Hand Qty (34,850 Kg), Allocated Qty (10,500 Kg), Free Available Qty (24,350 Kg), Unit Value (₹50.00/Kg), Total Value (₹17,42,500)",
                "Warehouse selector tabs: All, WH-RM (Raw Material), WH-WIP (Press Floor), WH-FG (Finished Goods), WH-SCRAP",
                "Search by Part/Material Code or Bin ID",
                "Action buttons: 'Perform Cycle Count', 'Initiate Stock Transfer', 'Export Stock List'"
            ],
            "demo_steps": [
                "1. Click 'Stock (Inventory)' section and open 'Stock on Hand'.",
                "2. Show the inventory table displaying items across all 4 plant warehouses.",
                "3. Switch between tabs: WH-RM (raw steel coils) -> WH-WIP (semi-finished press stampings) -> WH-FG (boxed finished brackets ready for dispatch).",
                "4. Highlight the three critical quantity columns: 'On-Hand Qty', 'Allocated to Work Orders', and 'Free Available Qty'.",
                "5. Explain how this distinction prevents promising unallocated stock to multiple orders."
            ],
            "script": "Now, namma Stock (Inventory)-la Stock on Hand screen paakkirom. Inga namma factory-oda complete physical inventory live-ah kaattum. Raw Material Yard-la evlo coils irukku, Press Floor WIP-la evlo blanks irukku, and Finished Goods Store-la evlo ready parts irukku nu single screen-la paakkalaam. Inga romba mukkiyamaana point — 'On-Hand Qty' vs 'Allocated Qty' vs 'Free Available Qty'. 34,850 Kg total stock irundhalum, 10,500 Kg already running work orders-ku reserve aagi irukku, balance 24,350 Kg dhaan puthu orders-ku use panna mudiyum nu system crystal clear-ah kaattum.",
            "example": "Sales team CUST-TVS order-ku 5,000 parts stock irukka nu paakiraanga. WH-FG tab open panna PRD-LCA-01 On-Hand 4,200 pieces, Allocated 2,500 pieces, Free Available 1,700 pieces nu instant-ah therinjidum.",
            "admin_benefit": "Guarantees 100% stock accuracy, eliminates ghost inventory, and prevents double-allocation of materials.",
            "advantages": [
                "Bin-level granularity accelerates stock picking and physical verification",
                "Segregation of allocated vs free stock protects production commitments",
                "Live financial valuation per warehouse supports operational audits"
            ],
            "transition": "Stock on hand paathuttom. Ippo factory-la nadandha ovvoru stock receipt, issue, and transfer history paaka Stock Movements screen-ku move aavom."
        },
        {
            "num": "11.2",
            "title": "Stock Movements",
            "route": "/inventory/transactions",
            "intro": "Stock Movements (Inventory Transactions) screen every stock issue to press lines, supplier inward receipts, inter-store transfers, and floor returns transaction ledger.",
            "problem": "Material stores-la irundhu eduthu account pannaama disappear aavatha thadukka non-repudiation movement audit ledger thevai.",
            "users": "Store Keeper, Internal Auditor, Cost Accountant.",
            "visible": [
                "Transactions Ledger Table: Txn ID (TXN-2026-041), Date & Timestamp, Movement Type (GRN Inward / Production Issue / WIP Transfer / Customer Dispatch), Item Code, Batch/Lot No, From Location, To Location, Quantity Moved (+/-), Handled By User",
                "Filter by Movement Type and Date Range",
                "Action buttons: '+ New Stock Transfer', '+ Issue to Production', 'Export Ledger'"
            ],
            "demo_steps": [
                "1. Click 'Stock Movements' in sidebar.",
                "2. Show the transaction ledger capturing every stock event with microsecond timestamps.",
                "3. Highlight a 'Production Issue' transaction: 1,050 Kg CRCA coil issued from WH-RM to WH-WIP against Work Order WO-2026-001 by user store.keeper@lbap.in.",
                "4. Highlight a 'GRN Inward' transaction: 24,850 Kg received from Tata Steel.",
                "5. Explain how every inventory movement requires an authorized transaction document."
            ],
            "script": "Now, namma Stock Movements screen-la irukkom. Factory stores-la oru single kilogram steel nagandhalum inga digital footprint create aagum. Supplier kitta irundhu inward aana GRN receipt, press shop-ku release aana Work Order issue, inter-bay transfer, customer dispatch — ellaam exact date, time, quantity, and user identity-oda record aagum. Store keeper yaaravadhu material eduthutu entry podama irukka mudiyaadhu, complete internal inventory theft and leakage 100% arrest aagum.",
            "example": "TXN-2026-041 shows 1,050 Kg CRCA coil issued from WH-RM to Press Line 1 for WO-2026-001. System recorded user identity, timestamp, and updated warehouse balance automatically.",
            "admin_benefit": "Eliminates unaccounted material shrinkages and provides an iron-clad audit trail for cost accounting.",
            "advantages": [
                "Complete tamper-proof historical ledger of all stock transactions",
                "Movement type codes categorize issues, receipts, scrap transfers, and adjustments",
                "Direct correlation between material issues and work order consumption"
            ],
            "transition": "Stock movements paathuttom. Ippo stock replenishment thresholds and buffer limits control panra Reorder Levels screen-ku move aavom."
        },
        {
            "num": "11.3",
            "title": "Reorder Levels",
            "route": "/inventory/optimization",
            "intro": "Reorder Levels (Inventory Optimization) screen Min-Max stock thresholds, safety stock buffers, and reorder point alerts configure panra parameters screen.",
            "problem": "Steel coils sudden-ah theerndhu poi emergency-la high price-ku buy panradha thadukka scientific Min-Max control thevai.",
            "users": "Materials Manager, SCM Head, Store In-charge.",
            "visible": [
                "Reorder Optimization Table: Material Code, Description, Minimum Stock Buffer (5,000 Kg), Maximum Stock Ceiling (50,000 Kg), Reorder Point (12,000 Kg), Safety Stock (3,000 Kg), Current Stock, Reorder Trigger Status (Normal / Reorder Needed / Overstocked)",
                "Stock Threshold Visual Gauge per item",
                "Action buttons: 'Recalculate Reorder Points', 'Save Thresholds'"
            ],
            "demo_steps": [
                "1. Click 'Reorder Levels' in sidebar.",
                "2. Show the Min-Max optimization matrix for raw materials and hardware.",
                "3. Point out 'MAT-CRCA-1.2': Current Stock 11,500 Kg vs Reorder Point 12,000 Kg -> Status shows yellow alert: 'Reorder Needed'.",
                "4. Explain how the system triggers purchase requisitions before stock dips into the 3,000 Kg safety buffer.",
                "5. Point out an overstocked item warning to prevent excess capital blockage."
            ],
            "script": "Now, namma Reorder Levels screen paakkirom. Inga namma raw materials and consumables-ku scientific Min-Max stock levels set panrom. Minimum Stock, Maximum Ceiling, Reorder Point, and Safety Buffer inga define aagum. Example-ku CRCA 1.2mm coil reorder point 12,000 Kg; ippo stock 11,500 Kg-ku drop aana udane system 'Reorder Needed' nu alert kuduthu, Purchase team-ku automated indent trigger pannidum. Idhu emergency purchasing and stockout panic-ai complete-ah eliminate pannum.",
            "example": "MAT-CRCA-1.2 coil stock 12,000 Kg kulla pochu. System auto-alert trigger panni 25 MT replenishment order suggest pannudhu, before safety buffer 3,000 Kg is touched.",
            "admin_benefit": "Balances working capital efficiency with 100% production continuity.",
            "advantages": [
                "Prevents both catastrophic stockouts and excessive capital lock-up",
                "Lead-time adjusted reorder points compensate for steel mill delivery delays",
                "Automates purchase trigger generation without daily manual physical checks"
            ],
            "transition": "Reorder levels paathuttom. Ippo total warehouse inventory value financial rupee terms-la calculate panra Stock Value screen-ku move aavom."
        },
        {
            "num": "11.4",
            "title": "Stock Value",
            "route": "/inventory/valuation",
            "intro": "Stock Value (Inventory Valuation) screen real-time financial valuation of total plant inventory using FIFO (First-In-First-Out) and Weighted Average costing methods.",
            "problem": "Month-end audit and balance sheet preparation-ku manual stock valuation panna weeks delay aavatha thadukka real-time valuation thevai.",
            "users": "Cost Accountant, Finance Controller, Super Admin.",
            "visible": [
                "Valuation Summary Cards: Total Plant Stock Value (₹1.84 Crores), Raw Materials Valuation (₹84.2 Lakhs), WIP Valuation (₹42.6 Lakhs), Finished Goods Valuation (₹57.2 Lakhs)",
                "Valuation Method Selector: Weighted Average Costing / FIFO (First-In-First-Out)",
                "Valuation Ledger by Item: Part Code, Description, Batch Count, Stock Qty, Average Unit Landed Rate, Total Valuation Amount (INR)",
                "Action buttons: 'Run Valuation Recalculation', 'Export Audit Valuation Sheet'"
            ],
            "demo_steps": [
                "1. Click 'Stock Value' in sidebar.",
                "2. Show the total plant inventory valuation of ₹1.84 Crores.",
                "3. Explain the split between Raw Materials (WH-RM), WIP on the press floor, and Finished Goods in WH-FG.",
                "4. Switch valuation method between 'Weighted Average' and 'FIFO' to show real-time mathematical recalculation.",
                "5. Show how this number reconciles with the Balance Sheet Inventory Asset account in Finance."
            ],
            "script": "Now, namma Stock Value screen-la irukkom. Indha screen finance and management audit-ku romba critical. Inga namma factory-oda total stock value live-ah calculate aagudhu — currently ₹1.84 Crores worth material plant kulla irukku. Raw coils evlo, WIP press parts evlo, and finished goods evlo nu crystal-clear breakdown kedaikkum. FIFO and Weighted Average cost methods renduமே support pannum. Month-end physical audit sheet single click-la export panni statutory auditors kitta submit pannalaam.",
            "example": "Statutory audit team stock valuation sheet kekkuraanga. Cost accountant indha screen open panni, batch-wise FIFO landed rate pottu ₹1,84,32,500 valuation report 10 seconds-la export panni kuduthuduraaru.",
            "admin_benefit": "Ensures statutory balance sheet compliance with AS-2 / Ind AS-2 inventory valuation standards.",
            "advantages": [
                "Continuous real-time inventory valuation eliminates month-end accounting delays",
                "Support for FIFO and Weighted Average methods accommodates corporate policy",
                "Perfect reconciliation with General Ledger inventory asset accounts"
            ],
            "transition": "Stock valuation paathuttom. Ippo finished automotive part-la irundhu raw steel coil heat number varaikkum backward trace panra Batch & Lot Tracking screen-ku move aavom."
        },
        {
            "num": "11.5",
            "title": "Batch & Lot Tracking",
            "route": "/inventory/traceability",
            "intro": "Batch & Lot Tracking (Traceability Management) screen end-to-end forward and backward automotive traceability engine. Finished stamped assembly serial number lookup panni work order, press machine, operator, and raw steel mill heat number trace pannudhu.",
            "problem": "OEM customer field failure report panna, exact batch identify panni quarantine panna mudiyama full plant recall aavatha 100% prevent panna IATF traceability thevai.",
            "users": "Quality Head, IATF Auditor, Plant Manager, Super Admin.",
            "visible": [
                "Traceability Search Box: 'Enter Batch No, Serial No, or Heat Number' (e.g. LOT-FG-2026-042)",
                "Traceability Genealogy Tree (Interactive Visual Flow): Raw Material Heat No (HEAT-88214 Tata Steel) -> Inward GRN (GRN-2026-007) -> Raw Material Lot (LOT-CRCA-2026-081) -> Work Order (WO-2026-001 on MCH-PR-250T) -> Press Operator (OP-104 Suresh) -> QA Inspection (PASS INS-2026-015) -> Finished Batch (LOT-FG-2026-042) -> Customer Dispatch (DC-2026-019 to TVS Motor Company)",
                "Action buttons: 'Perform Forward Recall Search', 'Perform Backward Root Cause Trace', 'Print Audit Certificate'"
            ],
            "demo_steps": [
                "1. Click 'Batch & Lot Tracking' in sidebar. (THIS IS THE CLIENT DEMO 'WOW' MOMENT!)",
                "2. Type sample finished batch: 'LOT-FG-2026-042' into the traceability search bar.",
                "3. Click Search: Show the complete visual genealogy tree unroll on the screen.",
                "4. Walk through the tree step-by-step: Dispatch DC-2026-019 to TVS -> Finished Batch -> QA Inspection sign-off -> Stamping Work Order WO-2026-001 -> Press MCH-PR-250T -> Operator OP-104 -> Raw Coil Lot -> Mill Heat No HEAT-88214 from Tata Steel.",
                "5. Explain how this 100% satisfies IATF 16949 automotive audit requirement 8.5.2."
            ],
            "script": "Now, namma Batch & Lot Tracking screen paakkirom. Idhu namma ERP-oda MOST POWERFUL FEATURE and client-ku biggest WOW MOMENT! Automotive industry-la IATF 16949 audit and OEM compliance-ku 100% backward traceability mandatory. Example-ku TVS assembly plant-la oru bracket crack aagi complaint varudhu. Namma indha search box-la andha batch number LOT-FG-2026-042 nu type panna, system complete genealogy tree kaattum: Idhu entha dispatch challan-la pochu, QA yaaru inspect pannaanga, entha work order-la entha 250T press-la stamp aachu, entha operator shift-la run aachu, and adhub mattum illama idhuku use panna raw coil Tata Steel-oda entha Heat Number (HEAT-88214) nu 2 seconds-la screen-la kedaikkum! Idhanaala multi-crore recall-ai thaduthu, affected batch-ai mattum pinpoint panni isolate pannalaam.",
            "example": "TVS claims defective batch. In 30 seconds, Super Admin traces batch to HEAT-88214, identifies only 450 parts were impacted, proves Tata Steel coil hardness variation was root cause, and provides audit certificate to OEM.",
            "admin_benefit": "Guarantees complete compliance with global automotive traceability mandates and protects company against catastrophic blanket product recalls.",
            "advantages": [
                "Instant bi-directional traceability (Finished Part to Steel Coil Heat Number and vice versa)",
                "Pinpoint quarantine capability limits recall exposure to specific batches",
                "Audit-ready genealogical certificates satisfy OEM and IATF 16949 auditors"
            ],
            "transition": "Traceability master capability paathuttom. Ippo shop floor-la work orders create panni production execute panra Production module-ku move aavom."
        }
    ],
    "production": [
        {
            "num": "12.1",
            "title": "Production Plan",
            "route": "/production/plan",
            "intro": "Production Plan screen weekly and monthly Master Production Schedule (MPS) allocating stamping batches to press lines manage panra planning screen.",
            "problem": "Daily orders ad-hoc-ah shop floor-ku release panni press chaos create aavatha thadukka disciplined MPS plan thevai.",
            "users": "Master Production Scheduler, Planning Head, Plant Manager.",
            "visible": [
                "Production Plan Matrix Table: Plan ID (PLN-2026-W42), Week / Month (October Week 3), Part Number, Description, Planned Production Qty (12,500 Nos), Machine Allocated (MCH-PR-250T), Start Date, Finish Date, Release Status (Approved / Ready for WO Release)",
                "Weekly Capacity Utilization bar per press line",
                "Action buttons: '+ New Production Plan', 'Import from Consolidated Demand', 'Release Plan to Work Orders' (green button)"
            ],
            "demo_steps": [
                "1. Click 'Production' section and open 'Production Plan'.",
                "2. Show the weekly production plan PLN-2026-W42.",
                "3. Highlight the planned parts: Lower Control Arm Brackets, Brake Levers, Floor Cross Members.",
                "4. Point out the machine allocations balancing press line hours.",
                "5. Show the 'Release Plan to Work Orders' button which converts planned lines into shop floor job cards."
            ],
            "script": "Now, namma Production-la Production Plan screen paakkirom. Factory-la random-ah production panna mudiyaadhu; structured Master Production Schedule (MPS) thevai. Inga weekly and monthly production plan define panrom. Week 42-la 12,500 Lower Control Arm brackets entha date start aagi entha date mudiyanum, and entha press line-la run aaganum nu plan lock panrom. 'Release Plan to Work Orders' click panna, system automatic-ah individual job cards generate pannidum.",
            "example": "PLN-2026-W42: 12,500 brackets allocated across Oct 14 to Oct 19 on 250T press line. Single click release panna, 3 work orders split aagi release aagidum.",
            "admin_benefit": "Ensures plant operations execute strictly according to customer demand schedules without line starvation.",
            "advantages": [
                "Smooths press shop production flow across shifts",
                "Aligns raw material deliveries with scheduled stamping execution",
                "Automates bulk generation of shop floor work orders"
            ],
            "transition": "Production plan release aagiyachu. Ippo shop floor-la running job cards aana Work Orders screen-ku move aavom."
        },
        {
            "num": "12.2",
            "title": "Work Orders",
            "route": "/production/wo",
            "intro": "Work Orders (Job Cards) screen released shop floor work orders detailing target part, planned batch quantity, BOM requirements, press routing operations, assigned machine, and due dates.",
            "problem": "Paper job cards miss aagi, wrong quantity stamp aavatha and operation sequence skip aavatha thadukka digital work order governance thevai.",
            "users": "Production Planner, Shift Supervisor, Machine Operator.",
            "visible": [
                "Work Orders Table: WO No (WO-2026-001), Part (PRD-LCA-01 Lower Control Arm Bracket), Batch Qty (5,000 Nos), Status (Released / In Production / Completed), Planned Machine (MCH-PR-250T), Material Allocated (100% Ready Green Badge), Due Date, Priority (High)",
                "Search and Status filter (Draft, Released, In Production, Completed)",
                "Action buttons: '+ Create Work Order', 'Print Job Card Traveler', 'Release to Shop Floor', 'View Operations Sequence'"
            ],
            "demo_steps": [
                "1. Click 'Work Orders' in sidebar.",
                "2. Show the list of 8 work orders across various production stages.",
                "3. Open 'WO-2026-001' (5,000 Lower Control Arm Brackets).",
                "4. Highlight the details: Planned quantity 5,000 Nos, assigned machine MCH-PR-250T, BOM attached, and routing operations Op 10 to Op 50.",
                "5. Show the 'Print Job Card Traveler' button which generates the physical or digital shop floor traveler with barcode.",
                "6. Explain how this WO serves as the master vehicle for material issue and operator bookings."
            ],
            "script": "Now, namma Work Orders screen-la irukkom. Idhu factory press shop-oda digital job card. Inga ovvoru stamping batch-kum unique Work Order number generate aagum. Kit-la target part, 5,000 pieces batch size, BOM component requirements, sequential routing operations, and assigned 250T press clear-ah specify aagi irukkum. Supervisor 'Print Job Card Traveler' click panni shop floor traveler print eduthu press line-la attach pannuvom. Indha work order number base panni dhaan raw steel issue, operator stroke logging, and scrap booking ellaame track aagum.",
            "example": "WO-2026-001 for 5,000 parts. Supervisor job card print panraaru. Press operator barcode scan panni stamping start pannuvaaru.",
            "admin_benefit": "Centralized visibility over all active stamping batches and complete enforcement of standard routing operations.",
            "advantages": [
                "Digital job cards eliminate paper loss and unauthorized batch overruns",
                "BOM and routing lock-in prevents operators from skipping mandatory steps",
                "Barcode tracking enables real-time stroke and output monitoring"
            ],
            "transition": "Work orders release aachu. Ippo indha work order-ku raw steel coils physical-ah reserve panra Allocate Material screen-ku move aavom."
        },
        {
            "num": "12.3",
            "title": "Allocate Material",
            "route": "/production/allocation",
            "intro": "Allocate Material screen physical reservation of raw steel coils and sheet blanks for released work orders, preventing double-allocation and ensuring material readiness.",
            "problem": "Work order release aana aparam steel coil physically illama operator die set panni ninnu poora time waste-ai thadukka advance allocation thevai.",
            "users": "Store Keeper, Production Planner, Shift Supervisor.",
            "visible": [
                "Material Allocation Matrix: Work Order Ref (WO-2026-001), Target Part, Required Raw Material (MAT-CRCA-1.2), Required Weight (5,250 Kg), Available Warehouse Stock, Selected Coil Lot (LOT-CRCA-2026-081), Allocation Status (100% Reserved Green), Action",
                "Coil Lot Picker Modal showing specific coil weights and locations in WH-RM",
                "Action buttons: 'Auto-Allocate FIFO Lots', 'Confirm Material Reservation', 'Issue Pick List to Stores'"
            ],
            "demo_steps": [
                "1. Click 'Allocate Material' in sidebar.",
                "2. Show the allocation queue for pending work orders.",
                "3. Open WO-2026-001 requiring 5,250 Kg of CRCA steel coil.",
                "4. Click 'Auto-Allocate FIFO Lots': Show the system automatically picking the oldest coil lot LOT-CRCA-2026-081 from Bin A03.",
                "5. Highlight the status changing to '100% Reserved'.",
                "6. Explain that once allocated, no other work order or user can take this coil."
            ],
            "script": "Now, namma Allocate Material screen paakkirom. Press line-la die setup panradhukku munnadi, raw steel coil physically ready-ah irukka nu confirm panna idhu use aagudhu. Work order select panni 'Auto-Allocate FIFO Lots' click panna, system oldest coil lot-ai pick panni indha work order-ku 100% reserve pannidum. Oru murai reserve aana aparam, vera entha supervisor-o work order-o indha coil-ai touch panna mudiyaadhu. 'Issue Pick List' click panna stores forklift operator coil-ai press line-ku move panna instruction pooidum.",
            "example": "WO-2026-001 needs 5,250 Kg. System allocates Lot LOT-CRCA-2026-081 from Bin A03. Forklift driver gets pick ticket and places coil on decoiler before shift starts.",
            "admin_benefit": "Guarantees die setup never begins without confirmed raw material at the press line, eliminating setup downtime waste.",
            "advantages": [
                "FIFO-driven coil allocation ensures oldest steel coils are consumed first",
                "Hard stock reservation prevents line stoppage caused by phantom inventory",
                "Automated pick tickets streamline warehouse forklift dispatching"
            ],
            "transition": "Material press line-la load panniyachu. Ippo press operator job run panni stroke count log panra Run Production (Execution) screen-ku move aavom."
        },
        {
            "num": "12.4",
            "title": "Run Production (Execution)",
            "route": "/production/execution",
            "intro": "Run Production (Execution) screen live job card tracking: Start, Pause, Resume, and Complete stamping operations with operator login and stroke counters.",
            "problem": "Shift mudiyura varaikkum production progress theriyama irundha supervisor-ku live press line control kedaikaadhu.",
            "users": "Press Operator, Shift Supervisor, Line In-charge.",
            "visible": [
                "Live Press Console Card: Machine Code (MCH-PR-250T), Work Order (WO-2026-001), Operator (OP-104 Suresh Kumar), Active Operation (Op 20 Deep Draw)",
                "Live Progress Circular Meter: Target (5,000 Pcs), Completed Today (3,850 Pcs), Progress (77%)",
                "Real-Time Speed: 32 Strokes Per Minute (SPM)",
                "Action buttons: 'START JOB' (green), 'PAUSE' (yellow for die adjustment/break), 'STOP / COMPLETE' (red)",
                "Stoppage Reason Modal triggered when PAUSE is clicked"
            ],
            "demo_steps": [
                "1. Click 'Run Production' in sidebar.",
                "2. Show the active press execution cockpit.",
                "3. Highlight 250T Press currently running WO-2026-001 with 3,850 pieces completed out of 5,000 (77% progress).",
                "4. Point to the 'Pause' button: Explain that clicking Pause prompts the operator for a stoppage reason (e.g. Die lubrication, coil changeover).",
                "5. Show the real-time stroke counter keeping track of press speed (32 SPM)."
            ],
            "script": "Now, namma Run Production screen-la irukkom. Idhu shop floor press terminal console. Machine operator press line-la login panni 'START' click panna, timer and stroke counter start aagidum. Currently 250T press-la 3,850 pieces mudinjurukku (77% progress). Operator edhavadhu reason-kaaga 'PAUSE' click panna, system mandatory-ah downtime reason kettu log pannum. Manager cabin-la ukkandhe entha press odudhu, entha press stop aagi irukku nu live-ah monitor pannalaam.",
            "example": "Operator Suresh Kumar runs 250T press at 32 SPM. Console shows 3,850 pieces stamped. At 4,000 pieces operator pauses for coil changeover, logging 8 minutes stoppage.",
            "admin_benefit": "Delivers real-time shop floor visibility, eliminating reliance on end-of-day handwritten logsheets.",
            "advantages": [
                "Live stroke counting provides minute-by-minute production pacing",
                "Mandatory pause categorization immediately exposes operational delays",
                "Direct operator accountability ties output to specific employee logins"
            ],
            "transition": "Production execution mudinjadhu. Ippo final good parts and offcut scrap book panna Production Output screen-ku move aavom."
        },
        {
            "num": "12.5",
            "title": "Production Output",
            "route": "/production/output",
            "intro": "Production Output screen booking of good pieces produced, recording offcuts and scrap metal weight, and posting finished goods into WIP or Finished Goods store.",
            "problem": "Good parts physically produce aagi warehouse-la stock update aagadha delay-ai eliminate panni immediate stock realization thevai.",
            "users": "Shift Supervisor, Store Keeper, Quality Inspector.",
            "visible": [
                "Production Booking Table: WO Ref (WO-2026-001), Finished Part (PRD-LCA-01), Shift (Shift A), Good Quantity Produced (4,850 Nos), Rejection Scrap Qty (150 Nos), Scrap Metal Weight (1,250 Kg), Target Destination (WH-FG Bay 2), Output Batch Lot Created (LOT-FG-2026-042), Status (Booked)",
                "Action buttons: '+ Book Shift Output', 'Confirm Warehouse Receipt', 'Print Pallet Label'"
            ],
            "demo_steps": [
                "1. Click 'Production Output' in sidebar.",
                "2. Show the output log for completed work orders.",
                "3. Open the booking for WO-2026-001.",
                "4. Highlight the balance: 4,850 Good Pieces + 150 Rejected Pieces = 5,000 Pieces Total.",
                "5. Show the generated Finished Goods Lot: 'LOT-FG-2026-042' and the 1,250 Kg offcut scrap booked to WH-SCRAP.",
                "6. Explain how this immediately increases the finished goods warehouse stock available for dispatch."
            ],
            "script": "Now, namma Production Output screen paakkirom. Shift mudinjadhum supervisor actual output book panraaru. WO-2026-001-la 4,850 good pieces produce aachu, 150 rejected pieces aachu, and 1,250 Kg metal scrap generate aachu nu book panrom. Good parts automatically Finished Goods Store (WH-FG)-la stock add aagidum and puthu pallet barcode LOT-FG-2026-042 create aagidum. Scrap weight direct-ah Scrap Yard (WH-SCRAP)-la inventory add aagidum. Single transaction-la finished goods-um ready, scrap recovery-um updated!",
            "example": "Supervisor books 4,850 pieces for TVS. WH-FG stock instantly increases from 1,700 to 6,550 pieces. Dispatch team immediately sees stock ready to ship.",
            "admin_benefit": "Instantly converts shop floor press work into certified finished goods inventory available for customer billing.",
            "advantages": [
                "Simultaneous booking of good pieces and scrap metal maintains mass balance",
                "Automatic barcode pallet generation prepares finished goods for warehouse storage",
                "Immediate stock availability enables same-day customer dispatch fulfillment"
            ],
            "transition": "Production output store-la book panniyachu. Ippo press operators, machine usage, downtime, and scrap analyze panna Shop Floor module-ku move aavom."
        }
    ],
    "shopfloor": [
        {
            "num": "13.1",
            "title": "Operators",
            "route": "/shopfloor/operator",
            "intro": "Operators screen press operator shift logging, skill matrix mapping (Grade A Press Operator, Die Setter, Robotic Welder), machine allocations, and operator efficiency tracking repository.",
            "problem": "Unskilled operators high-tonnage complex dies run panni tooling damage and scrap aavatha thadukka skill matrix verification thevai.",
            "users": "Shop Floor Supervisor, Industrial Engineer, HR Executive.",
            "visible": [
                "Operator Directory: Operator ID (OP-104), Name (Suresh Kumar), Skill Level (Grade A Certified Press Operator), Assigned Machine (MCH-PR-250T), Shift (Shift A), Today's Output (3,850 Nos), Operator Efficiency (94.2%), Safety Incident Record (Zero Incidents)",
                "Skill Filter and Shift selector",
                "Action buttons: '+ Register Operator', 'Update Skill Matrix', 'Shift Allocation'"
            ],
            "demo_steps": [
                "1. Click 'Shop Floor' section and open 'Operators'.",
                "2. Show the roster of press operators and die setters.",
                "3. Open profile of 'OP-104 Suresh Kumar'.",
                "4. Highlight the skill certification: Certified for 250T and 500T deep draw presses, 94.2% historical operating efficiency, zero safety incidents.",
                "5. Explain how the system prevents assigning a trainee operator to high-tonnage progressive dies."
            ],
            "script": "Now, namma Shop Floor-la Operators screen paakkirom. Automotive press shop-la skilled operators dhaan zero defect output guarantee panraanga. Inga ovvoru operator-oda skill level (Grade A, Grade B, Trainee), machine certifications, and shift allocations maintain panrom. Trainee operator-ai kondu poi 500T deep draw press-la assign panna system warning kaattum. Suresh Kumar 94.2% efficiency-oda 3,850 parts stamp pannirukaaru nu individual operator performance inga track pannalaam.",
            "example": "Supervisor assigns Grade A operator Suresh Kumar to MCH-PR-250T for TVS progressive die. System verifies active skill certification before releasing job card.",
            "admin_benefit": "Ensures machine and die safety by enforcing certified operator allocation and tracks individual worker productivity.",
            "advantages": [
                "Skill matrix verification protects expensive press tooling from operator errors",
                "Objective operator efficiency metrics support incentive and training programs",
                "Maintains comprehensive industrial safety compliance records"
            ],
            "transition": "Operators paathuttom. Ippo factory press machines running hours and stroke utilization analyze panna Machine Usage screen-ku move aavom."
        },
        {
            "num": "13.2",
            "title": "Machine Usage",
            "route": "/shopfloor/machine",
            "intro": "Machine Usage screen press machine utilization monitoring, gross stroke counts, operating vs idle hours, and Overall Equipment Effectiveness (OEE) tracking screen.",
            "problem": "Crores worth capital press machines idle-ah ninnu ROI drop aavatha prevent panna real-time machine usage analytics thevai.",
            "users": "Operations Head, Plant Manager, Industrial Engineer.",
            "visible": [
                "Machine Utilization Table: Machine Code (MCH-PR-250T), Running Hours Today (7.2 Hrs / 8.0 Hrs), Idle Hours (0.8 Hrs), Total Strokes Today (14,200 Strokes), Operating Utilization (90.0%), Availability (92.5%), Performance (91.0%), Quality (98.5%), Calculated OEE (82.9%)",
                "Press Line Utilization Bar Chart comparing all 10 machines",
                "Action buttons: 'Export Utilization Report', 'View Hourly Stroke Logs'"
            ],
            "demo_steps": [
                "1. Click 'Machine Usage' in sidebar.",
                "2. Show the machine utilization dashboard across mechanical and hydraulic presses.",
                "3. Highlight 'MCH-PR-250T' showing 90.0% running utilization and 82.9% overall OEE.",
                "4. Point out the OEE breakdown: Availability x Performance x Quality.",
                "5. Show how management uses this data to justify capital investment in new presses."
            ],
            "script": "Now, namma Machine Usage screen-la irukkom. Crores of rupees invest panna stamping presses evlo hours run aagudhu nu inga live-ah theriyum. Running hours, idle hours, gross stroke count, and international standard OEE (Overall Equipment Effectiveness) inga calculate aagum. 250T press 82.9% world-class OEE-la run aagudhu. Entha press under-utilized-ah irukku nu identify panni, sales team kitta extra component orders eduka push pannalaam.",
            "example": "MCH-PR-250T logged 14,200 strokes today across 7.2 running hours. OEE 82.9% meets world-class automotive manufacturing benchmark.",
            "admin_benefit": "Maximizes asset return on capital investment and pinpoints under-utilized factory equipment.",
            "advantages": [
                "Standardized OEE calculation (Availability x Performance x Quality)",
                "Stroke count logging enables predictive die regrinding intervals",
                "Identifies hidden plant capacity for new customer order intake"
            ],
            "transition": "Machine usage paathuttom. Aana press stoppages and interruptions analyze panna Machine Downtime screen-ku move aavom."
        },
        {
            "num": "13.3",
            "title": "Machine Downtime",
            "route": "/shopfloor/downtime",
            "intro": "Machine Downtime screen recording of unplanned stoppages by standardized reason codes (Die Breakdown, Coil Jam, Power Outage, Waiting for Material, Die Setting) with downtime duration tracking.",
            "problem": "Press line ninnu pochuna enna reason nu theriyama shift reports-la approximate panna actual root cause solve aagaadhu.",
            "users": "Shift Supervisor, Maintenance Engineer, Continuous Improvement (Kaizen) Head.",
            "visible": [
                "Downtime Incident Log: Incident ID (DT-2026-014), Machine (MCH-PR-250T), Work Order Affected, Stoppage Category (Tooling / Electrical / Material / Setup), Reason Code (Die Punch Chipped), Start Time (10:15 AM), End Time (10:48 AM), Duration (33 Mins), Action Taken (Tool room reground punch and re-aligned die), Handled By",
                "Downtime Reason Pareto Chart: Visual distribution of stoppage hours",
                "Action buttons: '+ Log Downtime Incident', 'Close Downtime', 'Export Pareto'"
            ],
            "demo_steps": [
                "1. Click 'Machine Downtime' in sidebar.",
                "2. Show the log of 14 downtime incidents recorded this month.",
                "3. Open 'DT-2026-014' on MCH-PR-250T.",
                "4. Highlight the details: Reason 'Die Punch Chipped', duration 33 minutes, maintenance action taken by tool room.",
                "5. Show the Downtime Pareto Chart showing that 62% of downtime is caused by Die Setting changeovers, indicating a need for Single-Minute Exchange of Die (SMED) optimization."
            ],
            "script": "Now, namma Machine Downtime screen paakkirom. Press line stop aana udane supervisor inga exact reason-oda downtime log pannanum. Die punch break aacha, coil feed jam aacha, illa material kaaga wait panraangala nu category select pannanum. Pareto chart-la 62% downtime die changeover nala dhaan aagudhu nu clear-ah kedaikkum. Idhuku continuous improvement team SMED (Single-Minute Exchange of Die) project pottu die changeover time-ai 45 mins-la irundhu 15 mins-ku reduce panna target veppom.",
            "example": "DT-2026-014: 250T press punch chipped at 10:15 AM, tool room replaced spare punch in 33 mins, press resumed. Full incident logged with zero mystery.",
            "admin_benefit": "Identifies recurring shop floor stoppage causes and drives targeted lean manufacturing improvements.",
            "advantages": [
                "Standardized downtime categorization eliminates finger-pointing between departments",
                "Pareto analysis prioritizes engineering focus on the biggest time-loss culprits",
                "Accurate downtime records feed into machine reliability metrics (MTBF & MTTR)"
            ],
            "transition": "Downtime paathuttom. Ippo shop floor-la reject aana parts and metal scrap manage panra Scrap & Rejections screen-ku move aavom."
        },
        {
            "num": "13.4",
            "title": "Scrap & Rejections",
            "route": "/shopfloor/scrap",
            "intro": "Scrap & Rejections screen defect logging by operation (Burrs, Wrinkling, Tear, Dimensional Inaccuracy) and metal scrap weight tracking in kilograms for scrap metal recovery credit.",
            "problem": "Rejected parts scrap bin-la thooki pottu account pannaama financial loss aavatha 100% stop panna idhu thevai.",
            "users": "Quality Inspector, Shift Supervisor, Scrap Yard In-charge.",
            "visible": [
                "Scrap Log Table: Scrap Entry (SCR-2026-013), Date, Work Order (WO-2026-001), Part (PRD-LCA-01), Operation (Op 20 Deep Draw), Defect Type (Wrinkling & Tear), Rejected Quantity (45 Nos), Total Scrap Weight (47.25 Kg), Steel Scrap Category (Melting Scrap Grade A), Financial Recovery Value (₹1,417.50 @ ₹30/Kg), Status (Sent to Scrap Yard)",
                "Defect Pareto Chart: Wrinkling (48%), Burrs (32%), Dimension (20%)",
                "Action buttons: '+ Log Scrap Batch', 'Transfer to Scrap Yard', 'Export Rejection Sheet'"
            ],
            "demo_steps": [
                "1. Click 'Scrap & Rejections' in sidebar.",
                "2. Show the register of 13 logged scrap records.",
                "3. Open 'SCR-2026-013' on WO-2026-001.",
                "4. Highlight the details: 45 parts rejected due to 'Wrinkling & Tear' during deep draw operation, scrap weight 47.25 Kg, metal scrap recovery value ₹1,417.50.",
                "5. Show how this rejected weight is transferred to WH-SCRAP for metal recycler auction.",
                "6. Show the Defect Pareto Chart highlighting top defect causes."
            ],
            "script": "Now, namma Scrap & Rejections screen-la irukkom. Stamping shop-la rejection nadakkum podhu adha maraika koodadhu — systematic-ah record pannanum. Inga 45 parts deep draw operation-la wrinkling defect nala reject aachu nu record panrom. Rejected pieces pieces-ah mattum nikkama, 47.25 Kg melting scrap nu weight panni Scrap Yard (WH-SCRAP)-ku transfer panrom. Indha metal scrap-ai namma recycler kitta ₹30/Kg-ku sell panni recovery revenue edupom. Complete rejection accountability and financial recovery renduமே inga track aagum.",
            "example": "SCR-2026-013 logs 45 wrinkled parts (47.25 Kg). Scrap yard receives it as Grade A melting scrap with ₹1,417.50 scrap credit booked in accounts.",
            "admin_benefit": "Enforces shop floor scrap transparency and turns waste metal into verified recycling revenue.",
            "advantages": [
                "Captures exact defect reason codes for engineering root cause investigation",
                "Automatic scrap metal weight calculation feeds physical scrap yard inventory",
                "Generates scrap recovery credits that offset raw material procurement expenditure"
            ],
            "transition": "Shop floor execution and scrap controls complete-ah paathuttom. Ippo IATF 16949 quality gates and inspection standards govern panra Quality module-ku move aavom."
        }
    ]
}

print("Part 3 data prepared successfully.")
