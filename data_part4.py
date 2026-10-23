# -*- coding: utf-8 -*-
"""
Data Part 4: Quality, Maintenance, Dispatch, Finance, Audit, End-to-End Flow, Q&A, Final Checklist
"""

PART_4_DATA = {
    "quality": [
        {
            "num": "14.1",
            "title": "Incoming Material Checks",
            "route": "/quality/incoming",
            "intro": "Incoming Material Checks screen chemical and physical testing logs for incoming raw coils against Mill Test Certificates (MTC).",
            "problem": "Coil hardness, tensile strength and thickness variations press tool-ai damage pannama irukka lab verification thevai.",
            "users": "Incoming Quality Inspector, Metallurgist, Quality Manager.",
            "visible": [
                "Incoming Inspection Table: Inspection ID (IQC-2026-011), Supplier (Tata Steel), Material (CRCA Coil 1.2mm), Heat No (HEAT-88214), Sample Size, Thickness (1.21 mm vs 1.20±0.03mm), Hardness (52 HRB vs 50-55), Tensile Strength (310 MPa), MTC Verified (Yes), Status (Accepted)",
                "Action buttons: 'Log Test Results', 'Attach Lab Certificate', 'Approve Heat Lot'"
            ],
            "demo_steps": [
                "1. Click 'Quality' section and open 'Incoming Material Checks'.",
                "2. Show the register of 11 incoming quality inspection reports.",
                "3. Open 'IQC-2026-011' for Tata Steel coil HEAT-88214.",
                "4. Highlight the metallurgic test values: Thickness 1.21mm, Hardness 52 HRB, Tensile 310 MPa matching standard IS 513.",
                "5. Show the Mill Test Certificate (MTC) digital copy attached to the record."
            ],
            "script": "Now, namma Quality-la Incoming Material Checks screen paakkirom. Inga inward aana ovvoru raw steel coil-kum metallurgy and dimensional tests record panrom. Thickness micrometer-la 1.21mm irukka, Rockwell hardness 52 HRB irukka, and supplier kudutha Mill Test Certificate (MTC) chemistry (Carbon, Manganese, Sulphur) match aagudha nu check panrom. Pass aana dhaan coil production-ku release aagum. Idhu tool room-la multi-lakh dies break aaguradha 100% thadukkum.",
            "example": "Tata Steel HEAT-88214 tested. Hardness 52 HRB within spec. Inspector records test results and attaches MTC PDF before approving coil for blanking.",
            "admin_benefit": "Guarantees raw material metallurgic compliance and prevents catastrophic press tooling damage.",
            "advantages": [
                "Strict raw steel chemistry and hardness gating protects press dies",
                "Digital MTC archiving complies with IATF 16949 section 8.4 verification rules",
                "Defective coils are rejected before expensive blanking and stamping labor is wasted"
            ],
            "transition": "Incoming checks paathuttom. Ippo press line run aagum podhu hourly patrol checks panra In-Process Checks screen-ku move aavom."
        },
        {
            "num": "14.2",
            "title": "In-Process Checks",
            "route": "/quality/in-process",
            "intro": "In-Process Checks screen first-piece inspection sign-off and periodic hourly patrol inspections with dimensional vernier/micrometer readings.",
            "problem": "Die wear nala shift naduvula burr height increase aagi thousands of parts reject aavatha hourly patrol checks thadukkum.",
            "users": "In-Process Quality Inspector, Shift Supervisor, Die Setter.",
            "visible": [
                "In-Process Inspection Table: Inspection ID (IPQ-2026-010), Work Order (WO-2026-001), Machine (MCH-PR-250T), Check Type (First Piece / Hourly Patrol), Hour Stamp (Hour 4 of Shift A), Critical Dimensions: Flange Width (45.02 mm vs 45.00±0.10mm), Hole Pitch (120.04 mm vs 120.00±0.05mm), Burr Height (0.04 mm vs < 0.08mm Max), Verdict (Pass / Warning / Stop Press)",
                "Action buttons: '+ Log Patrol Inspection', 'Sign First Piece Tag', 'Trigger Tool Regrind'"
            ],
            "demo_steps": [
                "1. Click 'In-Process Checks' in sidebar.",
                "2. Show the list of 10 patrol inspection logs recorded during live shifts.",
                "3. Open 'IPQ-2026-010' for WO-2026-001 on MCH-PR-250T.",
                "4. Highlight the three critical dimensions checked: Flange Width (45.02mm), Hole Pitch (120.04mm), and Burr Height (0.04mm).",
                "5. Show the 'First Piece Tag' sign-off which certifies that die setting is approved before mass stamping begins."
            ],
            "script": "Now, namma In-Process Checks screen-la irukkom. Stamping production-la die change panna udane mass production panna koodadhu — First Piece Inspection mandatory. Quality inspector first piece-ai CMM or height gauge-la check panni 'First Piece Approved Tag' kudupaaru. Adhuku apram every 1 hour inspector press line-ku vandhu 5 sample pieces eduthu burr height and hole pitch measure panni log pannuvaaru. Burr height 0.08mm cross panna udane, press-ai stop panni die regrind panna alert trigger aagidum.",
            "example": "Hour 4 inspection-la burr height 0.04mm measure panrom (limit 0.08mm). Inspector 'Pass' verdict potu sign panraaru, production continues safely.",
            "admin_benefit": "Catches tooling wear and dimensional drift early, preventing mass batch scrap on the shop floor.",
            "advantages": [
                "First-piece sign-off gate guarantees die setup accuracy before volume runs",
                "Hourly patrol inspections detect die wear before parts breach drawing tolerances",
                "Real-time alerts allow timely die sharpening without stopping the entire shift"
            ],
            "transition": "In-process checks paathuttom. Ippo finished parts customer-ku dispatch aaguradhukku munnadi final inspect panra Final Inspection screen-ku move aavom."
        },
        {
            "num": "14.3",
            "title": "Final Inspection",
            "route": "/quality/final",
            "intro": "Final Inspection screen pre-dispatch quality inspection of finished stamped parts, checking visual plating/coating quality, critical dimensions, and packaging standards.",
            "problem": "Defective components customer assembly plant-ku poyi OEM line stoppage penalty aavatha dispatch gate-la 100% prevent panna idhu thevai.",
            "users": "Final Quality Inspector, QA Manager, Dispatch In-charge.",
            "visible": [
                "Final QA Inspection Table: Inspection ID (FQC-2026-009), Part Code (PRD-LCA-01), Batch Lot (LOT-FG-2026-042), Customer (TVS Motor Company), Lot Size (4,850 Nos), Sample Size Inspected (125 Nos per AQL 1.0), Critical Dimensions (Pass), Visual Check: Plating Thickness 12 microns, No Dents, Packaging Correct, Status (Certified for Dispatch / Inspection Certificate Issued)",
                "Action buttons: 'Issue Quality Certificate (COA)', 'Approve Dispatch Gate', 'Attach Inspection Photos'"
            ],
            "demo_steps": [
                "1. Click 'Final Inspection' in sidebar.",
                "2. Show the register of 9 pre-dispatch final inspection records.",
                "3. Open 'FQC-2026-009' for finished batch LOT-FG-2026-042.",
                "4. Highlight the sampling standard: 125 samples checked per AQL 1.0 sampling plan.",
                "5. Show the verified parameters: Critical hole diameters, zinc plating thickness 12 microns, zero transit dents, and clean corrugated packaging.",
                "6. Click 'Issue Quality Certificate (COA)' to demonstrate generation of the Certificate of Analysis sent to the OEM."
            ],
            "script": "Now, namma Final Inspection screen paakkirom. Finished goods warehouse-la ready-ah irukkura parts customer lorry-la load aaguradhukku munnadi indha final gate pass aaganum. Automotive standard AQL 1.0 sample plan padi 125 sample pieces eduthu visual coating, hole dimensions, and packaging check panrom. Pass aana aparam inspector 'Certificate of Analysis (COA)' issue pannuvaaru. Indha digital quality certificate illama dispatch department-la Delivery Challan generate panna mudiyadhu.",
            "example": "Batch LOT-FG-2026-042 for TVS passed final QA. Inspector issues COA-2026-009. Batch is now electronically unlocked for vehicle loading.",
            "admin_benefit": "Guarantees zero defective parts leave the factory gate, protecting customer OEM PPM ratings.",
            "advantages": [
                "Statistical AQL sampling plans enforce rigorous pre-shipment quality standards",
                "Automated Certificate of Analysis (COA) generation accompanies dispatches",
                "Hard electronic lock prevents dispatch of uncertified finished goods batches"
            ],
            "transition": "Final inspection certified. Ippo quality tolerances and inspection plans define panra Inspection Parameters screen-ku move aavom."
        },
        {
            "num": "14.4",
            "title": "Inspection Parameters",
            "route": "/quality/parameters",
            "intro": "Inspection Parameters screen master library of quality inspection plans, critical dimensions, tolerance limits (upper/lower specifications), and sampling standards.",
            "problem": "Inspector drawing thedi alaiyama, part select panna udane exact dimensions and tolerances auto-populate aaga idhu thevai.",
            "users": "Quality Assurance Engineer, IATF Coordinator, Engineering Head.",
            "visible": [
                "Parameters Library Table: Part Number, Operation Stage (Incoming / In-Process / Final), Parameter Name (Hole Diameter D1), Nominal Value (14.00 mm), Upper Tolerance (+0.05 mm), Lower Tolerance (-0.05 mm), Measuring Instrument (Digital Vernier Caliper / Bore Gauge), Sample Frequency (Every 1 Hour)",
                "Search and Part filter",
                "Action buttons: '+ Add Parameter', 'Import from Drawing CAD', 'Save Inspection Plan'"
            ],
            "demo_steps": [
                "1. Click 'Inspection Parameters' in sidebar.",
                "2. Show the parameters library configured for all 15 stamped products.",
                "3. Open the plan for 'PRD-LCA-01 Lower Control Arm Bracket'.",
                "4. Highlight the parameters: Nominal 14.00mm (+0.05 / -0.05mm), Flange angle 90° (±0.5°), Plating thickness (10 to 15 microns).",
                "5. Show how these parameters automatically generate the inspection checklist when an inspector opens an inspection screen."
            ],
            "script": "Now, namma Inspection Parameters screen-la irukkom. Inga namma ovvoru automotive part-kum drawing specifications and tolerances master library define panrom. Nominal dimension 14.00mm, Upper tolerance +0.05mm, Lower tolerance -0.05mm, and entha measuring instrument use pannanum nu define panrom. Inspector inspection open panna udane, indha parameters automated checklist-ah screen-la vandhudum. Inspector manual-ah drawing theda thevaiyilla, measurement enter panna udane system green (In Spec) or red (Out of Spec) nu instant-ah alert kaattum.",
            "example": "Hole D1 nominal 14.00mm (13.95 - 14.05mm). Inspector enters 14.02mm -> System automatically tags green 'In Spec'.",
            "admin_benefit": "Standardizes quality inspection criteria plant-wide and eliminates subjective human inspection errors.",
            "advantages": [
                "Direct drawing-to-system parameter mapping eliminates manual measurement guesswork",
                "Automated out-of-spec highlighting alerts inspectors instantly",
                "Enforces standardized measuring instruments (CMM, Height Gauge, Micrometer)"
            ],
            "transition": "Parameters configure panniyachu. Ippo quality defects analyze panni root cause solve panra Quality Problems & Fixes (NCR / CAPA) screen-ku move aavom."
        },
        {
            "num": "14.5",
            "title": "Quality Problems & Fixes",
            "route": "/quality/ncr",
            "intro": "Quality Problems & Fixes (Non-Conformance Management & CAPA) screen NCR management, 5-Why root cause analysis, Ishikawa cause-and-effect diagrams, and Corrective/Preventive Action sign-off repository.",
            "problem": "Defects repeat aavatha thadukka disciplined 5-Why root cause investigation and CAPA closure workflow IATF standard-padi thevai.",
            "users": "Quality Head, Tool Room Engineer, Production Head, Plant Manager.",
            "visible": [
                "NCR Directory: NCR No (NCR-2026-006), Part (PRD-LCA-01), Defect (Flange Thinning & Tear), Origin (Press Line 1 / Operation 20), Quantity (150 Pcs), Severity (Major Red Alert), Status (CAPA Implemented / Verification Pending), Owner",
                "5-Why Analysis Tab: Why 1 (Material tore) -> Why 2 (Excessive blank holding pressure) -> Why 3 (Hydraulic cushion valve pressure drifted) -> Why 4 (Valve seal worn out) -> Why 5 (Preventive seal replacement delayed by 2 weeks)",
                "CAPA Action Plan: Corrective Action (Replace cushion valve seal and recalibrate pressure), Preventive Action (Update PM schedule to replace cushion seals every 6 months)",
                "Action buttons: '+ New NCR', 'Submit 5-Why Analysis', 'Close CAPA', 'Export 8D Report'"
            ],
            "demo_steps": [
                "1. Click 'Quality Problems & Fixes' in sidebar.",
                "2. Show the register of 6 active NCR records.",
                "3. Open 'NCR-2026-006' (Flange thinning on Lower Control Arm).",
                "4. Open the '5-Why Analysis' tab: Walk through the 5 steps reaching the true root cause: hydraulic cushion seal wear.",
                "5. Show the CAPA Action Plan: Corrective seal replacement + Preventive 6-month PM schedule update.",
                "6. Click 'Export 8D Report' to show automated generation of the global automotive 8D Problem Solving report."
            ],
            "script": "Now, namma Quality Problems & Fixes (NCR / CAPA) screen paakkirom. Automotive industry-la ISO/IATF 16949 audit-ku Corrective and Preventive Action (CAPA) heart of quality system. Oru problem vandha superficial-ah reject pannama, inga 5-Why Root Cause Analysis panrom: En tear aachu? -> Pressure high -> En high? -> Valve seal worn out -> En worn out? -> PM delayed. True root cause identify panni Corrective Action and Preventive Action define panrom. Full 8D report single click-la PDF export panni TVS or Tata Motors OEM kitta submit pannalaam.",
            "example": "NCR-2026-006 for flange tear. 5-Why identifies hydraulic cushion seal wear. Seal replaced, PM schedule updated. 8D report sent to TVS within 24 hours.",
            "admin_benefit": "Eliminates recurring manufacturing defects and demonstrates world-class problem-solving rigor during OEM customer audits.",
            "advantages": [
                "Disciplined 5-Why methodology ensures true root causes are permanently resolved",
                "Generates global automotive standard 8D reports with one click",
                "Tracks CAPA implementation deadlines with automated escalation alerts"
            ],
            "transition": "NCR and CAPA workflow paathuttom. Ippo scrap trends and quality PPM analytics evaluate panra Quality Reports screen-ku move aavom."
        },
        {
            "num": "14.6",
            "title": "Quality Reports",
            "route": "/quality/analytics",
            "intro": "Quality Reports (Analytics) screen defect trend charts, supplier PPM rankings, internal scrap analysis, and Cost of Poor Quality (COPQ) analytics hub.",
            "problem": "Rejection trends monthly basis-la aggregate panni Cost of Poor Quality financial loss measure panna analytics thevai.",
            "users": "Quality Head, Finance Controller, Managing Director.",
            "visible": [
                "Plant Scrap PPM Trend Graph over last 6 months (dropping from 2.4% to 1.1%)",
                "Cost of Poor Quality (COPQ in INR Lakhs) card: Total scrap metal financial loss vs budget",
                "Defect Pareto by Operation Category: Stamping Draw Defects (52%), Blanking Burrs (28%), Piercing Off-Center (20%)",
                "Supplier Incoming Defect PPM comparison table",
                "Action buttons: 'Export Quality Audit Deck', 'Generate Monthly Management Review Deck'"
            ],
            "demo_steps": [
                "1. Click 'Quality Reports' in sidebar.",
                "2. Show the Scrap PPM trend line declining towards the benchmark.",
                "3. Highlight the Cost of Poor Quality (COPQ) card quantifying scrap in rupees.",
                "4. Show the Defect Pareto breakdown guiding tool room die regrinding priorities.",
                "5. Show how this report serves as the core deck for monthly IATF Management Review Meetings (MRM)."
            ],
            "script": "Now, namma Quality Reports analytics screen-la irukkom. Management and IATF Management Review Meeting-ku indha screen dhaan core data source. Plant PPM last 6 months-la 2.4%-la irundhu 1.1%-ku epdi drop aagirukku nu trend line kaattum. Koodave Cost of Poor Quality (COPQ) — rejection nala evlo rupee loss aachu nu rupee terms-la calculate panni kaattum. Idhu continuous improvement projects-oda financial return-ai directly prove pannum.",
            "example": "Monthly review shows scrap PPM reduced from 1.8% to 1.1%, saving ₹3.4 Lakhs in scrap metal loss this quarter.",
            "admin_benefit": "Quantifies the financial return of quality improvements and provides audit-ready IATF compliance decks.",
            "advantages": [
                "Direct correlation between technical PPM defects and financial COPQ loss",
                "Multi-month trend analysis proves continuous quality improvement to OEMs",
                "Identifies high-scrap operations for targeted tooling automation investments"
            ],
            "transition": "Quality module complete-ah paathuttom. Ippo factory press machines and dies running condition-la vekkura Maintenance module-ku move aavom."
        }
    ],
    "maintenance": [
        {
            "num": "15.1",
            "title": "Planned Maintenance",
            "route": "/maintenance/preventive",
            "intro": "Planned Maintenance (Preventive Maintenance) screen scheduled servicing calendars for mechanical presses, hydraulic oil replacements, lubrication schedules, and die maintenance logs.",
            "problem": "Preventive service miss aagi running press-la crank shaft break aavadho hydraulic motor burn aavadho thadukka PM calendar thevai.",
            "users": "Maintenance Engineer, Tool Room In-charge, Plant Manager.",
            "visible": [
                "Preventive Maintenance Calendar Board: Monthly grid showing scheduled press servicing slots",
                "PM Service Orders Table: PM No (PM-2026-009), Machine (MCH-PR-250T 250T Press), Frequency (Monthly / 500 Operating Hours), Tasks: Hydraulic Oil Filter Check, Ram Guide Lubrication, Clutch & Brake Air Pressure Calibration, Scheduled Date (18-Oct), Status (Scheduled / Overdue / Completed), Assigned Technician (Ramesh M)",
                "Action buttons: '+ Schedule PM Order', 'Complete Service Checklist', 'Print PM Work Order'"
            ],
            "demo_steps": [
                "1. Click 'Maintenance' section and open 'Planned Maintenance'.",
                "2. Show the visual PM calendar board for the current month.",
                "3. Open 'PM-2026-009' for 250T Mechanical Press.",
                "4. Highlight the service checklist: Hydraulic filter replacement, lubrication check, pneumatic clutch/brake calibration.",
                "5. Show the scheduled technician assignment and due date.",
                "6. Explain how completing the checklist resets the operating hour counter for the next service interval."
            ],
            "script": "Now, namma Maintenance-la Planned Maintenance screen paakkirom. Heavy stamping press shop-la preventive maintenance dhaan machine health-oda lifeline. Inga daily lubrication, monthly filter replacement, and annual overhaul schedules calendar board-la maintain panrom. 250T press-ku 500 operating hours reach aana udane system PM work order create panni technician-ku assign pannidum. Clutch, brake and hydraulic pressure verify panni checklist submit panna dhaan machine operational status reset aagum. Idhu catastrophic breakdown-ai 90% eliminate pannum.",
            "example": "PM-2026-009: 250T press monthly service scheduled for Sunday shift. Technician inspects clutch brake and replaces filter in 2 hours, preventing production downtime on Monday.",
            "admin_benefit": "Prevents catastrophic machine failures and extends the operational lifespan of heavy capital equipment.",
            "advantages": [
                "Operating hour-based triggers prevent servicing too early or too late",
                "Standardized digital checklists ensure no maintenance step is overlooked",
                "Maintains comprehensive machine service history required for insurance and audits"
            ],
            "transition": "Planned maintenance paathuttom. Ippo sudden breakdown incidents handle panra Breakdown Repairs screen-ku move aavom."
        },
        {
            "num": "15.2",
            "title": "Breakdown Repairs",
            "route": "/maintenance/breakdown",
            "intro": "Breakdown Repairs screen emergency breakdown ticket logging, maintenance technician assignment, repair action logs, spare parts consumed, and downtime closure.",
            "problem": "Press line stop aana aparam technician delay aagi repair history record aagama time waste aavatha thadukka breakdown ticketing thevai.",
            "users": "Shift Supervisor, Maintenance Engineer, Electrical In-charge.",
            "visible": [
                "Breakdown Incident Table: Ticket ID (BD-2026-004), Machine (MCH-PR-500T 500T Hydraulic Press), Breakdown Nature (Hydraulic Pump Pressure Drop), Reported By (Shift Supervisor), Time Reported (09:15 AM), Assigned Engineer (K. Balan), Repair Action (Replaced high-pressure relief valve seal), Spares Consumed (SEAL-KIT-500T), Downtime Duration (48 Mins), Status (Closed / Operational)",
                "Action buttons: '+ Report Breakdown', 'Assign Technician', 'Log Spares & Close Ticket'"
            ],
            "demo_steps": [
                "1. Click 'Breakdown Repairs' in sidebar.",
                "2. Show the log of 4 breakdown incidents recorded this month.",
                "3. Open 'BD-2026-004' on 500T Hydraulic Press.",
                "4. Highlight the incident lifecycle: Reported at 09:15 AM -> Engineer assigned at 09:20 AM -> Seal replaced using spare kit SEAL-KIT-500T -> Machine certified operational at 10:03 AM (Total 48 mins downtime).",
                "5. Show how closing this ticket automatically feeds MTTR metrics in Maintenance Analytics."
            ],
            "script": "Now, namma Breakdown Repairs screen-la irukkom. Shop floor-la press stop aana udane supervisor inga emergency breakdown ticket raise pannuvaaru. System immediately maintenance engineer-ku mobile alert anuppum. Engineer attend panni, enna repair pannaaru, entha spare part replace pannaaru nu log panni, test run panni ticket close pannuvaaru. Exactly 48 minutes downtime record aagi, machine operational status-ku restore aagidum. Everything is logged with zero ambiguity.",
            "example": "BD-2026-004: 500T press hydraulic pressure drop. Engineer replaces valve seal from spares in 48 minutes, logs action, and restores press to active production.",
            "admin_benefit": "Accelerates emergency repair response times and captures failure modes for predictive maintenance.",
            "advantages": [
                "Instant emergency ticketing reduces technician dispatch latency",
                "Direct linking of spare parts consumption to specific machines",
                "Automated downtime duration capture calculates accurate MTTR figures"
            ],
            "transition": "Breakdown repairs paathuttom. Ippo machine repairs-ku thevaiyaana components maintain panra Spare Parts screen-ku move aavom."
        },
        {
            "num": "15.3",
            "title": "Spare Parts",
            "route": "/maintenance/sparepart",
            "intro": "Spare Parts Management screen inventory tracking for press spares: die springs, punches, hydraulic valves, seals, sensors, and lubricating oils with minimum stock alerts.",
            "problem": "₹500 value spare seal illama ₹50 Lakhs press machine 2 days idle-ah nikkatha thadukka critical spares inventory thevai.",
            "users": "Maintenance In-charge, Store Keeper, Purchase Officer.",
            "visible": [
                "Spare Parts Catalog Table: Spare Code (SPR-SEAL-01), Description (Hydraulic Cylinder Seal Kit 500T), Category (Hydraulic Spares), Machine Compatibility (MCH-PR-500T), On-Hand Stock (4 Sets), Min Buffer (2 Sets), Unit Cost (₹3,500), Storage Bin (BIN-MAINT-B02), Status (Normal)",
                "Critical Spares Filter and Reorder alert list",
                "Action buttons: '+ Add Spare Part', 'Issue to Breakdown Order', 'Reorder Alert'"
            ],
            "demo_steps": [
                "1. Click 'Spare Parts' in sidebar.",
                "2. Show the catalog of machine maintenance spares.",
                "3. Open 'SPR-SEAL-01' (500T Hydraulic Seal Kit).",
                "4. Highlight the machine mapping: Exclusively compatible with MCH-PR-500T.",
                "5. Point out the stock level (4 sets on hand vs min buffer 2 sets) stored in bin BIN-MAINT-B02.",
                "6. Show how spare parts issued to breakdown tickets automatically deplete stock."
            ],
            "script": "Now, namma Spare Parts screen paakkirom. Heavy press shop-la critical spares stock romba mukkiyam. Oru simple hydraulic seal-o illa die spring-o stores-la illana, crores worth press machine days kanakula ninnu pooidum. Inga mechanical press spares, hydraulic valves, pneumatic sensors, and lubricating oils maintain panrom. Min buffer 2 sets nu set panrom — stock 2-ku vandha udane system purchase indent auto-generate pannidum. Spare part entha maintenance rack-la irukku nu exact bin location kooda inga kaattum.",
            "example": "500T press seal kit on-hand 4 sets in Bin B02. When BD-2026-004 consumed 1 set, stock auto-decreased to 3 sets. Maintenance always knows spares are ready.",
            "admin_benefit": "Eliminates prolonged press downtime caused by missing maintenance spare parts.",
            "advantages": [
                "Machine-to-spare compatibility mapping accelerates correct part identification",
                "Minimum buffer thresholds trigger automated replenishment before stock runs out",
                "Bin-level location tracking enables instant retrieval during emergency repairs"
            ],
            "transition": "Spare parts paathuttom. Ippo MTBF, MTTR, and maintenance costs evaluate panra Maintenance Reports screen-ku move aavom."
        },
        {
            "num": "15.4",
            "title": "Maintenance Reports",
            "route": "/maintenance/analytics",
            "intro": "Maintenance Reports (Analytics) screen Mean Time Between Failures (MTBF), Mean Time To Repair (MTTR), breakdown frequency trends, and total repair expenditure hub.",
            "problem": "Which press is breaking down most frequently and whether maintenance cost exceeds machine value evaluate panna analytics thevai.",
            "users": "Plant Head, Maintenance Manager, Managing Director.",
            "visible": [
                "MTBF Indicator Card: 142 Operating Hours between stoppages (Target > 120 Hrs)",
                "MTTR Indicator Card: 44.5 Minutes average repair turnaround (Target < 60 Mins)",
                "Preventive Maintenance Schedule Compliance: 94.8% on-time completion",
                "Breakdown Frequency by Press Line bar chart",
                "Monthly Maintenance Spend trend (Spares + Consumables in INR Lakhs)",
                "Action buttons: 'Export Reliability Audit Deck', 'Generate Machine Life-Cycle Report'"
            ],
            "demo_steps": [
                "1. Click 'Maintenance Reports' in sidebar.",
                "2. Show the MTBF (142 Hrs) and MTTR (44.5 Mins) performance metrics.",
                "3. Highlight the PM compliance percentage of 94.8%.",
                "4. Point out the Breakdown Frequency chart highlighting that Press Line 1 had only 2 minor incidents this month.",
                "5. Show how management uses this report to plan annual press refurbishment budgets."
            ],
            "script": "Now, namma Maintenance Reports analytics screen-la irukkom. Management and plant head machine health evaluate panna international KPIs aana MTBF (Mean Time Between Failures) and MTTR (Mean Time To Repair) inga live-ah track panrom. Namma plant-la MTBF 142 hours achieve aagirukku (target 120 hours mela) and MTTR 44.5 minutes-la repair mudinjurudhu. PM compliance 94.8%-la irukku. Idhanaala press reliability maximum-la irukku and unplanned breakdowns negligible level-la maintain aagudhu.",
            "example": "Annual maintenance review shows MTBF improved from 98 hours to 142 hours, proving preventive maintenance strategy has reduced factory downtime by 31%.",
            "admin_benefit": "Provides executive visibility into machine asset reliability and validates maintenance budget ROI.",
            "advantages": [
                "Standardized MTBF and MTTR metrics benchmark plant against world-class standards",
                "Pinpoints troublesome machines requiring major overhaul or replacement",
                "Monitors monthly spares and servicing expenditure against allocated budget"
            ],
            "transition": "Maintenance module complete-ah paathuttom. Ippo finished goods customer-ku vehicle book panni dispatch panra Dispatch & Delivery module-ku move aavom."
        }
    ],
    "dispatch": [
        {
            "num": "16.1",
            "title": "Dispatch Plan",
            "route": "/dispatch/planning",
            "intro": "Dispatch Plan screen daily and weekly dispatch schedules consolidating finished parts against confirmed customer Sales Orders and vehicle booking plans.",
            "problem": "Multiple customer delivery commitments clash aagi lorry illama dispatch delay aavatha thadukka advance dispatch planning thevai.",
            "users": "Dispatch Coordinator, Logistics Manager, Sales Executive.",
            "visible": [
                "Dispatch Planning Board: Plan ID (DSP-2026-W42), Dispatch Date (16-Oct), Customer Name (TVS Motor Company), Sales Order Ref (SO-2026-001), Part (PRD-LCA-01), Planned Dispatch Qty (2,500 Nos), Packaging Type (Returnable Plastic Bins 50 Bins x 50 Pcs), Vehicle Type Planned (14-Ft Dedicated Truck), Delivery Status (Ready for Loading / Vehicle Assigned)",
                "Action buttons: '+ New Dispatch Plan', 'Auto-Plan from SO Schedules', 'Assign Vehicle'"
            ],
            "demo_steps": [
                "1. Click 'Dispatch & Delivery' section and open 'Dispatch Plan'.",
                "2. Show the dispatch planning schedule for the current week.",
                "3. Open the planned shipment for TVS Motor Company.",
                "4. Highlight the details: 2,500 Lower Control Arm brackets packed in 50 returnable plastic bins, scheduled for 16-Oct delivery.",
                "5. Show how the system verified available stock in WH-FG before locking the dispatch plan.",
                "6. Explain the 'Assign Vehicle' button which prompts for transporter and truck details."
            ],
            "script": "Now, namma Dispatch & Delivery-la Dispatch Plan screen paakkirom. Customer JIT delivery schedule meet panna logistics planning advance-ah pannanum. Inga weekly sales order delivery dates base panni dispatch plan create panrom. TVS-ku 2,500 brackets 50 returnable plastic bins-la pack panni 16-Oct anuppa 14-ft truck plan panrom. System warehouse-la finished stock ready-ah irukka nu verify panni dhaan plan lock pannum. Idhanaala lorry vandhadhukku aparam stock illama lorry idle aagura problem 100% eliminate aagum.",
            "example": "DSP-2026-W42: 2,500 brackets scheduled for TVS Hosur plant. System confirms 4,850 pieces available in WH-FG, locks stock, and alerts logistics to book truck.",
            "admin_benefit": "Ensures 100% On-Time In-Full (OTIF) customer delivery schedules and eliminates truck detention charges.",
            "advantages": [
                "Automated schedule consolidation from confirmed Sales Order delivery schedules",
                "Verifies stock availability before booking vehicles, eliminating transport waste",
                "Enables packaging type planning (returnable bins vs corrugated cartons)"
            ],
            "transition": "Dispatch plan ready. Ippo physical lorry load panni Delivery Challan (DC) generate panra Record Dispatch (Execution) screen-ku move aavom."
        },
        {
            "num": "16.2",
            "title": "Record Dispatch",
            "route": "/dispatch/execution",
            "intro": "Record Dispatch (Execution) screen Delivery Challan (DC) generation, picking finished goods from WH-FG, packing slip creation, vehicle registration, driver details, and e-Way bill logging.",
            "problem": "Manual gate pass and DC errors nala customer gate-la lorry return aavatha and GST e-Way bill compliance breach aavatha thadukka idhu thevai.",
            "users": "Dispatch In-charge, Gate Logistics Officer, Accounts Executive.",
            "visible": [
                "Dispatch Execution Register: Delivery Challan No (DC-2026-019), Dispatch Date, Customer (TVS Motor Company Ltd), Destination Plant (TVS Hosur Plant 1), Transporter Name (VRL Logistics), Vehicle Registration No (TN-70-AB-4567), Driver Name & Phone, e-Way Bill No (EWB-998811223344), Items Dispatched: 2,500 Nos PRD-LCA-01, Batch Lot Shipped (LOT-FG-2026-042), Status (Dispatched / Invoice Triggered)",
                "Action buttons: '+ Generate Delivery Challan', 'Print Branded Delivery Challan PDF', 'Print Gate Pass', 'Trigger Tax Invoice' (blue button)"
            ],
            "demo_steps": [
                "1. Click 'Record Dispatch' in sidebar.",
                "2. Show the register of 9 executed dispatch shipments.",
                "3. Open 'DC-2026-019' (TVS Motor Company).",
                "4. Highlight the captured details: Lorry TN-70-AB-4567, Transporter VRL Logistics, e-Way Bill Number, and shipped batch lot LOT-FG-2026-042.",
                "5. Show the 'Print Branded Delivery Challan PDF' button generating the formal stamped 4-copy delivery challan.",
                "6. Explain how confirming this dispatch automatically deducts stock from WH-FG and sends an invoice trigger to Accounts Receivable in Finance."
            ],
            "script": "Now, namma Record Dispatch screen-la irukkom. Lorry factory bay-la load aana udane formal Delivery Challan (DC) inga generate panrom. Vehicle number (TN-70-AB-4567), driver phone, transporter, and mandatory GST e-Way Bill number inga enter panrom. 'Print Delivery Challan' click panni 4-copy branded DC print eduthu driver kitta sign vaangi anuppuvom. Indha single click-la rendu automated actions nadakkum: #1 Finished Goods warehouse-la 2,500 pieces stock auto-deduct aagidum, and #2 Finance Accounts Receivable module-ku automatic invoice trigger generate aagidum!",
            "example": "DC-2026-019 generated for TVS. 2,500 parts shipped on vehicle TN-70-AB-4567 with e-Way Bill. Stock automatically drops by 2,500 in WH-FG and Invoice draft appears in Finance.",
            "admin_benefit": "Ensures 100% GST e-Way bill transport compliance and synchronizes warehouse stock reduction with finance billing.",
            "advantages": [
                "Automated branded Delivery Challan generation with full statutory details",
                "Instant stock depletion prevents ghost finished goods inventory",
                "Direct automated billing trigger eliminates billing delays between dispatch and finance"
            ],
            "transition": "Goods factory gate thaandi dispatch aachu. Ippo lorry customer plant reach aaguradha monitor panra Delivery Tracking screen-ku move aavom."
        },
        {
            "num": "16.3",
            "title": "Delivery Tracking",
            "route": "/dispatch/tracking",
            "intro": "Delivery Tracking screen shipment status monitoring (Dispatched, In Transit, Delivered, Customer Acknowledged) and Proof of Delivery (POD) signed copy archiving.",
            "problem": "Lorry customer plant reach aacha illaiya, security gate-la delay aacha nu theriyama customer escalations handle panna tracking thevai.",
            "users": "Logistics Coordinator, Customer Account Executive.",
            "visible": [
                "Tracking Dashboard Table: DC No (DC-2026-019), Customer (TVS Motor Company), Vehicle (TN-70-AB-4567), Dispatch Time (10:30 AM), Transit Status (Delivered & Acknowledged Green Badge), Arrival Time (11:45 AM), Gate Inward Ref (TVS-INW-7712), Proof of Delivery (POD Attachment Verified), Transit Time (1.25 Hrs)",
                "Action buttons: 'Update Transit Status', 'Upload Signed POD Slip', 'Close Shipment'"
            ],
            "demo_steps": [
                "1. Click 'Delivery Tracking' in sidebar.",
                "2. Show the tracking register across all active and completed shipments.",
                "3. Open shipment DC-2026-019.",
                "4. Highlight the status lifecycle: Dispatched at 10:30 AM -> Arrived at 11:45 AM -> Signed Proof of Delivery (POD) uploaded.",
                "5. Show the uploaded physical POD copy carrying the TVS security inward stamp.",
                "6. Explain how this verified POD unlocks payment collection in Finance."
            ],
            "script": "Now, namma Delivery Tracking screen paakkirom. Lorry dispatch aana aparam goods customer plant reach aaguradha inga track panrom. Transit status: In Transit, Delivered, and Acknowledged. Driver customer security gate-la delivery kuduthutu, customer seal and sign panna Proof of Delivery (POD) slip-ai photo eduthu upload pannuvaaru. Indha verified POD dhaan finance team customer kitta payment collection claim panna legal proof. Customer 'goods vandhu serala' nu eppovume dispute panna mudiyaadhu.",
            "example": "DC-2026-019 arrived TVS Hosur in 1.25 hours. Customer stamped gate inward TVS-INW-7712. POD uploaded into system, closing the delivery loop.",
            "admin_benefit": "Eliminates delivery disputes and provides indisputable legal proof of delivery for customer payment collection.",
            "advantages": [
                "Real-time shipment milestone tracking prevents transit blind spots",
                "Signed POD digital archiving supports dispute resolution and audit checks",
                "Closes the commercial fulfillment cycle, enabling confident financial invoicing"
            ],
            "transition": "Dispatch and delivery 100% complete. Ippo customer billing, vendor payments, GST and general ledger manage panra Finance & Accounts module-ku move aavom."
        }
    ],
    "finance": [
        {
            "num": "17.1",
            "title": "Money In (Receivable)",
            "route": "/finance/ar",
            "intro": "Money In (Accounts Receivable) screen Customer Tax Invoices generated against dispatches, payment receipt vouchers, customer aging analysis (30/60/90 days), and TDS reconciliation repository.",
            "problem": "Dispatched goods-ku invoice poda marandhadho illa customer payment dues delay aagi cash flow choke aavatha thadukka AR management thevai.",
            "users": "Accounts Executive, Credit Controller, CFO.",
            "visible": [
                "Accounts Receivable Ledger Table: Invoice No (INV-2026-001), DC Ref (DC-2026-019), Customer (TVS Motor Company), Invoice Amount (₹6,12,500), GST Amount (₹1,10,250), Total Receivable (₹7,22,750), Payment Received (₹0 / Pending), Due Date (30-Nov), Aging Bracket (0-30 Days Green), Status (Unpaid / Partially Paid / Paid)",
                "Customer Aging Summary Cards: Current (₹48.5L), 30-60 Days (₹14.2L), 60-90 Days (₹3.1L), > 90 Days Overdue (₹0)",
                "Action buttons: '+ Generate Tax Invoice', 'Record Customer Payment Receipt', 'Send Payment Reminder', 'Download Branded GST Tax Invoice PDF'"
            ],
            "demo_steps": [
                "1. Click 'Finance & Accounts' section and open 'Money In (Receivable)'.",
                "2. Show the register of 12 customer tax invoices totaling over ₹72 Lakhs.",
                "3. Open 'INV-2026-001' generated against DC-2026-019 for TVS Motor Company.",
                "4. Highlight the invoice breakdown: Basic value ₹6,12,500 + CGST 9% (₹55,125) + SGST 9% (₹55,125) = Total ₹7,22,750.",
                "5. Show the Customer Aging breakdown (Current, 30-60, 60-90 days) showing zero overdue debts.",
                "6. Click 'Download Branded GST Tax Invoice PDF' to demonstrate formal invoice generation with QR code and bank payout details.",
                "7. Show how recording a payment receipt automatically reconciles customer balance."
            ],
            "script": "Now, namma Finance & Accounts-la Money In (Accounts Receivable) screen paakkirom. Dispatch mudinja udane Delivery Challan base panni formal GST Tax Invoice inga auto-generate aagum. TVS-ku ₹6,12,500 basic value + 18% GST pottu ₹7,22,750 Tax Invoice ready. Customer payment credit days 45 days nu set panna, due date 30-Nov nu system track pannum. Aging summary-la current dues evlo, overdue dues evlo nu clear-ah theriyum. TVS RTGS payment anuppum podhu, 'Record Payment Receipt' click panni UTR number enter panna, customer balance instant-ah reconcile aagidum.",
            "example": "INV-2026-001 for TVS ₹7,22,750 due on 30-Nov. Customer transfers funds via RTGS UTR TVS99881122. Accounts records receipt, closing invoice balance.",
            "admin_benefit": "Accelerates customer billing, enforces credit payment terms, and guarantees healthy operating cash inflows.",
            "advantages": [
                "Automated invoice generation from delivery challans eliminates billing delays",
                "Dynamic aging brackets (30/60/90 days) prioritize payment collection follow-ups",
                "Full statutory GST tax compliance with CGST/SGST/IGST breakdown"
            ],
            "transition": "Customer invoicing and money in paathuttom. Ippo steel suppliers bills and payments handle panra Money Out (Payable) screen-ku move aavom."
        },
        {
            "num": "17.2",
            "title": "Money Out (Payable)",
            "route": "/finance/ap",
            "intro": "Money Out (Accounts Payable) screen Supplier bill booking against GRN (3-way match: PO vs GRN vs Vendor Invoice), payment voucher generation (RTGS/NEFT/Cheque), and MSME vendor aging ledger.",
            "problem": "Wrong vendor rates-ku bill book aavatha and MSME 45-day statutory payment penalty aavatha thadukka 3-way matching thevai.",
            "users": "Accounts Payable Officer, Purchase Head, Finance Controller.",
            "visible": [
                "Accounts Payable Register Table: Bill Ref (BILL-2026-001), PO Ref (PO-2026-001), GRN Ref (GRN-2026-007), Vendor (Tata Steel Limited), MSME Category (Medium), Bill Amount (₹12,42,500), GST (₹2,23,650), Total Payable (₹14,66,150), 3-Way Match Status (MATCHED 100% Green Badge), Payment Due Date (MSME 45-Day Compliant), Status (Approved for Payment)",
                "3-Way Match Verification Modal: PO Rate (₹50,000/MT) vs GRN Delivered Qty (24,850 Kg) vs Vendor Invoice Rate (₹50,000/MT) - Zero Variance",
                "Action buttons: '+ Book Supplier Bill', 'Generate Bank Payment Voucher', 'Export NEFT Payout File'"
            ],
            "demo_steps": [
                "1. Click 'Money Out (Payable)' in sidebar.",
                "2. Show the register of 8 supplier bills totaling over ₹65 Lakhs.",
                "3. Open 'BILL-2026-001' (Tata Steel Limited).",
                "4. Highlight the '3-Way Match Status: MATCHED': System automatically verified Purchase Order rate, GRN actual received weight (24,850 Kg), and Vendor Invoice price — zero price discrepancy.",
                "5. Show the MSME 45-day payment compliance due date alert.",
                "6. Show the 'Generate Bank Payment Voucher' button which prepares RTGS/NEFT payout instructions.",
                "7. Explain how this prevents overpaying suppliers or paying for undelivered goods."
            ],
            "script": "Now, namma Money Out (Accounts Payable) screen-la irukkom. Supplier billing-la fraud and errors prevent panna '3-Way Matching' industry gold standard. Inga Tata Steel bill book pannum podhu, system automatic-ah 3 documents match pannum: #1 Purchase Order rate (₹50,000/MT), #2 Gate GRN received weight (24,850 Kg), and #3 Supplier Invoice. Rate match aana dhaan bill approve aagum, oru paisa extra pay panna mudiyaadhu. Koodave MSME 45-day rule padi payment due date alert kaattum. 'Generate Payment Voucher' click panni RTGS payout ready pannikalam.",
            "example": "Tata Steel bill for ₹14,66,150 verified against PO-2026-001 and GRN-2026-007. System confirms 100% match and schedules RTGS payment on due date.",
            "admin_benefit": "100% protection against fraudulent or incorrect supplier billing, and ensures compliance with statutory MSME payment laws.",
            "advantages": [
                "Automated 3-way matching (PO vs GRN vs Invoice) completely prevents over-billing",
                "Statutory MSME 45-day payment tracking prevents interest penalties",
                "Exportable bank NEFT/RTGS batch files streamline treasury payment execution"
            ],
            "transition": "Accounts payable paathuttom. Ippo factory-oda all financial accounting entries accumulate aagura General Ledger screen-ku move aavom."
        },
        {
            "num": "17.3",
            "title": "General Ledger",
            "route": "/finance/ledger",
            "intro": "General Ledger screen standard Chart of Accounts (COA) and automated double-entry journal vouchers for all inventory movements, material issues, sales, and purchases repository.",
            "problem": "Manual journal entries potu mistakes aavatha thadukka all operational ERP transactions automated double-entry ledger-la post aaga idhu thevai.",
            "users": "Chief Accountant, Financial Auditor, CFO, Super Admin.",
            "visible": [
                "Chart of Accounts (COA) Tree: Assets (1000s), Liabilities (2000s), Equity (3000s), Revenue (4000s), Direct Expenses (5000s)",
                "Journal Vouchers Table: Voucher No (JV-2026-043), Date, Source Module (Inventory Movement / Sales Invoice / Purchase Bill), Description, Debit Account & Amount, Credit Account & Amount, Posted Status",
                "Filter by Account Code, Date Range, and Source Transaction",
                "Action buttons: '+ New Manual Journal Voucher', 'View COA Hierarchy', 'Export General Ledger Audit Trail'"
            ],
            "demo_steps": [
                "1. Click 'General Ledger' in sidebar.",
                "2. Show the Chart of Accounts hierarchy spanning 25 master accounts.",
                "3. Open the Journal Vouchers register showing 43 automated double-entry postings.",
                "4. Highlight an automated inventory posting: Debit Raw Material Inventory Asset (1520) / Credit GR/IR Clearing (2050).",
                "5. Highlight an automated sales invoice posting: Debit Accounts Receivable (1200) / Credit Sales Revenue (4010) & Output GST (2200).",
                "6. Explain how this proves that every operational movement has a corresponding real-time financial ledger entry."
            ],
            "script": "Now, namma General Ledger screen paakkirom. Idhu company-oda complete accounting heart. Inga standard Chart of Accounts (COA) irukku — Assets, Liabilities, Revenue, and Expenses. Romba mukkiyamaana capability: store keeper coil inward pannaalum, production scrap book pannaalum, illa dispatch lorry poonalum, background-la automated double-entry Journal Voucher generate aagi General Ledger-la real-time post aagidum. Accountant manual-ah debit/credit poda vendiya thevaiye illa; everything is 100% automated and balanced!",
            "example": "JV-2026-043 automatically generated when TVS invoice was created: Debit Accounts Receivable ₹7,22,750, Credit Sales Revenue ₹6,12,500, Credit GST Output ₹1,10,250.",
            "admin_benefit": "Guarantees that operational shop floor movements and financial books of account are permanently synchronized without month-end reconciliation lags.",
            "advantages": [
                "100% automated double-entry bookkeeping triggered by operational ERP events",
                "Standardized Chart of Accounts tailored for automotive component manufacturing",
                "Tamper-evident audit trail with source transaction cross-referencing"
            ],
            "transition": "General ledger paathuttom. Ippo GST statutory returns and tax working evaluate panra Tax & GST screen-ku move aavom."
        },
        {
            "num": "17.4",
            "title": "Tax & GST",
            "route": "/finance/tax",
            "intro": "Tax & GST screen GSTR-1 outward supply summaries, GSTR-2B input tax credit reconciliation, and net GST payment liability calculation workbench.",
            "problem": "GST mismatch, unclaimed Input Tax Credit (ITC), and delayed GST return filing penalties eliminate panna integrated tax workbench thevai.",
            "users": "Tax Consultant, Senior Accountant, CFO.",
            "visible": [
                "GST Summary Cards: Total Output GST Collected (₹14.2 Lakhs), Total Input Tax Credit Available (₹11.8 Lakhs), Net GST Cash Payable (₹2.4 Lakhs)",
                "GSTR-1 Outward Supply Register: B2B Invoices table with Customer GSTIN, HSN Code (8708), Taxable Value, CGST, SGST, IGST",
                "GSTR-2B Input Tax Credit (ITC) Reconciliation Table: Supplier Invoices vs Portal 2B Match Status (100% Matched)",
                "Action buttons: 'Export GSTR-1 JSON', 'Reconcile GSTR-2B', 'Download Monthly Tax Working'"
            ],
            "demo_steps": [
                "1. Click 'Tax & GST' in sidebar.",
                "2. Show the top 3 GST summary cards: Output Tax (₹14.2L) - Input Credit (₹11.8L) = Net Payable (₹2.4L).",
                "3. Open the GSTR-1 table: Show B2B sales invoices formatted exactly for government portal upload with customer GSTIN and HSN codes.",
                "4. Open GSTR-2B reconciliation: Show how raw steel coil purchase bills are matched against government 2B portal data to claim 100% ITC.",
                "5. Click 'Export GSTR-1 JSON' to show instant export ready for government portal filing."
            ],
            "script": "Now, namma Tax & GST screen-la irukkom. Indian GST statutory compliance-ku indha screen build pannadhu. Inga namma sales dispatches base panni GSTR-1 outward supplies table live-ah aggregate aagum — Customer GSTIN, HSN 8708, CGST, SGST clear-ah split aagum. Purchasing bills base panni GSTR-2B Input Tax Credit (ITC) match panrom. System net GST payable (Output Tax ₹14.2L minus Input Credit ₹11.8L = ₹2.4L) exact-ah calculate pannidum. 'Export GSTR-1 JSON' click panni direct-ah GST portal-la file pannikalam, zero CA consultant delays!",
            "example": "Tax working shows ₹11.8 Lakhs Input Tax Credit claimed on Tata Steel purchases, reducing net cash GST payout to ₹2.4 Lakhs. GSTR-1 JSON exported in 5 seconds.",
            "admin_benefit": "Guarantees 100% statutory GST compliance, maximizes Input Tax Credit recovery, and eliminates tax filing penalties.",
            "advantages": [
                "Automated GSTR-1 B2B compilation eliminates manual tax spreadsheet working",
                "Rigorous GSTR-2B matching prevents loss of valuable input tax credit",
                "Direct JSON export format complies with Indian GSTN portal specifications"
            ],
            "transition": "Tax working paathuttom. Ippo company-oda executive Balance Sheet and Profit & Loss statement generate panra Financial Statements screen-ku move aavom."
        },
        {
            "num": "17.5",
            "title": "Financial Statements",
            "route": "/finance/statements",
            "intro": "Financial Statements screen real-time Balance Sheet, Profit & Loss (P&L) statements, and Trial Balance with direct drill-down into accounting vouchers.",
            "problem": "Month-end mudinju 2 weeks aparam P&L theriyura conventional delay-ai thaduthu, real-time profitability visibility kedaikka idhu thevai.",
            "users": "Managing Director, CFO, Board of Directors, Statutory Auditor.",
            "visible": [
                "Statement Selector Tabs: Profit & Loss Statement (P&L), Balance Sheet, Trial Balance",
                "P&L Statement View: Total Revenue (₹1.84 Crores), Raw Material Consumed (₹98.2 Lakhs), Stamping Factory Overheads (₹24.5 Lakhs), Direct Labor (₹14.2 Lakhs), Gross Operating Profit (₹47.1 Lakhs / 25.6%), Net Profit Before Tax (₹32.4 Lakhs / 17.6%)",
                "Balance Sheet View: Total Assets (Current Assets, Plant Machinery, Fixed Assets) = Total Liabilities + Equity (Balanced to the rupee)",
                "Action buttons: 'Select Fiscal Period', 'Drill-Down to Voucher', 'Export Board Presentation PDF'"
            ],
            "demo_steps": [
                "1. Click 'Financial Statements' in sidebar.",
                "2. Show the live Profit & Loss (P&L) Statement.",
                "3. Highlight the financial performance: Net Revenue ₹1.84 Crores, Gross Operating Margin 25.6%, Net Profit Before Tax ₹32.4 Lakhs (17.6%).",
                "4. Switch to 'Balance Sheet' tab: Show that Assets and Liabilities balance perfectly to the rupee in real time.",
                "5. Click on 'Raw Material Consumed' line item to demonstrate 1-click drill-down directly into the underlying coil issue vouchers.",
                "6. Show the 'Export Board Presentation PDF' button."
            ],
            "script": "Now, namma Financial Statements screen-la irukkom. Management and business owners-ku idhu dhaan ultimate screen. Conventional accounting software-la month mudinju 15 days wait pannanum P&L paaka; aana Precision ERP-la real-time Profit & Loss statement live-ah generate aagudhu! Namma net revenue ₹1.84 Crores, raw steel consumption cost, factory overheads, and net profit before tax ₹32.4 Lakhs (17.6% margin) live-ah paakkalaam. Balance sheet-um Assets = Liabilities perfectly balanced-ah irukku. Endha line item click pannalum underlying vouchers-ku direct drill-down kedaikkum!",
            "example": "MD reviews October performance: Revenue ₹1.84 Cr, Net Profit ₹32.4 Lakhs. MD clicks 'Raw Material Consumed' and instantly views the exact coil batches consumed during the month.",
            "admin_benefit": "Delivers real-time corporate financial intelligence, eliminating month-end closing latency for top leadership.",
            "advantages": [
                "Instantaneous P&L and Balance Sheet generation without waiting for month-end reconciliations",
                "Interactive drill-down from executive summary figures directly into source vouchers",
                "Audit-ready formatting complying with standard Indian GAAP / Ind AS principles"
            ],
            "transition": "Financial statements paathuttom. Ippo individual automotive part level-la standard vs actual cost analyze panra Cost Accounting screen-ku move aavom."
        },
        {
            "num": "17.6",
            "title": "Cost Accounting",
            "route": "/finance/costing",
            "intro": "Cost Accounting screen product-level standard vs actual costing, variance analysis (material consumption variance, press machine rate variance, labor variance), and unit profitability analysis.",
            "problem": "Quotation-la quote panna cost-kum actual manufacturing cost-kum ulla difference theriyama loss-la parts supply panradha prevent panna idhu thevai.",
            "users": "Cost Accountant, Engineering Head, Commercial Director.",
            "visible": [
                "Product Costing Table: Part Code (PRD-LCA-01 Lower Control Arm Bracket), Standard Target Cost (₹198.50), Actual Incurred Cost (₹201.20), Cost Variance (+₹2.70 / +1.3% Red Alert), Unit Selling Price (₹245.00), Net Unit Margin (₹43.80 / 17.9%)",
                "Cost Element Breakdown Chart: Material Cost (₹144.10 vs ₹142.50 Std), Machine Cost (₹37.50 vs ₹38.20 Std), Labor Cost (₹14.80 vs ₹14.00 Std), Scrap Recovery Credit (-₹8.20 vs -₹8.70 Std)",
                "Variance Categorization: Material Price Variance, Material Usage Variance, Machine Efficiency Variance",
                "Action buttons: 'Run Batch Cost Variance', 'Update Standard Cost Baseline'"
            ],
            "demo_steps": [
                "1. Click 'Cost Accounting' in sidebar.",
                "2. Show the product costing analysis across all 15 manufactured parts.",
                "3. Open the costing breakdown for 'PRD-LCA-01 Lower Control Arm Bracket'.",
                "4. Highlight the comparison: Standard Cost ₹198.50 vs Actual Incurred Cost ₹201.20 (+₹2.70 variance).",
                "5. Walk through the variance analysis: Raw material consumed slightly more due to coil offcut, but net margin remains healthy at 17.9% against selling price ₹245.00.",
                "6. Explain how this data guides future price revisions during customer annual contract negotiations."
            ],
            "script": "Now, namma Cost Accounting screen paakkirom. Automotive manufacturing-la profitability maintain panna unit-level costing romba mukkiyam. Quotation-la namma ₹198.50 target cost estimate pannom; actual shop floor-la run aana aparam ₹201.20 cost aagirukku nu standard vs actual variance calculate panni kaattum. En ₹2.70 extra aachu? Material usage variance evlo, press cycle time variance evlo nu split panni kaattum. Selling price ₹245.00-la net unit margin ₹43.80 (17.9%) profit confirm aagudhu. Idhu customer kitta annual price increase negotiate panna solid cost proof tharudhu.",
            "example": "PRD-LCA-01 actual cost ₹201.20 vs standard ₹198.50. Cost accountant identifies 1.2% steel coil price increase as reason, preparing data for OEM raw material price compensation claim.",
            "admin_benefit": "Reveals the true profitability of every stamped part and prevents selling components at a hidden manufacturing loss.",
            "advantages": [
                "Granular variance analysis isolates material, labor, and press machine overhead drivers",
                "Protects operating margins by validating actual shop floor execution against initial quotations",
                "Provides factual backing for OEM raw material price escalation indexation claims"
            ],
            "transition": "Finance & Accounts module complete-ah paathuttom. Ippo system compliance, issue support, and audit trail govern panra Support & Audit menus-ku move aavom."
        }
    ],
    "audit_support": [
        {
            "num": "18.1",
            "title": "Reported Problems",
            "route": "/issues",
            "intro": "Reported Problems (Issue Queue & Internal Helpdesk) screen user-reported bug tickets, UI difficulties, operational assistance requests, and resolution workflows manage panra repository.",
            "problem": "Shop floor staff face panra software issues WhatsApp or phone calls-la solli marandhu poogama centralized IT helpdesk thevai.",
            "users": "All Staff (Reporters), IT Support Admin, Super Admin (Resolvers).",
            "visible": [
                "Issues Helpdesk Table: Issue ID (ISS-2026-006), Severity (Low / Medium / High / Critical Red Badge), Title (Printer Configuration in Dispatch Bay), Reported By (dispatch.coordinator@lbap.in), Module Tag (Dispatch), Date Reported, Status (Open / Under Investigation / Resolved / Closed), Assigned IT Admin",
                "Issue Details Modal: Screenshot attachment, Reporter remarks, Admin resolution comments, Status toggle",
                "Action buttons: '+ Log Support Ticket', 'Assign to IT', 'Resolve & Close Ticket'"
            ],
            "demo_steps": [
                "1. Click 'Reported Problems' under bottom menus.",
                "2. Show the register of 6 operational support tickets.",
                "3. Open 'ISS-2026-006' (Dispatch Bay Printer Configuration).",
                "4. Highlight the details: Reporter dispatch.coordinator@lbap.in logged it via the top-bar LifeBuoy button.",
                "5. Show the Admin resolution workflow: Changing status from 'Under Investigation' to 'Resolved' with admin resolution remarks.",
                "6. Explain how this internal ticketing keeps shop floor operations running smoothly without third-party tools."
            ],
            "script": "Now, namma Reported Problems (Issue Queue) screen paakkirom. Shop floor supervisor-o illa store keeper-o system use pannum podhu edhavadhu sandhegam-o illa printer issue-o vandha, top bar-la irukkura LifeBuoy icon click panni direct-ah issue log pannuvaanga. Andha tickets ellaame inga Super Admin dashboard-ku queue aagidum. Admin tickets review panni, IT team-ku assign panni, status 'Resolved' nu update panna, reporting employee-ku resolution notice pooidum. Company kulla internal IT helpdesk system in-built-ah irukku.",
            "example": "Dispatch bay reports barcode printer alignment issue. Admin assigns IT tech, tech adjusts label size, logs resolution, and closes ticket in 15 minutes.",
            "admin_benefit": "Centralizes all employee ERP support questions and tracks IT resolution turnaround times.",
            "advantages": [
                "In-app problem reporting captures exact screen context automatically",
                "Eliminates chaotic WhatsApp or verbal bug reporting",
                "Maintains a knowledge base of resolved operational questions"
            ],
            "transition": "Helpdesk queue paathuttom. Ippo IATF 16949 audit trail and system security history track panra Change History (Audit) screen-ku move aavom."
        },
        {
            "num": "18.2",
            "title": "Change History (Audit)",
            "route": "/audit",
            "intro": "Change History (Audit Logs) screen tamper-evident, non-repudiation audit trail complying with IATF 16949 and ISO 9001 requirements. Captures microsecond timestamps, user identity, action types, modified entities, before/after diffs, and client IP addresses.",
            "problem": "Record delete pannaalo illa price alter pannaalo yaaru eppo pannaanga nu theriyama internal fraud and audit non-compliance aavatha 100% prevent panna tamper-proof audit thevai.",
            "users": "Super Admin, Compliance Officer, External IATF 16949 Auditor.",
            "visible": [
                "Audit Logs Master Table: Event ID (AUD-2026-014), Timestamp (Exact Date & Second), User Full Name & Email, Assigned Role, Module & Entity (PurchaseOrder / SalesOrder / User / Machine), Action Type (CREATE / UPDATE / DELETE / LOGIN / STATUS_CHANGE), Record Reference (PO-2026-001), Client IP Address, Browser User-Agent",
                "Field Difference (Diff Log) Viewer: Comparing Old Value vs New Value (e.g. Unit Rate altered from ₹48,000 to ₹50,000)",
                "Search & Filter: Filter by User, Date Range, Module, Action Type",
                "Action buttons: 'Export Audit Log to CSV / Excel', 'View Full Event Diff'"
            ],
            "demo_steps": [
                "1. Click 'Change History (Audit)' in sidebar. (A CRITICAL DEMO CLOSING SCREEN FOR AUDIT COMPLIANCE!)",
                "2. Show the table containing 14 transaction audit logs and 46 user authentication logs.",
                "3. Open an 'UPDATE' event on a Purchase Order.",
                "4. Highlight the Field Diff Viewer: Shows exact old value vs new value, who made the change (user email and role), exact second of modification, and client IP address.",
                "5. Highlight that even if a record is deleted or altered, the audit log CANNOT be edited or deleted by anyone.",
                "6. Explain how this 100% satisfies ISO 9001 and IATF 16949 non-repudiation auditor requirements."
            ],
            "script": "Now, namma Change History (Audit) screen-la irukkom. Idhu enterprise security and ISO/IATF 16949 compliance-oda ultimate shield! System-la yaaru login pannaanga, yaaru Purchase Order price alter pannaanga, yaaru user permission change pannaanga — ellaame exact microsecond timestamp, user email, IP address, and Old Value vs New Value diff-oda permanently record aagum. Yaarume indha log-ai delete-o alter-o panna mudiyaadhu, 100% tamper-evident. External auditor audit-ku vandha, single click-la complete compliance audit trail export panni kudukkalaam. Complete non-repudiation and enterprise transparency guarantee!",
            "example": "External IATF auditor asks: 'Show proof of who authorized the rate change on PO-2026-001.' Super Admin opens /audit, filters PO-2026-001, and shows exact timestamp, old price ₹48,000, new price ₹50,000, user identity, and digital sign-off in 10 seconds.",
            "admin_benefit": "Guarantees complete non-repudiation, prevents internal unauthorized data tampering, and passes external IATF/ISO quality audits with flying colors.",
            "advantages": [
                "Tamper-proof, append-only audit trail complies with international standards",
                "Precise field diff logs capture exact before-and-after values for any change",
                "Complete traceability of all user logins, role modifications, and financial transactions"
            ],
            "transition": "All 16 modules and system audit controls complete-ah paathuttom. Ippo indha ERP-oda complete end-to-end business flow-ai single connected story-ah summarize pannuvom."
        }
    ]
}

print("Part 4 data prepared successfully.")
