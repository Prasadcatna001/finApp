const fs = require('fs');
const p = 'd:/coding/finapp/context/MoneyContext.tsx';
let content = fs.readFileSync(p, 'utf8');

if (!content.includes('export interface SmsRule')) {
  content = content.replace(
    /export interface Suggestion {/,
    "export interface SmsRule {\n  id: string;\n  bank_name: string;\n  sender_pattern: string;\n  body_pattern: string;\n  type_match: 'debit' | 'credit';\n}\n\nexport interface Suggestion {"
  );
}

if (!content.includes('const [smsRules')) {
  content = content.replace(
    /const \[suggestions, setSuggestions\] = useState<Suggestion\[\]>\(MOCK_SUGGESTIONS\);/,
    "const [suggestions, setSuggestions] = useState<Suggestion[]>(MOCK_SUGGESTIONS);\n  const [smsRules, setSmsRules] = useState<SmsRule[]>([]);"
  );
}

if (!content.includes("load('money_smsRules')")) {
  content = content.replace(
    /load\('money_settlements'\), load\('money_recurring'\)/,
    "load('money_settlements'), load('money_recurring'), load('money_smsRules')"
  );
  content = content.replace(
    /const \[rAcc, rPeo, rTx, rSet, rRec\] =/,
    "const [rAcc, rPeo, rTx, rSet, rRec, rSms] ="
  );
  content = content.replace(
    /if \(rRec\) setRecurringRules\(rRec\); else setRecurringRules\(MOCK_RECURRING\);/,
    "if (rRec) setRecurringRules(rRec); else setRecurringRules(MOCK_RECURRING);\n      if (rSms) setSmsRules(rSms);"
  );
}

fs.writeFileSync(p, content);
console.log('Fixed MoneyContext SMS loading');
