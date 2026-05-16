const fs = require('fs');
const path = require('path');
const files = ['app/recurring.tsx', 'app/record-repayment.tsx', 'app/profile.tsx', 'app/person-detail.tsx', 'app/add-transaction.tsx', 'app/add-split.tsx', 'app/add-person.tsx', 'app/add-lending.tsx', 'app/add-account.tsx'];
files.forEach(file => {
  const p = path.join(__dirname, file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(/router\.back\(\)/g, "router.canGoBack() ? router.back() : router.replace('/')");
  fs.writeFileSync(p, content);
});
console.log('Replaced router.back() calls');
