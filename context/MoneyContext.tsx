import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ──────────────────────────────────────────────────────────────────
export type AccountType = 'bank' | 'credit_card' | 'upi' | 'cash' | 'wallet';
export type TxType = 'debit' | 'credit' | 'transfer';
export type SettleType = 'lent' | 'borrowed' | 'split';
export type SettleStatus = 'pending' | 'partial' | 'settled';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type CategoryKey = 'food' | 'transport' | 'shopping' | 'health' | 'entertainment' | 'utilities' | 'rent' | 'education' | 'salary' | 'transfer' | 'repayment' | 'other';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  bank_name?: string;
  balance: number;
  upi_id?: string;
  funding_account_id?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  alias?: string;
  notes?: string;
  avatar_color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TxType;
  title: string;
  note?: string;
  category: CategoryKey;
  account_id: string;
  person_id?: string;
  settlement_id?: string;
  date: string;
  created_at: string;
  source: 'manual' | 'sms_suggestion';
  is_confirmed: boolean;
}

export interface Settlement {
  id: string;
  type: SettleType;
  person_id: string;
  total_amount: number;
  paid_amount: number;
  status: SettleStatus;
  description: string;
  account_id: string;
  date: string;
  note?: string;
  created_at: string;
}

export interface RecurringRule {
  id: string;
  title: string;
  amount: number;
  account_id: string;
  frequency: FrequencyType;
  next_due: string;
  category: CategoryKey;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

export interface SmsRule {
  id: string;
  bank_name: string;
  sender_pattern: string;
  body_pattern: string;
  type_match: 'debit' | 'credit';
}

export interface Suggestion {
  id: string;
  type: 'repayment' | 'recurring' | 'link_person';
  message: string;
  meta?: Record<string, any>;
  dismissed: boolean;
}

interface MoneyContextType {
  accounts: Account[];
  people: Person[];
  transactions: Transaction[];
  settlements: Settlement[];
  recurringRules: RecurringRule[];
  suggestions: Suggestion[];
  smsRules: SmsRule[];
  // Accounts
  addAccount: (a: Omit<Account, 'id' | 'created_at'>) => void;
  updateAccount: (id: string, a: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  updateAccountBalance: (id: string, delta: number) => void;
  // People
  addPerson: (p: Omit<Person, 'id' | 'created_at'>) => void;
  updatePerson: (id: string, p: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  getPersonNet: (personId: string) => number; // +ve = they owe you, -ve = you owe them
  getPersonSettlements: (personId: string) => Settlement[];
  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'created_at'>) => void;
  deleteTransaction: (id: string) => void;
  getPersonTransactions: (personId: string) => Transaction[];
  // Settlements
  addSettlement: (s: Omit<Settlement, 'id' | 'created_at'>) => void;
  recordRepayment: (settlementId: string, amount: number, accountId: string, note?: string) => void;
  // Recurring
  addRecurring: (r: Omit<RecurringRule, 'id' | 'created_at'>) => void;
  toggleRecurring: (id: string) => void;
  // Suggestions
  dismissSuggestion: (id: string) => void;
  acceptSuggestion: (id: string) => void;
  // SMS Rules
  addSmsRule: (r: Omit<SmsRule, 'id'>) => void;
  deleteSmsRule: (id: string) => void;
  // Stats
  totalOwedToMe: number;
  totalIOwe: number;
  isLoading: boolean;
  userName: string;
  setUserName: (n: string) => void;
  preferredCurrency: string;
  setPreferredCurrency: (c: string) => void;
  resetData: () => Promise<void>;
}

const MoneyContext = createContext<MoneyContextType | null>(null);

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_ACCOUNTS: Account[] = [
  { id: 'a1', name: 'HDFC Savings', type: 'bank', bank_name: 'HDFC Bank', balance: 45200, color: '#60A5FA', is_active: true, created_at: new Date().toISOString() },
  { id: 'a2', name: 'ICICI Credit Card', type: 'credit_card', bank_name: 'ICICI Bank', balance: -8500, color: '#A78BFA', is_active: true, created_at: new Date().toISOString() },
  { id: 'a3', name: 'GPay', type: 'upi', upi_id: 'user@okhdfc', funding_account_id: 'a1', balance: 0, color: '#34C77B', is_active: true, created_at: new Date().toISOString() },
  { id: 'a4', name: 'Cash', type: 'cash', balance: 3200, color: '#F5A524', is_active: true, created_at: new Date().toISOString() },
];

const MOCK_PEOPLE: Person[] = [
  { id: 'p1', name: 'Rahul Sharma', phone: '9876543210', alias: 'Rahul', avatar_color: '#5B5BD6', created_at: new Date().toISOString() },
  { id: 'p2', name: 'Priya Singh', phone: '9123456780', alias: 'Priya', avatar_color: '#E5534B', created_at: new Date().toISOString() },
  { id: 'p3', name: 'Amit Verma', alias: 'Amit', avatar_color: '#34C77B', created_at: new Date().toISOString() },
  { id: 'p4', name: 'Mom', avatar_color: '#F5A524', created_at: new Date().toISOString() },
];

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

const MOCK_SETTLEMENTS: Settlement[] = [
  { id: 's1', type: 'lent', person_id: 'p1', total_amount: 2000, paid_amount: 1000, status: 'partial', description: 'Emergency loan', account_id: 'a3', date: d(12), created_at: d(12) },
  { id: 's2', type: 'split', person_id: 'p1', total_amount: 500, paid_amount: 0, status: 'pending', description: 'Movie tickets (Batman)', account_id: 'a2', date: d(6), note: '₹250 each', created_at: d(6) },
  { id: 's3', type: 'borrowed', person_id: 'p2', total_amount: 800, paid_amount: 800, status: 'settled', description: 'Metro card recharge', account_id: 'a4', date: d(20), created_at: d(20) },
  { id: 's4', type: 'lent', person_id: 'p2', total_amount: 1500, paid_amount: 500, status: 'partial', description: 'Flight booking advance', account_id: 'a1', date: d(5), created_at: d(5) },
  { id: 's5', type: 'split', person_id: 'p3', total_amount: 3200, paid_amount: 0, status: 'pending', description: 'Team lunch split', account_id: 'a2', date: d(2), created_at: d(2) },
  { id: 's6', type: 'borrowed', person_id: 'p4', total_amount: 5000, paid_amount: 5000, status: 'settled', description: 'Rent advance from Mom', account_id: 'a4', date: d(30), created_at: d(30) },
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', amount: 2000, type: 'debit', title: 'Lent to Rahul', category: 'transfer', account_id: 'a3', person_id: 'p1', settlement_id: 's1', date: d(12), created_at: d(12), source: 'manual', is_confirmed: true },
  { id: 't2', amount: 1000, type: 'credit', title: 'Rahul repaid part', category: 'repayment', account_id: 'a3', person_id: 'p1', settlement_id: 's1', date: d(4), created_at: d(4), source: 'manual', is_confirmed: true },
  { id: 't3', amount: 500, type: 'debit', title: 'Movie tickets', category: 'entertainment', account_id: 'a2', person_id: 'p1', settlement_id: 's2', date: d(6), created_at: d(6), source: 'manual', is_confirmed: true },
  { id: 't4', amount: 450, type: 'debit', title: 'Swiggy order', category: 'food', account_id: 'a3', date: d(1), created_at: d(1), source: 'manual', is_confirmed: true },
  { id: 't5', amount: 55000, type: 'credit', title: 'Salary — May 2025', category: 'salary', account_id: 'a1', date: d(3), created_at: d(3), source: 'manual', is_confirmed: true },
  { id: 't6', amount: 1500, type: 'debit', title: 'Priya flight advance', category: 'transfer', account_id: 'a1', person_id: 'p2', settlement_id: 's4', date: d(5), created_at: d(5), source: 'manual', is_confirmed: true },
  { id: 't7', amount: 649, type: 'debit', title: 'Netflix subscription', category: 'entertainment', account_id: 'a2', date: d(8), created_at: d(8), source: 'manual', is_confirmed: true },
  { id: 't8', amount: 3200, type: 'debit', title: 'Team lunch', category: 'food', account_id: 'a2', person_id: 'p3', settlement_id: 's5', date: d(2), created_at: d(2), source: 'manual', is_confirmed: true },
  { id: 't9', amount: 1200, type: 'debit', title: 'Electricity bill', category: 'utilities', account_id: 'a3', date: d(10), created_at: d(10), source: 'manual', is_confirmed: true },
  { id: 't10', amount: 500, type: 'credit', title: 'Priya repaid', category: 'repayment', account_id: 'a3', person_id: 'p2', settlement_id: 's4', date: d(1), created_at: d(1), source: 'sms_suggestion', is_confirmed: true },
];

const MOCK_RECURRING: RecurringRule[] = [
  { id: 'r1', title: 'Netflix', amount: 649, account_id: 'a2', frequency: 'monthly', next_due: new Date(Date.now() + 22 * 86400000).toISOString(), category: 'entertainment', is_active: true, created_at: d(60) },
  { id: 'r2', title: 'LIC Premium', amount: 4200, account_id: 'a1', frequency: 'monthly', next_due: new Date(Date.now() + 5 * 86400000).toISOString(), category: 'utilities', notes: 'Policy #LIC-2034', is_active: true, created_at: d(90) },
  { id: 'r3', title: 'SIP - Mirae Asset', amount: 3000, account_id: 'a1', frequency: 'monthly', next_due: new Date(Date.now() + 12 * 86400000).toISOString(), category: 'other', is_active: true, created_at: d(180) },
];

const MOCK_SUGGESTIONS: Suggestion[] = [];

// ─── Provider ────────────────────────────────────────────────────────────────
export function MoneyProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [smsRules, setSmsRules] = useState<SmsRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserNameState] = useState('You');
  const [preferredCurrency, setPreferredCurrencyState] = useState('₹');

