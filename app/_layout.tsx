import React, { useState, useEffect } from 'react';
import { useFonts, Outfit_300Light, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MoneyProvider } from '../context/MoneyContext';
import { VersionProvider, useVersion } from '../context/VersionContext';
import { Colors } from '../constants/Colors';
import Toast from 'react-native-toast-message';
import { Modal, Text, Pressable, Linking, StyleSheet } from 'react-native';

function UpdatePrompt() {
  const { isUpdateAvailable, latestVersion, releaseNotes, downloadUrl } = useVersion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isUpdateAvailable) setVisible(true);
  }, [isUpdateAvailable]);

  if (!isUpdateAvailable) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>Update Available!</Text>
          <Text style={styles.desc}>Version {latestVersion} is now available on GitHub.</Text>
          {releaseNotes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesTitle}>What's New:</Text>
              <Text style={styles.notesText}>{releaseNotes}</Text>
            </View>
          )}
          <View style={styles.btnRow}>
            <Pressable style={styles.skipBtn} onPress={() => setVisible(false)}>
              <Text style={styles.skipBtnText}>Maybe Later</Text>
            </Pressable>
            <Pressable style={styles.updateBtn} onPress={() => downloadUrl && Linking.openURL(downloadUrl)}>
              <Text style={styles.updateBtnText}>Download APK</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  content: { backgroundColor: Colors.card, borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: Colors.cardBorder },
  emoji: { fontSize: 40, marginBottom: 16 },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: Colors.text, marginBottom: 8 },
  desc: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: Colors.textSub, textAlign: 'center', marginBottom: 20 },
  notesBox: { alignSelf: 'stretch', backgroundColor: Colors.surface, borderRadius: 12, padding: 16, marginBottom: 20 },
  notesTitle: { fontFamily: 'Outfit_600SemiBold', fontSize: 12, color: Colors.textSub, marginBottom: 4 },
  notesText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: Colors.text, lineHeight: 18 },
  btnRow: { flexDirection: 'row', gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  skipBtnText: { fontFamily: 'Outfit_500Medium', fontSize: 14, color: Colors.textSub },
  updateBtn: { flex: 2, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  updateBtnText: { fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: '#fff' },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_300Light, Outfit_400Regular, Outfit_500Medium,
    Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold,
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) setReady(true);
  }, [fontsLoaded]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <VersionProvider>
        <MoneyProvider>
          <StatusBar style="light" backgroundColor={Colors.bg} />
          <UpdatePrompt />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add-transaction" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="add-lending"     options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="add-split"       options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="add-account"     options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="add-person"      options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="record-repayment" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="profile"         options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="person-detail"   options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="recurring"       options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="sms-training"    options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          </Stack>
        </MoneyProvider>
        <Toast />
      </VersionProvider>
    </GestureHandlerRootView>
  );
}
