import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMoney } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function RecordRepaymentScreen() {
  const router = useRouter();
  const { settlement_id, person_id } = useLocalSearchParams<{ settlement_id: string; person_id: string }>();
  const { settlements, accounts, people, recordRepayment, preferredCurrency } = useMoney();

  const settlement = settlements.find(s => s.id === settlement_id);
  const person = people.find(p => p.id === person_id);
  const remaining = settlement ? settlement.total_amount - settlement.paid_amount : 0;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');

  const handleSave = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Invalid Amount'); return; }
    if (amt > remaining) { Alert.alert('Amount exceeds remaining balance', `Max: ${preferredCurrency}${remaining}`); return; }
    recordRepayment(settlement_id, amt, selectedAccount, note.trim() || undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
    router.canGoBack() ? router.back() : router.replace('/');
  };

  if (!settlement) return null;

  const sc = Colors.settlements[settlement.type];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>Record Repayment</Text>
          <Pressable onPress={handleSave}><Text style={styles.save}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Context card */}
          <View style={styles.contextCard}>
            <View style={[styles.personAvatar, { backgroundColor: person?.avatar_color + '25' }]}>
              <Text style={[styles.personAvatarText, { color: person?.avatar_color }]}>{person?.name.charAt(0)}</Text>
            </View>
            <View style={styles.contextInfo}>
              <Text style={styles.contextName}>{person?.name}</Text>
              <Text style={styles.contextDesc}>{settlement.description}</Text>
              <View style={styles.contextAmounts}>
                <Text style={styles.contextRemaining}>Remaining: <Text style={{ color: Colors.income, fontFamily: 'Outfit_700Bold' }}>{preferredCurrency}{remaining.toLocaleString('en-IN')}</Text></Text>
              </View>
            </View>
          </View>

          {/* Quick amount buttons */}
          <Text style={styles.quickLabel}>Quick amounts</Text>
          <View style={styles.quickAmounts}>
            {[remaining, Math.round(remaining / 2), 500, 1000].filter((v, i, a) => v > 0 && a.indexOf(v) === i).slice(0, 4).map(v => (
              <Pressable key={v} style={styles.quickBtn} onPress={() => setAmount(v.toString())}>
                <Text style={styles.quickBtnText}>{preferredCurrency}{v.toLocaleString('en-IN')}</Text>
              </Pressable>
            ))}
          </View>

          {/* Amount input */}
          <View style={styles.amountRow}>
            <Text style={styles.currSign}>{preferredCurrency}</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} autoFocus />
          </View>

          {/* Account + note */}
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Received in</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {accounts.map(a => {
                  const at = Colors.accounts[a.type];
                  return (
                    <Pressable key={a.id} style={[styles.accChip, selectedAccount === a.id && { backgroundColor: at.bg, borderColor: at.color }]}
                      onPress={() => setSelectedAccount(a.id)}>
                      <Text>{at.icon}</Text>
                      <Text style={[styles.chipLabel, selectedAccount === a.id && { color: at.color }]}>{a.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput style={styles.textInput} value={note} onChangeText={setNote} placeholder="via UPI, cash..." placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          <Pressable style={styles.cta} onPress={handleSave}>
            <Text style={styles.ctaText}>✓ Record Repayment</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgSecondary },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.surface, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  cancel: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: Colors.textSub },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: Colors.text },
  save: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.income },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  contextCard: { flexDirection: 'row', gap: 14, alignItems: 'center', backgroundColor: Colors.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20 },
  personAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  personAvatarText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 20 },
  contextInfo: { flex: 1 },
  contextName: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text },
  contextDesc: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub, marginTop: 2 },
  contextAmounts: { marginTop: 6 },
  contextRemaining: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textSub },
  quickLabel: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub, marginBottom: 10 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  quickBtn: { backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: Colors.cardBorder },
  quickBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13, color: Colors.income },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 4 },
  currSign: { fontFamily: 'Outfit_700Bold', fontSize: 36, color: Colors.textSub, marginTop: 8 },
  amountInput: { fontFamily: 'Outfit_800ExtraBold', fontSize: 56, color: Colors.text, minWidth: 80 },
  formCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.text, padding: 0 },
  fieldDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  chipRow: { gap: 8 },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  chipLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  cta: { backgroundColor: Colors.income, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff' },
});