  useEffect(() => { loadAll(); }, []);

  const load = async <T,>(key: string, fallback: T): Promise<T> => {
    try {
      const v = await AsyncStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };

  const save = async (key: string, value: any) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(value)); } catch {}
  };

  const loadAll = async () => {
    try {
      const [acc, ppl, txs, stl, rec, sug, uname, curr] = await Promise.all([
        load('money_accounts', []),
        load('money_people', []),
        load('money_transactions', []),
        load('money_settlements', []),
        load('money_recurring', []),
        load('money_suggestions', []),
        load('money_userName', 'User'),
        load('money_currency', '₹'),
      ]);
      setAccounts(acc); setPeople(ppl); setTransactions(txs);
      setSettlements(stl); setRecurringRules(rec); setSuggestions(sug);
      setUserNameState(uname); setPreferredCurrencyState(curr);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { if (!isLoading) save('money_accounts', accounts); }, [accounts, isLoading]);
  useEffect(() => { if (!isLoading) save('money_people', people); }, [people, isLoading]);
  useEffect(() => { if (!isLoading) save('money_transactions', transactions); }, [transactions, isLoading]);
  useEffect(() => { if (!isLoading) save('money_settlements', settlements); }, [settlements, isLoading]);
  useEffect(() => { if (!isLoading) save('money_recurring', recurringRules); }, [recurringRules, isLoading]);
  useEffect(() => { if (!isLoading) save('money_smsRules', smsRules); }, [smsRules, isLoading]);
  useEffect(() => { if (!isLoading) save('money_suggestions', suggestions); }, [suggestions, isLoading]);

  // Accounts
  const addAccount = (a: Omit<Account, 'id' | 'created_at'>) => {
    const n = { ...a, id: Date.now().toString() + Math.random().toString(), created_at: new Date().toISOString() };
    setAccounts(prev => [...prev, n]);
  };
  const updateAccount = (id: string, a: Partial<Account>) => {
    setAccounts(prev => prev.map(x => x.id === id ? { ...x, ...a } : x));
  };
  const deleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(a => a.id !== id));
  };
  const updateAccountBalance = (id: string, delta: number) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, balance: a.balance + delta } : a));
  };

  // People
  const addPerson = (p: Omit<Person, 'id' | 'created_at'>) => {
    const n = { ...p, id: Date.now().toString() + Math.random().toString(), created_at: new Date().toISOString() };
    setPeople(prev => [...prev, n]);
  };
  const updatePerson = (id: string, p: Partial<Person>) => {
    setPeople(prev => prev.map(person => person.id === id ? { ...person, ...p } : person));
  };
  const deletePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const getPersonNet = (personId: string): number => {
    // +ve = they owe you (lent - repaid), -ve = you owe them (borrowed - repaid)
    return settlements
      .filter(s => s.person_id === personId)
      .reduce((net, s) => {
        const remaining = s.total_amount - s.paid_amount;
        if (s.type === 'lent' || s.type === 'split') return net + remaining;
        if (s.type === 'borrowed') return net - remaining;
        return net;
      }, 0);
  };

  const getPersonSettlements = (personId: string) =>
    settlements.filter(s => s.person_id === personId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Transactions
  const addTransaction = (t: Omit<Transaction, 'id' | 'created_at'>) => {
    const n = { ...t, id: Date.now().toString() + Math.random().toString(), created_at: new Date().toISOString() };
    setTransactions(prev => [n, ...prev]);

    // Smart Suggestion Engine
    if (t.type === 'credit' && !t.settlement_id) {
      // Find a pending settlement where someone owes us roughly this amount
      const matchingSettlement = settlements.find(s => 
        (s.type === 'lent' || s.type === 'split') && 
        s.status !== 'settled' && 
        (s.total_amount - s.paid_amount) === t.amount
      );
      
      if (matchingSettlement) {
        const person = people.find(p => p.id === matchingSettlement.person_id);
        const suggestion: Suggestion = {
          id: Date.now().toString() + Math.random().toString(),
          type: 'repayment',
          message: `₹${t.amount} received — possible repayment from ${person?.name || 'someone'} for "${matchingSettlement.description}"?`,
          meta: { 
            transaction_id: n.id,
            person_id: matchingSettlement.person_id, 
            settlement_id: matchingSettlement.id, 
            amount: t.amount,
            account_id: t.account_id
          },
          dismissed: false
        };
        setSuggestions(prev => [suggestion, ...prev]);
      }
    }
  };
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };
  const getPersonTransactions = (personId: string) =>
    transactions.filter(t => t.person_id === personId);

  // Settlements
  const addSettlement = (s: Omit<Settlement, 'id' | 'created_at'>) => {
    const n = { ...s, id: Date.now().toString() + Math.random().toString(), created_at: new Date().toISOString() };
    setSettlements(prev => [n, ...prev]);
  };

  const recordRepayment = (settlementId: string, amount: number, accountId: string, note?: string) => {
    setSettlements(prev => prev.map(s => {
      if (s.id !== settlementId) return s;
      const newPaid = Math.min(s.paid_amount + amount, s.total_amount);
      const newStatus: SettleStatus = newPaid >= s.total_amount ? 'settled' : 'partial';
      return { ...s, paid_amount: newPaid, status: newStatus };
    }));
    // Also create a transaction
    const s = settlements.find(x => x.id === settlementId);
    if (s) {
      addTransaction({
        amount, type: 'credit', title: `Repayment from ${people.find(p => p.id === s.person_id)?.name || 'Person'}`,
        category: 'repayment', account_id: accountId, person_id: s.person_id,
        settlement_id: settlementId, note, date: new Date().toISOString(),
        source: 'manual', is_confirmed: true,
      });
    }
  };

  // Recurring
  const addRecurring = (r: Omit<RecurringRule, 'id' | 'created_at'>) => {
    const n = { ...r, id: Date.now().toString() + Math.random().toString(), created_at: new Date().toISOString() };
    setRecurringRules(prev => [...prev, n]);
  };
  const toggleRecurring = (id: string) => {
    setRecurringRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
  };

  const dismissSuggestion = (id: string) => {
    setSuggestions(prev => prev.map(s => s.id === id ? { ...s, dismissed: true } : s));
  };

  const acceptSuggestion = (id: string) => {
    const sug = suggestions.find(s => s.id === id);
    if (!sug) return;
    
    if (sug.type === 'repayment' && sug.meta) {
      // We found a match! We don't need to create a *new* transaction because the transaction 
      // already exists (it triggered the suggestion). We just need to update the settlement
      // and link the transaction.
      
      const { settlement_id, amount, transaction_id } = sug.meta;
      
      // Update the settlement
      setSettlements(prev => prev.map(s => {
        if (s.id !== settlement_id) return s;
        const newPaid = Math.min(s.paid_amount + amount, s.total_amount);
        const newStatus: SettleStatus = newPaid >= s.total_amount ? 'settled' : 'partial';
        return { ...s, paid_amount: newPaid, status: newStatus };
      }));

      // Update the transaction to link it
      setTransactions(prev => prev.map(t => 
        t.id === transaction_id ? { ...t, settlement_id, person_id: sug.meta?.person_id } : t
      ));
    }

    dismissSuggestion(id);
  };

  // SMS Rules
  const addSmsRule = (r: Omit<SmsRule, 'id'>) => {
    setSmsRules(prev => [...prev, { ...r, id: Date.now().toString() }]);
  };
  const deleteSmsRule = (id: string) => {
    setSmsRules(prev => prev.filter(x => x.id !== id));
  };

  // Computed stats
  const totalOwedToMe = people.reduce((sum, p) => {
    const net = getPersonNet(p.id);
    return net > 0 ? sum + net : sum;
  }, 0);
  const totalIOwe = people.reduce((sum, p) => {
    const net = getPersonNet(p.id);
    return net < 0 ? sum + Math.abs(net) : sum;
  }, 0);

  const setUserName = async (n: string) => { setUserNameState(n); await save('money_userName', n); };
  const setPreferredCurrency = async (c: string) => { setPreferredCurrencyState(c); await save('money_currency', c); };

  const resetData = async () => {
    setIsLoading(true);
    await AsyncStorage.clear();
    setAccounts([]);
    setPeople([]);
    setTransactions([]);
    setSettlements([]);
    setRecurringRules([]);
    setSmsRules([]);
    setSuggestions([]);
    
    // Explicitly save empty state so next app launch doesn't load mock data
    await save('money_accounts', []);
    await save('money_people', []);
    await save('money_transactions', []);
    await save('money_settlements', []);
    await save('money_recurring', []);
    await save('money_smsRules', []);
    
    setIsLoading(false);
  };

  return (
    <MoneyContext.Provider value={{
      accounts, people, transactions, settlements, recurringRules, suggestions, smsRules,
      addAccount, updateAccount, deleteAccount, updateAccountBalance,
      addPerson, updatePerson, deletePerson, getPersonNet, getPersonSettlements,
      addTransaction, deleteTransaction, getPersonTransactions,
      addSettlement, recordRepayment,
      addRecurring, toggleRecurring,
      dismissSuggestion, acceptSuggestion,
      addSmsRule, deleteSmsRule,
      totalOwedToMe, totalIOwe,
      isLoading, userName, setUserName,
      preferredCurrency, setPreferredCurrency,
      resetData,
    }}>
      {children}
    </MoneyContext.Provider>
  );
}

export function useMoney() {
  const ctx = useContext(MoneyContext);
  if (!ctx) throw new Error('useMoney must be used within MoneyProvider');
  return ctx;
}
