import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function SmsTrainingScreen() {
  const router = useRouter();
  const { smsRules, addSmsRule, deleteSmsRule } = useMoney();

  const [bankName, setBankName] = useState('');
  const [senderPattern, setSenderPattern] = useState('');
  const [bodyPattern, setBodyPattern] = useState('');
  const [typeMatch, setTypeMatch] = useState<'debit' | 'credit'>('debit');
  
  const [testSms, setTestSms] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  const handleTest = () => {
    try {
      Haptics.selectionAsync();
      const regex = new RegExp(bodyPattern);
      const match = regex.exec(testSms);
      if (match && match.groups && match.groups.amount) {
        setTestResult({ success: true, amount: match.groups.amount });
      } else {
        setTestResult({ success: false, error: 'Pattern matched, but no <amount> group found.' });
      }
    } catch (e: any) {
      setTestResult({ success: false, error: e.message || 'Invalid Regex' });
    }
  };

  const handleSave = () => {
    if (!bankName.trim() || !senderPattern.trim() || !bodyPattern.trim()) {
      Alert.alert('Validation Error', 'Please fill all required fields');
      return;
    }
    
    // Validate regex
    try {
      new RegExp(bodyPattern);
    } catch (e) {
      Alert.alert('Invalid Regex', 'The Body Pattern regex is not valid.');
      return;
    }

    addSmsRule({
      bank_name: bankName.trim(),
      sender_pattern: senderPattern.trim(),
      body_pattern: bodyPattern.trim(),
      type_match: typeMatch
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Rule Saved Successfully', position: 'top' });
    
    // Clear form
    setBankName('');
    setSenderPattern('');
    setBodyPattern('');
    setTestSms('');
    setTestResult(null);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Close</Text></Pressable>
          <Text style={styles.title}>SMS Training</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Expo Go doesn't permit background SMS reading. However, you can use this engine to train rules for your bank (e.g. HDFC, ICICI). 
              The rule must use regex with an <Text style={{ fontFamily: 'Outfit_700Bold' }}>{`(?<amount>\\d+)`}</Text> capture group.
            </Text>
          </View>

          <Text style={styles.sectionLabel}>Saved Rules</Text>
          {smsRules.length === 0 ? (
            <Text style={styles.emptyText}>No rules defined yet.</Text>
          ) : (
            smsRules.map(r => (
              <View key={r.id} style={styles.ruleCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleBank}>{r.bank_name} ({r.type_match.toUpperCase()})</Text>
                  <Text style={styles.ruleSub}>Sender: {r.sender_pattern}</Text>
                  <Text style={styles.ruleRegex} numberOfLines={1}>{r.body_pattern}</Text>
                </View>
                <Pressable style={styles.delBtn} onPress={() => deleteSmsRule(r.id)}>
                  <Text style={styles.delBtnText}>Delete</Text>
                </Pressable>
              </View>
            ))
          )}

          <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Add New Rule</Text>
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Bank Name</Text>
              <TextInput style={styles.textInput} value={bankName} onChangeText={setBankName} placeholder="e.g. HDFC Bank" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Sender ID (Contains)</Text>
              <TextInput style={styles.textInput} value={senderPattern} onChangeText={setSenderPattern} placeholder="e.g. HDFCBK" placeholderTextColor={Colors.textMuted} autoCapitalize="characters" />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Transaction Type</Text>
              <View style={styles.typeRow}>
                <Pressable style={[styles.typeBtn, typeMatch === 'debit' && { backgroundColor: Colors.expenseBg, borderColor: Colors.expense }]} onPress={() => setTypeMatch('debit')}>
                  <Text style={[styles.typeText, typeMatch === 'debit' && { color: Colors.expense }]}>Debit / Expense</Text>
                </Pressable>
                <Pressable style={[styles.typeBtn, typeMatch === 'credit' && { backgroundColor: Colors.incomeBg, borderColor: Colors.income }]} onPress={() => setTypeMatch('credit')}>
                  <Text style={[styles.typeText, typeMatch === 'credit' && { color: Colors.income }]}>Credit / Income</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Body Regex Pattern</Text>
              <TextInput style={styles.textInput} value={bodyPattern} onChangeText={setBodyPattern} placeholder="(?i)debited by (?<amount>\d+\.?\d*)" placeholderTextColor={Colors.textMuted} multiline />
            </View>
          </View>

          <Text style={[styles.sectionLabel, { marginTop: 10 }]}>Test Regex Parser</Text>
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <TextInput style={[styles.textInput, { height: 60 }]} value={testSms} onChangeText={setTestSms} placeholder="Paste a sample bank SMS here..." placeholderTextColor={Colors.textMuted} multiline />
            </View>
          </View>

          {testResult && (
            <View style={[styles.testResultBox, { backgroundColor: testResult.success ? Colors.incomeBg : Colors.expenseBg }]}>
              {testResult.success ? (
                <Text style={[styles.testResultText, { color: Colors.income }]}>✅ Match! Amount: {testResult.amount}</Text>
              ) : (
                <Text style={[styles.testResultText, { color: Colors.expense }]}>❌ {testResult.error}</Text>
              )}
            </View>
          )}

          <View style={styles.btnRow}>
            <Pressable style={styles.testBtn} onPress={handleTest}>
              <Text style={styles.testBtnText}>Test Regex</Text>
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Rule</Text>
            </Pressable>
          </View>

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
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  infoBox: { backgroundColor: Colors.primaryBg, padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: Colors.primary + '30' },
  infoText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.primary, lineHeight: 18 },
  sectionLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.text, marginBottom: 10 },
  emptyText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted, marginBottom: 10 },
  ruleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  ruleBank: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.text },
  ruleSub: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  ruleRegex: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: Colors.primary, marginTop: 4, backgroundColor: Colors.surface, padding: 4, borderRadius: 4, overflow: 'hidden' },
  delBtn: { backgroundColor: Colors.expenseBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  delBtnText: { color: Colors.expense, fontFamily: 'Outfit_500Medium', fontSize: 12 },
  formCard: { backgroundColor: Colors.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_500Medium', fontSize: 12, color: Colors.textSub, marginBottom: 6 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.text, padding: 0 },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.surface, backgroundColor: Colors.surface },
  typeText: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
  testResultBox: { padding: 14, borderRadius: 12, marginBottom: 16 },
  testResultText: { fontFamily: 'Outfit_600SemiBold', fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 12 },
  testBtn: { flex: 1, backgroundColor: Colors.surface, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  testBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text },
  saveBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: '#fff' }
});
