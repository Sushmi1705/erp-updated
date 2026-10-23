const fs = require('fs');
const path = require('path');

const masterDir = path.join(__dirname, 'client/src/pages/master');
const files = fs.readdirSync(masterDir).filter(f => f.endsWith('.jsx'));

const targetText = "window.confirm('Are you sure you want to delete this record?')";
const replacementText = "window.confirm('Are you sure you want to deactivate this record?')";

files.forEach(file => {
  const filePath = path.join(masterDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes(targetText)) {
    content = content.replace(targetText, replacementText);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});

const companySetupPath = path.join(__dirname, 'client/src/pages/company/CompanySetup.jsx');
let companyContent = fs.readFileSync(companySetupPath, 'utf8');
if (companyContent.includes(targetText)) {
    companyContent = companyContent.replace(targetText, replacementText);
    fs.writeFileSync(companySetupPath, companyContent, 'utf8');
    console.log(`Updated CompanySetup.jsx`);
}

