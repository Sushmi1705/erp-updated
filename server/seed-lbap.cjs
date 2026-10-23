/* Coherent demo seed for Laxmi Balaji Automotive Products (lbap.in).
 *
 * Clears the accumulated test junk (dasd/bmw/TESTING/OLA/FLOWTEST/…) from the
 * business collections — never from auth/config — and seeds a realistic,
 * connected cycle grounded in what LBAP actually is: a Hosur SIPCOT sheet-metal
 * press shop serving the Tamil Nadu / Karnataka auto belt. Real customers,
 * steel vendors, pressed-component products, steel-grade raw materials, their
 * own presses, and a live set of sales orders, purchase orders, inventory and
 * work orders. All money is Indian rupees.
 *
 *   node seed-lbap.cjs
 */
require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const randInt = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
const daysAgo = (n) => new Date(Date.now() - n * 864e5);
const daysAhead = (n) => new Date(Date.now() + n * 864e5);
const gst = (st, pan) => `${st}${pan}1Z${randInt(1, 9)}`;

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // ── 1. Clear business collections; preserve auth + config ────────────────
  const PRESERVE = new Set([
    'users', 'roles', 'permissions', 'systemconfigurations', 'systemconfigs',
    'currencies', 'uoms', 'uomconversions', 'loginhistories', 'auditlogs',
    'docsequences', 'approvalconfigs', 'paymentterms'
  ]);
  const existing = (await db.listCollections().toArray()).map((c) => c.name);
  let cleared = 0;
  for (const name of existing) {
    if (PRESERVE.has(name)) continue;
    const n = await db.collection(name).countDocuments();
    if (n) { await db.collection(name).deleteMany({}); cleared += n; }
  }
  console.log(`cleared ${cleared} junk docs from ${existing.length - PRESERVE.size} business collections`);

  // Models (registers schemas + defaults + validation)
  const M = (p) => require('./src/models/' + p);
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

  // Reuse the real currency + units that already exist.
  const inr = await db.collection('currencies').findOne({ code: 'INR' });
  const uomKg = await db.collection('uoms').findOne({ symbol: 'kg' });
  const uomEa = await db.collection('uoms').findOne({ symbol: 'ea' });
  const inrId = inr?._id, kgId = uomKg?._id, eaId = uomEa?._id;

  // ── 2. Org: one clean LBAP company / plant / departments ─────────────────
  const company = await Company.create({
    name: 'Laxmi Balaji Automotive Products Pvt. Ltd.', code: 'LBAP',
    gst: gst('33', 'AAECL4521B'), pan: 'AAECL4521B', email: 'jotheeslbap@gmail.com',
    phone: '+91 99943 97522', address: 'Plot 16-C, 3rd Cross, SIPCOT Industrial Complex Phase 2, Hosur',
    country: 'India', state: 'Tamil Nadu', currency: 'INR', fiscalYear: 'Apr-Mar', status: 'Active'
  });
  const bu = await BusinessUnit.create({ name: 'Sheet Metal Division', code: 'LBAP-SMD', companyId: company._id, status: 'Active' });
  const plant = await Plant.create({
    name: 'LBAP Hosur', code: 'LBAP-HOSUR', companyId: company._id, businessUnitId: bu._id,
    address: 'SIPCOT Phase 2, Hosur-635126, Tamil Nadu', currency: 'INR', status: 'Active'
  });
  const depts = {};
  for (const [k, nm, cd] of [
    ['press', 'Press Shop', 'DEPT-PRESS'], ['weld', 'Weld & Assembly', 'DEPT-WELD'],
    ['tool', 'Tool Room', 'DEPT-TOOL'], ['qc', 'Quality', 'DEPT-QC'], ['store', 'Stores', 'DEPT-STORE']
  ]) depts[k] = await Department.create({ name: nm, code: cd, plantId: plant._id, status: 'Active' });

  // ── 3. Warehouses ─────────────────────────────────────────────────────────
  const whRM = await Warehouse.create({ name: 'Raw Material Store', code: 'WH-RM', plantId: plant._id, status: 'Active' });
  const whWIP = await Warehouse.create({ name: 'WIP Store', code: 'WH-WIP', plantId: plant._id, status: 'Active' });
  const whFG = await Warehouse.create({ name: 'Finished Goods Store', code: 'WH-FG', plantId: plant._id, status: 'Active' });

  // ── 4. Categories ─────────────────────────────────────────────────────────
  const custCat = {};
  for (const nm of ['OEM', 'Tier-1 Supplier']) custCat[nm] = await CustomerCategory.create({ name: nm, status: 'Active' });
  const venCat = {};
  for (const nm of ['Steel Supplier', 'Consumables', 'Tooling & Job Work']) venCat[nm] = await VendorCategory.create({ name: nm, status: 'Active' });
  const prodCat = {};
  for (const nm of ['Automotive Press Components', 'Sub-Assembly Components', 'Press Tools', 'Non-Automotive Parts']) prodCat[nm] = await ProductCategory.create({ name: nm, status: 'Active' });
  const matCat = {};
  for (const nm of ['CR Steel', 'HR Steel', 'Coated Steel', 'Stainless & Alloy', 'Consumables', 'Tool Steel']) matCat[nm] = await MaterialCategory.create({ name: nm, status: 'Active' });

  // ── 5. Customers — Hosur / TN–KA auto belt ───────────────────────────────
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
    customers.push(await Customer.create({
      name, code: `CUST-${String(i + 1).padStart(3, '0')}`, categoryId: custCat[cat]._id,
      gst: gst(st, pan), pan, currencyId: inrId, creditLimit: credit,
      email: `purchase@${name.split(' ')[0].toLowerCase()}.com`, phone: `+91 ${randInt(70, 99)}${randInt(10000000, 99999999)}`,
      billingAddress: addr, shippingAddress: addr, status: 'Active'
    }));
  }

  // ── 6. Vendors — steel mills + consumables + tooling ─────────────────────
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
    vendors.push(await Vendor.create({
      name, code: `VND-${String(i + 1).padStart(3, '0')}`, categoryId: venCat[cat]._id,
      gst: gst(rnd(['27', '29', '33', '19']), pan), pan, rating, leadTimeDays: lead,
      currencyId: inrId, contactPerson: rnd(['R. Kumar', 'S. Menon', 'A. Iyer', 'V. Reddy', 'P. Nair']),
      phone: `+91 ${randInt(70, 99)}${randInt(10000000, 99999999)}`,
      email: `sales@${name.split(' ')[0].toLowerCase()}.com`, address: `${cat} depot`, status: 'Active'
    }));
  }
  const steelVendors = vendors.filter((_, i) => vendorsData[i][1] === 'Steel Supplier');

  // ── 7. Raw materials — steel grades, priced in ₹/kg ──────────────────────
  const materialsData = [
    // name, category, grade, ₹/kg, reorderKg, onHandKg, hsn
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
    materials.push(await Material.create({
      name, code: `MAT-${String(i + 1).padStart(3, '0')}`, categoryId: matCat[cat]._id, uomId: kgId,
      Material_Type: cat === 'Consumables' ? 'SPARE_PART' : 'RAW_MATERIAL', grade,
      standardCost: cost, hsnCode: hsn, leadTimeDays: randInt(5, 15),
      reorderLevel: reorder, Reorder_Point: reorder, minStock: Math.round(reorder * 0.6),
      Safety_Stock_Level: Math.round(reorder * 0.5), maxStock: reorder * 4,
      preferredVendorId: rnd(steelVendors)._id, status: 'Active'
    }));
  }

  // ── 8. Products — pressed automotive components, priced in ₹/piece ────────
  const productsData = [
    // name, category, ₹/piece, stdCost, hsn
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
    products.push(await Product.create({
      name, code: `PRD-${String(i + 1).padStart(3, '0')}`, categoryId: prodCat[cat]._id, uomId: eaId,
      hsnCode: hsn, sellingPrice: price, standardCost: cost, weight: +(Math.random() * 3 + 0.2).toFixed(2),
      currentRevision: '1.0', defaultWarehouseId: whFG._id, status: 'Active'
    }));
  }
  const sellable = products.filter((_, i) => productsData[i][1] !== 'Press Tools');

  // ── 9. Machines — LBAP's actual press line ───────────────────────────────
  const machinesData = [
    ['Power Press 250T #1', 'Shri Balaji', 850], ['Power Press 250T #2', 'Shri Balaji', 850],
    ['Power Press 160T', 'Shri Balaji', 620], ['Power Press 63T', 'Ameteep', 380],
    ['Mechanical Press 60T', 'Neel Kanth', 300], ['CNC Laser Cutting Machine', 'Trumpf', 1400],
    ['CNC Press Brake', 'Amada', 720], ['Hydraulic Shearing Machine', 'T.E.E', 260],
    ['5-Axis Tube Bending Machine', 'BLM', 900], ['MIG Welding Station #1', 'Pro Tech', 180]
  ];
  const machines = [];
  for (let i = 0; i < machinesData.length; i++) {
    const [name, mfr, rate] = machinesData[i];
    const dept = name.includes('Weld') ? depts.weld : name.includes('Laser') || name.includes('Bending') ? depts.tool : depts.press;
    machines.push(await Machine.create({
      name, code: `MC-${String(i + 1).padStart(3, '0')}`, plantId: plant._id, departmentId: dept._id,
      hourlyCost: rate, capacity: randInt(200, 2000), manufacturer: mfr, status: 'Active'
    }));
  }

  // ── 10. Work centres ─────────────────────────────────────────────────────
  const wcData = [['Press Shop', 'WC-PRESS', 'press'], ['Weld & Assembly', 'WC-WELD', 'weld'], ['Tool Room', 'WC-TOOL', 'tool'], ['Quality Lab', 'WC-QC', 'qc']];
  for (const [nm, cd, dk] of wcData) await WorkCenter.create({ name: nm, code: cd, plantId: plant._id, departmentId: depts[dk]._id, efficiencyRate: +(0.78 + Math.random() * 0.15).toFixed(2), baseDailyHours: 16, status: 'Active' });

  // ── 11. Inventory stock on raw materials (kg) ────────────────────────────
  for (let i = 0; i < materials.length; i++) {
    const onHand = materialsData[i][5];
    await InventoryStock.create({
      batchNumber: `RM-${materials[i].code}-${randInt(1000, 9999)}`, materialId: materials[i]._id,
      warehouseId: whRM._id, quantityAvailable: onHand, unitCost: materialsData[i][3], uomId: kgId,
      status: 'Active', postingDate: daysAgo(randInt(2, 40))
    });
  }

  // ── 12. Sales orders — the live order book ───────────────────────────────
  const SO_STATUS = ['Approved', 'Processing', 'Partially Shipped', 'Draft', 'Completed', 'Approved', 'Processing'];
  let soCount = 0;
  for (let s = 0; s < 11; s++) {
    const cust = rnd(customers);
    const status = SO_STATUS[s % SO_STATUS.length];
    const so = await SOHeader.create({
      orderNumber: `SO-${daysAgo(0).getFullYear()}-${String(1001 + s)}`, customerId: cust._id,
      orderDate: daysAgo(randInt(1, 55)), currencyId: inrId, status, holdStatus: 'None',
      deliveryCommitmentDate: s % 4 === 0 ? daysAgo(randInt(1, 6)) : daysAhead(randInt(4, 40)) // some overdue
    });
    let sub = 0; const lineCount = randInt(1, 3);
    for (let l = 0; l < lineCount; l++) {
      const p = rnd(sellable); const qty = randInt(500, 12000) * (Math.random() < 0.3 ? 1 : 1);
      const price = productsData[products.indexOf(p)][2]; const total = qty * price; sub += total;
      await SOLineItem.create({
        orderId: so._id, lineSequence: (l + 1) * 10, productId: p._id, orderedQuantity: qty,
        uomId: eaId, unitPrice: price, lineTotal: total,
        atpStatus: rnd(['Fully Allocated', 'Partially Allocated', 'Backordered']),
        fulfillmentType: rnd(['From Stock', 'Production Required'])
      });
    }
    so.subTotal = sub; so.grandTotal = Math.round(sub * 1.18); await so.save(); // +18% GST
    soCount++;
  }

  // ── 13. Purchase orders — steel replenishment ────────────────────────────
  let poCount = 0;
  for (let s = 0; s < 6; s++) {
    const vendor = rnd(steelVendors);
    const po = await POHeader.create({
      poNumber: `PO-${daysAgo(0).getFullYear()}-${String(2001 + s)}`, vendorId: vendor._id,
      date: daysAgo(randInt(1, 30)), paymentTerms: rnd(['Net30', 'Net60']), incoterms: 'DDP',
      approvalStatus: rnd(['Approved', 'Approved', 'Pending']),
      deliveryStatus: rnd(['Not Scheduled', 'In-Transit', 'Delivered']), totalAmount: 0
    });
    let tot = 0; const lineCount = randInt(1, 2);
    for (let l = 0; l < lineCount; l++) {
      const mat = rnd(materials.filter((_, i) => materialsData[i][1].includes('Steel')));
      const qty = randInt(2000, 10000); const price = materialsData[materials.indexOf(mat)][3]; const total = qty * price; tot += total;
      await POLineItem.create({
        poId: po._id, materialId: mat._id, orderQty: qty, unitPrice: price, total,
        promisedDeliveryDate: daysAhead(randInt(3, 20)), lineStatus: 'Open'
      });
    }
    po.totalAmount = tot; await po.save();
    poCount++;
  }

  // ── 14. Production plan + work orders ────────────────────────────────────
  const plan = await PlanHeader.create({ Plan_Number: `PP-${daysAgo(0).getFullYear()}-01`, Plant_ID: plant._id, Status: 'Released' });
  let woCount = 0;
  for (const st of ['Released', 'In Progress', 'In Progress', 'Draft']) {
    await WOHeader.create({ WO_Number: `WO-${daysAgo(0).getFullYear()}-${String(3001 + woCount)}`, Source_Plan_ID: plan._id, Plant_ID: plant._id, Status: st, Overall_Progress_Percentage: st === 'In Progress' ? randInt(20, 80) : 0 });
    woCount++;
  }

  // ── report ───────────────────────────────────────────────────────────────
  console.log('\nSeeded LBAP demo cycle:');
  console.log(`  customers ${customers.length}  vendors ${vendors.length}  materials ${materials.length}  products ${products.length}`);
  console.log(`  warehouses 3  machines ${machines.length}  work centres 4  departments 5`);
  console.log(`  sales orders ${soCount}  purchase orders ${poCount}  work orders ${woCount}  material stock rows ${materials.length}`);
  const totSO = await SOHeader.aggregate([{ $group: { _id: null, t: { $sum: '$grandTotal' } } }]);
  console.log(`  order book value: ₹${(totSO[0]?.t || 0).toLocaleString('en-IN')}`);
  process.exit(0);
})().catch((e) => { console.error('SEED FAILED:', e.message); process.exit(1); });
