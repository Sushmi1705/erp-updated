const mongoose = require('mongoose');

async function seed() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/erp-system');
    console.log('Connected to DB. Wiping existing master data...');
    
    // Import Models
    const { Company, Plant, Department, BusinessUnit } = require('./src/models/CompanyStructure');
    const { Warehouse } = require('./src/models/MasterWarehouse');
    const { Material, MaterialCategory } = require('./src/models/MasterMaterial');
    const { Vendor, VendorCategory } = require('./src/models/MasterVendor');
    const { Customer, CustomerCategory } = require('./src/models/MasterCustomer');
    const { UOM } = require('./src/models/MasterUOM');
    const { PaymentTerms } = require('./src/models/MasterPaymentTerms');
    const { Currency } = require('./src/models/MasterCurrency');
    const { Tax } = require('./src/models/MasterTax');
    const { WorkCenter } = require('./src/models/MasterWorkCenter');
    const { POHeader } = require('./src/models/PurchaseOrder');
    const { PRHeader } = require('./src/models/PurchaseRequisition');
    const { SalesOrder } = require('./src/models/SalesOrder');
    const Role = require('./src/models/Role');
    const User = require('./src/models/User');

    // Wipe DB
    await Promise.all([
      Company.deleteMany({}), Plant.deleteMany({}), Warehouse.deleteMany({}), Department.deleteMany({}), BusinessUnit.deleteMany({}),
      Material.deleteMany({}), MaterialCategory.deleteMany({}),
      Vendor.deleteMany({}), VendorCategory.deleteMany({}), Customer.deleteMany({}), CustomerCategory.deleteMany({}), UOM.deleteMany({}),
      PaymentTerms.deleteMany({}), Currency.deleteMany({}), Tax.deleteMany({}),
      WorkCenter.deleteMany({}), POHeader.deleteMany({}), PRHeader.deleteMany({}),
      SalesOrder.deleteMany({}), Role.deleteMany({}), User.deleteMany({})
    ]);

    console.log('DB Wiped. Seeding new data...');

    // 1. Roles & Users
    const role = await Role.create({ name: 'Admin', description: 'System Administrator', permissions: [{ module: 'All' }] });
    const user = await User.create({ firstName: 'John', lastName: 'Doe', email: 'john@example.com', password: 'password123', role: role._id, status: 'Active' });

    // 2. Company Structure
    const company = await Company.create({ name: 'Precision Auto Components', code: 'PAC01', status: 'Active' });
    const bu = await BusinessUnit.create({ companyId: company._id, name: 'Automotive Parts', code: 'BU-AUTO', headUserId: user._id });
    const plant = await Plant.create({ companyId: company._id, businessUnitId: bu._id, name: 'Main Assembly Plant', code: 'PL-01', location: 'Detroit, MI' });
    const warehouse = await Warehouse.create({ plantId: plant._id, name: 'Central Raw Materials', code: 'WH-RM-01', type: 'Raw Material' });
    const fgWarehouse = await Warehouse.create({ plantId: plant._id, name: 'Finished Goods DC', code: 'WH-FG-01', type: 'Finished Goods' });
    const dept = await Department.create({ companyId: company._id, name: 'Production', code: 'DEPT-PROD', managerUserId: user._id });

    // 3. UOM, Payment Terms, Currency, Tax
    const uomEa = await UOM.create({ name: 'Each', code: 'EA', type: 'Quantity', symbol: 'ea' });
    const uomKg = await UOM.create({ name: 'Kilograms', code: 'KG', type: 'Weight', symbol: 'kg' });

    await PaymentTerms.create([
      { name: 'Net 30 Days', code: 'NET30', days: 30, status: 'Active' },
      { name: 'Net 60 Days', code: 'NET60', days: 60, status: 'Active' },
      { name: 'Net 90 Days', code: 'NET90', days: 90, status: 'Active' },
      { name: 'Immediate / Cash on Delivery', code: 'IMMEDIATE', days: 0, status: 'Active' },
      { name: '100% Advance Payment', code: 'ADVANCE', days: 0, status: 'Active' }
    ]);

    await Currency.create([
      { code: 'INR', name: 'Indian Rupee', symbol: '₹', isBase: true, status: 'Active' },
      { code: 'USD', name: 'US Dollar', symbol: '$', isBase: false, exchangeRate: 83.5, status: 'Active' },
      { code: 'EUR', name: 'Euro', symbol: '€', isBase: false, exchangeRate: 90.2, status: 'Active' }
    ]);

    await Tax.create([
      { name: 'GST 18%', code: 'GST18', rate: 18, type: 'GST', status: 'Active' },
      { name: 'GST 28%', code: 'GST28', rate: 28, type: 'GST', status: 'Active' },
      { name: 'GST 12%', code: 'GST12', rate: 12, type: 'GST', status: 'Active' },
      { name: 'GST 5%',  code: 'GST5',  rate: 5,  type: 'GST', status: 'Active' }
    ]);

    // 4. Vendors & Customers
    const vendorCat = await VendorCategory.create({ name: 'Hardware Supplier' });
    const customerCat = await CustomerCategory.create({ name: 'Distributor' });
    
    const vendor = await Vendor.create({ name: 'SteelWorks Corp', code: 'V-001', categoryId: vendorCat._id, status: 'Active' });
    const customer = await Customer.create({ name: 'Global Auto Motors', code: 'C-001', categoryId: customerCat._id, status: 'Active' });

    // 5. Material Categories & Materials
    const catRM = await MaterialCategory.create({ name: 'Raw Metal', status: 'Active' });
    const catFG = await MaterialCategory.create({ name: 'Finished Assembly', status: 'Active' });

    const matRM = await Material.create({
      name: 'High-Grade Steel Sheet', code: 'RM-STL-001', categoryId: catRM._id, uomId: uomKg._id,
      Material_Type: 'RAW_MATERIAL', status: 'Active', standardCost: 1.50
    });
    
    const matFG = await Material.create({
      name: 'Engine Block Assembly', code: 'FG-ENG-001', categoryId: catFG._id, uomId: uomEa._id,
      Material_Type: 'FINISHED_GOOD', status: 'Active', standardCost: 1500
    });

    // 6. Work Centers
    const wc = await WorkCenter.create({
      code: 'WC-ASSY-01', name: 'Assembly Line A', type: 'Assembly', plantId: plant._id, departmentId: dept._id,
      capacityPerDay: 100, costPerHour: 50, status: 'Active'
    });

    // 7. PO, PR, Sales Order (for drop downs)
    await POHeader.create({
      poNumber: 'PO-10001', vendorId: vendor._id, totalAmount: 5000, approvalStatus: 'Approved',
      deliveryStatus: 'In-Transit', companyId: company._id
    });
    await PRHeader.create({
      prNumber: 'PR-10001', requesterId: user._id, totalValue: 2000, status: 'Approved'
    });
    await SalesOrder.create({
      orderNumber: 'SO-10001', customerId: customer._id, totalAmount: 15000, status: 'Confirmed'
    });

    console.log('✅ Master Data Seeded Successfully!');
    process.exit(0);

  } catch(e) {
    console.error('Seed Error:', e);
    process.exit(1);
  }
}

seed();
