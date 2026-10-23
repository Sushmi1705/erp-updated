require('dotenv').config();
const http = require('http');

const BASE = 'http://localhost:5000/api';
let TOKEN = '';
let results = [];
let createdIds = {};

function request(method, path, body) {
  return new Promise((resolve) => {
    const url = new URL(BASE + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN ? { 'Authorization': `Bearer ${TOKEN}` } : {})
      }
    };
    if (data) options.headers['Content-Length'] = Buffer.byteLength(data);

    const req = http.request(options, (res) => {
      let chunks = '';
      res.on('data', d => chunks += d);
      res.on('end', () => {
        let parsed = {};
        try { parsed = JSON.parse(chunks); } catch(e) { parsed = { raw: chunks.substring(0, 200) }; }
        resolve({ status: res.statusCode, data: parsed });
      });
    });
    req.on('error', (e) => {
      resolve({ status: 'ERR', data: { message: e.message } });
    });
    if (data) req.write(data);
    req.end();
  });
}

async function test(name, method, path, body) {
  try {
    const res = await request(method, path, body);
    const ok = typeof res.status === 'number' && res.status >= 200 && res.status < 300;
    const msg = ok ? '' : (res.data?.message || JSON.stringify(res.data).substring(0, 120));
    results.push({ name, status: res.status, ok, msg });
    return res;
  } catch (err) {
    results.push({ name, status: 'ERR', ok: false, msg: err.message.substring(0, 120) });
    return null;
  }
}

