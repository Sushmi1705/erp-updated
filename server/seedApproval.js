const mongoose = require('mongoose');
require('dotenv').config();
const { ApprovalConfig } = require('./src/models/Approval');
const Role = require('./src/models/Role');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/PrecisionERP?retryWrites=true&w=majority').then(async () => {
  console.log('Connected to DB');
  
  // Find the Super Admin role (or any role) to assign as the approver
  const role = await Role.findOne({ name: 'Super Admin' });
  
  if (!role) {
    console.log('Super Admin role not found');
    process.exit(1);
  }

  // Create a rule that creating any of these modules requires Super Admin approval
  const modules = ['Plant', 'Branch', 'Warehouse', 'CostCenter', 'BusinessUnit'];
  
  for (const mod of modules) {
    await ApprovalConfig.deleteMany({ module: mod });
    await ApprovalConfig.create({
      module: mod,
      action: 'create',
      levels: [
        { level: 1, roleId: role._id }
      ]
    });
  }

  console.log('Successfully seeded ApprovalConfigs for all Company modules!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
