const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client/src/pages/master');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace toggleStatus signature
  const target = '  const toggleStatus = async (row) => {\n    try {';
  const replacement = "  const toggleStatus = async (row) => {\n    if (row.isActive && !window.confirm('Are you sure you want to delete this record?')) return;\n    try {";
  
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`Target not found in ${file}`);
  }
});
