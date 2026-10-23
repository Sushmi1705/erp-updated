const mongoose = require('mongoose');
const path = require('path');

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const daysAhead = (n) => new Date(Date.now() + n * 864e5);
const gst = (st, pan) => `${st}${pan}1Z${randInt(1, 9)}`;

async function seedMasterAndDemoData() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not ready');
  }

  console.log('=== [SEEDER] Starting Non-Destructive Demo Data Population ===');

  // Load Models
  const M = (p) => require(path.join(__dirname, '..', 'models', p));
  const User = M('User');
  const Role = M('Role');
  const { Company, BusinessUnit, Plant, Department } = M('CompanyStructure');
  const { CustomerCategory, Customer } = M('MasterCustomer');
  const { VendorCategory, Vendor } = M('MasterVendor');
  const { MaterialCategory, Material } = M('MasterMaterial');
  const { ProductCategory, Product } = M('MasterProduct');
  const { Warehouse } = M('MasterWarehouse');
  const { Machine } = M('MasterMachine');
  const { WorkCenter } = M('MasterWorkCenter');
  const { SOHeader, SOLineItem } = M('SalesOrder');
  const { POHeader, POLineItem } = M('PurchaseOrder');
  const InventoryStock = M('InventoryStock');
  const PP = M('ProductionPlan');
  const PlanHeader = PP.PlanHeader;
  const { WOHeader } = M('WorkOrder');
  const { ApprovalRequest } = M('Approval');
  const Issue = M('Issue');
  const { AuditLog, LoginHistory } = M('Audit');
  const { ChartOfAccounts } = M('GeneralLedger');
  const { AccountDetermination } = M('AccountDetermination');
  const { Currency } = M('MasterCurrency');
  const { UOM } = M('MasterUOM');

  // ── 1. Master Currency & UOM Lookups ─────────────────────────────────────
  let inr = await Currency.findOne({ code: 'INR' });
  if (!inr) {
    inr = await Currency.create({ code: 'INR', name: 'Indian Rupee', symbol: '₹', isBase: true, status: 'Active' });
  }
  let uomKg = await UOM.findOne({ symbol: 'kg' });
  if (!uomKg) {
    uomKg = await UOM.create({ name: 'Kilograms', code: 'KG', type: 'Weight', symbol: 'kg' });
  }
  let uomEa = await UOM.findOne({ symbol: 'ea' });
  if (!uomEa) {
    uomEa = await UOM.create({ name: 'Each', code: 'EA', type: 'Quantity', symbol: 'ea' });
  }

  const inrId = inr._id;
  const kgId = uomKg._id;
  const eaId = uomEa._id;

  // ── 2. Admin & Roles ─────────────────────────────────────────────────────
  const admin = await User.findOne({ email: 'admin@example.com' });
  const superAdminRole = await Role.findOne({ name: 'Super Admin' });
  const allUsers = await User.find({});

  // ── 3. LBAP Company Structure ────────────────────────────────────────────
  let company = await Company.findOne({ code: 'LBAP' });
  if (!company) {
    company = await Company.create({
      name: 'Laxmi Balaji Automotive Products Pvt. Ltd.', code: 'LBAP',
      gst: gst('33', 'AAECL4521B'), pan: 'AAECL4521B', email: 'jotheeslbap@gmail.com',
      phone: '+91 99943 97522', address: 'Plot 16-C, 3rd Cross, SIPCOT Industrial Complex Phase 2, Hosur',
      country: 'India', state: 'Tamil Nadu', currency: 'INR', fiscalYear: 'Apr-Mar', status: 'Active'
    });
    console.log('Created Company LBAP');
  }

  let bu = await BusinessUnit.findOne({ code: 'LBAP-SMD' });
  if (!bu) {
    bu = await BusinessUnit.create({
      name: 'Sheet Metal Division', code: 'LBAP-SMD',
      companyId: company._id, status: 'Active'
    });
    console.log('Created Business Unit LBAP-SMD');
  }

  let plant = await Plant.findOne({ code: 'LBAP-HOSUR' });
  if (!plant) {
    plant = await Plant.create({
      name: 'LBAP Hosur', code: 'LBAP-HOSUR',
      companyId: company._id, businessUnitId: bu._id,
      address: 'SIPCOT Phase 2, Hosur-635126, Tamil Nadu', currency: 'INR', status: 'Active'
    });
    console.log('Created Plant LBAP-HOSUR');
  }

  const depts = {};
  for (const [k, nm, cd] of [
    ['press', 'Press Shop', 'DEPT-PRESS'],
    ['weld', 'Weld & Assembly', 'DEPT-WELD'],
    ['tool', 'Tool Room', 'DEPT-TOOL'],
    ['qc', 'Quality', 'DEPT-QC'],
    ['store', 'Stores', 'DEPT-STORE']
  ]) {
    let d = await Department.findOne({ code: cd });
    if (!d) {
      d = await Department.create({ name: nm, code: cd, plantId: plant._id, status: 'Active' });
    }
    depts[k] = d;
  }

  // ── 4. Warehouses ────────────────────────────────────────────────────────
  let whRM = await Warehouse.findOne({ code: 'WH-RM' });
  if (!whRM) whRM = await Warehouse.create({ name: 'Raw Material Store', code: 'WH-RM', plantId: plant._id, type: 'Raw Material', status: 'Active' });

  let whWIP = await Warehouse.findOne({ code: 'WH-WIP' });
  if (!whWIP) whWIP = await Warehouse.create({ name: 'WIP Store', code: 'WH-WIP', plantId: plant._id, type: 'WIP', status: 'Active' });

  let whFG = await Warehouse.findOne({ code: 'WH-FG' });
  if (!whFG) whFG = await Warehouse.create({ name: 'Finished Goods Store', code: 'WH-FG', plantId: plant._id, type: 'Finished Goods', status: 'Active' });

  // ── 5. Categories ────────────────────────────────────────────────────────
  const custCat = {};
  for (const nm of ['OEM', 'Tier-1 Supplier']) {
    let c = await CustomerCategory.findOne({ name: nm });
    if (!c) c = await CustomerCategory.create({ name: nm, status: 'Active' });
    custCat[nm] = c;
  }

  const venCat = {};
  for (const nm of ['Steel Supplier', 'Consumables', 'Tooling & Job Work']) {
    let v = await VendorCategory.findOne({ name: nm });
    if (!v) v = await VendorCategory.create({ name: nm, status: 'Active' });
    venCat[nm] = v;
  }

  const prodCat = {};
  for (const nm of ['Automotive Press Components', 'Sub-Assembly Components', 'Press Tools', 'Non-Automotive Parts']) {
    let p = await ProductCategory.findOne({ name: nm });
    if (!p) p = await ProductCategory.create({ name: nm, status: 'Active' });
    prodCat[nm] = p;
  }

  const matCat = {};
  for (const nm of ['CR Steel', 'HR Steel', 'Coated Steel', 'Stainless & Alloy', 'Consumables', 'Tool Steel']) {
    let m = await MaterialCategory.findOne({ name: nm });
    if (!m) m = await MaterialCategory.create({ name: nm, status: 'Active' });
    matCat[nm] = m;
  }

  // ── 6. Customers ─────────────────────────────────────────────────────────
  const customersData = [
    ['TVS Motor Company Ltd', 'OEM', '33', 'AAACT5626D', 'Hosur, Tamil Nadu', 5000000],
    ['Ashok Leyland Ltd', 'OEM', '33', 'AAACA2831D', 'Ennore, Chennai', 4000000],
    ['Brakes India Pvt Ltd', 'Tier-1 Supplier', '33', 'AABCB0012F', 'Sholinganallur, Chennai', 2500000],
    ['Sundram Fasteners Ltd', 'Tier-1 Supplier', '33', 'AAACS4198L', 'Padi, Chennai', 3000000],
    ['Rane (Madras) Ltd', 'Tier-1 Supplier', '33', 'AAACR1234M', 'Guindy, Chennai', 2000000],
    ['Lucas-TVS Ltd', 'Tier-1 Supplier', '33', 'AAACL7788K', 'Padi, Chennai', 2200000],
    ['Wheels India Ltd', 'Tier-1 Supplier', '33', 'AAACW3421J', 'Padi, Chennai', 1800000],
    ['Bosch Ltd', 'OEM', '29', 'AAACB1479P', 'Adugodi, Bengaluru', 3500000],
    ['Sundaram Clayton Ltd', 'Tier-1 Supplier', '33', 'AAACS9012C', 'Padi, Chennai', 2600000],
    ['Caterpillar India Pvt Ltd', 'OEM', '33', 'AABCC5566H', 'Hosur, Tamil Nadu', 4200000],
    ['Titan Company Ltd', 'OEM', '33', 'AAACT3456E', 'Hosur, Tamil Nadu', 1500000],
    ['India Yamaha Motor Pvt Ltd', 'OEM', '33', 'AAACI7890Q', 'Oragadam, Chennai', 3100000]
  ];

  const customers = [];
  for (let i = 0; i < customersData.length; i++) {
    const [name, cat, st, pan, addr, credit] = customersData[i];
    const code = `CUST-${String(i + 1).padStart(3, '0')}`;
    let cust = await Customer.findOne({ code });
    if (!cust) {
      cust = await Customer.create({
        name, code, categoryId: custCat[cat]._id,
        gst: gst(st, pan), pan, currencyId: inrId, creditLimit: credit,
        email: `purchase@${name.split(' ')[0].toLowerCase()}.com`,
        phone: `+91 ${randInt(70, 99)}${randInt(10000000, 99999999)}`,
        billingAddress: addr, shippingAddress: addr, status: 'Active'
      });
    }
    customers.push(cust);
  }

  // ── 7. Vendors ───────────────────────────────────────────────────────────
  const vendorsData = [
    ['Tata Steel Ltd', 'Steel Supplier', 'AAACT2727Q', 7, 'A'],
    ['JSW Steel Ltd', 'Steel Supplier', 'AAACJ5310R', 8, 'A'],
    ['Steel Authority of India Ltd', 'Steel Supplier', 'AAACS7601B', 12, 'B'],
    ['Jindal Steel & Power Ltd', 'Steel Supplier', 'AAACJ4444D', 10, 'B'],
    ['APL Apollo Tubes Ltd', 'Steel Supplier', 'AAACA9988T', 9, 'B'],
    ['Kalyani Steels Ltd', 'Steel Supplier', 'AAACK1212L', 11, 'B'],
    ['Ador Welding Ltd', 'Consumables', 'AAACA3131W', 5, 'A'],
    ['Balmer Lawrie & Co Ltd', 'Consumables', 'AAACB6262L', 6, 'B'],
    ['Bohler Uddeholm India', 'Tooling & Job Work', 'AAACB8484U', 21, 'B'],
    ['Sri Ganesh Heat Treaters', 'Tooling & Job Work', 'AAFCS9090H', 4, 'C']
  ];

  const vendors = [];
  for (let i = 0; i < vendorsData.length; i++) {
    const [name, cat, pan, lead, rating] = vendorsData[i];
    const code = `VND-${String(i + 1).padStart(3, '0')}`;
    let vend = await Vendor.findOne({ code });
    if (!vend) {
      vend = await Vendor.create({
        name, code, categoryId: venCat[cat]._id,
        gst: gst(rnd(['27', '29', '33', '19']), pan), pan, rating, leadTimeDays: lead,
        currencyId: inrId, contactPerson: rnd(['R. Kumar', 'S. Menon', 'A. Iyer', 'V. Reddy', 'P. Nair']),
        phone: `+91 ${randInt(70, 99)}${randInt(10000000, 99999999)}`,
        email: `sales@${name.split(' ')[0].toLowerCase()}.com`, address: `${cat} depot`, status: 'Active'
      });
    }
    vendors.push(vend);
  }
  const steelVendors = vendors.filter((_, i) => vendorsData[i][1] === 'Steel Supplier');

  // ── 8. Raw Materials ─────────────────────────────────────────────────────
  const materialsData = [
    ['CRCA Coil 0.8mm', 'CR Steel', 'CRCA D513', 62, 3000, 5200, '7209'],
    ['CRCA Coil 1.2mm', 'CR Steel', 'CRCA D513', 61, 3000, 2400, '7209'],
    ['CRCA Coil 1.6mm', 'CR Steel', 'CRCA D513', 60, 2500, 4100, '7209'],
    ['HR Coil 2.0mm', 'HR Steel', 'IS 2062 E250', 56, 4000, 7800, '7208'],
    ['HR Coil 3.0mm', 'HR Steel', 'IS 2062 E250', 55, 3500, 3100, '7208'],
    ['GI Sheet 1.0mm', 'Coated Steel', 'GI 120 GSM', 68, 2000, 1500, '7210'],
    ['SS 304 Sheet 1.0mm', 'Stainless & Alloy', 'SS 304 2B', 245, 800, 950, '7219'],
    ['Aluminium Sheet 1.5mm', 'Stainless & Alloy', 'AA 5052', 280, 600, 420, '7606'],
    ['MIG Welding Wire ER70S', 'Consumables', 'ER70S-6', 135, 500, 680, '8311'],
    ['Tool Steel D2 Block', 'Tool Steel', 'AISI D2', 340, 200, 260, '7228']
  ];

  const materials = [];
  for (let i = 0; i < materialsData.length; i++) {
    const [name, cat, grade, cost, reorder, , hsn] = materialsData[i];
    const code = `MAT-${String(i + 1).padStart(3, '0')}`;
    let mat = await Material.findOne({ code });
    if (!mat) {
      mat = await Material.create({
        name, code, categoryId: matCat[cat]._id, uomId: kgId,
        Material_Type: cat === 'Consumables' ? 'SPARE_PART' : 'RAW_MATERIAL', grade,
        standardCost: cost, hsnCode: hsn, leadTimeDays: randInt(5, 15),
        reorderLevel: reorder, Reorder_Point: reorder, minStock: Math.round(reorder * 0.6),
        Safety_Stock_Level: Math.round(reorder * 0.5), maxStock: reorder * 4,
        preferredVendorId: rnd(steelVendors)._id, status: 'Active'
      });
    }
    materials.push(mat);
  }

  // ── 9. Products ──────────────────────────────────────────────────────────
  const productsData = [
    ['Brake Pedal Bracket', 'Automotive Press Components', 48, 31, '8708'],
    ['Clutch Pedal Bracket', 'Automotive Press Components', 52, 34, '8708'],
    ['Side Stand Bracket', 'Automotive Press Components', 34, 22, '8714'],
    ['Silencer Mounting Bracket', 'Automotive Press Components', 41, 27, '8708'],
    ['Fuel Tank Mounting Bracket', 'Automotive Press Components', 57, 38, '8708'],
    ['Mudguard Stay', 'Automotive Press Components', 29, 18, '8714'],
    ['Number Plate Bracket', 'Automotive Press Components', 18, 11, '8708'],
    ['Footrest Bracket LH/RH', 'Automotive Press Components', 44, 29, '8714'],
    ['Seat Mounting Frame', 'Sub-Assembly Components', 128, 86, '8708'],
    ['Cross Member Assembly', 'Sub-Assembly Components', 210, 142, '8708'],
    ['Battery Tray Assembly', 'Sub-Assembly Components', 88, 59, '8708'],
    ['Engine Mounting Bracket', 'Sub-Assembly Components', 112, 74, '8708'],
    ['Exhaust Heat Shield', 'Automotive Press Components', 95, 63, '8708'],
    ['Blanking Die - Bracket', 'Press Tools', 185000, 132000, '8207'],
    ['Precision Turned Spacer', 'Non-Automotive Parts', 12, 7, '8483']
  ];

  const products = [];
  for (let i = 0; i < productsData.length; i++) {
    const [name, cat, price, cost, hsn] = productsData[i];
    const code = `PRD-${String(i + 1).padStart(3, '0')}`;
    let prod = await Product.findOne({ code });
    if (!prod) {
      prod = await Product.create({
        name, code, categoryId: prodCat[cat]._id, uomId: eaId,
        hsnCode: hsn, sellingPrice: price, standardCost: cost, weight: +(Math.random() * 3 + 0.2).toFixed(2),
        currentRevision: '1.0', defaultWarehouseId: whFG._id, status: 'Active'
      });
    }
    products.push(prod);
  }
  const sellable = products.filter((_, i) => productsData[i][1] !== 'Press Tools');

  // ── 10. Machines ─────────────────────────────────────────────────────────
  const machinesData = [
    ['Power Press 250T #1', 'Shri Balaji', 850],
    ['Power Press 250T #2', 'Shri Balaji', 850],
    ['Power Press 160T', 'Shri Balaji', 620],
    ['Power Press 63T', 'Ameteep', 380],
    ['Mechanical Press 60T', 'Neel Kanth', 300],
    ['CNC Laser Cutting Machine', 'Trumpf', 1400],
    ['CNC Press Brake', 'Amada', 720],
    ['Hydraulic Shearing Machine', 'T.E.E', 260],
    ['5-Axis Tube Bending Machine', 'BLM', 900],
    ['MIG Welding Station #1', 'Pro Tech', 180]
  ];

  const machines = [];
  for (let i = 0; i < machinesData.length; i++) {
    const [name, mfr, rate] = machinesData[i];
    const code = `MC-${String(i + 1).padStart(3, '0')}`;
    let mc = await Machine.findOne({ code });
    if (!mc) {
      const dept = name.includes('Weld') ? depts.weld : name.includes('Laser') || name.includes('Bending') ? depts.tool : depts.press;
      mc = await Machine.create({
        name, code, plantId: plant._id, departmentId: dept._id,
        hourlyCost: rate, capacity: randInt(200, 2000), manufacturer: mfr, status: 'Active'
      });
    }
    machines.push(mc);
  }

  // ── 11. Work Centers ─────────────────────────────────────────────────────
  const wcData = [
    ['Press Shop', 'WC-PRESS', 'press'],
    ['Weld & Assembly', 'WC-WELD', 'weld'],
    ['Tool Room', 'WC-TOOL', 'tool'],
    ['Quality Lab', 'WC-QC', 'qc']
  ];
  const workcenters = [];
  for (const [nm, cd, dk] of wcData) {
    let wc = await WorkCenter.findOne({ code: cd });
    if (!wc) {
      wc = await WorkCenter.create({
        name: nm, code: cd, plantId: plant._id, departmentId: depts[dk]._id,
        efficiencyRate: +(0.78 + Math.random() * 0.15).toFixed(2), baseDailyHours: 16, status: 'Active'
      });
    }
    workcenters.push(wc);
  }

  // ── 12. Inventory Stock on Raw Materials ─────────────────────────────────
  for (let i = 0; i < materials.length; i++) {
    const onHand = materialsData[i][5];
    const existingStock = await InventoryStock.findOne({ materialId: materials[i]._id, warehouseId: whRM._id });
    if (!existingStock) {
      await InventoryStock.create({
        batchNumber: `RM-${materials[i].code}-${randInt(1000, 9999)}`, materialId: materials[i]._id,
        warehouseId: whRM._id, quantityAvailable: onHand, unitCost: materialsData[i][3], uomId: kgId,
        status: 'Active', postingDate: daysAgo(randInt(2, 40))
      });
    }
  }

  // ── 13. Sales Orders ─────────────────────────────────────────────────────
  const existingSOCount = await SOHeader.countDocuments({ customerId: { $in: customers.map((c) => c._id) } });
  if (existingSOCount === 0) {
    const SO_STATUS = ['Approved', 'Processing', 'Partially Shipped', 'Draft', 'Completed', 'Approved', 'Processing'];
    for (let s = 0; s < 11; s++) {
      const cust = rnd(customers);
      const status = SO_STATUS[s % SO_STATUS.length];
      const so = await SOHeader.create({
        orderNumber: `SO-${daysAgo(0).getFullYear()}-${String(1001 + s)}`, customerId: cust._id,
        orderDate: daysAgo(randInt(1, 55)), currencyId: inrId, status, holdStatus: 'None',
        deliveryCommitmentDate: s % 4 === 0 ? daysAgo(randInt(1, 6)) : daysAhead(randInt(4, 40))
      });
      let sub = 0;
      const lineCount = randInt(1, 3);
      for (let l = 0; l < lineCount; l++) {
        const p = rnd(sellable);
        const qty = randInt(500, 12000);
        const price = productsData[products.indexOf(p)][2];
        const total = qty * price;
        sub += total;
        await SOLineItem.create({
          orderId: so._id, lineSequence: (l + 1) * 10, productId: p._id, orderedQuantity: qty,
          uomId: eaId, unitPrice: price, lineTotal: total,
          atpStatus: rnd(['Fully Allocated', 'Partially Allocated', 'Backordered']),
          fulfillmentType: rnd(['From Stock', 'Production Required'])
        });
      }
      so.subTotal = sub;
      so.grandTotal = Math.round(sub * 1.18);
      await so.save();
    }
    console.log('Seeded 11 Sales Orders');
  }

  // ── 14. Purchase Orders ──────────────────────────────────────────────────
  const existingPOCount = await POHeader.countDocuments({ vendorId: { $in: vendors.map((v) => v._id) } });
  if (existingPOCount === 0) {
    for (let s = 0; s < 6; s++) {
      const vendor = rnd(steelVendors);
      const po = await POHeader.create({
        poNumber: `PO-${daysAgo(0).getFullYear()}-${String(2001 + s)}`, vendorId: vendor._id,
        date: daysAgo(randInt(1, 30)), paymentTerms: rnd(['Net30', 'Net60']), incoterms: 'DDP',
        approvalStatus: rnd(['Approved', 'Approved', 'Pending']),
        deliveryStatus: rnd(['Not Scheduled', 'In-Transit', 'Delivered']), totalAmount: 0
      });
      let tot = 0;
      const lineCount = randInt(1, 2);
      for (let l = 0; l < lineCount; l++) {
        const mat = rnd(materials.filter((_, i) => materialsData[i][1].includes('Steel')));
        const qty = randInt(2000, 10000);
        const price = materialsData[materials.indexOf(mat)][3];
        const total = qty * price;
        tot += total;
        await POLineItem.create({
          poId: po._id, materialId: mat._id, orderQty: qty, unitPrice: price, total,
          promisedDeliveryDate: daysAhead(randInt(3, 20)), lineStatus: 'Open'
        });
      }
      po.totalAmount = tot;
      await po.save();
    }
    console.log('Seeded 6 Purchase Orders');
  }

  // ── 15. Production Plan & Work Orders ────────────────────────────────────
  let plan = await PlanHeader.findOne({ Plan_Number: `PP-${daysAgo(0).getFullYear()}-01` });
  if (!plan) {
    plan = await PlanHeader.create({ Plan_Number: `PP-${daysAgo(0).getFullYear()}-01`, Plant_ID: plant._id, Status: 'Released' });
  }
  const existingWOCount = await WOHeader.countDocuments({ Plant_ID: plant._id });
  if (existingWOCount === 0) {
    let woCount = 0;
    for (const st of ['Released', 'In Progress', 'In Progress', 'Draft']) {
      await WOHeader.create({
        WO_Number: `WO-${daysAgo(0).getFullYear()}-${String(3001 + woCount)}`,
        Source_Plan_ID: plan._id, Plant_ID: plant._id, Status: st,
        Overall_Progress_Percentage: st === 'In Progress' ? randInt(20, 80) : 0
      });
      woCount++;
    }
    console.log('Seeded 4 Work Orders');
  }

  // ── 16. Run Module Seeders (10 to 80) ─────────────────────────────────────
  const { buildContext } = require('../../seeds/context.cjs');
  const ctx = await buildContext();

  const moduleFiles = [
    '10-sales.cjs',
    '20-procurement.cjs',
    '30-inventory.cjs',
    '40-production.cjs',
    '50-shopfloor.cjs',
    '60-quality.cjs',
    '70-finance.cjs',
    '80-engineering-planning.cjs'
  ];

  const seedResults = {};
  for (const file of moduleFiles) {
    const filePath = path.join(__dirname, '../../seeds', file);
    try {
      delete require.cache[require.resolve(filePath)];
      const seeder = require(filePath);
      const res = await seeder.run(ctx);
      seedResults[seeder.name || file] = res;
      console.log(`[SEEDER] ${seeder.name || file} completed successfully`);
    } catch (err) {
      console.error(`[SEEDER] ${file} failed:`, err.message);
    }
  }

  // ── 17. Setup Account Determination ──────────────────────────────────────
  const NEW_ACCOUNTS = [
    { Account_ID: '1520', Account_Number: '1520', Account_Name: 'Work in Progress — Press Shop', Account_Type: 'Asset' },
    { Account_ID: '2050', Account_Number: '2050', Account_Name: 'Goods Received Not Invoiced (GR/IR)', Account_Type: 'Liability', Is_Control_Account: true },
    { Account_ID: '5900', Account_Number: '5900', Account_Name: 'Scrap & Rejection Loss', Account_Type: 'Expense' }
  ];
  for (const acc of NEW_ACCOUNTS) {
    const existing = await ChartOfAccounts.findOne({ Account_Number: acc.Account_Number });
    if (!existing) {
      await ChartOfAccounts.create({ ...acc, Status: 'Active' });
    }
  }
  const byCode = {};
  for (const a of await ChartOfAccounts.find({})) byCode[a.Account_Number] = a;

  const RULES = [
    { Movement_Type: 'GOODS_RECEIPT', Valuation_Class: '*', debit: '1500', credit: '2050', Description: 'Material received from supplier' },
    { Movement_Type: 'VENDOR_BILL_CLEARING', Valuation_Class: '*', debit: '2050', credit: '2000', Description: "Supplier's bill received" },
    { Movement_Type: 'GOODS_ISSUE_PRODUCTION', Valuation_Class: '*', debit: '1520', credit: '1500', Description: 'Material issued to production' },
    { Movement_Type: 'PRODUCTION_RECEIPT', Valuation_Class: '*', debit: '1550', credit: '1520', Description: 'Finished parts booked in' },
    { Movement_Type: 'DISPATCH_COGS', Valuation_Class: '*', debit: '5000', credit: '1550', Description: 'Goods despatched to customer' },
    { Movement_Type: 'SCRAP_LOSS', Valuation_Class: '*', debit: '5900', credit: '1520', Description: 'Parts spoiled on the press' },
    { Movement_Type: 'STOCK_ADJUSTMENT', Valuation_Class: '*', debit: '5900', credit: '1500', Description: 'Physical count correction' }
  ];
  for (const { debit, credit, ...rule } of RULES) {
    const dr = byCode[debit], cr = byCode[credit];
    if (dr && cr) {
      await AccountDetermination.findOneAndUpdate(
        { Movement_Type: rule.Movement_Type, Valuation_Class: rule.Valuation_Class },
        { ...rule, Debit_Account_ID: dr._id, Credit_Account_ID: cr._id, Status: 'Active' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  // ── 18. Pending Approvals for Super Admin ────────────────────────────────
  const roleAdminId = superAdminRole ? superAdminRole._id : admin._id;
  const sampleUsers = allUsers.length ? allUsers : [admin];

  // Add domain-wide pending approval requests
  const EXTRA_APPROVALS = [
    {
      module: 'PurchaseOrder', action: 'create', status: 'Pending',
      payload: { poNumber: 'PO-2026-2005', supplier: 'JSW Steel Ltd', totalAmount: 540000, items: 'CRCA Coil 1.6mm (9,000 kg)', note: 'Exceeds standard buyer delegation limit of ₹2,50,000' }
    },
    {
      module: 'SalesOrder', action: 'update', status: 'Pending',
      payload: { orderNumber: 'SO-2026-1004', customer: 'Sundram Fasteners Ltd', grandTotal: 480000, note: 'Special credit limit override for delivery schedule release' }
    },
    {
      module: 'ScrapManagement', action: 'create', status: 'Pending',
      payload: { scrapReportId: 'SCRAP-2026-044', machine: 'Power Press 250T #1', partNumber: 'PRD-010', scrappedWeightKg: 420, scrapValueInr: 25620, rootCause: 'Die fracture during progressive blanking' }
    },
    {
      module: 'QualityNonConformance', action: 'create', status: 'Pending',
      payload: { ncrNumber: 'NCR-2026-088', material: 'CRCA Coil 1.6mm', lotSizeKg: 4100, severity: 'Major', disposition: 'Accept with deviation / edge-trimming' }
    },
    {
      module: 'EngineeringChange', action: 'create', status: 'Pending',
      payload: { ecrNumber: 'ECR-2026-004', title: 'Renest SS 304 heat shield blank for scrap reduction', estimatedSavingPerPiece: '₹7.35', toolingCost: '₹35,000' }
    },
    {
      module: 'WorkOrder', action: 'update', status: 'Pending',
      payload: { woNumber: 'WO-2026-3005', product: 'Cross Member Assembly', quantity: 2400, priority: 'Rush Expedite', note: 'Customer line-stoppage prevention' }
    }
  ];

  for (let i = 0; i < EXTRA_APPROVALS.length; i++) {
    const item = EXTRA_APPROVALS[i];
    await ApprovalRequest.create({
      module: item.module,
      action: item.action,
      payload: item.payload,
      requestedBy: sampleUsers[i % sampleUsers.length]._id,
      status: 'Pending',
      currentLevel: 1,
      requiredLevels: [
        { level: 1, roleId: roleAdminId, status: 'Pending' }
      ],
      createdAt: daysAgo(randInt(1, 10))
    });
  }
  console.log('Seeded pending ApprovalRequests for Super Admin inbox');

  // ── 19. Issues Queue ─────────────────────────────────────────────────────
  const existingIssues = await Issue.countDocuments();
  if (existingIssues === 0) {
    const SAMPLE_ISSUES = [
      {
        reference: 'ISS-2026-0001',
        kind: 'Problem',
        description: 'Barcode scanner on Press 250T #1 intermittently dropping last digit of coil batch number when scanning heat tags.',
        reportedByName: 'Selvaraj Murugan',
        roleName: 'Shop Floor Supervisor',
        screenPath: '/shopfloor/machine',
        screenName: 'Machine Utilization & Shop Floor',
        status: 'In Progress',
        severity: 'Painful',
        response: 'IT maintenance scheduled barcode reader firmware update on Monday morning shift.',
        createdAt: daysAgo(4)
      },
      {
        reference: 'ISS-2026-0002',
        kind: 'Idea',
        description: 'Add auto-refresh toggle (every 30s) on Shop Floor live machine status and stroke counter screen.',
        reportedByName: 'Suresh Babu',
        roleName: 'Plant Manager',
        screenPath: '/shopfloor/machine',
        screenName: 'Machine Monitoring',
        status: 'New',
        severity: 'Minor',
        createdAt: daysAgo(2)
      },
      {
        reference: 'ISS-2026-0003',
        kind: 'Problem',
        description: 'Thickness tolerance on CRCA 1.6mm needs 2 decimal precision (e.g. 1.58mm) in QA in-process measurement log.',
        reportedByName: 'Priya Sundaram',
        roleName: 'Quality Inspector',
        screenPath: '/quality/in-process',
        screenName: 'In-Process Quality Inspection',
        status: 'Seen',
        severity: 'Painful',
        response: 'Parameter precision configuration updated to 3 decimal places.',
        createdAt: daysAgo(6)
      },
      {
        reference: 'ISS-2026-0004',
        kind: 'Question',
        description: 'Where can we verify GST GSTR-1 outward supply JSON export before filing on the GST portal?',
        reportedByName: 'Meenakshi Krishnan',
        roleName: 'Accounts Executive',
        screenPath: '/finance/tax',
        screenName: 'Tax Management & Filing',
        status: 'Fixed',
        severity: 'Minor',
        response: 'Available under Finance -> Tax Management -> GSTR-1 Export button.',
        createdAt: daysAgo(12)
      },
      {
        reference: 'ISS-2026-0005',
        kind: 'Crash',
        description: 'Timeout error when exporting multi-month general ledger with more than 5,000 journal lines.',
        reportedByName: 'Meenakshi Krishnan',
        roleName: 'Accounts Executive',
        screenPath: '/finance/ledger',
        screenName: 'General Ledger',
        status: 'In Progress',
        severity: 'Blocking',
        response: 'Added server-side streaming pagination to ledger export endpoint.',
        createdAt: daysAgo(1)
      },
      {
        reference: 'ISS-2026-0006',
        kind: 'Problem',
        description: 'Goods Receipt Note print slip should show the vendor mill heat certificate number in bold.',
        reportedByName: 'Muthuvel Pandian',
        roleName: 'Store Keeper',
        screenPath: '/receipt/grn',
        screenName: 'Goods Receipt Note',
        status: 'Fixed',
        severity: 'Minor',
        response: 'GRN barcode template updated with prominent Heat No header.',
        createdAt: daysAgo(18)
      }
    ];

    for (const is of SAMPLE_ISSUES) {
      await Issue.create(is);
    }
    console.log('Seeded 6 Issue Queue tickets');
  }

  // ── 20. Audit Logs & Login History ───────────────────────────────────────
  const existingAudit = await AuditLog.countDocuments();
  if (existingAudit === 0) {
    const AUDIT_MODULES = [
      ['SalesOrder', 'CREATE', { orderNumber: 'SO-2026-1001', customer: 'TVS Motor Company Ltd', grandTotal: 258000 }],
      ['SalesOrder', 'UPDATE', { orderNumber: 'SO-2026-1002', status: 'Processing' }],
      ['PurchaseOrder', 'CREATE', { poNumber: 'PO-2026-2001', vendor: 'Tata Steel Ltd', totalAmount: 488000 }],
      ['PurchaseOrder', 'UPDATE', { poNumber: 'PO-2026-2002', approvalStatus: 'Approved' }],
      ['EngineeringBOM', 'CREATE', { bomCode: 'BOM-P001', product: 'Brake Pedal Bracket', revision: '1.0' }],
      ['EngineeringChange', 'CREATE', { ecrNumber: 'ECR-2026-004', title: 'Renest SS 304 heat shield blank' }],
      ['WorkOrder', 'UPDATE', { WO_Number: 'WO-2026-3001', Status: 'In Progress' }],
      ['ProductionOutput', 'CREATE', { outputId: 'POUT-2026-081', part: 'PRD-001', quantityProduced: 1200 }],
      ['QualityInspection', 'CREATE', { type: 'Incoming', heatNo: 'HT-9921', result: 'Accepted' }],
      ['GoodsReceipt', 'CREATE', { grnNumber: 'GRN-2026-5001', material: 'CRCA Coil 0.8mm', quantity: 5200 }],
      ['GeneralLedger', 'CREATE', { voucherNumber: 'JV-2026-0104', type: 'GoodsReceipt', amount: 322400 }],
      ['Customer', 'CREATE', { code: 'CUST-012', name: 'India Yamaha Motor Pvt Ltd', creditLimit: 3100000 }],
      ['Machine', 'UPDATE', { code: 'MC-001', status: 'Running', operator: 'Selvaraj Murugan' }],
      ['Role', 'UPDATE', { roleName: 'Purchase Officer', permissionUpdated: 'Approvals' }]
    ];

    for (let i = 0; i < AUDIT_MODULES.length; i++) {
      const [mod, act, changes] = AUDIT_MODULES[i];
      const usr = sampleUsers[i % sampleUsers.length];
      await AuditLog.create({
        action: act,
        module: mod,
        changedBy: usr._id,
        ipAddress: `192.168.1.${randInt(10, 80)}`,
        newValue: changes,
        createdAt: daysAgo(randInt(1, 28))
      });
    }

    const LOGINS = [
      { email: 'admin@example.com', status: 'Success' },
      { email: 'sales.exec@lbap.in', status: 'Success' },
      { email: 'purchase.officer@lbap.in', status: 'Success' },
      { email: 'store.keeper@lbap.in', status: 'Success' },
      { email: 'production.planner@lbap.in', status: 'Success' },
      { email: 'shopfloor.supervisor@lbap.in', status: 'Success' },
      { email: 'quality.inspector@lbap.in', status: 'Success' },
      { email: 'maintenance.engineer@lbap.in', status: 'Success' },
      { email: 'dispatch.coordinator@lbap.in', status: 'Success' },
      { email: 'accounts.executive@lbap.in', status: 'Success' },
      { email: 'plant.manager@lbap.in', status: 'Success' }
    ];

    for (let i = 0; i < LOGINS.length; i++) {
      await LoginHistory.create({
        email: LOGINS[i].email,
        status: LOGINS[i].status,
        ipAddress: `192.168.1.${randInt(10, 80)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36',
        createdAt: daysAgo(randInt(0, 5))
      });
    }
    console.log('Seeded Audit Logs & Login History');
  }

  console.log('=== [SEEDER] All Modules Seeded Successfully Without Affecting Existing Data ===');

  return {
    success: true,
    message: 'Master and operational dummy data populated across all modules.',
    seedResults
  };
}

module.exports = { seedMasterAndDemoData };
