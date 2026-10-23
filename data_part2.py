# -*- coding: utf-8 -*-
"""
Data Part 2: Master Data, Engineering, Sales, Demand Planning, MRP, Capacity Planning
"""

PART_2_DATA = {
    "master_data": [
        {
            "num": "3.1",
            "title": "Customers",
            "route": "/master/customer",
            "intro": "Customers master screen dhaan OEM and Tier-1 clients master repository. Customer legal details, GSTIN, credit limit, and delivery locations inga maintain aagum.",
            "problem": "Customer billing errors and credit risk manage panna centralized customer database thevai.",
            "users": "Sales Executive, Accounts Officer, Super Admin.",
            "visible": [
                "Customer Directory Table: Code (e.g. CUST-TVS), Company Name (TVS Motor Company Ltd), GSTIN, City (Hosur), Credit Limit (₹50,00,000), Credit Days (60), Status",
                "Search bar and State filter",
                "Action buttons: '+ New Customer', 'Edit', 'Export Excel'",
                "Modal Form Fields: Customer Code, Name, GSTIN, PAN, Billing Address, Shipping Address, Payment Terms, Primary Contact Person"
            ],
            "demo_steps": [
                "1. Click 'Master Data' in sidebar and open 'Customers'.",
                "2. Show the list of 12 registered automotive clients (TVS, Ashok Leyland, Tata Motors, etc.).",
                "3. Click 'Edit' or open 'TVS Motor Company' record.",
                "4. Point out the GSTIN, Credit Limit (₹50L), Credit Days (60 days), and multi-shipping address fields.",
                "5. Explain how this data automatically flows into Quotations, Sales Orders, and Invoices."
            ],
            "script": "Now, namma Master Data-la Customers screen paakkirom. Inga company-oda approved automotive OEM clients (like TVS, Ashok Leyland, Tata Motors) maintain panrom. Ovvoru client-kum avangala legal name, GSTIN, billing address, shipping plant address, and credit limits inga define aagum. Oru customer-oda credit limit cross aana, system Sales Order create pannum podhe approval alert trigger pannidum.",
            "example": "TVS Motor Company Hosur plant-ku CUST-TVS nu master create panrom. GSTIN 33AAACT1234F1Z5, credit limit ₹50 Lakhs and payment terms 45 Days net nu set panrom. Indha customer-ku Sales Order podum podhe tax and delivery terms auto-fill aagidum.",
            "admin_benefit": "Prevents bad debt by enforcing credit limits and guarantees accurate GST invoicing.",
            "advantages": [
                "Single source of truth for customer tax, address, and contact details",
                "Automated credit limit checks prevent over-exposure to payment delays",
                "Multi-shipping address support for OEM multi-plant deliveries"
            ],
            "transition": "Customers paathuttom. Ippo namma steel coils and consumables supply panra Suppliers (Vendors) master-ku move aavom."
        },
        {
            "num": "3.2",
            "title": "Suppliers (Vendors)",
            "route": "/master/vendor",
            "intro": "Suppliers (Vendors) screen raw steel coil mills, hardware suppliers, and tooling vendors master repository. Legal GSTIN, MSME status, and bank details inga maintain aagum.",
            "problem": "Supplier onboarding and MSME compliance payment terms manage panna structured vendor master thevai.",
            "users": "Purchase Officer, Accounts Payable, Super Admin.",
            "visible": [
                "Vendor Directory Table: Vendor Code (VND-TATA-STL), Supplier Name (Tata Steel Limited), MSME Category, GSTIN, Bank IFSC & Account, Approved Status, Lead Time (Days)",
                "Search and Category filters (Steel Mills, Hardware, Tooling, Consumables)",
                "Action buttons: '+ Add Vendor', 'View Details', 'Export List'",
                "Modal Form Fields: Vendor Code, Name, MSME Registration, GSTIN, Bank Account No, IFSC, Credit Period, Payment Terms"
            ],
            "demo_steps": [
                "1. Click 'Suppliers (Vendors)' in sidebar.",
                "2. Show the 10 registered steel suppliers (Tata Steel, JSW Steel, POSCO, etc.).",
                "3. Open 'Tata Steel Limited' profile.",
                "4. Highlight the MSME classification, GSTIN, bank payout details, and standard supply lead time.",
                "5. Explain how this vendor record connects to Purchase Orders, GRNs, and Accounts Payable bills."
            ],
            "script": "Now, namma Suppliers (Vendors) master screen paakkirom. Inga namma raw material suppliers like Tata Steel, JSW, and tooling vendors maintain panrom. Vendor code, legal address, GSTIN, MSME category, and bank details inga enter panrom. Indha details base panni dhaan Purchase Order and payment vouchers auto-populate aagum. Vendor lead time define panna, MRP system delivery date calculate panna idhu help pannum.",
            "example": "Tata Steel Limited-ku VND-TATA-STL nu master create panrom. Supplier lead time 14 days nu set panrom. MRP system-la coil shortage detect aana, system automatically 14 days lead time calculate panni PO date suggest pannidum.",
            "admin_benefit": "Ensures vendor regulatory compliance (MSME 45-day payment rules) and accurate direct bank NEFT/RTGS payouts.",
            "advantages": [
                "Complete statutory profile including MSME and GST compliance",
                "Vendor lead time parameter automates procurement schedule calculation",
                "Verified bank details eliminate payout errors during bill settlement"
            ],
            "transition": "Suppliers paathuttom. Ippo namma press shop-la manufacture panra finished parts master aana Products We Make screen-ku move aavom."
        },
        {
            "num": "3.3",
            "title": "Products We Make",
            "route": "/master/product",
            "intro": "Products We Make screen finished stamped parts, welded sub-assemblies, and customer drawing numbers master repository. HSN codes, drawing revisions, and selling prices inga maintain aagum.",
            "problem": "Part number confusion and wrong revision production prevent panna standardized product master thevai.",
            "users": "Engineering Head, Sales Executive, Production Planner.",
            "visible": [
                "Products Catalog Table: Part Code (PRD-LCA-01), Part Name (Lower Control Arm Bracket), Customer Part No (TVS-LCA-9021), Drawing Rev (Rev C), HSN Code (87082900), Unit Selling Price (₹245.00), UOM (NOS)",
                "Search by part code or customer drawing number",
                "Action buttons: '+ Add Product', 'Edit Part', 'View BOM Link'",
                "Modal Form Fields: Internal Part No, Customer Part No, Drawing No, Revision Level, Net Weight (Kg), HSN Code, Standard Selling Price"
            ],
            "demo_steps": [
                "1. Click 'Products We Make' in sidebar.",
                "2. Show the catalog of 15 stamped automotive components.",
                "3. Open 'PRD-LCA-01' (Lower Control Arm Bracket).",
                "4. Highlight the Customer Part No (TVS-LCA-9021), Drawing Rev level (Rev C), Net Weight (0.85 Kg), and HSN code (87082900).",
                "5. Explain how this finished part connects to BOMs, Sales Orders, and Work Orders."
            ],
            "script": "Now, namma Products We Make screen-la irukkom. Namma Hosur press shop-la manufacture panra finished automotive components (like Lower Control Arm Bracket, Brake Pedal Assembly) inga define aagudhu. Internal part number, customer drawing number, drawing revision level, and HSN code inga store aagum. Stamping industry-la drawing revision control romba critical — customer drawing change panna, revision level inga update aagum.",
            "example": "TVS-ku supply panra Lower Control Arm Bracket (PRD-LCA-01) drawing rev C-la irukku. HSN code 87082900, selling price ₹245.00. Indha part number select panna, sales order, production work order and dispatch challan ellaathulayum drawing rev automatic-ah link aagidum.",
            "admin_benefit": "Guarantees zero drawing mismatch between customer requirements and shop floor production.",
            "advantages": [
                "Rigorous drawing revision tracking complies with IATF 16949 standards",
                "Customer part number cross-referencing eliminates dispatch labeling errors",
                "Standard HSN codes ensure accurate GST tax calculation across all invoices"
            ],
            "transition": "Finished products paathuttom. Ippo idhuku thevaiyaana Raw Materials (steel coils and blanks) master-ku move aavom."
        },
        {
            "num": "3.4",
            "title": "Raw Materials",
            "route": "/master/material",
            "intro": "Raw Materials screen steel coils (CRCA, HR, EDD), strip blanks, hardware and stamping lubricants master repository. Thickness, grade, coil width, and purchase prices inga maintain aagum.",
            "problem": "Steel coil specifications miss aagi wrong material stamping press-la feed aavatha thadukka idhu thevai.",
            "users": "Purchase Officer, Store Keeper, Quality Inspector.",
            "visible": [
                "Raw Materials Table: Material Code (MAT-CRCA-1.2), Name (CRCA Steel Coil 1.2mm x 250mm), Material Grade (IS 513 CR2), Thickness (1.20 mm), Width (250 mm), UOM (KGS / MT), Standard Cost (₹52.00/Kg), Min Stock Buffer",
                "Search and Grade filter (CRCA, HR, EDD, Hardware)",
                "Action buttons: '+ Add Material', 'Edit Specs', 'Export'",
                "Modal Form Fields: Code, Description, Grade, Thickness, Width, Density, Base UOM, Safety Stock Buffer, Default Storage Warehouse"
            ],
            "demo_steps": [
                "1. Click 'Raw Materials' in sidebar.",
                "2. Show the list of 10 standard steel raw materials.",
                "3. Open 'MAT-CRCA-1.2' (CRCA Steel Coil 1.2mm).",
                "4. Highlight the technical specs: IS 513 Grade CR2, 1.20mm thickness, 250mm slit width, and default unit in Kgs.",
                "5. Show how this raw material is linked to BOM consumption and purchase orders."
            ],
            "script": "Now, namma Raw Materials master screen paakkirom. Stamping business-oda core input raw steel coils dhaan. Inga CRCA coils, Hot Rolled (HR) coils, Extra Deep Drawing (EDD) sheets, and hardware items maintain panrom. Steel grade (IS 513), thickness in mm, slit width, and minimum safety stock buffer inga define aagum. Indha material code base panni dhaan supplier PO, warehouse GRN and press shop issue transactions nadakkum.",
            "example": "PRD-LCA-01 bracket stamp panna MAT-CRCA-1.2 (1.2mm thickness CRCA coil) thevai. Minimum safety buffer 5,000 Kg nu set panrom. Stock 5,000 Kg kulla pochu na, system automatically shortage alert trigger pannidum.",
            "admin_benefit": "Guarantees technical steel grade integrity and automates stock replenishment buffers.",
            "advantages": [
                "Precise dimensional parameters (thickness, width, density) prevent tooling damage",
                "Safety stock buffers prevent unexpected factory shutdowns",
                "Standard purchase costing enables accurate material price variance tracking"
            ],
            "transition": "Raw materials paathuttom. Ippo idhula use aagura Units of Measure and conversion rules master-ku move aavom."
        },
        {
            "num": "3.5",
            "title": "Units of Measure",
            "route": "/master/uom",
            "intro": "Units of Measure (UOM) screen units (NOS, KGS, MT, MTR, SET) and mathematical conversion ratios master repository.",
            "problem": "Supplier Metric Tonnes (MT)-la supply panra coils, factory-la Kgs-la issue aagi, customer-ku Pieces (NOS)-la dispatch aagum podhu conversion mismatch prevent panna idhu thevai.",
            "users": "Engineering Head, Store Keeper, Accounts Executive.",
            "visible": [
                "UOM Directory Table: UOM Code (NOS, KGS, MT, MTR, SET), Display Name, Decimal Precision Allowed, Standard Conversion Factor",
                "Conversion Matrix: 1 MT = 1,000 KGS; 1 Box = 50 NOS; 1 Coil = 2,500 KGS",
                "Action buttons: '+ Add UOM', 'Edit Conversions'"
            ],
            "demo_steps": [
                "1. Click 'Units of Measure' in sidebar.",
                "2. Show standard UOM entries: NOS, KGS, MT, MTR.",
                "3. Highlight the conversion rule: 1 MT = 1,000 KGS.",
                "4. Explain how purchasing can buy in MT while production consumes in KGS seamlessly."
            ],
            "script": "Now, namma Units of Measure (UOM) master screen-la irukkom. Manufacturing-la units conversion romba essential. Tata Steel kitta namma coils Metric Tonnes (MT)-la vangina kooda, press shop-la blanks Kgs-la issue panrom, and finished bracket customer-ku Numbers (NOS)-la dispatch panrom. Inga define panra conversion rules nala, system decimal precision and unit conversion calculations-ai automatically 100% accurate-ah handle pannikidum.",
            "example": "Supplier invoice-la 12.5 MT steel coil vandhalum, system stores-la 12,500 KGS stock entry potudum, zero manual calculation errors.",
            "admin_benefit": "Eliminates unit calculation errors and inventory balance discrepancies.",
            "advantages": [
                "Standardized conversions between weight, count, and packaging units",
                "Decimal precision controls maintain precision up to 3 decimal places",
                "GST statutory compliance for prescribed UOM reporting"
            ],
            "transition": "UOM paathuttom. Ippo indha items store aagura physical warehouse and bin locations master-ku move aavom."
        },
        {
            "num": "3.6",
            "title": "Stores & Warehouses",
            "route": "/master/warehouse",
            "intro": "Stores & Warehouses screen plant storage facilities (Raw Material Yard, WIP Staging, Finished Goods Store, Scrap Yard) and bin locations master repository.",
            "problem": "Stock physical location theriyama search panra time waste-ai thadukka warehouse segregation thevai.",
            "users": "Store Keeper, Logistics In-charge, Plant Manager.",
            "visible": [
                "Warehouse Directory: Code (WH-RM), Name (Raw Material Coil Yard), Plant (LBAP-HOSUR), Storage Type (Raw Steel), Total Bins (12), Active Status",
                "Warehouse Cards: WH-RM (Raw Material), WH-WIP (Press Floor WIP), WH-FG (Finished Goods Pallet Bay), WH-SCRAP (Metal Offcut Yard)",
                "Bin Locations Table: Bin ID (BIN-RM-A01), Rack, Row, Shelf, Capacity",
                "Action buttons: '+ Add Warehouse', '+ Add Bin', 'View Stock on Hand'"
            ],
            "demo_steps": [
                "1. Click 'Stores & Warehouses' in sidebar.",
                "2. Show the 4 segregated plant warehouses (WH-RM, WH-WIP, WH-FG, WH-SCRAP).",
                "3. Open 'WH-RM' (Raw Material Yard).",
                "4. Highlight the specific bin locations (BIN-RM-A01 to A12) reserved for heavy steel coils.",
                "5. Show how inventory is quarantined or separated between raw, in-process, and finished goods."
            ],
            "script": "Now, namma Stores & Warehouses screen paakkirom. Inga namma Hosur plant-oda 4 main physical storage zones define panrom: Raw Material Coil Yard (WH-RM), Press Shop WIP Staging (WH-WIP), Finished Goods Pallet Bay (WH-FG), and Scrap Yard (WH-SCRAP). Ovvoru warehouse kulla specific Rack and Bin locations define pannalaam. Goods inward aana udane entha bin-la coil unload aaganum nu exact location trace pannalaam.",
            "example": "Tata Steel coil unload aagum podhu 'WH-RM / BIN-RM-A03' nu tag panrom. Forklift operator-ku system direct-ah bin location kaattum, coil search panna time waste aagadhu.",
            "admin_benefit": "Enforces strict physical and accounting segregation between raw coils, in-process parts, and finished assemblies.",
            "advantages": [
                "Bin-level tracking accelerates material picking and inventory counting",
                "Segregated scrap warehouse ensures 100% metal recycling realization",
                "Prevents mixed-up batches and accidental use of quarantined stock"
            ],
            "transition": "Warehouses paathuttom. Ippo factory press floor-la irukkura mechanical and hydraulic presses master-ku move aavom."
        },
        {
            "num": "3.7",
            "title": "Machines",
            "route": "/master/machine",
            "intro": "Machines screen stamping presses, welding robots, and decoiler feeders master repository. Tonnage, stroke speed, operating cost per hour, and maintenance link inga maintain aagum.",
            "problem": "Machine capacity, breakdown history, and hourly stamping cost track panna machine master thevai.",
            "users": "Production Head, Maintenance Engineer, Cost Accountant.",
            "visible": [
                "Machines Catalog: Machine Code (MCH-PR-250T), Machine Name (250 Ton Mechanical Stamping Press), Type (Mechanical Press), Plant, Rated Strokes/Min (35 SPM), Hourly Cost Rate (₹650.00/Hr), Status (Operational)",
                "Filter by Press Type (Mechanical, Hydraulic, Welding, Decoiler)",
                "Action buttons: '+ Add Machine', 'View Maintenance Log', 'Edit Specs'",
                "Modal Form Fields: Code, Name, Tonnage, Stroke Speed (SPM), Bed Size (L x W), Motor Power (HP), Hourly Operating Cost, Serial No"
            ],
            "demo_steps": [
                "1. Click 'Machines' in sidebar.",
                "2. Show the list of 10 stamping presses and machines.",
                "3. Open 'MCH-PR-250T' (250T Mechanical Press).",
                "4. Highlight the technical parameters: 250 Ton Tonnage, 35 Strokes per Minute, Bed Size 1500x1200mm, Hourly Cost Rate ₹650/Hr.",
                "5. Show how this machine is mapped to operations in Routing and Work Orders."
            ],
            "script": "Now, namma Machines master screen-la irukkom. Inga namma press shop-oda mechanical presses (50T to 500T), hydraulic deep drawing presses, and robotic welding cells define aagudhu. Press tonnage capacity, strokes per minute (SPM), bed dimensions, and machine hourly operating cost inga enter panrom. Indha machine rate dhaan engineering costing and product quotation-ku hourly press cost calculate panna use aagudhu.",
            "example": "MCH-PR-250T mechanical press 35 strokes/minute capacity and ₹650/hour operating rate. Oru bracket 500 pieces stamp panna 2.5 hours aagudhu na, system ₹1,625 machine overhead automatically calculate pannidum.",
            "admin_benefit": "Accurate machine capacity utilization tracking and machine-hour rate cost accounting.",
            "advantages": [
                "Complete machine technical profile prevents die-to-press mismatch",
                "Hourly machine rates automate precise stamping cost calculations",
                "Direct linkage to maintenance history and breakdown downtime logs"
            ],
            "transition": "Individual machines paathuttom. Ippo indha machines-ai combine panni form panra Work Centres master-ku move aavom."
        },
        {
            "num": "3.8",
            "title": "Work Centres",
            "route": "/master/workcenter",
            "intro": "Work Centres screen machine groupings (Heavy Stamping Line, Blanking Line, Sub-Assembly Cell) and shift capacity master repository.",
            "problem": "Capacity planning and load balancing machine group level-la calculate panna work centre grouping thevai.",
            "users": "Production Planner, Industrial Engineer, Plant Head.",
            "visible": [
                "Work Centres Directory: Code (WC-PRESS-HVY), Name (Heavy Stamping Press Line 1), Plant (LBAP-HOSUR), Machines Assigned (3 Presses), Daily Operating Hours (16 Hrs across 2 Shifts), Efficiency Rating (90%)",
                "Capacity summary cards: Total Available Plant Hours vs Planned Hours",
                "Action buttons: '+ Add Work Centre', 'Edit Capacity', 'View Line Load'"
            ],
            "demo_steps": [
                "1. Click 'Work Centres' in sidebar.",
                "2. Show the 4 functional work centres (Heavy Stamping, Light Blanking, Welding, Assembly).",
                "3. Open 'WC-PRESS-HVY' (Heavy Press Line 1).",
                "4. Highlight the 3 linked presses, 16 daily operating hours (2 shifts x 8 hours), and 90% planned efficiency rating.",
                "5. Show how this work centre is selected in Routing operations and Capacity Planning."
            ],
            "script": "Now, namma Work Centres screen paakkirom. Inga namma individual machines-ai functional lines-ah group panrom — like Heavy Stamping Press Line 1, Blanking Line, and Robotic Welding Cell. Daily shifts (Shift A + Shift B = 16 hours) and line efficiency percentage inga define aagudhu. Capacity planning module indha work centre hours-ai check panni dhaan production schedule load balance pannum.",
            "example": "Heavy Press Line 1-la daily 16 hours available capacity irukku. Namma 3 work orders total 14 hours plan panna, 87.5% capacity utilization-la smooth-ah run aagum nu system predict pannum.",
            "admin_benefit": "Prevents shop floor overloading and enables accurate lead-time forecasting.",
            "advantages": [
                "Simplifies capacity scheduling by grouping interchangeable presses",
                "Efficiency factors account for real-world die changeover and setup times",
                "Direct integration with MRP and dispatch delivery promise dates"
            ],
            "transition": "Work centres paathuttom. Ippo ERP-oda global numbering series and plant parameters aana System Settings screen-ku move aavom."
        },
        {
            "num": "3.9",
            "title": "System Settings",
            "route": "/master/system-config",
            "intro": "System Settings screen document numbering sequences (SO-2026-, PO-2026-, WO-2026-), base currency (INR), financial year lock dates and global defaults master repository.",
            "problem": "Manual document numbering errors and accidental modifications to closed financial years prevent panna idhu thevai.",
            "users": "Super Admin, Finance Controller, IT Admin.",
            "visible": [
                "Document Prefix Numbering Series Table: Sales Orders (SO-2026-0001), Purchase Orders (PO-2026-0001), Work Orders (WO-2026-0001), GRN (GRN-2026-0001), Tax Invoices (INV-2026-0001)",
                "Financial Year Settings: Current Fiscal Year (2026-2027), Lock Date (prevents editing transactions before date)",
                "System Parameters: Base Currency (INR ₹), Tax Display (GST CGST/SGST/IGST), Auto-Email Triggers",
                "Action buttons: 'Save Configuration', 'Reset Defaults'"
            ],
            "demo_steps": [
                "1. Click 'System Settings' in sidebar.",
                "2. Show the Prefix Series table: SO-2026-, PO-2026-, WO-2026-, GRN-2026-.",
                "3. Explain how document numbers auto-increment automatically upon saving.",
                "4. Highlight the Financial Year Lock Date preventing backdated voucher editing.",
                "5. Show the Base Currency (INR) and GST tax engine defaults."
            ],
            "script": "Now, namma System Settings screen-la irukkom. Idhu ERP-oda global configuration hub. Inga automated document numbering series configure aagudhu — Sales Order SO-2026-, Purchase Order PO-2026-, Work Order WO-2026- nu auto-increment aagum. Financial Year lock date set panna, audit mudincha backdated records-ai yaarum alter panna mudiyaadhu. System currency INR and standard GST tax rates inga centrally control aagudhu.",
            "example": "Puthu financial year vandhum prefix SO-2026-0001 nu reset pannalaam. Duplicate invoice numbers-o missing numbers-o create aagaadha maadhiri system strict sequence enforce pannum.",
            "admin_benefit": "Guarantees flawless audit numbering integrity and statutory fiscal year compliance.",
            "advantages": [
                "Eliminates duplicate or skipped document numbers across all modules",
                "Financial year lock protects closed accounts from unauthorized tampering",
                "Centralized tax defaults ensure uniform GST calculation plant-wide"
            ],
            "transition": "Master Data 9 sub-screens complete-ah paathuttom. Ippo product design and manufacturing process define panra Engineering module-ku move aavom."
        }
    ],
    "engineering": [
        {
            "num": "4.1",
            "title": "Parts Lists (BOM)",
            "route": "/engineering/bom",
            "intro": "Parts Lists (BOM) screen finished stamped component-ku thevaiyaana raw steel coil, blank strip dimensions, scrap allowance, and secondary hardware define panra Bill of Materials repository.",
            "problem": "Wrong raw material consumption and incorrect coil weight estimation eliminate panna engineering BOM thevai.",
            "users": "Engineering Manager, Tool Designer, Costing Engineer.",
            "visible": [
                "BOM Catalog Table: BOM ID (BOM-LCA-01), Finished Product (PRD-LCA-01 Lower Control Arm Bracket), Revision (Rev B), Status (Active), Raw Material (MAT-CRCA-1.2), Gross Weight (1.05 Kg), Net Weight (0.85 Kg), Scrap Weight (0.20 Kg), Recovery Credit (₹3.60)",
                "Search by product code or BOM ID",
                "Action buttons: '+ Create BOM', 'Clone BOM', 'View Explosion'",
                "BOM Details Drawer: Parent part, Child components table, strip pitch (mm), strip width (mm), number of blanks per stroke"
            ],
            "demo_steps": [
                "1. Click 'Engineering' section and open 'Parts Lists (BOM)'.",
                "2. Show the active list of 9 automotive product BOMs.",
                "3. Open 'BOM-LCA-01' (Lower Control Arm Bracket).",
                "4. Highlight the engineering precision: Gross Blank Weight 1.05 Kg, Net Finished Weight 0.85 Kg, Engineered Offcut Scrap 0.20 Kg.",
                "5. Show how MRP uses this BOM to explode raw steel coil requirements for production."
            ],
            "script": "Now, namma Engineering-la Parts Lists (BOM) screen paakkirom. Automotive press shop-la BOM calculation romba precise-ah irukkanum. Oru finished bracket manufacture panna Gross Blank Weight evlo (1.05 Kg), Net Part Weight evlo (0.85 Kg), and offcut scrap weight evlo (0.20 Kg) nu define panrom. Indha BOM base panni dhaan MRP system exact raw steel coil kilograms calculate pannum and product costing accurately derive aagum.",
            "example": "TVS Lower Control Arm Bracket 10,000 pieces stamp panna Gross Weight 1.05 Kg pottu total 10,500 Kg CRCA coil thevai nu system instant-ah calculate pannidum. 2,000 Kg scrap recovery credit-um automatic-ah account aagidum.",
            "admin_benefit": "Eliminates material estimation guesswork and drives precise procurement and costing.",
            "advantages": [
                "Engineered gross vs net weight tracking captures true scrap metal credit",
                "Revision-controlled BOMs ensure production always uses approved drawing revisions",
                "Powers automated multi-level MRP explosion without manual spreadsheets"
            ],
            "transition": "BOM paathuttom. Aana indha part-ai entha press operations-la step-by-step manufacture panrom nu Process Steps (Routing) screen-la paapom."
        },
        {
            "num": "4.2",
            "title": "Process Steps (Routing)",
            "route": "/engineering/routing",
            "intro": "Process Steps (Routing) screen manufacturing operations sequence (Decoiling, Blanking, Drawing, Piercing, Trimming, Welding, Inspection) and cycle times define panra master repository.",
            "problem": "Operation sequencing miss aagi wrong press-la die set aavatha thadukka routing master thevai.",
            "users": "Process Engineer, Production Planner, Tool Room Head.",
            "visible": [
                "Routing Catalog: Routing ID (RTG-LCA-01), Product (PRD-LCA-01), Revision (Rev A), Total Operations (5 Steps), Total Standard Cycle Time (1.42 Mins)",
                "Operations Sequence Table: Op 10 (Decoiling & Blanking on MCH-DEC-01), Op 20 (Deep Draw on MCH-PR-250T), Op 30 (Piercing & Trimming on MCH-PR-160T), Op 40 (Deburring on MCH-DEB-01), Op 50 (Final QA & Packing)",
                "Action buttons: '+ New Routing', 'Edit Operations', 'Calculate Lead Time'"
            ],
            "demo_steps": [
                "1. Click 'Process Steps (Routing)' in sidebar.",
                "2. Show the list of 6 approved routings.",
                "3. Open 'RTG-LCA-01' (Routing for Lower Control Arm Bracket).",
                "4. Highlight the 5 sequential operations with specific machine assignments, die setup time, and run cycle time per piece.",
                "5. Show how Work Orders automatically import this sequence as job card operations."
            ],
            "script": "Now, namma Process Steps (Routing) screen-la irukkom. Stamping production single stroke-la mudiyadhu — continuous sequence of operations thevai: Op 10 Decoiling, Op 20 Deep Drawing on 250T press, Op 30 Piercing & Trimming, Op 40 Deburring, and Op 50 Inspection. Ovvoru operation-kum entha machine, die setup time evlo, and cycle time per part evlo seconds nu inga define panrom. Indha routing dhaan shop floor job card-ku steps provide pannum.",
            "example": "Op 20 Deep Drawing 250T press-la 1.8 seconds per stroke cycle time set panrom. Work order 5,000 pieces create aana, system 2.5 hours press run time accurately schedule pannidum.",
            "admin_benefit": "Standardizes shop floor manufacturing methods and provides baseline cycle times for OEE tracking.",
            "advantages": [
                "Guarantees standard manufacturing practice across all shifts",
                "Accurate setup and run times automate production scheduling",
                "Direct linkage to machine-hour costing and labor capacity planning"
            ],
            "transition": "Routing paathuttom. Ippo customer drawing revision change pannum podhu adha control panra Design Change Requests (ECM) screen-ku move aavom."
        },
        {
            "num": "4.3",
            "title": "Design Change Requests",
            "route": "/engineering/change",
            "intro": "Design Change Requests (ECM / ECR) screen customer drawing revisions, tool modification requirements, scrap risk assessment and effective cutoff dates govern panra change management repository.",
            "problem": "Drawing revision change aana aparam old parts stamp panni customer rejection and scrap loss aavatha 100% prevent panna idhu thevai.",
            "users": "Engineering Head, Quality Head, Tool Room Manager, Super Admin.",
            "visible": [
                "Change Request Table: ECR No (ECR-2026-004), Part (PRD-LCA-01), Title (Hole Diameter Modification from 12mm to 14mm), Customer Ref (TVS-ECN-441), Status (Under Review / Approved), Cutoff Date, Tool Mod Cost",
                "Action buttons: '+ New Change Request', 'Review ECR', 'Sign-off ECO'",
                "ECR Details Modal: Reason for change, Impact on WIP stock, Tooling die modification plan, Multi-department sign-off status"
            ],
            "demo_steps": [
                "1. Click 'Design Change Requests' in sidebar.",
                "2. Show the list of 6 engineering change records.",
                "3. Open 'ECR-2026-004' (TVS Hole Diameter modification).",
                "4. Highlight the impact assessment: Tool die modification required, existing WIP 500 parts can be reworked, cutoff date next month.",
                "5. Show the multi-department sign-off status required before BOM rev advances to Rev C."
            ],
            "script": "Now, namma Design Change Requests (ECM) screen paakkirom. Automotive industry-la IATF 16949 audit-ku Engineering Change Management mandatory requirement. Customer drawing-la hole diameter 12mm-la irundhu 14mm change panraanga na, direct-ah press-la change panna koodadhu. Inga formal ECR raise panni, existing tool modification cost, existing WIP parts scrap risk, and effective cutoff date evaluate panni, Super Admin approve panna dhaan BOM and production update aagum.",
            "example": "TVS ECN issue pannudhu. ECR-2026-004 pottu tool room die-la punch modify panna ₹18,000 estimate panrom. Approved aana aparam system automatically old BOM Rev B lock panni, new BOM Rev C activate pannidum.",
            "admin_benefit": "Zero accidental production of obsolete drawing revisions and full compliance with IATF 16949 standards.",
            "advantages": [
                "Strict audit trail of customer drawing revisions and engineering sign-offs",
                "Evaluates WIP stock risk before approving design modifications",
                "Synchronizes tool room die modifications with production changeover dates"
            ],
            "transition": "Engineering controls complete-ah paathuttom. Ippo customer kitta irundhu commercial orders receive panra Sales module-ku move aavom."
        }
    ],
    "sales": [
        {
            "num": "5.1",
            "title": "Customer Inquiries",
            "route": "/sales/inquiry",
            "intro": "Customer Inquiries screen inbound customer RFQs, new part development requests, technical drawing uploads, and feasibility sign-offs manage panra central commercial register.",
            "problem": "Customer inquiries emails and WhatsApp-la miss aagi quotation delayed aavatha thadukka central register thevai.",
            "users": "Sales Executive, Commercial Head, Tooling Estimator.",
            "visible": [
                "Inquiries Directory: Inquiry ID (INQ-2026-012), Customer (Ashok Leyland Ltd), Part Name (Heavy Chassis Gusset), Target Annual Volume (1,20,000 Nos), Target Price (₹180.00), Status (Feasible / Under Estimation), Inquiry Date",
                "Search and Status filter",
                "Action buttons: '+ New Inquiry', 'Feasibility Review', 'Convert to Quotation' (blue launch button)",
                "Modal Form Fields: Customer, Inquiry Ref, Drawing File Upload, Annual Volume, Delivery Location, Feasibility Status"
            ],
            "demo_steps": [
                "1. Click 'Sales' in sidebar and open 'Customer Inquiries'.",
                "2. Show the list of 14 active inquiries from Ashok Leyland, TVS, and Tata Motors.",
                "3. Open 'INQ-2026-012' (Ashok Leyland Chassis Gusset).",
                "4. Highlight the uploaded customer 2D drawing attachment, target volume (1.2L pieces), and Technical Feasibility sign-off: 'Feasible'.",
                "5. Point to the 'Convert to Quotation' button which pushes this data directly into the pricing builder."
            ],
            "script": "Now, namma Sales-la Customer Inquiries screen paakkirom. OEM customers puthu part develop panna solli RFQ anuppum podhu, first inga inquiry register panrom. Customer drawing upload panni, annual volume (1,20,000 pieces), target delivery date, and technical feasibility evaluate panrom — namma kitta 250T press irukka, tool develop panna mudiyuma nu feasibility 'Yes' aana udane, single click-la 'Convert to Quotation' click panni cost estimation-ku transfer pannalaam.",
            "example": "Ashok Leyland email-la RFQ anuppudhu. Sales team INQ-2026-012 register panni drawing attach panraanga. Feasibility team evaluate panni 'Feasible' sign-off kudukuraanga, immediate-ah quotation screen-ku transfer aagudhu.",
            "admin_benefit": "Tracks sales enquiry response time and ensures 100% technical feasibility before quoting prices.",
            "advantages": [
                "Central repository for all customer RFQs and technical drawing revisions",
                "Mandatory technical feasibility gate prevents unviable manufacturing commitments",
                "One-click conversion into quotation eliminates manual re-typing"
            ],
            "transition": "Inquiries paathuttom. Ippo precision sheet-metal cost estimation and price proposal build panra Quotations screen-ku move aavom."
        },
        {
            "num": "5.2",
            "title": "Quotations",
            "route": "/sales/quotation",
            "intro": "Quotations screen sheet-metal cost estimation (steel blank weight, press hourly rate, plating, tool amortization, scrap recovery) and commercial PDF proposal generation engine.",
            "problem": "Accurate cost estimation illama under-quote panni loss aavadho illa over-quote panni order miss aavadho thadukka idhu thevai.",
            "users": "Commercial Head, Costing Engineer, Super Admin.",
            "visible": [
                "Quotations Register: Quote No (QT-2026-009), Customer (TVS Motor Company), Revision (Rev 1), Stamped Part, Total Quoted Price (₹245.00/pc), Net Margin (16.5%), Status (Sent / Approved), Valid Until",
                "Cost Breakdown Grid: Raw Material Cost (₹142.50), Stamping Press Cost (₹38.20), Secondary Plating (₹22.00), Tooling Amortization (₹15.00), Scrap Recovery Credit (-₹8.70), Overhead & Margin (₹36.00)",
                "Action buttons: '+ New Quotation', 'Download PDF Proposal', 'Convert to Sales Order' (green button)"
            ],
            "demo_steps": [
                "1. Click 'Quotations' in sidebar.",
                "2. Show the list of 9 structured quotations.",
                "3. Open 'QT-2026-009' (TVS Lower Control Arm Bracket).",
                "4. Highlight the cost breakdown sheet: Raw material coil cost, stamping press hourly rate, tool amortization, minus scrap credit, plus profit margin.",
                "5. Show the 'Download PDF Proposal' button that produces a professional branded proposal letter.",
                "6. Point to the 'Convert to Sales Order' button activated once the customer releases PO."
            ],
            "script": "Now, namma Quotations screen-la irukkom. Stamping industry-la quoting is an engineering science. Inga namma raw material blank gross weight, press tonnage hourly cost, secondary zinc plating, and tooling amortization ellame scientific-ah calculate panrom. Stamping offcut scrap credit-ai deduce panni, accurate unit cost ₹245.00 arrive panrom. Professional PDF proposal generate panni client-ku anuppalaam. Customer PO release panna udane, 'Convert to Sales Order' click panni direct-ah confirm pannikalam.",
            "example": "TVS-ku quote panrom. Raw coil cost ₹142.50, press operations ₹38.20, minus scrap metal credit ₹8.70, margin 16.5% pottu ₹245.00 per piece quote panrom. Customer approve panniyachu, order-ah convert panrom.",
            "admin_benefit": "Guarantees profitable gross margins and complete visibility into sheet metal component costing.",
            "advantages": [
                "Rigorous multi-element cost estimation protects operating margins",
                "Automated scrap credit realization provides competitive pricing edge",
                "One-click conversion to confirmed Sales Order saves administrative time"
            ],
            "transition": "Quotations paathuttom. Ippo customer PO confirm aana udane delivery schedule manage panra Sales Orders screen-ku move aavom."
        },
        {
            "num": "5.3",
            "title": "Sales Orders",
            "route": "/sales/order",
            "intro": "Sales Orders screen confirmed customer purchase orders, line items, multi-date JIT delivery schedules, and real-time finished goods warehouse stock allocation repository.",
            "problem": "Automotive OEM JIT weekly delivery commitments track panna and stock reserve panna sales order scheduling thevai.",
            "users": "Sales Executive, Dispatch Coordinator, Planning Head.",
            "visible": [
                "Sales Orders Table: SO No (SO-2026-001), Customer PO No (TVS-PO-8821), Customer (TVS Motor Company), Order Value (₹24,50,000), Status (Confirmed / In Production), Order Date, Due Date",
                "Order Lines Drill-Down: Part Code, Ordered Qty (10,000 Nos), Unit Price (₹245.00), GST (18%), Line Total",
                "Multi-Date Delivery Schedules Tab: Schedule 1 (2,500 pcs on 15-Oct), Schedule 2 (2,500 pcs on 22-Oct), Schedule 3 (2,500 pcs on 29-Oct), Schedule 4 (2,500 pcs on 05-Nov)",
                "Batch Allocation Tab: Available WH-FG stock, Allocated Qty, Batch Lot Nos locked",
                "Action buttons: '+ New Order', 'Add Schedule', 'Allocate Stock', 'Confirm Order'"
            ],
            "demo_steps": [
                "1. Click 'Sales Orders' in sidebar.",
                "2. Show the active list of 11 sales orders totaling over ₹1.2 Crores.",
                "3. Open 'SO-2026-001' (TVS Motor Company).",
                "4. Highlight the Customer PO Number (TVS-PO-8821) and line items.",
                "5. Open the 'Delivery Schedules' tab: Show how a 10,000-piece order is broken into 4 weekly JIT delivery schedules of 2,500 pieces each.",
                "6. Open 'Batch Allocation' tab: Show how finished goods stock from WH-FG is reserved specifically for this customer order.",
                "7. Explain how confirming this order automatically triggers demand in MRP."
            ],
            "script": "Now, namma Sales Orders screen paakkirom. Customer formal Purchase Order kudutha udane inga SO create panrom. Inga order lines, pricing, and GST tax calculate aagudhu. Automotive-la romba mukkiyamaana feature 'Multi-Date Delivery Schedules' — customer 10,000 pieces bulk-ah kekkamaataanga, weekly 2,500 pieces JIT delivery kepaanga. Inga namma weekly schedules set pannalaam. Koodave warehouse-la ready-ah irukkura finished stock-ai indha order-ku 'Batch Allocation' panni reserve pannalaam. Order confirm aana udane MRP system-ku net demand trigger aagidum.",
            "example": "TVS PO-8821 for 10,000 Lower Control Arm Brackets. Warehouse-la ready-ah 3,000 pieces irukku. 2,500 pieces Schedule 1-ku reserve panrom, balance 7,500 pieces-ku production work orders plan panna demand release aagudhu.",
            "admin_benefit": "Guarantees 100% on-time OEM delivery schedule adherence and prevents double-commitment of finished goods stock.",
            "advantages": [
                "Multi-date delivery scheduling matches automotive OEM JIT requirements",
                "Physical batch allocation locks inventory exclusively for confirmed orders",
                "Seamless demand handoff to MRP and production planning engines"
            ],
            "transition": "Sales Orders confirm panniyachu. Ippo customer rolling forecasts and demand consolidation analyze panna Demand Planning module-ku move aavom."
        }
    ]
}

print("Part 2 data prepared successfully.")
