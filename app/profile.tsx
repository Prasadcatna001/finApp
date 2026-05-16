import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useMoney } from '../context/MoneyContext';
import { useVersion } from '../context/VersionContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MailComposer from 'expo-mail-composer';
import * as Linking from 'expo-linking';
import { Modal } from 'react-native';
import * as Application from 'expo-application';

const CURRENCIES = [
  { symbol: '₹', label: 'INR' },
  { symbol: '$', label: 'USD' },
  { symbol: '€', label: 'EUR' },
  { symbol: '£', label: 'GBP' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { 
    userName, setUserName, preferredCurrency, setPreferredCurrency, resetData,
    accounts, people, transactions, settlements, recurringRules 
  } = useMoney();
  const { isUpdateAvailable, latestVersion, checkUpdates } = useVersion();

  const [nameInput, setNameInput] = useState(userName);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'issue' | 'review'>('review');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const GITHUB_REPO = "https://github.com/Prasadcatna001/finApp"; // Update with actual repo
  const SUPPORT_EMAIL = "homegarage70@gmail.com"; // Update with actual email

  const handleSave = () => {
    if (nameInput.trim()) setUserName(nameInput.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
    router.canGoBack() ? router.back() : router.replace('/');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all accounts, people, and transactions? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            await resetData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Saved Successfully', position: 'top' });
            router.canGoBack() ? router.back() : router.replace('/');
          }
        }
      ]
    );
  };

  const handleExport = async () => {
    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        accounts, people, transactions, settlements, recurringRules
      };
      // @ts-ignore
      const fileUri = FileSystem.documentDirectory + 'money_tracker_backup.json';
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2));
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Error', 'Sharing not available on this device');
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not create backup file');
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackMsg.trim()) return;

    if (feedbackType === 'issue') {
      const url = `${GITHUB_REPO}/issues/new?title=${encodeURIComponent('Bug Report')}&body=${encodeURIComponent(feedbackMsg)}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Could not open GitHub. Please ensure you have a browser installed.');
      }
    } else {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (isAvailable) {
        await MailComposer.composeAsync({
          recipients: [SUPPORT_EMAIL],
          subject: 'App Review / Feedback',
          body: feedbackMsg,
        });
      } else {
        Alert.alert('Error', 'Mail composer is not available. Please send an email to ' + SUPPORT_EMAIL);
      }
    }
    
    setFeedbackVisible(false);
    setFeedbackMsg('');
    Toast.show({ type: 'success', text1: 'Feedback Sent', position: 'top' });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/')}><Text style={styles.cancel}>Cancel</Text></Pressable>
          <Text style={styles.title}>Settings</Text>
          <Pressable onPress={handleSave}><Text style={styles.save}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{nameInput.charAt(0).toUpperCase() || 'U'}</Text>
            </View>
          </View>

          {isUpdateAvailable && (
            <Pressable style={styles.updateBanner} onPress={checkUpdates}>
              <View style={styles.updateBannerContent}>
                <Text style={styles.updateEmoji}>🚀</Text>
                <View>
                  <Text style={styles.updateTitle}>Update Available (v{latestVersion})</Text>
                  <Text style={styles.updateSubtitle}>Tap to see what's new and download</Text>
                </View>
              </View>
              <Text style={styles.updateArrow}>→</Text>
            </Pressable>
          )}

          <Text style={styles.sectionLabel}>Profile</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Your Name</Text>
              <TextInput 
                style={styles.textInput} 
                value={nameInput} 
                onChangeText={setNameInput}
                placeholder="How should we call you?"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </View>

          <Text style={styles.sectionLabel}>Preferences</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Default Currency</Text>
              <View style={styles.currencyRow}>
                {CURRENCIES.map(c => (
                  <Pressable 
                    key={c.symbol}
                    style={[styles.currencyBtn, preferredCurrency === c.symbol && styles.currencyBtnActive]}
                    onPress={() => { setPreferredCurrency(c.symbol); Haptics.selectionAsync(); }}
                  >
                    <Text style={[styles.currencyText, preferredCurrency === c.symbol && styles.currencyTextActive]}>
                      {c.symbol} {c.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Automation</Text>
          <View style={styles.card}>
            <Pressable style={styles.fieldRow} onPress={() => router.push('/sms-training')}>
              <Text style={styles.fieldLabel}>SMS Parsing & Training</Text>
              <Text style={styles.exportDesc}>Configure bank SMS rules for auto-tracking</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Backup & Export</Text>
          <View style={styles.card}>
            <Pressable style={styles.fieldRow} onPress={handleExport}>
              <Text style={styles.fieldLabel}>Export Data as JSON</Text>
              <Text style={styles.exportDesc}>Save a backup of your offline data</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Help & Feedback</Text>
          <View style={styles.card}>
            <Pressable style={styles.fieldRow} onPress={() => { setFeedbackType('issue'); setFeedbackVisible(true); }}>
              <Text style={styles.fieldLabel}>Report an Issue</Text>
              <Text style={styles.exportDesc}>Report bugs directly to our GitHub repository</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.fieldRow} onPress={() => { setFeedbackType('review'); setFeedbackVisible(true); }}>
              <Text style={styles.fieldLabel}>Send a Review</Text>
              <Text style={styles.exportDesc}>Share your thoughts with us via email</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Danger Zone</Text>
          <Pressable style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>Erase all data and start fresh</Text>
          </Pressable>

          <Text style={styles.appVersion}>Money Tracker v{Application.nativeApplicationVersion || '1.0.0'}</Text>
        </ScrollView>

        <Modal visible={feedbackVisible} transparent animationType="slide" onRequestClose={() => setFeedbackVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{feedbackType === 'issue' ? 'Report Issue' : 'Send Review'}</Text>
                <Pressable onPress={() => setFeedbackVisible(false)}><Text style={styles.closeBtn}>✕</Text></Pressable>
              </View>
              
              <View style={styles.typeToggle}>
                <Pressable 
                  style={[styles.typeToggleBtn, feedbackType === 'issue' && styles.typeToggleActive]} 
                  onPress={() => setFeedbackType('issue')}
                >
                  <Text style={[styles.typeToggleText, feedbackType === 'issue' && styles.typeToggleTextActive]}>Issue</Text>
                </Pressable>
                <Pressable 
                  style={[styles.typeToggleBtn, feedbackType === 'review' && styles.typeToggleActive]} 
                  onPress={() => setFeedbackType('review')}
                >
                  <Text style={[styles.typeToggleText, feedbackType === 'review' && styles.typeToggleTextActive]}>Review</Text>
                </Pressable>
              </View>

              <TextInput
                style={styles.feedbackInput}
                multiline
                placeholder={feedbackType === 'issue' ? "Describe the bug you found..." : "What do you think about the app?"}
                placeholderTextColor={Colors.textMuted}
                value={feedbackMsg}
                onChangeText={setFeedbackMsg}
                autoFocus
              />

              <Pressable 
                style={[styles.submitBtn, !feedbackMsg.trim() && { opacity: 0.5 }]} 
                onPress={handleFeedbackSubmit}
                disabled={!feedbackMsg.trim()}
              >
                <Text style={styles.submitBtnText}>Submit</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  content: { paddingHorizontal: 20, paddingBottom: 80 },
  avatarWrap: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary + '30', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: Colors.primary, lineHeight: 40, textAlignVertical: 'center', includeFontPadding: false },
  sectionLabel: { fontFamily: 'Outfit_500Medium', fontSize: 13, color: Colors.textSub, marginBottom: 8, paddingHorizontal: 4 },
  card: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 24, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 16 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 10 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 16, color: Colors.text, paddingVertical: 4, includeFontPadding: false },
  currencyRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  currencyBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.surface },
  currencyBtnActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  currencyText: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.textSub },
  currencyTextActive: { color: Colors.primary },
  resetBtn: { backgroundColor: Colors.expenseBg, borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.expense + '40', marginBottom: 30 },
  resetBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.expense, includeFontPadding: false },
  exportDesc: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  appVersion: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  
  // Update Banner
  updateBanner: { backgroundColor: Colors.primary + '15', marginHorizontal: 20, marginTop: 10, marginBottom: 20, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.primary + '30' },
  updateBannerContent: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  updateEmoji: { fontSize: 24 },
  updateTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: Colors.primary },
  updateSubtitle: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  updateArrow: { fontSize: 18, color: Colors.primary, opacity: 0.8 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: Colors.text },
  closeBtn: { fontSize: 20, color: Colors.textSub, padding: 4 },
  typeToggle: { flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 12, padding: 4, marginBottom: 20 },
  typeToggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  typeToggleActive: { backgroundColor: Colors.card, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  typeToggleText: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.textSub },
  typeToggleTextActive: { color: Colors.primary },
  feedbackInput: { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, height: 120, fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.text, textAlignVertical: 'top', marginBottom: 20 },
  submitBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: '#fff' }
});
