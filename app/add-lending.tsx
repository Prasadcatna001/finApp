import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMoney, SettleType } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function AddLendingScreen() {
  const router = useRouter();
  const { person_id, type: initialType } = useLocalSearchParams<{ person_id?: string; type?: string }>();
  const { people, accounts, addSettlement, addTransaction, preferredCurrency } = useMoney();

  const [settleType, setSettleType] = useState<SettleType>((initialType as SettleType) || 'lent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(person_id || '');
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');

  const types: { key: SettleType; label: string; icon: string; color: string; desc: string }[] = [
    { key: 'lent', label: 'Lent', icon: '↗', color: Colors.income, desc: 'You gave money to someone' },
    { key: 'borrowed', label: 'Borrowed', icon: '↙', color: Colors.expense, desc: 'Someone gave money to you' },
  ];

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Invalid Amount'); return; }
    if (!description.trim()) { Alert.alert('Enter Description'); return; }
    if (!selectedPerson) { Alert.alert('Select Person'); return; }
    if (!selectedAccount) { Alert.alert('Select Account'); return; }

    const settlementId = Date.now().toString();
    addSettlement({
      type: settleType, person_id: selectedPerson,
      total_amount: parseFloat(amount), paid_amount: 0,
      status: 'pending', description: description.trim(),
      account_id: selectedAccount, date: new Date().toISOString(), note: note.trim() || undefined,
    });
    addTransaction({
      amount: parseFloat(amount),
      type: settleType === 'lent' ? 'debit' : 'credit',
      title: settleType === 'lent' ? `Lent to ${people.find(p => p.id === selectedPerson)?.name}` : `Borrowed from ${people.find(p => p.id === selectedPerson)?.name}`,
      category: 'transfer', account_id: selectedAccount,
      person_id: selectedPerson, date: new Date().toISOString(),
      source: 'manual', is_confirmed: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const selectedTypeDef = types.find(t => t.key === settleType)!;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>Lend / Borrow</Text>
          <Pressable onPress={handleSave}><Text style={styles.save}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Type toggle */}
          <View style={styles.typeToggle}>
            {types.map(t => (
              <Pressable key={t.key} style={[styles.typeBtn, settleType === t.key && { backgroundColor: t.color + '20', borderColor: t.color }]}
                onPress={() => { setSettleType(t.key); Haptics.selectionAsync(); }}>
                <Text style={[styles.typeBtnIcon, { color: settleType === t.key ? t.color : Colors.textMuted }]}>{t.icon}</Text>
                <View>
                  <Text style={[styles.typeBtnLabel, { color: settleType === t.key ? t.color : Colors.textSub }]}>{t.label}</Text>
                  <Text style={styles.typeBtnDesc}>{t.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.currSign}>{preferredCurrency}</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} autoFocus />
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Person</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {people.map(p => (
                  <Pressable key={p.id} style={[styles.personChip, selectedPerson === p.id && { backgroundColor: p.avatar_color + '22', borderColor: p.avatar_color }]}
                    onPress={() => { setSelectedPerson(p.id); Haptics.selectionAsync(); }}>
                    <View style={[styles.chipAvatar, { backgroundColor: p.avatar_color + '30' }]}>
                      <Text style={[styles.chipAvatarText, { color: p.avatar_color }]}>{p.name.charAt(0)}</Text>
                    </View>
                    <Text style={[styles.chipName, selectedPerson === p.id && { color: p.avatar_color }]}>{p.name.split(' ')[0]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={styles.textInput} value={description} onChangeText={setDescription} placeholder="What's it for?" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {accounts.map(a => {
                  const at = Colors.accounts[a.type];
                  return (
                    <Pressable key={a.id} style={[styles.accChip, selectedAccount === a.id && { backgroundColor: at.bg, borderColor: at.color }]}
                      onPress={() => setSelectedAccount(a.id)}>
                      <Text>{at.icon}</Text>
                      <Text style={[styles.chipName, selectedAccount === a.id && { color: at.color }]}>{a.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Note (optional)</Text>
              <TextInput style={styles.textInput} value={note} onChangeText={setNote} placeholder="Any note..." placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          <Pressable style={[styles.cta, { backgroundColor: selectedTypeDef.color }]} onPress={handleSave}>
            <Text style={styles.ctaText}>{selectedTypeDef.icon} Record {selectedTypeDef.label}</Text>
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
  save: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.primary },
  content: { paddingHorizontal: 20, paddingBottom: 100 },
  typeToggle: { gap: 10, marginBottom: 20 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  typeBtnIcon: { fontSize: 24, width: 30, textAlign: 'center' },
  typeBtnLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 15 },
  typeBtnDesc: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 4 },
  currSign: { fontFamily: 'Outfit_700Bold', fontSize: 40, color: Colors.textSub, marginTop: 8 },
  amountInput: { fontFamily: 'Outfit_800ExtraBold', fontSize: 60, color: Colors.text, minWidth: 80 },
  formCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.text, padding: 0 },
  fieldDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  chipRow: { gap: 8, flexDirection: 'row' },
  personChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  chipAvatar: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  chipAvatarText: { fontFamily: 'Outfit_700Bold', fontSize: 11 },
  chipName: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  cta: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff' },
});
