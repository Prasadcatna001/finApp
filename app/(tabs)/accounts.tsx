import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney } from '../../context/MoneyContext';
import { Colors } from '../../constants/Colors';
import { Account } from '../../context/MoneyContext';

function AccountCard({ account, onPress }: { account: Account; onPress: () => void }) {
  const accStyle = Colors.accounts[account.type];
  const isCreditCard = account.type === 'credit_card';
  const balance = account.balance;

  return (
    <Pressable style={styles.accountCard} onPress={onPress}>
      <View style={styles.accountCardTop}>
        <View style={[styles.accIcon, { backgroundColor: accStyle.bg }]}>
          <Text style={styles.accIconText}>{accStyle.icon}</Text>
        </View>
        <View style={styles.accountMeta}>
          <Text style={styles.accountName}>{account.name}</Text>
          {account.bank_name && <Text style={styles.accountBank}>{account.bank_name}</Text>}
          {account.upi_id && <Text style={styles.accountBank}>{account.upi_id}</Text>}
        </View>
        <View style={styles.accountBadge}>
          <Text style={[styles.accountTypeBadge, { color: accStyle.color }]}>
            {account.type.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      {account.type !== 'upi' && (
        <View style={styles.accountBottom}>
          <Text style={styles.accountBalLabel}>
            {isCreditCard ? 'Outstanding' : 'Balance'}
          </Text>
          <Text style={[styles.accountBalance, { color: isCreditCard && balance < 0 ? Colors.expense : Colors.text }]}>
            ₹{Math.abs(balance).toLocaleString('en-IN')}
          </Text>
        </View>
      )}

      {account.type === 'upi' && account.funding_account_id && (
        <Text style={styles.upiLinked}>Linked to account</Text>
      )}
    </Pressable>
  );
}

export default function AccountsScreen() {
  const router = useRouter();
  const { accounts, preferredCurrency } = useMoney();

  const totalAssets = accounts
    .filter(a => a.type !== 'credit_card' && a.is_active)
    .reduce((sum, a) => sum + a.balance, 0);
  const creditOutstanding = accounts
    .filter(a => a.type === 'credit_card' && a.is_active)
    .reduce((sum, a) => sum + Math.abs(a.balance < 0 ? a.balance : 0), 0);

  const grouped: Record<string, Account[]> = {};
  accounts.filter(a => a.is_active).forEach(a => {
    const g = a.type === 'bank' ? 'Bank Accounts'
      : a.type === 'credit_card' ? 'Credit Cards'
      : a.type === 'upi' ? 'UPI Accounts'
      : 'Cash & Wallets';
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(a);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Accounts</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/add-account')}>
            <Text style={styles.addBtnText}>＋</Text>
          </Pressable>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Assets</Text>
            <Text style={[styles.summaryVal, { color: Colors.income }]}>{preferredCurrency}{totalAssets.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Credit Due</Text>
            <Text style={[styles.summaryVal, { color: Colors.expense }]}>{preferredCurrency}{creditOutstanding.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {Object.entries(grouped).map(([group, accs]) => (
          <View key={group} style={styles.group}>
            <Text style={styles.groupTitle}>{group}</Text>
            {accs.map(a => (
              <AccountCard key={a.id} account={a} onPress={() => router.push({ pathname: '/add-account', params: { id: a.id } })} />
            ))}
          </View>
        ))}

        {accounts.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏦</Text>
            <Text style={styles.emptyTitle}>No accounts yet</Text>
            <Text style={styles.emptyText}>Tap + to add your bank, UPI, or cash account</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/add-account')}>
              <Text style={styles.emptyBtnText}>Add Account</Text>
            </Pressable>
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: Colors.text },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 20, lineHeight: 22 },
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  summaryCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  summaryLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 6 },
  summaryVal: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  group: { paddingHorizontal: 20, marginBottom: 20 },
  groupTitle: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub, marginBottom: 10 },
  accountCard: { backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  accountCardTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  accIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  accIconText: { fontSize: 20 },
  accountMeta: { flex: 1 },
  accountName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text },
  accountBank: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  accountBadge: {},
  accountTypeBadge: { fontFamily: 'Outfit_600SemiBold', fontSize: 10, letterSpacing: 0.5 },
  accountBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 12 },
  accountBalLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub },
  accountBalance: { fontFamily: 'Outfit_700Bold', fontSize: 20 },
  upiLinked: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 10 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 8 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSub, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#fff' },
});