async function run() {
  console.log('🚀 Starting Full Application Test...\n');

  // ═══ PHASE 1: AUTH ═══
  console.log('━━━ PHASE 1: Authentication ━━━');
  let loginRes = await test('Auth → Login', 'POST', '/auth/login', { email: 'admin@example.com', password: 'password123' });
  if (loginRes?.data?.token) {
    TOKEN = loginRes.data.token;
    console.log('  ✅ Token acquired');
  } else {
    console.log('  ❌ Login failed, cannot continue. Response:', JSON.stringify(loginRes?.data));
    printReport(); return;
  }
  await test('Auth → Get Me', 'GET', '/auth/me');

  // ═══ PHASE 2: COMPANY SETUP ═══
  console.log('━━━ PHASE 2: Company Setup ━━━');
  await test('Company → GET Profiles', 'GET', '/company/profiles');
  let r = await test('Company → CREATE Profile', 'POST', '/company/profiles', { name: 'Test Corp', registrationNumber: 'REG-001', contactEmail: 'test@corp.com' });
  if (r?.data?.data?._id) createdIds.profile = r.data.data._id;
  if (createdIds.profile) {
    await test('Company → Toggle Profile Status (→Inactive)', 'PUT', `/company/profiles/${createdIds.profile}`, { status: 'Inactive' });
    await test('Company → Toggle Profile Status (→Active)', 'PUT', `/company/profiles/${createdIds.profile}`, { status: 'Active' });
  }

  await test('Company → GET Plants', 'GET', '/company/plants');
  r = await test('Company → CREATE Plant', 'POST', '/company/plants', { name: 'Plant Alpha', code: 'PLNT-TST' + Date.now(), location: 'Chennai' });
  if (r?.data?.data?._id) createdIds.plant = r.data.data._id;
  if (createdIds.plant) {
    await test('Company → Toggle Plant (→Inactive)', 'PUT', `/company/plants/${createdIds.plant}`, { isActive: false });
    await test('Company → Toggle Plant (→Active)', 'PUT', `/company/plants/${createdIds.plant}`, { isActive: true });
  }

  await test('Company → GET Branches', 'GET', '/company/branches');
  r = await test('Company → CREATE Branch', 'POST', '/company/branches', { name: 'Branch A', code: 'BRCH-TST' + Date.now(), plantId: createdIds.plant });
  if (r?.data?.data?._id) createdIds.branch = r.data.data._id;

  await test('Company → GET Warehouses', 'GET', '/company/warehouses');
  r = await test('Company → CREATE Warehouse', 'POST', '/company/warehouses', { name: 'WH-1', code: 'WRHS-TST' + Date.now(), plantId: createdIds.plant });
  if (r?.data?.data?._id) createdIds.warehouse = r.data.data._id;

  await test('Company → GET Cost Centers', 'GET', '/company/cost-centers');
  r = await test('Company → CREATE Cost Center', 'POST', '/company/cost-centers', { name: 'CC Main', code: 'CC-TST' + Date.now() });
  if (r?.data?.data?._id) createdIds.costCenter = r.data.data._id;

  await test('Company → GET Business Units', 'GET', '/company/business-units');
  r = await test('Company → CREATE Business Unit', 'POST', '/company/business-units', { name: 'BU Auto', code: 'BU-TST' + Date.now() });
  if (r?.data?.data?._id) createdIds.businessUnit = r.data.data._id;

  // ═══ PHASE 3: USERS & ROLES ═══
  console.log('━━━ PHASE 3: Users & Roles ━━━');
  await test('Roles → GET All', 'GET', '/roles');
  r = await test('Roles → CREATE Role', 'POST', '/roles', { name: 'TestRole' + Date.now(), description: 'Test', permissions: [] });
  if (r?.data?.data?._id) createdIds.role = r.data.data._id;

  await test('Users → GET All', 'GET', '/users');
  r = await test('Users → CREATE User', 'POST', '/users', { firstName: 'Test', lastName: 'User', email: 'tu' + Date.now() + '@test.com', password: 'test1234', role: createdIds.role, status: 'Active' });
  if (r?.data?.data?._id) createdIds.user = r.data.data._id;
  if (createdIds.user) await test('Users → Toggle Status (→Inactive)', 'PUT', `/users/${createdIds.user}/status`, { status: 'Inactive' });

  // ═══ PHASE 4: MASTER DATA ═══
  console.log('━━━ PHASE 4: Master Data ━━━');
  r = await test('Master → GET CustCategories', 'GET', '/master/customercategory');
  r = await test('Master → CREATE CustCategory', 'POST', '/master/customercategory', { name: 'OEM' + Date.now() });
  if (r?.data?.data?._id) createdIds.custCat = r.data.data._id;

  await test('Master → GET Customers', 'GET', '/master/customer');
  r = await test('Master → CREATE Customer', 'POST', '/master/customer', { name: 'ABC Motors', code: 'CUST-TST' + Date.now(), category: createdIds.custCat });
  if (r?.data?.data?._id) createdIds.customer = r.data.data._id;
  if (createdIds.customer) {
    await test('Master → Toggle Customer (→Inactive)', 'PUT', `/master/customer/${createdIds.customer}`, { isActive: false });
    await test('Master → Toggle Customer (→Active)', 'PUT', `/master/customer/${createdIds.customer}`, { isActive: true });
  }

  r = await test('Master → CREATE VendorCategory', 'POST', '/master/vendorcategory', { name: 'Supplier' + Date.now() });
  if (r?.data?.data?._id) createdIds.vendCat = r.data.data._id;
  await test('Master → GET Vendors', 'GET', '/master/vendor');
  r = await test('Master → CREATE Vendor', 'POST', '/master/vendor', { name: 'Steel India', code: 'VND-TST' + Date.now(), category: createdIds.vendCat });
  if (r?.data?.data?._id) createdIds.vendor = r.data.data._id;
  if (createdIds.vendor) {
    await test('Master → Toggle Vendor (→Inactive)', 'PUT', `/master/vendor/${createdIds.vendor}`, { isActive: false });
    await test('Master → Toggle Vendor (→Active)', 'PUT', `/master/vendor/${createdIds.vendor}`, { isActive: true });
  }

  await test('Master → GET UOMs', 'GET', '/master/uom');
  r = await test('Master → CREATE UOM', 'POST', '/master/uom', { name: 'KG' + Date.now(), code: 'KG' + Date.now(), type: 'Weight' });
  if (r?.data?.data?._id) createdIds.uom = r.data.data._id;

  await test('Master → GET Materials', 'GET', '/master/material');
  r = await test('Master → CREATE Material', 'POST', '/master/material', { name: 'Steel Rod', code: 'MAT-TST' + Date.now(), type: 'Raw Material', baseUom: createdIds.uom, safetyStock: 100, reorderPoint: 50 });
  if (r?.data?.data?._id) createdIds.material = r.data.data._id;
  if (createdIds.material) {
    await test('Master → Toggle Material (→Inactive)', 'PUT', `/master/material/${createdIds.material}`, { isActive: false });
    await test('Master → Toggle Material (→Active)', 'PUT', `/master/material/${createdIds.material}`, { isActive: true });
  }

  await test('Master → GET Products', 'GET', '/master/product');
  r = await test('Master → CREATE Product', 'POST', '/master/product', { name: 'Brake Caliper', code: 'PRD-TST' + Date.now(), type: 'Finished Good', baseUom: createdIds.uom });
  if (r?.data?.data?._id) createdIds.product = r.data.data._id;

  await test('Master → GET Machines', 'GET', '/master/machine');
  r = await test('Master → CREATE Machine', 'POST', '/master/machine', { name: 'CNC Lathe', code: 'MC-TST' + Date.now(), type: 'CNC' });
  if (r?.data?.data?._id) createdIds.machine = r.data.data._id;

  await test('Master → GET Work Centers', 'GET', '/master/workcenter');
  r = await test('Master → CREATE Work Center', 'POST', '/master/workcenter', { name: 'Machining Bay', code: 'WC-TST' + Date.now() });
  if (r?.data?.data?._id) createdIds.workCenter = r.data.data._id;

  await test('Master → GET StorageLocations', 'GET', '/master/storagelocation');
  r = await test('Master → CREATE StorageLocation', 'POST', '/master/storagelocation', { name: 'Bay A', code: 'LOC-TST' + Date.now(), warehouseId: createdIds.warehouse });
  if (r?.data?.data?._id) createdIds.loc = r.data.data._id;

  await test('Master → GET Zones', 'GET', '/master/zone');
  r = await test('Master → CREATE Zone', 'POST', '/master/zone', { name: 'Zone 1', code: 'ZN-TST' + Date.now(), warehouseId: createdIds.warehouse });
  if (r?.data?.data?._id) createdIds.zone = r.data.data._id;

  await test('Master → GET Racks', 'GET', '/master/rack');
  r = await test('Master → CREATE Rack', 'POST', '/master/rack', { name: 'Rack A1', code: 'RCK-TST' + Date.now(), zoneId: createdIds.zone });
  if (r?.data?.data?._id) createdIds.rack = r.data.data._id;

  await test('Master → GET Bins', 'GET', '/master/bin');
  r = await test('Master → CREATE Bin', 'POST', '/master/bin', { name: 'Bin 001', code: 'BIN-TST' + Date.now(), rackId: createdIds.rack });
  if (r?.data?.data?._id) createdIds.bin = r.data.data._id;

  // ═══ PHASE 5: ENGINEERING ═══
  console.log('━━━ PHASE 5: Engineering ━━━');
  await test('Engineering → GET BOMs', 'GET', '/engineering/bom');
  r = await test('Engineering → CREATE BOM', 'POST', '/engineering/bom', { bomNumber: 'BOM-TST' + Date.now(), productId: createdIds.product, version: '1.0', status: 'Active', components: [{ materialId: createdIds.material, quantity: 2, uom: 'KG' }] });
  if (r?.data?.data?._id) createdIds.bom = r.data.data._id;

  await test('Engineering → GET Routings', 'GET', '/engineering/routing');
  r = await test('Engineering → CREATE Routing', 'POST', '/engineering/routing', { routingNumber: 'ROUT-TST' + Date.now(), productId: createdIds.product, version: '1.0', status: 'Active', operations: [{ operationNumber: 10, name: 'Turning', workCenterId: createdIds.workCenter, setupTime: 15, cycleTime: 5 }] });
  if (r?.data?.data?._id) createdIds.routing = r.data.data._id;

  await test('Engineering → GET ECRs', 'GET', '/engineering/ecr');
  r = await test('Engineering → CREATE ECR', 'POST', '/engineering/ecr', { ecrNumber: 'ECR-TST' + Date.now(), title: 'Update BOM', description: 'Change spec', priority: 'High', status: 'Open' });
  if (r?.data?.data?._id) createdIds.ecr = r.data.data._id;
  if (createdIds.ecr) await test('Engineering → UPDATE ECR', 'PUT', `/engineering/ecr/${createdIds.ecr}`, { status: 'In Review' });

  // ═══ PHASE 6: SALES ═══
  console.log('━━━ PHASE 6: Sales ━━━');
  await test('Sales → GET Inquiries', 'GET', '/sales/inquiry');
  r = await test('Sales → CREATE Inquiry', 'POST', '/sales/inquiry', { inquiryNumber: 'INQ-TST' + Date.now(), customerId: createdIds.customer, status: 'Open', items: [{ productId: createdIds.product, quantity: 100 }] });
  if (r?.data?.data?._id) createdIds.inquiry = r.data.data._id;
  if (createdIds.inquiry) await test('Sales → UPDATE Inquiry', 'PUT', `/sales/inquiry/${createdIds.inquiry}`, { status: 'Qualified' });

  await test('Sales → GET Quotations', 'GET', '/sales/quotation');
  r = await test('Sales → CREATE Quotation', 'POST', '/sales/quotation', { quotationNumber: 'QTN-TST' + Date.now(), inquiryId: createdIds.inquiry, customerId: createdIds.customer, status: 'Draft', validUntil: '2026-12-31', items: [{ productId: createdIds.product, quantity: 100, unitPrice: 500 }] });
  if (r?.data?.data?._id) createdIds.quotation = r.data.data._id;
  if (createdIds.quotation) await test('Sales → Quotation Status (→Sent)', 'PUT', `/sales/quotation/${createdIds.quotation}/status`, { status: 'Sent' });

  await test('Sales → GET Orders', 'GET', '/sales/order');
  r = await test('Sales → CREATE Order', 'POST', '/sales/order', { orderNumber: 'SO-TST' + Date.now(), quotationId: createdIds.quotation, customerId: createdIds.customer, status: 'Confirmed', items: [{ productId: createdIds.product, quantity: 100, unitPrice: 500 }] });
  if (r?.data?.data?._id) createdIds.salesOrder = r.data.data._id;
  if (createdIds.salesOrder) {
    await test('Sales → UPDATE Order (edit)', 'PUT', `/sales/order/${createdIds.salesOrder}`, { status: 'In Production' });
    await test('Sales → Order Status (→Shipped)', 'PUT', `/sales/order/${createdIds.salesOrder}/status`, { status: 'Shipped' });
    await test('Sales → ATP Check', 'PUT', `/sales/order/${createdIds.salesOrder}/atp`, {});
    await test('Sales → Update Tracking', 'PUT', `/sales/order/${createdIds.salesOrder}/tracking`, { trackingNumber: 'TRACK-001', carrier: 'FedEx', status: 'In Transit' });
  }

  // ═══ PHASE 7: DEMAND ═══
  console.log('━━━ PHASE 7: Demand Planning ━━━');
  await test('Demand → GET Forecasts', 'GET', '/demand/forecast');
  r = await test('Demand → CREATE Forecast', 'POST', '/demand/forecast', { forecastNumber: 'FC-TST' + Date.now(), period: 'Q3-2026', forecastType: 'Product', productId: createdIds.product, forecastQty: 500, seasonalFactor: 1.2 });
  if (r?.data?.data?._id) createdIds.forecast = r.data.data._id;
  if (createdIds.forecast) await test('Demand → UPDATE Forecast', 'PUT', `/demand/forecast/${createdIds.forecast}`, { forecastQty: 600 });
  await test('Demand → GET Historical', 'GET', '/demand/historical');
  await test('Demand → GET Consolidations', 'GET', '/demand/consolidation');
  await test('Demand → CREATE Consolidation', 'POST', '/demand/consolidation', { period: 'Q3-2026', status: 'Draft', items: [{ productId: createdIds.product, totalDemand: 500 }] });
  await test('Demand → GENERATE Consolidation', 'POST', '/demand/consolidation/generate', { period: 'Q3-2026' });

  // ═══ PHASE 8: MRP ═══
  console.log('━━━ PHASE 8: MRP Engine ━━━');
  await test('MRP → GET Runs', 'GET', '/mrp/run');
  await test('MRP → Execute Run', 'POST', '/mrp/run/execute', { planningHorizon: '30', demandSource: 'Forecast' });
  await test('MRP → GET Requirements', 'GET', '/mrp/requirements');
  await test('MRP → GET Shortages', 'GET', '/mrp/shortages');
  await test('MRP → GET Recommendations', 'GET', '/mrp/recommendations');

  // ═══ PHASE 9: CAPACITY ═══
  console.log('━━━ PHASE 9: Capacity Planning ━━━');
  await test('Capacity → GET Machine', 'GET', '/capacity/machine');
  r = await test('Capacity → CREATE Machine Cap', 'POST', '/capacity/machine', { machineId: createdIds.machine, availableHours: 16, efficiency: 85, period: 'July-2026' });
  if (r?.data?.data?._id) createdIds.machCap = r.data.data._id;
  await test('Capacity → GET Labor', 'GET', '/capacity/labor');
  r = await test('Capacity → CREATE Labor Cap', 'POST', '/capacity/labor', { workCenterId: createdIds.workCenter, availableOperators: 5, shiftHours: 8, period: 'July-2026' });
  if (r?.data?.data?._id) createdIds.labCap = r.data.data._id;
  await test('Capacity → GET Schedules', 'GET', '/capacity/schedule');
  r = await test('Capacity → CREATE Schedule', 'POST', '/capacity/schedule', { workCenterId: createdIds.workCenter, productId: createdIds.product, scheduledDate: '2026-07-15', quantity: 100, status: 'Scheduled' });
  if (r?.data?.data?._id) createdIds.capSched = r.data.data._id;

  // ═══ PHASE 10: PROCUREMENT ═══
  console.log('━━━ PHASE 10: Procurement ━━━');
  await test('Procurement → GET Requisitions', 'GET', '/procurement/requisition');
  r = await test('Procurement → CREATE Requisition', 'POST', '/procurement/requisition', { items: [{ materialId: createdIds.material, quantity: 200, uom: 'KG', requiredDate: '2026-08-01' }], status: 'Pending' });
  if (r?.data?.data?._id) createdIds.requisition = r.data.data._id;
  if (createdIds.requisition) await test('Procurement → Requisition Status (→Approved)', 'PUT', `/procurement/requisition/${createdIds.requisition}/status`, { status: 'Approved' });

  await test('Procurement → GET RFQs', 'GET', '/procurement/rfq');
  r = await test('Procurement → CREATE RFQ', 'POST', '/procurement/rfq', { vendors: [createdIds.vendor], items: [{ materialId: createdIds.material, quantity: 200 }], dueDate: '2026-07-20' });
  if (r?.data?.data?._id) createdIds.rfq = r.data.data._id;

  await test('Procurement → GET POs', 'GET', '/procurement/po');
  r = await test('Procurement → CREATE PO', 'POST', '/procurement/po', { vendorId: createdIds.vendor, items: [{ materialId: createdIds.material, quantity: 200, unitPrice: 150 }], deliveryDate: '2026-08-01', status: 'Confirmed' });
  if (r?.data?.data?._id) createdIds.po = r.data.data._id;
  if (createdIds.po) await test('Procurement → PO Status (→Delivered)', 'PUT', `/procurement/po/${createdIds.po}/status`, { status: 'Delivered' });

  await test('Procurement → GET Performances', 'GET', '/procurement/performance');
  await test('Procurement → CREATE Performance', 'POST', '/procurement/performance', { vendorId: createdIds.vendor, rating: 4.5, deliveryScore: 90, qualityScore: 95, period: 'Q2-2026' });

  // ═══ PHASE 11: GOODS RECEIPT ═══
  console.log('━━━ PHASE 11: Goods Receipt ━━━');
  await test('Receipt → GET GRNs', 'GET', '/receipt/grn');
  r = await test('Receipt → CREATE GRN', 'POST', '/receipt/grn', { purchaseOrderId: createdIds.po, receivedDate: '2026-07-15', items: [{ materialId: createdIds.material, orderedQty: 200, receivedQty: 195 }] });
  if (r?.data?.data?._id) createdIds.grn = r.data.data._id;
  await test('Receipt → GET Inspections', 'GET', '/receipt/inspection');
  await test('Receipt → GET Inventory', 'GET', '/receipt/inventory');
  await test('Receipt → Post to Inventory', 'POST', '/receipt/inventory/post', { grnId: createdIds.grn, items: [{ materialId: createdIds.material, quantity: 195 }] });

  // ═══ PHASE 12: INVENTORY ═══
  console.log('━━━ PHASE 12: Inventory ━━━');
  await test('Inventory → GET Stock', 'GET', '/inventory/stock');
  await test('Inventory → GET Movements', 'GET', '/inventory/movement');
  await test('Inventory → CREATE Movement', 'POST', '/inventory/movement', { materialId: createdIds.material, type: 'Transfer', fromLocation: 'WH-A', toLocation: 'WH-B', quantity: 50 });
  await test('Inventory → GET Adjustments', 'GET', '/inventory/adjustment');
  await test('Inventory → CREATE Adjustment', 'POST', '/inventory/adjustment', { materialId: createdIds.material, adjustmentType: 'Cycle Count', adjustedQty: 190, reason: 'Physical count' });
  await test('Inventory → GET Valuations', 'GET', '/inventory/valuation');

  // ═══ PHASE 13: PRODUCTION ═══
  console.log('━━━ PHASE 13: Production ━━━');
  await test('Production → GET Plans', 'GET', '/production/plan');
  r = await test('Production → CREATE Plan', 'POST', '/production/plan', { productId: createdIds.product, plannedQty: 100, startDate: '2026-07-20', endDate: '2026-07-25', status: 'Draft' });
  if (r?.data?.data?._id) createdIds.prodPlan = r.data.data._id;
  if (createdIds.prodPlan) {
    await test('Production → UPDATE Plan', 'PUT', `/production/plan/${createdIds.prodPlan}`, { status: 'Confirmed' });
    await test('Production → Validate Capacity', 'POST', `/production/plan/${createdIds.prodPlan}/validate`, {});
  }

  await test('Production → GET Work Orders', 'GET', '/production/wo');
  r = await test('Production → CREATE Work Order', 'POST', '/production/wo', { productId: createdIds.product, quantity: 50, startDate: '2026-07-20', endDate: '2026-07-22', status: 'Released', routingId: createdIds.routing });
  if (r?.data?.data?._id) createdIds.workOrder = r.data.data._id;
  if (createdIds.workOrder) await test('Production → UPDATE Work Order', 'PUT', `/production/wo/${createdIds.workOrder}`, { status: 'In Progress' });

  await test('Production → Material Allocation', 'POST', '/production/wo/allocation', { workOrderId: createdIds.workOrder, materials: [{ materialId: createdIds.material, allocatedQty: 100 }] });
  await test('Production → GET Outputs', 'GET', '/production/output');
  await test('Production → Record Output', 'POST', '/production/output', { workOrderId: createdIds.workOrder, productId: createdIds.product, producedQty: 48, goodQty: 46, rejectedQty: 2 });

  // ═══ PHASE 14: SHOP FLOOR ═══
  console.log('━━━ PHASE 14: Shop Floor ━━━');
  await test('ShopFloor → GET Operators', 'GET', '/shopfloor/operator');
  r = await test('ShopFloor → Assign Operator', 'POST', '/shopfloor/operator', { operatorName: 'Ravi Kumar', workCenterId: createdIds.workCenter, shift: 'Day', status: 'Active' });
  if (r?.data?.data?._id) createdIds.operator = r.data.data._id;
  await test('ShopFloor → GET Machines', 'GET', '/shopfloor/machine');
  await test('ShopFloor → Allocate Machine', 'POST', '/shopfloor/machine', { machineId: createdIds.machine, workOrderId: createdIds.workOrder, status: 'Running' });
  await test('ShopFloor → GET Downtimes', 'GET', '/shopfloor/downtime');
  r = await test('ShopFloor → Record Downtime', 'POST', '/shopfloor/downtime', { machineId: createdIds.machine, reason: 'Tool Change', startTime: '2026-07-15T09:00:00Z', endTime: '2026-07-15T09:30:00Z' });
  if (r?.data?.data?._id) createdIds.downtime = r.data.data._id;
  await test('ShopFloor → GET Scrap', 'GET', '/shopfloor/scrap');
  await test('ShopFloor → Record Scrap', 'POST', '/shopfloor/scrap', { workOrderId: createdIds.workOrder, materialId: createdIds.material, quantity: 2, reason: 'Deviation' });

  // ═══ PHASE 15: QUALITY ═══
  console.log('━━━ PHASE 15: Quality ━━━');
  await test('Quality → GET Inspections', 'GET', '/quality/inspection');
  r = await test('Quality → Record Inspection', 'POST', '/quality/inspection', { workOrderId: createdIds.workOrder, productId: createdIds.product, inspectorName: 'Inspector 1', result: 'Pass', inspectedQty: 46, passedQty: 45, failedQty: 1 });
  if (r?.data?.data?._id) createdIds.qInsp = r.data.data._id;
  if (createdIds.qInsp) {
    await test('Quality → UPDATE Inspection', 'PUT', `/quality/inspection/${createdIds.qInsp}`, { result: 'Conditional Pass' });
    await test('Quality → Approve Release', 'POST', `/quality/inspection/${createdIds.qInsp}/release`, { approved: true });
  }
  await test('Quality → GET Parameters', 'GET', '/quality/parameter');
  r = await test('Quality → CREATE Parameter', 'POST', '/quality/parameter', { name: 'Surface Roughness', unit: 'Ra', targetValue: 1.6, upperLimit: 2.0, lowerLimit: 1.2 });
  if (r?.data?.data?._id) createdIds.qParam = r.data.data._id;
  if (createdIds.qParam) await test('Quality → Record Measurement', 'POST', `/quality/parameter/${createdIds.qParam}/measurement`, { measuredValue: 1.5, measuredBy: 'Operator A' });
  await test('Quality → GET NCRs', 'GET', '/quality/ncr');
  r = await test('Quality → Record NCR', 'POST', '/quality/ncr', { title: 'Bore Defect', description: 'Out of spec', severity: 'Major', status: 'Open' });
  if (r?.data?.data?._id) createdIds.ncr = r.data.data._id;
  if (createdIds.ncr) await test('Quality → UPDATE NCR', 'PUT', `/quality/ncr/${createdIds.ncr}`, { status: 'Under Investigation', rootCause: 'Tool wear' });
  await test('Quality → GET Analytics', 'GET', '/quality/analytics');

  // ═══ PHASE 16: MAINTENANCE ═══
  console.log('━━━ PHASE 16: Maintenance ━━━');
  await test('Maintenance → GET Work Orders', 'GET', '/maintenance/workorder');
  r = await test('Maintenance → CREATE Work Order', 'POST', '/maintenance/workorder', { machineId: createdIds.machine, type: 'Preventive', priority: 'High', description: 'Quarterly', scheduledDate: '2026-07-20', status: 'Scheduled' });
  if (r?.data?.data?._id) createdIds.mwo = r.data.data._id;
  if (createdIds.mwo) await test('Maintenance → UPDATE Work Order', 'PUT', `/maintenance/workorder/${createdIds.mwo}`, { status: 'In Progress' });
  await test('Maintenance → GET Schedules', 'GET', '/maintenance/schedule');
  r = await test('Maintenance → CREATE Schedule', 'POST', '/maintenance/schedule', { machineId: createdIds.machine, frequency: 'Monthly', nextDueDate: '2026-08-01', type: 'Preventive' });
  if (r?.data?.data?._id) createdIds.mSched = r.data.data._id;
  await test('Maintenance → GET Spare Parts', 'GET', '/maintenance/sparepart');
  r = await test('Maintenance → CREATE Spare Part', 'POST', '/maintenance/sparepart', { name: 'Bearing SKF', partNumber: 'SP-' + Date.now(), currentStock: 10, reorderLevel: 3 });
  if (r?.data?.data?._id) createdIds.spare = r.data.data._id;

  // ═══ PHASE 17: DISPATCH ═══
  console.log('━━━ PHASE 17: Dispatch & Logistics ━━━');
  await test('Dispatch → GET Plans', 'GET', '/dispatch/planning');
  r = await test('Dispatch → CREATE Plan', 'POST', '/dispatch/planning', { salesOrderId: createdIds.salesOrder, plannedDate: '2026-07-25', carrier: 'BlueDart', status: 'Planned' });
  if (r?.data?.data?._id) createdIds.dispPlan = r.data.data._id;
  if (createdIds.dispPlan) await test('Dispatch → UPDATE Plan', 'PUT', `/dispatch/planning/${createdIds.dispPlan}`, { status: 'Ready' });
  await test('Dispatch → GET Executions', 'GET', '/dispatch/execution');
  await test('Dispatch → Record Execution', 'POST', '/dispatch/execution', { dispatchPlanId: createdIds.dispPlan, dispatchDate: '2026-07-25', vehicleNumber: 'TN-01-AB-1234', status: 'Dispatched' });
  await test('Dispatch → GET Trackings', 'GET', '/dispatch/tracking');

  // ═══ PHASE 18: FINANCE ═══
  console.log('━━━ PHASE 18: Finance & Accounting ━━━');
  await test('Finance → GET Invoices', 'GET', '/finance/invoice');
  r = await test('Finance → CREATE Invoice', 'POST', '/finance/invoice', { salesOrderId: createdIds.salesOrder, customerId: createdIds.customer, invoiceDate: '2026-07-25', dueDate: '2026-08-25', items: [{ description: 'Brake Caliper', quantity: 100, unitPrice: 500, amount: 50000 }], totalAmount: 50000, status: 'Draft' });
  if (r?.data?.data?._id) createdIds.invoice = r.data.data._id;
  await test('Finance → GET Payments', 'GET', '/finance/payment');
  r = await test('Finance → Record Payment', 'POST', '/finance/payment', { invoiceId: createdIds.invoice, amount: 25000, paymentDate: '2026-08-01', method: 'Bank Transfer', reference: 'TXN-001' });
  if (r?.data?.data?._id) createdIds.payment = r.data.data._id;
  await test('Finance → GET Credit Notes', 'GET', '/finance/credit-note');
  await test('Finance → CREATE Credit Note', 'POST', '/finance/credit-note', { invoiceId: createdIds.invoice, amount: 2500, reason: 'Returns' });
  await test('Finance → GET Debit Notes', 'GET', '/finance/debit-note');
  await test('Finance → CREATE Debit Note', 'POST', '/finance/debit-note', { vendorId: createdIds.vendor, purchaseOrderId: createdIds.po, amount: 5000, reason: 'Short delivery' });
  await test('Finance → GET Cost Analysis', 'GET', '/finance/cost-analysis');

  // ═══ PHASE 19: DASHBOARDS ═══
  console.log('━━━ PHASE 19: Dashboards ━━━');
  await test('Dashboard → System Stats', 'GET', '/dashboard/stats');
  await test('Dashboard → CEO', 'GET', '/dashboard/ceo');
  await test('Dashboard → Sales', 'GET', '/dashboard/sales');
  await test('Dashboard → Procurement', 'GET', '/dashboard/procurement');
  await test('Dashboard → Inventory', 'GET', '/dashboard/inventory');
  await test('Dashboard → Production', 'GET', '/dashboard/production');
  await test('Dashboard → Quality', 'GET', '/dashboard/quality');
  await test('Dashboard → Maintenance', 'GET', '/dashboard/maintenance');

  // ═══ PHASE 20: APPROVALS & AUDIT ═══
  console.log('━━━ PHASE 20: Approvals & Audit ━━━');
  await test('Approvals → GET Pending', 'GET', '/approvals/pending');
  await test('Approvals → GET Configs', 'GET', '/approvals/config');
  r = await test('Approvals → CREATE Config', 'POST', '/approvals/config', { module: 'PurchaseOrder', action: 'create', isActive: true, levels: [{ level: 1, roleId: createdIds.role }] });
  if (r?.data?.data?._id) createdIds.apConfig = r.data.data._id;
  await test('Audit → GET Logs', 'GET', '/audit/logs');
  await test('Audit → GET Login History', 'GET', '/audit/login-history');

  // ═══ PHASE 21: AUTH EXTRAS ═══
  console.log('━━━ PHASE 21: Auth Extras ━━━');
  await test('Auth → Update Password', 'PUT', '/auth/updatepassword', { currentPassword: 'password123', newPassword: 'password123' });
  await test('Auth → Forgot Password (invalid email)', 'POST', '/auth/forgotpassword', { email: 'nobody@test.com' });

  printReport();
}

