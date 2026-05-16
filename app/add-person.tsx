import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMoney } from '../context/MoneyContext';
import { Colors } from '../constants/Colors';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

export default function AddPersonScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { people, addPerson, updatePerson } = useMoney();

  const existing = id ? people.find(p => p.id === id) : null;

  const [name, setName] = useState(existing?.name || '');
  const [phone, setPhone] = useState(existing?.phone || '');
  const [alias, setAlias] = useState(existing?.alias || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [selectedColor, setSelectedColor] = useState(existing?.avatar_color || Colors.avatarColors[0]);

  const initial = name.charAt(0).toUpperCase() || '?';

  const handleSave = () => {
    if (!name.trim()) return;
    const payload = { name: name.trim(), phone: phone.trim() || undefined, alias: alias.trim() || undefined, notes: notes.trim() || undefined, avatar_color: selectedColor };
    
    if (existing) {
      updatePerson(existing.id, payload);
    } else {
      addPerson(payload);
    }
    
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
          <Text style={styles.title}>{existing ? 'Edit Person' : 'Add Person'}</Text>
          <Pressable onPress={handleSave}><Text style={[styles.save, !name.trim() && { opacity: 0.4 }]}>Save</Text></Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* Avatar preview */}
          <View style={styles.avatarPreview}>
            <View style={[styles.avatar, { backgroundColor: selectedColor + '25' }]}>
              <Text style={[styles.avatarText, { color: selectedColor }]}>{initial}</Text>
            </View>
            <Text style={styles.avatarHint}>Pick a color</Text>
          </View>

          {/* Color picker */}
          <View style={styles.colorRow}>
            {Colors.avatarColors.map(c => (
              <Pressable key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSel]}
                onPress={() => { setSelectedColor(c); Haptics.selectionAsync(); }} />
            ))}
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput style={styles.textInput} value={name} onChangeText={setName}
                placeholder="Rahul Sharma" placeholderTextColor={Colors.textMuted} autoFocus />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Phone (optional)</Text>
              <TextInput style={styles.textInput} value={phone} onChangeText={setPhone}
                placeholder="9876543210" placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad" />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nickname / Alias</Text>
              <TextInput style={styles.textInput} value={alias} onChangeText={setAlias}
                placeholder="Rahul, Bhai, Boss..." placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput style={styles.textInput} value={notes} onChangeText={setNotes}
                placeholder="Flatmate, colleague, friend..." placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          <Pressable style={[styles.cta, !name.trim() && { opacity: 0.5 }]} onPress={handleSave}>
            <Text style={styles.ctaText}>{existing ? '💾 Save Changes' : '👤 Add Person'}</Text>
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
  avatarPreview: { alignItems: 'center', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, lineHeight: 38, textAlignVertical: 'center', includeFontPadding: false },
  avatarHint: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotSel: { borderWidth: 3, borderColor: '#fff' },
  formCard: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20, overflow: 'hidden' },
  fieldRow: { paddingHorizontal: 16, paddingVertical: 14 },
  fieldLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: Colors.textSub, marginBottom: 8 },
  textInput: { fontFamily: 'Outfit_500Medium', fontSize: 15, color: Colors.text, paddingVertical: 4, includeFontPadding: false },
  divider: { height: 1, backgroundColor: Colors.divider, marginLeft: 16 },
  cta: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#fff', includeFontPadding: false },
});
