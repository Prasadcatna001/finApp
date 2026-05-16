import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMoney, Transaction, CategoryKey } from '../../context/MoneyContext';
import { Colors } from '../../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

const FILTERS = ['All', 'Debit', 'Credit', 'Transfer'] as const;
type Filter = typeof FILTERS[number];

function dateLabel(iso: string) {
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function groupByDate(txs: Transaction[]) {
  const groups: Record<string, Transaction[]> = {};
  txs.forEach(tx => {
    const label = dateLabel(tx.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });
  return groups;
}

function getMonthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(monthKey: string) {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function ActivityScreen() {
  const { transactions, people, accounts, preferredCurrency, deleteTransaction } = useMoney();
  const [filter, setFilter] = useState<Filter>('All');
  
  // Available months
  const months = Array.from(new Set(transactions.map(t => getMonthKey(t.date)))).sort().reverse();
  const currentMonthKey = getMonthKey(new Date().toISOString());
  const [selectedMonth, setSelectedMonth] = useState<string>(months.length > 0 ? months[0] : currentMonthKey);

  // Filter txs
  const monthTxs = transactions.filter(t => getMonthKey(t.date) === selectedMonth);
  const filtered = monthTxs.filter(tx => {
    if (filter === 'Debit') return tx.type === 'debit';
    if (filter === 'Credit') return tx.type === 'credit';
    if (filter === 'Transfer') return tx.category === 'transfer' || tx.category === 'repayment';
    return true;
  });

  const grouped = groupByDate(filtered);

  // Month Stats
  const monthIncome = monthTxs.filter(t => t.type === 'credit' && t.category !== 'transfer').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxs.filter(t => t.type === 'debit' && t.category !== 'transfer').reduce((s, t) => s + t.amount, 0);

  const getPerson = (id?: string) => people.find(p => p.id === id);
  const getAccount = (id: string) => accounts.find(a => a.id === id);

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Deleted Transaction' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity</Text>
      </View>

      {/* Month Selector & Summary */}
      {months.length > 0 && (
        <View style={styles.monthHeader}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScrollRow}>
            {months.map(m => (
              <Pressable key={m} style={[styles.monthChip, selectedMonth === m && styles.monthChipActive]} onPress={() => setSelectedMonth(m)}>
                <Text style={[styles.monthChipText, selectedMonth === m && styles.monthChipTextActive]}>{formatMonth(m)}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Income</Text>
              <Text style={[styles.summaryVal, { color: Colors.income }]}>+{preferredCurrency}{monthIncome.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Expense</Text>
              <Text style={[styles.summaryVal, { color: Colors.expense }]}>-{preferredCurrency}{monthExpense.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>{f}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {Object.entries(grouped).map(([dateLabel, txs]) => (
          <View key={dateLabel} style={styles.dateGroup}>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
            <View style={styles.groupCard}>
              {txs.map((tx, i) => {
                const cat = Colors.categories[tx.category as CategoryKey];
                const person = getPerson(tx.person_id);
                const account = getAccount(tx.account_id);
                const isCredit = tx.type === 'credit';
                const isTransfer = tx.category === 'transfer' || tx.category === 'repayment';

                return (
                  <React.Fragment key={tx.id}>
                    {i > 0 && <View style={[styles.rowDivider, { marginLeft: 68 }]} />}
                    <View style={styles.txRowWrapper}>
                      <View style={styles.txRow}>
                        <View style={[styles.txIcon, { backgroundColor: cat?.color + '22' }]}>
                          <Text style={styles.txIconText}>{cat?.icon}</Text>
                        </View>
                        <View style={styles.txInfo}>
                          <View style={styles.txTitleRow}>
                            <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                            {tx.source === 'sms_suggestion' && (
                              <View style={styles.smsBadge}><Text style={styles.smsBadgeText}>SMS</Text></View>
                            )}
                          </View>
                          <Text style={styles.txSub}>
                            {account?.name}{person ? ` · ${person.name}` : ''}
                            {isTransfer ? ' · Transfer' : ''}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <Text style={[styles.txAmount, {
                            color: isCredit ? Colors.income : isTransfer ? Colors.transfer : Colors.expense
                          }]}>
                            {isCredit ? '+' : '-'}{preferredCurrency}{tx.amount.toLocaleString('en-IN')}
                          </Text>
                          <Pressable onPress={() => handleDelete(tx.id)} style={styles.delBtn}>
                            <Text style={styles.delBtnText}>✕</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: Colors.text },
  monthHeader: { paddingHorizontal: 20, paddingTop: 10 },
  monthScrollRow: { gap: 10, paddingBottom: 16 },
  monthChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  monthChipActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary + '40' },
  monthChipText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textSub },
  monthChipTextActive: { color: Colors.primary },
  summaryBox: { flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 10 },
  summaryItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub, marginBottom: 4 },
  summaryVal: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  summaryDivider: { width: 1, backgroundColor: Colors.divider, height: '100%' },
  filterScroll: { flexGrow: 0, flexShrink: 0, marginBottom: 4 },
  filterRow: { paddingHorizontal: 20, gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  filterChipTextActive: { color: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 4 },
  dateGroup: { marginBottom: 20 },
  dateLabel: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub, marginBottom: 8, letterSpacing: 0.3 },
  groupCard: { backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  rowDivider: { height: 1, backgroundColor: Colors.divider },
  txRowWrapper: { overflow: 'hidden' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  txTitle: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.text, flex: 1 },
  txSub: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSub, marginTop: 2 },
  txAmount: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
  delBtn: { backgroundColor: Colors.expenseBg, width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  delBtnText: { color: Colors.expense, fontFamily: 'Outfit_500Medium', fontSize: 12 },
  smsBadge: { backgroundColor: Colors.pendingBg, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 1 },
  smsBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 9, color: Colors.pending },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSub },
});