function printReport() {
  const passed = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  console.log('\n\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                       FULL APPLICATION TEST REPORT                            ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝');
  console.log(`\n  Total: ${results.length}  |  ✅ Passed: ${passed.length}  |  ❌ Failed: ${failed.length}\n`);

  let phase = '';
  for (const r of results) {
    const p = r.name.split(' → ')[0];
    if (p !== phase) { phase = p; console.log(`\n  ── ${phase} ──`); }
    const icon = r.ok ? '✅' : '❌';
    const s = `[${r.status}]`.padEnd(6);
    console.log(`    ${icon} ${s} ${r.name}${r.msg ? '  ← ' + r.msg : ''}`);
  }

  if (failed.length > 0) {
    console.log('\n\n  ╔══════════════════════════════════════╗');
    console.log('  ║        FAILED TESTS SUMMARY          ║');
    console.log('  ╚══════════════════════════════════════╝\n');
    for (const f of failed) {
      console.log(`    ❌ [${f.status}] ${f.name}`);
      console.log(`       Reason: ${f.msg}\n`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`  RESULT: ${failed.length === 0 ? '🎉 ALL TESTS PASSED!' : `⚠️  ${failed.length} TEST(S) NEED ATTENTION`}`);
  console.log('═══════════════════════════════════════════════════════════════════\n');
  process.exit(failed.length > 0 ? 1 : 0);
}

run().catch(e => { console.error('Fatal:', e); process.exit(1); });
