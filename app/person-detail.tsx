import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMoney, Settlement } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';

function SettlementCard({ s, onRepay, personName, currency }: { s: Settlement; onRepay: () => void; personName: string; currency: string }) {
  const sc = Colors.settlements[s.type];
  const remaining = s.total_amount - s.paid_amount;
  const pct = s.total_amount > 0 ? (s.paid_amount / s.total_amount) * 100 : 0;
  const isOwed = s.type === 'lent' || s.type === 'split';

  return (
    <View style={styles.settlementCard}>
      <View style={styles.scTop}>
        <View style={[styles.scTypeBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.scTypeText, { color: sc.color }]}>{sc.icon} {sc.label}</Text>
        </View>
        <View style={[styles.scStatusBadge, {
          backgroundColor: s.status === 'settled' ? Colors.incomeBg : s.status === 'partial' ? Colors.pendingBg : Colors.expenseBg
        }]}>
          <Text style={[styles.scStatusText, {
            color: s.status === 'settled' ? Colors.income : s.status === 'partial' ? Colors.pending : Colors.expense
          }]}>{s.status}</Text>
        </View>
      </View>

      <Text style={styles.scDesc}>{s.description}</Text>
      <Text style={[styles.scAmount, { color: isOwed ? Colors.income : Colors.expense }]}>
        {isOwed ? '+' : '-'}{currency}{s.total_amount.toLocaleString('en-IN')}
      </Text>

      {/* Progress bar */}
      {s.total_amount > 0 && (
        <View style={styles.scProgressWrap}>
          <View style={styles.scProgressBg}>
            <View style={[styles.scProgressFill, { width: `${pct}%`, backgroundColor: sc.color }]} />
          </View>
          <View style={styles.scProgressLabels}>
            <Text style={styles.scProgressLabel}>
              {currency}{s.paid_amount.toLocaleString('en-IN')} repaid
            </Text>
            <Text style={[styles.scProgressLabel, { color: s.status === 'settled' ? Colors.income : Colors.pending }]}>
              {s.status === 'settled' ? '✓ Fully settled' : `${currency}${remaining.toLocaleString('en-IN')} remaining`}
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.scDate}>
        {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        {s.note ? ` · ${s.note}` : ''}
      </Text>

      {s.status !== 'settled' && isOwed && (
        <Pressable style={styles.repayBtn} onPress={onRepay}>
          <Text style={styles.repayBtnText}>Record Repayment</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function PersonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { people, getPersonNet, getPersonSettlements, getPersonTransactions, deletePerson, preferredCurrency } = useMoney();

  const person = people.find(p => p.id === id);
  if (!person) return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Person not found</Text>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
          <Text style={{ color: Colors.primary, fontFamily: 'Outfit_600SemiBold', fontSize: 15, marginTop: 12 }}>Go Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );

  const net = getPersonNet(id);
  const isOwed = net > 0;
  const settlements = getPersonSettlements(id);
  const transactions = getPersonTransactions(id);

  const handleDelete = () => {
    Alert.alert('Remove Person', `Remove ${person.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deletePerson(id); router.canGoBack() ? router.back() : router.replace('/'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{person.name}</Text>
          <Pressable style={styles.menuBtn} onPress={handleDelete}>
            <Text style={styles.menuIcon}>•••</Text>
          </Pressable>
        </View>

        {/* Person summary */}
        <View style={styles.personCard}>
          <View style={[styles.avatar, { backgroundColor: person.avatar_color + '25' }]}>
            <Text style={[styles.avatarText, { color: person.avatar_color }]}>{person.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.personName}>{person.name}</Text>
          {person.phone && <Text style={styles.personPhone}>📞 {person.phone}</Text>}
          {person.alias && person.alias !== person.name && <Text style={styles.personAlias}>Also known as "{person.alias}"</Text>}

          {net !== 0 && (
            <View style={[styles.netBadge, { backgroundColor: isOwed ? Colors.incomeBg : Colors.expenseBg }]}>
              <Text style={[styles.netBadgeText, { color: isOwed ? Colors.income : Colors.expense }]}>
                {isOwed ? `${person.name.split(' ')[0]} owes you` : 'You owe'} {preferredCurrency}{Math.abs(net).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          {net === 0 && settlements.length > 0 && (
            <View style={[styles.netBadge, { backgroundColor: Colors.incomeBg }]}>
              <Text style={[styles.netBadgeText, { color: Colors.income }]}>✓ All settled</Text>
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickBtn} onPress={() => router.push({ pathname: '/add-lending', params: { person_id: id } })}>
            <Text style={styles.quickBtnIcon}>↗</Text>
            <Text style={styles.quickBtnLabel}>Lend</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push({ pathname: '/add-lending', params: { person_id: id, type: 'borrowed' } })}>
            <Text style={styles.quickBtnIcon}>↙</Text>
            <Text style={styles.quickBtnLabel}>Borrow</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push({ pathname: '/add-split', params: { person_id: id } })}>
            <Text style={styles.quickBtnIcon}>⇄</Text>
            <Text style={styles.quickBtnLabel}>Split</Text>
          </Pressable>
        </View>

        {/* Settlements */}
        <Text style={styles.sectionTitle}>Settlements ({settlements.length})</Text>
        {settlements.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>No settlements yet — lend, borrow or split to get started</Text>
          </View>
        ) : (
          settlements.map(s => (
            <SettlementCard
              key={s.id} s={s} personName={person.name} currency={preferredCurrency}
              onRepay={() => router.push({ pathname: '/record-repayment', params: { settlement_id: s.id, person_id: id } })}
            />
          ))
        )}

        {/* Linked Transactions */}
        {transactions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Linked Transactions ({transactions.length})</Text>
            <View style={styles.txCard}>
              {transactions.map((tx, i) => {
                const cat = Colors.categories[tx.category as keyof typeof Colors.categories];
                const isCredit = tx.type === 'credit';
                return (
                  <React.Fragment key={tx.id}>
                    {i > 0 && <View style={[styles.rowDivider, { marginLeft: 68 }]} />}
                    <View style={styles.txRow}>
                      <View style={[styles.txIcon, { backgroundColor: cat?.color + '22' }]}>
                        <Text style={styles.txIconText}>{cat?.icon}</Text>
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={styles.txTitle}>{tx.title}</Text>
                        <Text style={styles.txDate}>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                      </View>
                      <Text style={[styles.txAmt, { color: isCredit ? Colors.income : Colors.expense }]}>
                        {isCredit ? '+' : '-'}{preferredCurrency}{tx.amount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundText: { fontFamily: 'Outfit_500Medium', fontSize: 16, color: Colors.textSub },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  backIcon: { fontFamily: 'Outfit_400Regular', fontSize: 22, color: Colors.text, lineHeight: 26 },
  headerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.text },
  menuBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  menuIcon: { fontFamily: 'Outfit_600SemiBold', fontSize: 10, color: Colors.textSub, letterSpacing: 1 },
  personCard: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 20, marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26 },
  personName: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.text, marginBottom: 4 },
  personPhone: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub, marginBottom: 2 },
  personAlias: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 2 },
  netBadge: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, marginTop: 12 },
  netBadgeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14 },
  quickActions: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 24 },
  quickBtn: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  quickBtnIcon: { fontSize: 22, marginBottom: 4 },
  quickBtnLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  sectionTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text, paddingHorizontal: 20, marginBottom: 12 },
  emptySection: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center' },
  emptySectionText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub, textAlign: 'center' },
  settlementCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: Colors.card, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: Colors.cardBorder },
  scTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  scTypeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  scTypeText: { fontFamily: 'Outfit_600SemiBold', fontSize: 12 },
  scStatusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  scStatusText: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, textTransform: 'capitalize' },
  scDesc: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.text, marginBottom: 4 },
  scAmount: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, letterSpacing: -0.5, marginBottom: 14 },
  scProgressWrap: { marginBottom: 10 },
  scProgressBg: { height: 6, backgroundColor: Colors.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  scProgressFill: { height: 6, borderRadius: 3 },
  scProgressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  scProgressLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSub },
  scDate: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textMuted, marginBottom: 12 },
  repayBtn: { backgroundColor: Colors.primaryBg, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '40' },
  repayBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.primary },
  txCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  rowDivider: { height: 1, backgroundColor: Colors.divider },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txIconText: { fontSize: 18 },
  txInfo: { flex: 1 },
  txTitle: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.text },
  txDate: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  txAmt: { fontFamily: 'Outfit_700Bold', fontSize: 14 },
});
