import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney } from '../../context/MoneyContext';
import { Colors } from '../../constants/Colors';

export default function PeopleScreen() {
  const router = useRouter();
  const { people, getPersonNet, settlements, totalOwedToMe, totalIOwe, preferredCurrency } = useMoney();

  const sorted = [...people].sort((a, b) => Math.abs(getPersonNet(b.id)) - Math.abs(getPersonNet(a.id)));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>People</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push('/add-person')}>
            <Text style={styles.addBtnText}>＋</Text>
          </Pressable>
        </View>

        {/* Net summary */}
        <View style={styles.netRow}>
          <View style={styles.netCard}>
            <Text style={styles.netLabel}>They owe you</Text>
            <Text style={[styles.netVal, { color: Colors.income }]}>{preferredCurrency}{totalOwedToMe.toLocaleString('en-IN')}</Text>
          </View>
          <View style={[styles.netCard, styles.netCardMiddle]}>
            <Text style={[styles.netLabel, { textAlign: 'center' }]}>Net</Text>
            <Text style={[styles.netVal, { color: totalOwedToMe - totalIOwe >= 0 ? Colors.income : Colors.expense, textAlign: 'center' }]}>
              {totalOwedToMe - totalIOwe >= 0 ? '+' : '-'}{preferredCurrency}{Math.abs(totalOwedToMe - totalIOwe).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.netCard, { alignItems: 'flex-end' }]}>
            <Text style={[styles.netLabel, { textAlign: 'right' }]}>You owe</Text>
            <Text style={[styles.netVal, { color: Colors.expense }]}>{preferredCurrency}{totalIOwe.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* People list */}
        {sorted.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No people added yet</Text>
            <Text style={styles.emptyText}>Add people you lend to, borrow from, or split expenses with</Text>
            <Pressable style={styles.emptyBtn} onPress={() => router.push('/add-person')}>
              <Text style={styles.emptyBtnText}>Add Person</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listCard}>
            {sorted.map((person, i) => {
              const net = getPersonNet(person.id);
              const isOwed = net > 0;
              const isSettled = net === 0;
              const personSettlements = settlements.filter(s => s.person_id === person.id);
              const activeCount = personSettlements.filter(s => s.status !== 'settled').length;

              return (
                <React.Fragment key={person.id}>
                  {i > 0 && <View style={styles.rowDivider} />}
                  <Pressable
                    style={styles.personRow}
                    onPress={() => router.push({ pathname: '/person-detail', params: { id: person.id } })}
                  >
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: person.avatar_color + '25' }]}>
                      <Text style={[styles.avatarText, { color: person.avatar_color }]}>
                        {person.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.personInfo}>
                      <Text style={styles.personName}>{person.name}</Text>
                      <Text style={styles.personSub}>
                        {isSettled ? 'All settled ✓' :
                         `${activeCount} active settlement${activeCount !== 1 ? 's' : ''}`}
                      </Text>
                    </View>

                    {/* Amount */}
                    <View style={styles.personRight}>
                      {!isSettled ? (
                        <>
                          <Text style={[styles.personNet, { color: isOwed ? Colors.income : Colors.expense }]}>
                            {isOwed ? '+' : '-'}{preferredCurrency}{Math.abs(net).toLocaleString('en-IN')}
                          </Text>
                          <Text style={[styles.personNetLabel, { color: isOwed ? Colors.income : Colors.expense }]}>
                            {isOwed ? 'owes you' : 'you owe'}
                          </Text>
                        </>
                      ) : (
                        <View style={styles.settledBadge}>
                          <Text style={styles.settledBadgeText}>✓ Settled</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.arrow}>›</Text>
                  </Pressable>
                </React.Fragment>
              );
            })}
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
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 24, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false },
  netRow: { flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 20, marginBottom: 20, gap: 0 },
  netCard: { flex: 1, justifyContent: 'center' },
  netCardMiddle: { alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.divider, paddingHorizontal: 8 },
  netLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textSub, marginBottom: 4 },
  netVal: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  listCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.cardBorder },
  rowDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 74 },
  personRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Outfit_700Bold', fontSize: 18 },
  personInfo: { flex: 1 },
  personName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text },
  personSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  personRight: { alignItems: 'flex-end' },
  personNet: { fontFamily: 'Outfit_700Bold', fontSize: 15 },
  personNetLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, marginTop: 2 },
  settledBadge: { backgroundColor: Colors.incomeBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  settledBadgeText: { fontFamily: 'Outfit_500Medium', fontSize: 11, color: Colors.income },
  arrow: { fontFamily: 'Outfit_400Regular', fontSize: 20, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 18, color: Colors.text, marginBottom: 8 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSub, textAlign: 'center', marginBottom: 24 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#fff' },
});
