import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney, CategoryKey, TxType } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

const CATEGORIES = Object.entries(Colors.categories) as [CategoryKey, any][];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction, accounts, people, preferredCurrency } = useMoney();

  const [type, setType] = useState<TxType>('debit');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<CategoryKey>('food');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [personId, setPersonId] = useState<string | undefined>();

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) { Alert.alert('Enter a valid amount'); return; }
    if (!title.trim()) { Alert.alert('Enter description'); return; }
    addTransaction({
      amount: parseFloat(amount), type, title: title.trim(),
      note: note.trim() || undefined, category,
      account_id: accountId, person_id: personId,
      date: new Date().toISOString(), source: 'manual', is_confirmed: true,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const typeColor = type === 'credit' ? Colors.income : type === 'transfer' ? Colors.transfer : Colors.expense;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>Add Transaction</Text>
          <Pressable onPress={handleSave}><Text style={styles.save}>Save</Text></Pressable>
        </View>

        {/* Type tabs */}
        <View style={styles.typeTabs}>
          {([['debit', 'Expense', Colors.expense], ['credit', 'Income', Colors.income], ['transfer', 'Transfer', Colors.transfer]] as const).map(([t, label, color]) => (
            <Pressable key={t} style={[styles.typeTab, type === t && styles.typeTabActive]} onPress={() => { setType(t); Haptics.selectionAsync(); }}>
              <Text style={[styles.typeTabText, type === t && { color }]}>{label}</Text>
              {type === t && <View style={[styles.typeTabLine, { backgroundColor: color }]} />}
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Amount */}
          <View style={styles.amountRow}>
            <Text style={styles.currSign}>{preferredCurrency}</Text>
            <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount}
              keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textMuted} autoFocus />
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput style={styles.textInput} value={title} onChangeText={setTitle}
                placeholder="What's this for?" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Account</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {accounts.map(a => {
                  const at = Colors.accounts[a.type];
                  return (
                    <Pressable key={a.id} style={[styles.chip, accountId === a.id && { backgroundColor: at.bg, borderColor: at.color }]}
                      onPress={() => setAccountId(a.id)}>
                      <Text>{at.icon}</Text>
                      <Text style={[styles.chipText, accountId === a.id && { color: at.color }]}>{a.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Link to Person (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                <Pressable style={[styles.chip, !personId && { backgroundColor: Colors.primaryBg, borderColor: Colors.primary }]}
                  onPress={() => setPersonId(undefined)}>
                  <Text style={[styles.chipText, !personId && { color: Colors.primary }]}>None</Text>
                </Pressable>
                {people.map(p => (
                  <Pressable key={p.id} style={[styles.chip, personId === p.id && { backgroundColor: p.avatar_color + '22', borderColor: p.avatar_color }]}
                    onPress={() => setPersonId(p.id)}>
                    <View style={[styles.miniAvatar, { backgroundColor: p.avatar_color + '30' }]}>
                      <Text style={[styles.miniAvatarText, { color: p.avatar_color }]}>{p.name.charAt(0)}</Text>
                    </View>
                    <Text style={[styles.chipText, personId === p.id && { color: p.avatar_color }]}>{p.name.split(' ')[0]}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.fieldDivider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput style={styles.textInput} value={note} onChangeText={setNote}
                placeholder="Optional note..." placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          {/* Category */}
          <Text style={styles.catTitle}>Category</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(([key, cat]) => (
              <Pressable key={key} style={[styles.catChip, category === key && { backgroundColor: cat.color + '22', borderColor: cat.color }]}
                onPress={() => { setCategory(key); Haptics.selectionAsync(); }}>
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel, category === key && { color: cat.color }]}>{cat.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={[styles.cta, { backgroundColor: typeColor }]} onPress={handleSave}>
            <Text style={styles.ctaText}>Save Transaction</Text>
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
  typeTabs: { flexDirection: 'row', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: Colors.divider, marginBottom: 20 },
  typeTab: { flex: 1, alignItems: 'center', paddingBottom: 12, position: 'relative' },
  typeTabActive: {},
  typeTabText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.textMuted },
  typeTabLine: { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, borderRadius: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 4 },
  currSign: { fontFamily: 'Outfit_700Bold', fontSize: 40, color: Colors.textSub, marginTop: 8 },
  amountInput: { fontFamily: 'Outfit_800ExtraBold', fontSize: 60, color: Colors.text, minWidth: 80 },
  formCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.text, padding: 0 },
  fieldDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  chipRow: { gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  chipText: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  miniAvatar: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  miniAvatarText: { fontFamily: 'Outfit_700Bold', fontSize: 9 },
  catTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  catIcon: { fontSize: 16 },
  catLabel: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub },
  cta: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff' },
});
