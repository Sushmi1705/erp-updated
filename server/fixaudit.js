const fs = require('fs');
const path = require('path');

const files = [
  'src/controllers/engineering.controller.js',
  'src/controllers/quality.controller.js',
  'src/controllers/production.controller.js',
  'src/controllers/inventory.controller.js',
  'src/controllers/receipt.controller.js',
  'src/controllers/maintenance.controller.js',
  'src/controllers/finance.controller.js',
  'src/controllers/dispatch.controller.js',
  'src/controllers/mrp.controller.js',
  'src/controllers/demand.controller.js',
  'src/controllers/procurement.controller.js',
  'src/controllers/sales.controller.js',
  'src/controllers/capacity.controller.js',
  'src/controllers/shopfloor.controller.js'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the import
  content = content.replace(
    /const Audit = require\('\.\.\/models\/Audit'\);/, 
    "const { AuditLog } = require('../models/Audit');"
  );
  
  // Fix the function
  content = content.replace(
    /await Audit\.create\(\{\s*action,\s*entityType,\s*entityId,\s*user:\s*userId,\s*changes:\s*changes\s*\?\s*JSON\.stringify\(changes\)\s*:\s*null,\s*timestamp:\s*new Date\(\)\s*\}\);/g,
    "await AuditLog.create({\n      action,\n      module: entityType,\n      recordId: entityId,\n      changedBy: userId,\n      newValue: changes || null\n    });"
  );

  fs.writeFileSync(filePath, content);
}
console.log("Fixed all audit logs!");
