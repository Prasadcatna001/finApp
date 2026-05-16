import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney } from '../../context/MoneyContext';
import { Colors } from '../../constants/Colors';

function fmt(n: number) {
  return Math.abs(n).toLocaleString('en-IN');
}
function dateLabel(iso: string) {
  const d = new Date(iso), now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function HomeScreen() {
  const router = useRouter();
  const {
    transactions, settlements, people, accounts,
    totalOwedToMe, totalIOwe, suggestions, dismissSuggestion, acceptSuggestion,
    preferredCurrency, userName,
  } = useMoney();

  const recent = transactions.slice(0, 6);
  const pendingSettlements = settlements.filter(s => s.status !== 'settled');
  const activeSuggestions = suggestions.filter(s => !s.dismissed);

  const totalBalance = accounts.filter(a => a.type !== 'credit_card').reduce((sum, a) => sum + a.balance, 0);

  const getPerson = (id?: string) => people.find(p => p.id === id);
  const getAccount = (id: string) => accounts.find(a => a.id === id);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'} 👋</Text>
            <Text style={styles.title}>Money Overview</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/recurring')}>
              <Text style={styles.iconBtnText}>🔁</Text>
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => router.push('/profile')}>
              <Text style={styles.iconBtnText}>⚙️</Text>
            </Pressable>
          </View>
        </View>

        {/* Balance overview card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceMain}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{preferredCurrency}{fmt(totalBalance)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <View style={styles.balanceStat}>
              <View style={[styles.balanceDot, { backgroundColor: Colors.income }]} />
              <View>
                <Text style={styles.balanceStatLabel}>Owed to you</Text>
                <Text style={[styles.balanceStatVal, { color: Colors.income }]}>{preferredCurrency}{fmt(totalOwedToMe)}</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <View style={[styles.balanceDot, { backgroundColor: Colors.expense }]} />
              <View>
                <Text style={styles.balanceStatLabel}>You owe</Text>
                <Text style={[styles.balanceStatVal, { color: Colors.expense }]}>{preferredCurrency}{fmt(totalIOwe)}</Text>
              </View>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceStat}>
              <View style={[styles.balanceDot, { backgroundColor: Colors.pending }]} />
              <View>
                <Text style={styles.balanceStatLabel}>Pending</Text>
                <Text style={[styles.balanceStatVal, { color: Colors.pending }]}>{pendingSettlements.length}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Smart Suggestions */}
        {activeSuggestions.map(s => (
          <View key={s.id} style={styles.suggestionCard}>
            <Text style={styles.suggestionIcon}>💡</Text>
            <View style={styles.suggestionContent}>
              <Text style={styles.suggestionText}>{s.message}</Text>
              <View style={styles.suggestionActions}>
                <Pressable onPress={() => dismissSuggestion(s.id)} style={styles.sugBtnDismiss}>
                  <Text style={styles.sugBtnDismissText}>Ignore</Text>
                </Pressable>
                <Pressable onPress={() => acceptSuggestion(s.id)} style={styles.sugBtnAccept}>
                  <Text style={styles.sugBtnAcceptText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Pending Settlements */}
        {pendingSettlements.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pending Settlements</Text>
              <Pressable onPress={() => router.push('/(tabs)/people')}>
                <Text style={styles.seeAll}>See all ›</Text>
              </Pressable>
            </View>
            <View style={styles.card}>
              {pendingSettlements.slice(0, 4).map((s, i) => {
                const person = getPerson(s.person_id);
                const remaining = s.total_amount - s.paid_amount;
                const isOwed = s.type === 'lent' || s.type === 'split';
                const sCol = Colors.settlements[s.type];
                return (
                  <React.Fragment key={s.id}>
                    {i > 0 && <View style={styles.divider} />}
                    <Pressable style={styles.settleRow} onPress={() => router.push({ pathname: '/person-detail', params: { id: s.person_id } })}>
                      <View style={[styles.personAvatar, { backgroundColor: person?.avatar_color + '30' }]}>
                        <Text style={[styles.personAvatarText, { color: person?.avatar_color }]}>
                          {person?.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.settleInfo}>
                        <Text style={styles.settleName}>{person?.name}</Text>
                        <Text style={styles.settleDesc}>{s.description}</Text>
                      </View>
                      <View style={styles.settleAmountWrap}>
                        <Text style={[styles.settleAmount, { color: isOwed ? Colors.income : Colors.expense }]}>
                          {isOwed ? '+' : '-'}{preferredCurrency}{fmt(remaining)}
                        </Text>
                        <View style={[styles.settleTag, { backgroundColor: sCol.bg }]}>
                          <Text style={[styles.settleTagText, { color: sCol.color }]}>{sCol.label}</Text>
                        </View>
                      </View>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Pressable onPress={() => router.push('/(tabs)/activity')}>
              <Text style={styles.seeAll}>See all ›</Text>
            </Pressable>
          </View>
          <View style={styles.card}>
            {recent.map((tx, i) => {
              const cat = Colors.categories[tx.category];
              const person = getPerson(tx.person_id);
              const account = getAccount(tx.account_id);
              const isCredit = tx.type === 'credit';
              return (
                <React.Fragment key={tx.id}>
                  {i > 0 && <View style={[styles.divider, { marginLeft: 68 }]} />}
                  <View style={styles.txRow}>
                    <View style={[styles.txIcon, { backgroundColor: cat?.color + '22' }]}>
                      <Text style={styles.txIconText}>{cat?.icon}</Text>
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                      <Text style={styles.txSub}>
                        {account?.name}{person ? ` · ${person.name}` : ''} · {dateLabel(tx.date)}
                      </Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isCredit ? Colors.income : Colors.expense }]}>
                      {isCredit ? '+' : '-'}{preferredCurrency}{fmt(tx.amount)}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  greeting: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: Colors.text, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  iconBtnText: { fontSize: 18 },
  // Balance Card
  balanceCard: { marginHorizontal: 20, marginBottom: 20, backgroundColor: Colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder },
  balanceMain: { marginBottom: 18 },
  balanceLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub, marginBottom: 4 },
  balanceAmount: { fontFamily: 'Outfit_800ExtraBold', fontSize: 36, color: Colors.text, letterSpacing: -0.5 },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceDot: { width: 8, height: 8, borderRadius: 4 },
  balanceStatLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSub },
  balanceStatVal: { fontFamily: 'Outfit_700Bold', fontSize: 14, marginTop: 1 },
  balanceDivider: { width: 1, height: 32, backgroundColor: Colors.divider },
  // Suggestion
  suggestionCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.primaryBg, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.primary + '40' },
  suggestionIcon: { fontSize: 18 },
  suggestionContent: { flex: 1 },
  suggestionText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.text, lineHeight: 18, marginBottom: 10 },
  suggestionActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  sugActions: { flexDirection: 'row', gap: 10 },
  sugBtnDismiss: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.surface },
  sugBtnDismissText: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub },
  sugBtnAccept: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.primary },
  sugBtnAcceptText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: '#fff' },
  // Sections
  section: { marginHorizontal: 20, marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: Colors.text },
  seeAll: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.primary },
  card: { backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  divider: { height: 1, backgroundColor: Colors.divider },
  // Settlement row
  settleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  personAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  personAvatarText: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  settleInfo: { flex: 1 },
  settleName: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.text },
  settleDesc: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  settleAmountWrap: { alignItems: 'flex-end', gap: 6 },
  settleAmount: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
  settleTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  settleTagText: { fontFamily: 'Outfit_600SemiBold', fontSize: 10, textAlign: 'center' },
  // Transaction row
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txTitle: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.text },
  txSub: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSub, marginTop: 2 },
  txAmount: { fontFamily: 'Outfit_700Bold', fontSize: 14 }
});
