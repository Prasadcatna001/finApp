import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMoney } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function AddSplitScreen() {
  const router = useRouter();
  const { person_id } = useLocalSearchParams<{ person_id?: string }>();
  const { people, accounts, addSettlement, addTransaction, preferredCurrency } = useMoney();

  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPeople, setSelectedPeople] = useState<string[]>(person_id ? [person_id] : []);
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || '');
  const [note, setNote] = useState('');

  const togglePerson = (id: string) => {
    setSelectedPeople(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    Haptics.selectionAsync();
  };

  const total = parseFloat(totalAmount) || 0;
  const perPerson = selectedPeople.length > 0 ? total / (selectedPeople.length + 1) : 0; // +1 for you

  const handleSave = () => {
    if (!totalAmount || total <= 0) { Alert.alert('Enter Amount'); return; }
    if (!description.trim()) { Alert.alert('Enter Description'); return; }
    if (selectedPeople.length === 0) { Alert.alert('Select at least one person'); return; }

    // Create one settlement per person for their share
    selectedPeople.forEach(pid => {
      addSettlement({
        type: 'split', person_id: pid,
        total_amount: perPerson, paid_amount: 0, status: 'pending',
        description: description.trim(), account_id: selectedAccount,
        date: new Date().toISOString(),
        note: `₹${total} total split ${selectedPeople.length + 1} ways`,
      });
    });

    // Main transaction for full amount
    addTransaction({
      amount: total, type: 'debit', title: description.trim(),
      category: 'other', account_id: selectedAccount,
      person_id: selectedPeople[0], date: new Date().toISOString(),
      source: 'manual', is_confirmed: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
    router.canGoBack() ? router.back() : router.replace('/');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>Split Expense</Text>
          <Pressable onPress={handleSave}><Text style={styles.save}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Amount */}
          <View style={styles.amountSection}>
            <View style={styles.amountRow}>
              <Text style={styles.currSign}>{preferredCurrency}</Text>
              <TextInput style={styles.amountInput} value={totalAmount} onChangeText={setTotalAmount}
                keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} autoFocus />
            </View>
            <Text style={styles.amountSub}>Total amount paid by you</Text>

            {selectedPeople.length > 0 && total > 0 && (
              <View style={styles.splitPreview}>
                <Text style={styles.splitPreviewText}>
                  Each person owes you {preferredCurrency}{perPerson.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </Text>
                <Text style={styles.splitPreviewSub}>
                  {selectedPeople.length + 1} people split equally
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>What was this for?</Text>
              <TextInput style={styles.textInput} value={description} onChangeText={setDescription}
                placeholder="e.g. Dinner, Movie tickets, Trip..." placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Paid from</Text>
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
          </View>

          {/* People selector */}
          <Text style={styles.peopleTitle}>Who do you want to split with?</Text>
          <View style={styles.peopleGrid}>
            {people.map(p => {
              const sel = selectedPeople.includes(p.id);
              return (
                <Pressable key={p.id} style={[styles.personCard, sel && { backgroundColor: p.avatar_color + '20', borderColor: p.avatar_color }]}
                  onPress={() => togglePerson(p.id)}>
                  <View style={[styles.personAvatar, { backgroundColor: p.avatar_color + '25' }]}>
                    <Text style={[styles.personAvatarText, { color: p.avatar_color }]}>{p.name.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.personCardName, sel && { color: p.avatar_color }]} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
                  {sel && <Text style={[styles.checkmark, { color: p.avatar_color }]}>✓</Text>}
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.cta} onPress={handleSave}>
            <Text style={styles.ctaText}>⇄ Create Split</Text>
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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  amountSection: { alignItems: 'center', marginBottom: 24 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currSign: { fontFamily: 'Outfit_700Bold', fontSize: 40, color: Colors.textSub, marginTop: 8 },
  amountInput: { fontFamily: 'Outfit_800ExtraBold', fontSize: 60, color: Colors.text, minWidth: 80 },
  amountSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 4 },
  splitPreview: { marginTop: 16, backgroundColor: Colors.primaryBg, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.primary + '30' },
  splitPreviewText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.primaryLight },
  splitPreviewSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 4 },
  formCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 24, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.text, padding: 0 },
  fieldDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  chipRow: { gap: 8 },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  chipLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  peopleTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text, marginBottom: 14 },
  peopleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  personCard: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, minWidth: 80, position: 'relative' },
  personAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  personAvatarText: { fontFamily: 'Outfit_700Bold', fontSize: 16 },
  personCardName: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  checkmark: { position: 'absolute', top: 6, right: 8, fontFamily: 'Outfit_700Bold', fontSize: 12 },
  cta: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff' },
});
