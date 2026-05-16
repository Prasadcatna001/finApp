const fs = require('fs');
const path = require('path');
const files = ['app/record-repayment.tsx', 'app/profile.tsx', 'app/add-transaction.tsx', 'app/add-split.tsx', 'app/add-person.tsx', 'app/add-lending.tsx', 'app/add-account.tsx'];
files.forEach(file => {
  const p = path.join(__dirname, file);
  let content = fs.readFileSync(p, 'utf8');
  
  if (!content.includes("import Toast")) {
     content = content.replace("import * as Haptics from 'expo-haptics';", "import * as Haptics from 'expo-haptics';\nimport Toast from 'react-native-toast-message';");
  }

  content = content.replace(/Haptics\.notificationAsync\(Haptics\.NotificationFeedbackType\.Success\);/g, "Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);\n    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });");
  
  fs.writeFileSync(p, content);
});
console.log('Added Toasts');
