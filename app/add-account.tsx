import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMoney, AccountType } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

const ACCOUNT_TYPES: { key: AccountType; label: string; desc: string }[] = [
  { key: 'bank', label: 'Bank Account', desc: 'Savings or current' },
  { key: 'credit_card', label: 'Credit Card', desc: 'Postpaid card' },
  { key: 'upi', label: 'UPI Account', desc: 'GPay, PhonePe, Paytm' },
  { key: 'cash', label: 'Cash', desc: 'Physical cash' },
  { key: 'wallet', label: 'Wallet', desc: 'Digital wallet' },
];

const AVATAR_COLORS = Colors.avatarColors;

export default function AddAccountScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { accounts, addAccount, updateAccount, deleteAccount } = useMoney();

  const [type, setType] = useState<AccountType>('bank');
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [balance, setBalance] = useState('');
  const [upiId, setUpiId] = useState('');
  const [fundingAccountId, setFundingAccountId] = useState('');
  const [color, setColor] = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    if (id) {
      const a = accounts.find(x => x.id === id);
      if (a) {
        setType(a.type);
        setName(a.name);
        setBankName(a.bank_name || '');
        setBalance(a.balance.toString());
        setUpiId(a.upi_id || '');
        setFundingAccountId(a.funding_account_id || '');
        setColor(a.color);
      }
    }
  }, [id, accounts]);

  const needsBank = type === 'bank' || type === 'credit_card';
  const needsUpi = type === 'upi';
  const selected = ACCOUNT_TYPES.find(t => t.key === type)!;
  const accStyle = Colors.accounts[type];

  const handleSave = () => {
    if (!name.trim()) { Alert.alert('Enter account name'); return; }
    
    if (id) {
      updateAccount(id, {
        name: name.trim(), type, bank_name: bankName.trim() || undefined,
        balance: type === 'upi' ? 0 : (parseFloat(balance) || 0),
        upi_id: upiId.trim() || undefined, color,
        funding_account_id: fundingAccountId || undefined
      });
    } else {
      addAccount({
        name: name.trim(), type, bank_name: bankName.trim() || undefined,
        balance: type === 'upi' ? 0 : (parseFloat(balance) || 0),
        upi_id: upiId.trim() || undefined, color,
        funding_account_id: fundingAccountId || undefined,
        is_active: true,
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Account', 'Are you sure? This will not delete transactions linked to it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        deleteAccount(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
        router.canGoBack() ? router.back() : router.replace('/');
      }}
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>{id ? 'Edit Account' : 'Add Account'}</Text>
          <Pressable onPress={handleSave}><Text style={styles.save}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Account type grid */}
          <Text style={styles.sectionLabel}>Account Type</Text>
          <View style={styles.typeGrid}>
            {ACCOUNT_TYPES.map(t => {
              const at = Colors.accounts[t.key];
              const sel = type === t.key;
              return (
                <Pressable key={t.key}
                  style={[styles.typeCard, sel && { backgroundColor: at.bg, borderColor: at.color }]}
                  onPress={() => { setType(t.key); Haptics.selectionAsync(); }}>
                  <Text style={styles.typeIcon}>{at.icon}</Text>
                  <Text style={[styles.typeLabel, sel && { color: at.color }]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Account Name</Text>
              <TextInput style={styles.textInput} value={name} onChangeText={setName}
                placeholder={`e.g. ${type === 'upi' ? 'My GPay' : type === 'cash' ? 'Cash in hand' : 'HDFC Savings'}`}
                placeholderTextColor={Colors.textMuted} autoFocus />
            </View>

            {needsBank && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <TextInput style={styles.textInput} value={bankName} onChangeText={setBankName}
                    placeholder="HDFC, ICICI, SBI..." placeholderTextColor={Colors.textMuted} />
                </View>
              </>
            )}

            {needsUpi && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>UPI ID</Text>
                  <TextInput style={styles.textInput} value={upiId} onChangeText={setUpiId}
                    placeholder="user@okhdfc" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" />
                </View>
                
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Linked Bank Account</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                    {accounts.filter(a => a.type === 'bank' || a.type === 'credit_card').map(a => {
                      const sel = fundingAccountId === a.id;
                      return (
                        <Pressable key={a.id} style={[styles.accChip, sel && { backgroundColor: Colors.accounts[a.type].bg, borderColor: Colors.accounts[a.type].color }]}
                          onPress={() => setFundingAccountId(sel ? '' : a.id)}>
                          <Text style={[styles.chipLabel, sel && { color: Colors.accounts[a.type].color }]}>{a.name}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </>
            )}

            {type !== 'upi' && (
              <>
                <View style={styles.fieldDivider} />
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>
                    {type === 'credit_card' ? 'Outstanding Balance (negative)' : 'Current Balance'}
                  </Text>
                  <TextInput style={styles.textInput} value={balance} onChangeText={setBalance}
                    placeholder={type === 'credit_card' ? 'e.g. -8500' : 'e.g. 45000'}
                    placeholderTextColor={Colors.textMuted} keyboardType="numbers-and-punctuation" />
                </View>
              </>
            )}
          </View>

          {/* Color picker */}
          <Text style={styles.sectionLabel}>Card Color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map(c => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSelected]}
                onPress={() => setColor(c)} />
            ))}
          </View>

          <Pressable style={[styles.cta, { backgroundColor: accStyle.color }]} onPress={handleSave}>
            <Text style={styles.ctaText}>{accStyle.icon} {id ? 'Save Changes' : 'Add Account'}</Text>
          </Pressable>

          {id && (
            <Pressable style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>Delete Account</Text>
            </Pressable>
          )}
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
  sectionLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub, marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: 'center', width: '30%' },
  typeIcon: { fontSize: 22, marginBottom: 6 },
  typeLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 11, color: Colors.textSub, textAlign: 'center', marginBottom: 2 },
  typeDesc: { fontFamily: 'Outfit_400Regular', fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  formCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.text, padding: 0 },
  fieldDivider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 24 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  cta: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff' },
  deleteBtn: { paddingVertical: 16, alignItems: 'center' },
  deleteBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.expense },
  chipRow: { gap: 8 },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  chipLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub },
});
