import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Modal, TouchableOpacity } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import * as Haptics from 'expo-haptics';

function TabIcon({ emoji, label, active }: { emoji: string; label: string; active: boolean }) {
  return (
    <View style={styles.iconWrap}>
      <Text style={[styles.iconEmoji, active && styles.iconActive]}>{emoji}</Text>
      <Text style={[styles.iconLabel, active && styles.iconLabelActive]}>{label}</Text>
    </View>
  );
}

function ActionSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const router = useRouter();
  const actions = [
    { icon: '↗', label: 'Lend / Borrow', sub: 'Track money with someone', route: '/add-lending', color: Colors.income },
    { icon: '⇄', label: 'Split Expense', sub: 'Divide a bill with friends', route: '/add-split', color: Colors.pending },
    { icon: '📋', label: 'Add Transaction', sub: 'Log income or expense', route: '/add-transaction', color: Colors.primary },
    { icon: '🏦', label: 'Add Account', sub: 'Bank, UPI, card or cash', route: '/add-account', color: Colors.transfer },
    { icon: '👤', label: 'Add Person', sub: 'Track money with someone new', route: '/add-person', color: Colors.textSub },
  ];

  const go = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 100);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>What would you like to do?</Text>
          {actions.map(a => (
            <Pressable key={a.route} style={styles.sheetItem} onPress={() => go(a.route)}>
              <View style={[styles.sheetIcon, { backgroundColor: a.color + '22' }]}>
                <Text style={[styles.sheetIconText, { color: a.color }]}>{a.icon}</Text>
              </View>
              <View style={styles.sheetItemInfo}>
                <Text style={styles.sheetItemLabel}>{a.label}</Text>
                <Text style={styles.sheetItemSub}>{a.sub}</Text>
              </View>
              <Text style={styles.sheetArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function TabLayout() {
  const [sheetVisible, setSheetVisible] = useState(false);

  const openSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetVisible(true);
  };

  return (
    <>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: styles.bar, tabBarShowLabel: false }}>
        <Tabs.Screen name="index"    options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="⊙" label="Home"     active={focused} /> }} />
        <Tabs.Screen name="accounts" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏦" label="Accounts" active={focused} /> }} />
        <Tabs.Screen name="add"      options={{ tabBarButton: () => (
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Pressable style={styles.fab} onPress={openSheet}>
              <Text style={styles.fabText}>＋</Text>
            </Pressable>
          </View>
        )}} />
        <Tabs.Screen name="people"   options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="People"   active={focused} /> }} />
        <Tabs.Screen name="activity" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Activity" active={focused} /> }} />
      </Tabs>
      <ActionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1, borderTopColor: Colors.cardBorder,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 6, elevation: 0, boxShadow: 'none',
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconEmoji: { fontSize: 20, opacity: 0.35 },
  iconActive: { opacity: 1 },
  iconLabel: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: Colors.textMuted },
  iconLabelActive: { color: Colors.primary, fontFamily: 'Outfit_500Medium' },
  fab: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 6,
    elevation: 12, boxShadow: '0px 6px 12px rgba(91, 91, 214, 0.5)',
  },
  fabText: { color: '#fff', fontSize: 26, fontFamily: 'Outfit_300Light', lineHeight: 30 },
  // Action Sheet
  sheetOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheetContainer: {
    backgroundColor: Colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 24, paddingTop: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.surface, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 16, color: Colors.textSub, marginBottom: 16 },
  sheetItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  sheetIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  sheetIconText: { fontSize: 20, fontFamily: 'Outfit_700Bold' },
  sheetItemInfo: { flex: 1 },
  sheetItemLabel: { fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: Colors.text },
  sheetItemSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginTop: 2 },
  sheetArrow: { fontSize: 20, color: Colors.textMuted, fontFamily: 'Outfit_400Regular' },
});
