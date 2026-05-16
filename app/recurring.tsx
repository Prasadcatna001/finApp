import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';

function daysUntil(iso: string) {
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Due today';
  if (diff < 0) return `Overdue by ${Math.abs(diff)}d`;
  return `In ${diff} days`;
}

export default function RecurringScreen() {
  const router = useRouter();
  const { recurringRules, toggleRecurring, accounts, preferredCurrency } = useMoney();

  const getAccount = (id: string) => accounts.find(a => a.id === id);
  const active = recurringRules.filter(r => r.is_active);
  const inactive = recurringRules.filter(r => !r.is_active);

  const totalMonthly = active.reduce((sum, r) => {
    const m = r.frequency === 'monthly' ? r.amount : r.frequency === 'yearly' ? r.amount / 12 : r.frequency === 'weekly' ? r.amount * 4 : r.amount * 30;
    return sum + m;
  }, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.title}>Recurring Payments</Text>
          <View style={{ width: 38 }} />
        </View>

        {/* Monthly summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Estimated monthly outflow</Text>
          <Text style={styles.summaryAmount}>{preferredCurrency}{Math.round(totalMonthly).toLocaleString('en-IN')}</Text>
          <Text style={styles.summaryCount}>{active.length} active rules</Text>
        </View>

        {/* Active */}
        {active.length > 0 && (
          <>
            <Text style={styles.groupLabel}>Active</Text>
            <View style={styles.listCard}>
              {active.map((r, i) => {
                const acc = getAccount(r.account_id);
                const cat = Colors.categories[r.category as keyof typeof Colors.categories];
                const dueStr = daysUntil(r.next_due);
                const isOverdue = new Date(r.next_due) < new Date();
                return (
                  <React.Fragment key={r.id}>
                    {i > 0 && <View style={[styles.divider, { marginLeft: 68 }]} />}
                    <View style={styles.ruleRow}>
                      <View style={[styles.ruleIcon, { backgroundColor: cat?.color + '22' }]}>
                        <Text style={styles.ruleIconText}>{cat?.icon}</Text>
                      </View>
                      <View style={styles.ruleInfo}>
                        <Text style={styles.ruleTitle}>{r.title}</Text>
                        <Text style={styles.ruleSub}>{acc?.name} · {r.frequency}</Text>
                        <Text style={[styles.ruleDue, { color: isOverdue ? Colors.expense : Colors.pending }]}>{dueStr}</Text>
                      </View>
                      <View style={styles.ruleRight}>
                        <Text style={styles.ruleAmount}>{preferredCurrency}{r.amount.toLocaleString('en-IN')}</Text>
                        <Switch value={r.is_active} onValueChange={() => toggleRecurring(r.id)}
                          trackColor={{ true: Colors.primary, false: Colors.surface }} thumbColor="#fff" />
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        {/* Inactive */}
        {inactive.length > 0 && (
          <>
            <Text style={[styles.groupLabel, { marginTop: 20 }]}>Paused</Text>
            <View style={styles.listCard}>
              {inactive.map((r, i) => {
                const cat = Colors.categories[r.category as keyof typeof Colors.categories];
                return (
                  <React.Fragment key={r.id}>
                    {i > 0 && <View style={[styles.divider, { marginLeft: 68 }]} />}
                    <View style={[styles.ruleRow, { opacity: 0.5 }]}>
                      <View style={[styles.ruleIcon, { backgroundColor: cat?.color + '22' }]}>
                        <Text style={styles.ruleIconText}>{cat?.icon}</Text>
                      </View>
                      <View style={styles.ruleInfo}>
                        <Text style={styles.ruleTitle}>{r.title}</Text>
                        <Text style={styles.ruleSub}>{r.frequency}</Text>
                      </View>
                      <View style={styles.ruleRight}>
                        <Text style={styles.ruleAmount}>{preferredCurrency}{r.amount.toLocaleString('en-IN')}</Text>
                        <Switch value={r.is_active} onValueChange={() => toggleRecurring(r.id)}
                          trackColor={{ true: Colors.primary, false: Colors.surface }} thumbColor="#fff" />
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        {recurringRules.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔁</Text>
            <Text style={styles.emptyTitle}>No recurring rules</Text>
            <Text style={styles.emptyText}>When recurring payments are detected, they'll appear here</Text>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  backIcon: { fontFamily: 'Outfit_400Regular', fontSize: 22, color: Colors.text, lineHeight: 26 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.text },
  summaryCard: { marginHorizontal: 20, marginBottom: 24, backgroundColor: Colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder },
  summaryLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub, marginBottom: 4 },
  summaryAmount: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: Colors.expense, letterSpacing: -0.5 },
  summaryCount: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 4 },
  groupLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub, paddingHorizontal: 20, marginBottom: 10 },
  listCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  divider: { height: 1, backgroundColor: Colors.divider },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  ruleIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  ruleIconText: { fontSize: 18 },
  ruleInfo: { flex: 1 },
  ruleTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text },
  ruleSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  ruleDue: { fontFamily: 'Outfit_500Medium', fontSize: 11, marginTop: 3 },
  ruleRight: { alignItems: 'flex-end', gap: 4 },
  ruleAmount: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: Colors.text },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 8 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSub, textAlign: 'center' },
});
