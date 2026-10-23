const mongoose = require('mongoose');

const autoSeedData = async () => {
  try {
    const User = require('../models/User');
    const Role = require('../models/Role');
    const { Company, Plant, Department, BusinessUnit } = require('../models/CompanyStructure');
    const { Warehouse, StorageLocation, StorageZone, Rack, Bin } = require('../models/MasterWarehouse');
    const { Material, MaterialCategory } = require('../models/MasterMaterial');
    const { Product, ProductCategory } = require('../models/MasterProduct');
    const { Vendor, VendorCategory } = require('../models/MasterVendor');
    const { Customer, CustomerCategory } = require('../models/MasterCustomer');
    const { UOM, UOMConversion } = require('../models/MasterUOM');
    const { PaymentTerms } = require('../models/MasterPaymentTerms');
    const { Currency } = require('../models/MasterCurrency');
    const { Tax } = require('../models/MasterTax');
    const { WorkCenter } = require('../models/MasterWorkCenter');
    const { POHeader } = require('../models/PurchaseOrder');
    const { PRHeader } = require('../models/PurchaseRequisition');
    const { SalesOrder } = require('../models/SalesOrder');

    // 1. Roles & Super Admin
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'System Administrator with full access',
        isSystem: true,
        permissions: [{ module: 'All', actions: ['manage'] }]
      });
    }

    let adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      adminUser = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: superAdminRole._id,
        status: 'Active'
      });
    }

    // Seed quick-login role personas
    const QUICK_USERS = [
      {
        roleName: 'Sales Executive', email: 'sales.exec@lbap.in', firstName: 'Karthik', lastName: 'Raman',
        description: 'Raises quotations and sales orders, and checks stock before promising a delivery date.',
        permissions: [
          { module: 'Sales' }, { module: 'MasterData', actions: ['read'] },
          { module: 'Inventory', actions: ['read'] }, { module: 'Dispatch', actions: ['read'] }
        ]
      },
      {
        roleName: 'Purchase Officer', email: 'purchase.officer@lbap.in', firstName: 'Deepa', lastName: 'Iyer',
        description: 'Converts material-plan suggestions into purchase orders and tracks what suppliers still owe.',
        permissions: [
          { module: 'Procurement' }, { module: 'MRP', actions: ['read'] },
          { module: 'MasterData', actions: ['read'] }, { module: 'GoodsReceipt', actions: ['read'] },
          { module: 'DemandPlanning', actions: ['read'] }
        ]
      },
      {
        roleName: 'Store Keeper', email: 'store.keeper@lbap.in', firstName: 'Muthuvel', lastName: 'Pandian',
        description: 'Receives material at the gate, inspects it and posts what is accepted into the store.',
        permissions: [
          { module: 'GoodsReceipt' }, { module: 'Inventory' },
          { module: 'MasterData', actions: ['read'] }, { module: 'Procurement', actions: ['read'] }
        ]
      },
      {
        roleName: 'Production Planner', email: 'production.planner@lbap.in', firstName: 'Arun', lastName: 'Kumar',
        description: 'Runs the material plan, releases work orders and checks machine capacity before committing a date.',
        permissions: [
          { module: 'Production' }, { module: 'MRP' }, { module: 'Capacity' },
          { module: 'Engineering', actions: ['read'] }, { module: 'DemandPlanning', actions: ['read'] },
          { module: 'MasterData', actions: ['read'] }
        ]
      },
      {
        roleName: 'Shop Floor Supervisor', email: 'shopfloor.supervisor@lbap.in', firstName: 'Selvaraj', lastName: 'Murugan',
        description: 'Runs the presses day to day — issues material to a job, logs output, downtime and scrap.',
        permissions: [
          { module: 'ShopFloor' }, { module: 'Production' }, { module: 'MasterData', actions: ['read'] }
        ]
      },
      {
        roleName: 'Quality Inspector', email: 'quality.inspector@lbap.in', firstName: 'Priya', lastName: 'Sundaram',
        description: 'Inspects incoming, in-process and final parts, and raises a non-conformance when one fails.',
        permissions: [
          { module: 'Quality' }, { module: 'GoodsReceipt', actions: ['read'] },
          { module: 'Production', actions: ['read'] }, { module: 'MasterData', actions: ['read'] },
          { module: 'Procurement', actions: ['read'] }
        ]
      },
      {
        roleName: 'Maintenance Engineer', email: 'maintenance.engineer@lbap.in', firstName: 'Ravishankar', lastName: 'Pillai',
        description: 'Keeps the presses running — planned service, breakdown repair and the spares that cover them.',
        permissions: [
          { module: 'Maintenance' }, { module: 'MasterData', actions: ['read'] },
          { module: 'ShopFloor', actions: ['read'] }, { module: 'Production', actions: ['read'] }
        ]
      },
      {
        roleName: 'Dispatch Coordinator', email: 'dispatch.coordinator@lbap.in', firstName: 'Lakshmi', lastName: 'Narayanan',
        description: 'Plans deliveries, books the vehicle and confirms dispatch once goods are loaded.',
        permissions: [
          { module: 'Dispatch' }, { module: 'Sales', actions: ['read'] },
          { module: 'Inventory', actions: ['read'] }, { module: 'MasterData', actions: ['read'] }
        ]
      },
      {
        roleName: 'Accounts Executive', email: 'accounts.executive@lbap.in', firstName: 'Meenakshi', lastName: 'Krishnan',
        description: 'Raises customer invoices, records receipts and payments, and keeps the books straight.',
        permissions: [
          { module: 'Finance' }, { module: 'Sales', actions: ['read'] },
          { module: 'Procurement', actions: ['read'] }, { module: 'MasterData', actions: ['read'] },
          { module: 'Inventory', actions: ['read'] }
        ]
      },
      {
        roleName: 'Plant Manager', email: 'plant.manager@lbap.in', firstName: 'Suresh', lastName: 'Babu',
        description: 'Sees the whole shop floor and order book at a glance — everything operational, none of the admin or money screens.',
        permissions: [
          { module: 'Production' }, { module: 'ShopFloor' }, { module: 'Quality' },
          { module: 'Maintenance' }, { module: 'Capacity' }, { module: 'MRP' },
          { module: 'Dispatch' }, { module: 'Sales', actions: ['read'] },
          { module: 'Procurement', actions: ['read'] }, { module: 'Inventory', actions: ['read'] },
          { module: 'MasterData', actions: ['read'] }, { module: 'Engineering', actions: ['read'] },
          { module: 'DemandPlanning', actions: ['read'] }
        ]
      },
      {
        roleName: 'HR Executive', email: 'hr.executive@lbap.in', firstName: 'Ananya', lastName: 'Sen',
        description: 'Manages employee lifecycle, leave quotas, shift attendance regularization, and overtime governance.',
        permissions: [
          { module: 'Approvals' }, { module: 'MasterData', actions: ['read'] }
        ]
      }
    ];

    for (const cat of QUICK_USERS) {
      let role = await Role.findOne({ name: cat.roleName });
      if (!role) {
        role = await Role.create({
          name: cat.roleName,
          description: cat.description,
          permissions: cat.permissions,
          isActive: true,
          isSystem: false
        });
      }
      const existingUser = await User.findOne({ email: cat.email });
      if (!existingUser) {
        await User.create({
          firstName: cat.firstName,
          lastName: cat.lastName,
          email: cat.email,
          password: 'password123',
          role: role._id,
          status: 'Active'
        });
      }
    }


    // 2. Company Structure
    let company = await Company.findOne({ code: 'PAC01' });
    if (!company) {
      company = await Company.create({
        name: 'Precision Auto Components Pvt Ltd',
        code: 'PAC01',
        gst: '33AAACP8912K1Z4',
        pan: 'AAACP8912K',
        email: 'corporate@precisionauto.co.in',
        phone: '+91 44 2688 1234',
        address: 'Plot No. 42-B, Industrial Estate, Phase 1, Ambattur, Chennai - 600058',
        country: 'India',
        state: 'Tamil Nadu',
        currency: 'INR',
        timeZone: 'Asia/Kolkata',
        fiscalYear: 'Apr-Mar',
        status: 'Active'
      });
    }

    let bu = await BusinessUnit.findOne({ code: 'BU-AUTO' });
    if (!bu) {
      bu = await BusinessUnit.create({ companyId: company._id, name: 'Automotive Parts Division', code: 'BU-AUTO', headUserId: adminUser._id });
    }

    let plant = await Plant.findOne({ code: 'PL-01' });
    if (!plant) {
      plant = await Plant.create({ companyId: company._id, businessUnitId: bu._id, name: 'Main Assembly Plant 1', code: 'PL-01', location: 'Plant Region 1' });
    }

    let warehouse = await Warehouse.findOne({ code: 'WH-RM-01' });
    if (!warehouse) {
      warehouse = await Warehouse.create({ plantId: plant._id, name: 'Central Raw Materials Warehouse', code: 'WH-RM-01', type: 'Raw Material' });
    }

    let fgWarehouse = await Warehouse.findOne({ code: 'WH-FG-01' });
    if (!fgWarehouse) {
      fgWarehouse = await Warehouse.create({ plantId: plant._id, name: 'Finished Goods Distribution Center', code: 'WH-FG-01', type: 'Finished Goods' });
    }

    // Warehouse spatial topology
    let locRM = await StorageLocation.findOne({ code: 'LOC-RM-BAY-01' });
    if (!locRM && warehouse) {
      locRM = await StorageLocation.create({
        name: 'Coil & Infeed Receiving Bay',
        code: 'LOC-RM-BAY-01',
        warehouseId: warehouse._id,
        areaType: 'Receiving Bay',
        description: 'Primary receiving dock for heavy CRCA & HR steel coils'
      });
    }

    let zoneRM = null;
    if (locRM) {
      zoneRM = await StorageZone.findOne({ code: 'ZN-CRCA-01' });
      if (!zoneRM) {
        zoneRM = await StorageZone.create({
          name: 'CRCA Heavy Coil Staging',
          code: 'ZN-CRCA-01',
          storageLocationId: locRM._id,
          zoneType: 'Heavy Coils',
          description: 'High-load floor zone for automotive prime stamping coils'
        });
      }
    }

    let rackRM = null;
    if (zoneRM) {
      rackRM = await Rack.findOne({ code: 'RCK-CANT-01' });
      if (!rackRM) {
        rackRM = await Rack.create({
          name: 'Cantilever Coil Cradle Rack 01',
          code: 'RCK-CANT-01',
          zoneId: zoneRM._id,
          rackType: 'Cantilever',
          levels: 2,
          capacityTons: 40
        });
      }
    }

    if (rackRM) {
      const rmBins = [
        { name: 'Coil Slot A-01', code: 'BIN-RM-C01', barcode: 'BC-RM-C01', maxWeightKg: 15000 },
        { name: 'Coil Slot A-02', code: 'BIN-RM-C02', barcode: 'BC-RM-C02', maxWeightKg: 15000 }
      ];
      for (const b of rmBins) {
        const existBin = await Bin.findOne({ code: b.code });
        if (!existBin) {
          await Bin.create({ ...b, rackId: rackRM._id });
        }
      }
    }

    // Finished Goods topology
    let locFG = await StorageLocation.findOne({ code: 'LOC-FG-BAY-01' });
    if (!locFG && fgWarehouse) {
      locFG = await StorageLocation.create({
        name: 'Finished Parts Dispatch Bay',
        code: 'LOC-FG-BAY-01',
        warehouseId: fgWarehouse._id,
        areaType: 'Dispatch Staging',
        description: 'Customer outbound dispatch and pallet wrapping staging bay'
      });
    }

    let zoneFG = null;
    if (locFG) {
      zoneFG = await StorageZone.findOne({ code: 'ZN-FG-PALLET-01' });
      if (!zoneFG) {
        zoneFG = await StorageZone.create({
          name: 'High-Bay Pallet Storage Zone',
          code: 'ZN-FG-PALLET-01',
          storageLocationId: locFG._id,
          zoneType: 'Finished Assemblies',
          description: 'High-density multi-tier pallet racking for OEM delivery'
        });
      }
    }

    let rackFG = null;
    if (zoneFG) {
      rackFG = await Rack.findOne({ code: 'RCK-HBR-01' });
      if (!rackFG) {
        rackFG = await Rack.create({
          name: 'High-Bay 4-Tier Pallet Rack A',
          code: 'RCK-HBR-01',
          zoneId: zoneFG._id,
          rackType: 'Pallet Rack',
          levels: 4,
          capacityTons: 20
        });
      }
    }

    if (rackFG) {
      const fgBins = [
        { name: 'Pallet Bay Alpha-1', code: 'BIN-FG-A1', barcode: 'BC-FG-A1', maxWeightKg: 2000 },
        { name: 'Pallet Bay Alpha-2', code: 'BIN-FG-A2', barcode: 'BC-FG-A2', maxWeightKg: 2000 }
      ];
      for (const b of fgBins) {
        const existBin = await Bin.findOne({ code: b.code });
        if (!existBin) {
          await Bin.create({ ...b, rackId: rackFG._id });
        }
      }
    }


    let dept = await Department.findOne({ code: 'DEPT-PROD' });
    if (!dept) {
      dept = await Department.create({ companyId: company._id, name: 'Production & Manufacturing', code: 'DEPT-PROD', managerUserId: adminUser._id });
    }

    // 3. Precision Metrology Units of Measure (UOMs) & Conversions
    const standardUOMs = [
      { name: 'Each', code: 'EA', type: 'Quantity', symbol: 'ea', decimalPrecision: 0, isBaseUnit: true, description: 'Standard discrete piece count for press stampings, brackets, and assemblies' },
      { name: 'Kilograms', code: 'KG', type: 'Weight', symbol: 'kg', decimalPrecision: 3, isBaseUnit: true, description: 'SI base unit for mass; steel coils, blank weights, and scrap reconciliation' },
      { name: 'Meters', code: 'MTR', type: 'Length', symbol: 'm', decimalPrecision: 2, isBaseUnit: true, description: 'SI base unit for length; strip infeed, coil unwinding, wire harnesses' },
      { name: 'Metric Ton', code: 'TNE', type: 'Weight', symbol: 'MT', decimalPrecision: 3, isBaseUnit: false, description: 'Heavy bulk steel infeed (1 MT = 1,000 kg); steel mill coils & raw ingots' },
      { name: 'Grams', code: 'GRM', type: 'Weight', symbol: 'g', decimalPrecision: 2, isBaseUnit: false, description: 'Fine metallurgical measurement (1 kg = 1,000 g); fasteners and clips' },
      { name: 'Millimeters', code: 'MMT', type: 'Length', symbol: 'mm', decimalPrecision: 2, isBaseUnit: false, description: 'Sheet metal thickness, stamping pitch, piercing tolerances' },
      { name: 'Centimeters', code: 'CMT', type: 'Length', symbol: 'cm', decimalPrecision: 2, isBaseUnit: false, description: 'Intermediate component dimensions (1 m = 100 cm)' },
      { name: 'Square Meters', code: 'MTK', type: 'Area', symbol: 'm²', decimalPrecision: 3, isBaseUnit: true, description: 'Sheet metal blank nesting surface, electro-zinc plating, e-coating area' },
      { name: 'Liters', code: 'LTR', type: 'Volume', symbol: 'L', decimalPrecision: 2, isBaseUnit: true, description: 'Stamping press lubrication oils, hydraulic fluids, rust preventative liquids' },
      { name: 'Hours', code: 'HUR', type: 'Time', symbol: 'hr', decimalPrecision: 2, isBaseUnit: true, description: 'Machine cycle time, press run time, preventive maintenance duration' },
      { name: 'Minutes', code: 'MIN', type: 'Time', symbol: 'min', decimalPrecision: 1, isBaseUnit: false, description: 'Stamping changeover time, tool setup duration (1 hr = 60 min)' },
      { name: 'Set / Kit', code: 'SET', type: 'Quantity', symbol: 'SET', decimalPrecision: 0, isBaseUnit: false, description: 'Matched sub-assembly kit (e.g. Precision Piston Kit Set of 4)' },
      { name: 'Box', code: 'BX', type: 'Packaging', symbol: 'BOX', decimalPrecision: 0, isBaseUnit: false, description: 'Corrugated dispatch box (e.g. 50 pcs / box)' }
    ];

    const uomMap = {};
    for (const u of standardUOMs) {
      let doc = await UOM.findOne({ $or: [{ symbol: u.symbol }, { name: u.name }] });
      if (!doc) {
        doc = await UOM.create({ ...u, status: 'Active', isActive: true });
      } else {
        // Enrich existing doc with precision fields if missing
        doc.code = doc.code || u.code;
        doc.type = doc.type || u.type;
        doc.decimalPrecision = doc.decimalPrecision ?? u.decimalPrecision;
        doc.isBaseUnit = doc.isBaseUnit ?? u.isBaseUnit;
        doc.description = doc.description || u.description;
        doc.status = 'Active';
        doc.isActive = true;
        await doc.save();
      }
      uomMap[u.symbol] = doc;
    }

    let uomEa = uomMap['ea'];
    let uomKg = uomMap['kg'];
    let uomMtr = uomMap['m'];

    // Standard conversion rules
    const conversionDefs = [
      { from: 'MT', to: 'kg', factor: 1000, formula: '1 MT = 1,000 kg', notes: 'Mill coil conversion to standard stock kg' },
      { from: 'kg', to: 'g', factor: 1000, formula: '1 kg = 1,000 g', notes: 'Blank mass to fine fastener weight' },
      { from: 'm', to: 'mm', factor: 1000, formula: '1 m = 1,000 mm', notes: 'Strip feed pitch calculation' },
      { from: 'm', to: 'cm', factor: 100, formula: '1 m = 100 cm', notes: 'Linear cut length' },
      { from: 'hr', to: 'min', factor: 60, formula: '1 hr = 60 min', notes: 'Machine hours to cycle time minutes' },
      { from: 'BOX', to: 'ea', factor: 50, formula: '1 BOX = 50 ea', notes: 'Standard packing shipper box count' }
    ];

    for (const c of conversionDefs) {
      const fromDoc = uomMap[c.from];
      const toDoc = uomMap[c.to];
      if (fromDoc && toDoc) {
        const existingConv = await UOMConversion.findOne({ fromUOM: fromDoc._id, toUOM: toDoc._id });
        if (!existingConv) {
          await UOMConversion.create({
            fromUOM: fromDoc._id,
            toUOM: toDoc._id,
            factor: c.factor,
            formula: c.formula,
            notes: c.notes,
            status: 'Active',
            isActive: true
          });
        }
      }
    }


    // 4. Payment Terms, Currency, Tax
    if (await PaymentTerms.countDocuments() === 0) {
      await PaymentTerms.create([
        { name: 'Net 30 Days', code: 'NET30', days: 30, status: 'Active' },
        { name: 'Net 60 Days', code: 'NET60', days: 60, status: 'Active' },
        { name: 'Net 90 Days', code: 'NET90', days: 90, status: 'Active' },
        { name: 'Immediate / Cash on Delivery', code: 'IMMEDIATE', days: 0, status: 'Active' }
      ]);
    }

    if (await Currency.countDocuments() === 0) {
      await Currency.create([
        { code: 'INR', name: 'Indian Rupee', symbol: '₹', isBase: true, status: 'Active' },
        { code: 'USD', name: 'US Dollar', symbol: '$', isBase: false, exchangeRate: 83.5, status: 'Active' }
      ]);
    }

    if (await Tax.countDocuments() === 0) {
      await Tax.create([
        { name: 'GST 18%', code: 'GST18', rate: 18, type: 'GST', status: 'Active' },
        { name: 'GST 28%', code: 'GST28', rate: 28, type: 'GST', status: 'Active' },
        { name: 'GST 12%', code: 'GST12', rate: 12, type: 'GST', status: 'Active' }
      ]);
    }

    // 5. Vendor & Customer Categories
    let vendorCat = await VendorCategory.findOne({ name: 'Hardware Supplier' });
    if (!vendorCat) vendorCat = await VendorCategory.create({ name: 'Hardware Supplier' });

    let customerCat = await CustomerCategory.findOne({ name: 'Distributor' });
    if (!customerCat) customerCat = await CustomerCategory.create({ name: 'Distributor' });

    // 6. Vendors & Customers
    if (await Vendor.countDocuments() === 0) {
      await Vendor.create([
        { name: 'SteelWorks Corp Pvt Ltd', code: 'V-001', categoryId: vendorCat._id, status: 'Active', email: 'sales@steelworks.com', phone: '+91 9876543210' },
        { name: 'Indo Aluminum Supplies', code: 'V-002', categoryId: vendorCat._id, status: 'Active', email: 'contact@indoaluminum.com', phone: '+91 9876543211' }
      ]);
    }

    let customer = await Customer.findOne({ code: 'C-001' });
    if (!customer) {
      customer = await Customer.create({
        name: 'Global Auto Motors Ltd', code: 'C-001', categoryId: customerCat._id, status: 'Active', email: 'orders@globalautomotors.com', phone: '+91 9123456789'
      });
    }
    if (await Customer.countDocuments() < 3) {
      await Customer.create([
        { name: 'TATA Motors Parts Division', code: 'C-002', categoryId: customerCat._id, status: 'Active', email: 'procurement@tatamotors.com' },
        { name: 'Mahindra Auto Supplies', code: 'C-003', categoryId: customerCat._id, status: 'Active', email: 'vendor@mahindra.com' },
        { name: 'Bosch Automotive India', code: 'C-004', categoryId: customerCat._id, status: 'Active', email: 'supply@bosch.in' }
      ]);
    }

    // 7. Material & Product Categories
    let catRM = await MaterialCategory.findOne({ name: 'Raw Metal' });
    if (!catRM) catRM = await MaterialCategory.create({ name: 'Raw Metal', status: 'Active' });

    let catFG = await ProductCategory.findOne({ name: 'Finished Assembly' });
    if (!catFG) catFG = await ProductCategory.create({ name: 'Finished Assembly', description: 'Complete Automotive Assemblies', status: 'Active' });

    // 8. Materials & Products
    if (await Material.countDocuments() === 0) {
      await Material.create([
        { name: 'High-Grade Steel Sheet (2mm)', code: 'RM-STL-001', categoryId: catRM._id, uomId: uomKg._id, Material_Type: 'RAW_MATERIAL', status: 'Active', standardCost: 120 },
        { name: 'Aluminum Alloy Ingot', code: 'RM-ALU-002', categoryId: catRM._id, uomId: uomKg._id, Material_Type: 'RAW_MATERIAL', status: 'Active', standardCost: 240 },
        { name: 'Copper Wire Harness 5m', code: 'RM-COP-003', categoryId: catRM._id, uomId: uomMtr._id, Material_Type: 'RAW_MATERIAL', status: 'Active', standardCost: 85 }
      ]);
    }

    if (await Product.countDocuments() === 0) {
      await Product.create([
        { name: 'Engine Block Assembly 1.5L', code: 'PRD-ENG-001', categoryId: catFG._id, uomId: uomEa._id, sellingPrice: 45000, standardCost: 32000, status: 'Active' },
        { name: 'Precision Piston Kit (Set of 4)', code: 'PRD-PST-002', categoryId: catFG._id, uomId: uomEa._id, sellingPrice: 8500, standardCost: 5400, status: 'Active' },
        { name: 'Ventilated Brake Disc Rotor', code: 'PRD-BRK-003', categoryId: catFG._id, uomId: uomEa._id, sellingPrice: 4200, standardCost: 2800, status: 'Active' }
      ]);
    }

    // 9. Work Centers
    let wc = await WorkCenter.findOne({ code: 'WC-ASSY-01' });
    if (!wc) {
      wc = await WorkCenter.create({
        code: 'WC-ASSY-01', name: 'Main Assembly Line A', type: 'Assembly', plantId: plant._id, departmentId: dept._id,
        capacityPerDay: 200, costPerHour: 450, status: 'Active'
      });
    }

    console.log('✅ Demo Master Data Auto-Seeded Successfully');

    // 10. Automatically populate full module demo data if operational data is missing
    try {
      const { seedMasterAndDemoData } = require('./seedMasterData');
      await seedMasterAndDemoData();
    } catch (moduleSeedErr) {
      console.error('Module demo seed note:', moduleSeedErr.message);
    }
  } catch (err) {
    console.error('AutoSeed Note:', err.message);
  }
};

module.exports = autoSeedData;
