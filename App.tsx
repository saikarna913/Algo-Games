
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Pacifico_400Regular } from '@expo-google-fonts/pacifico';

import HomeScreen from './src/core/navigation/HomeScreen';
import GameScreen from './src/core/navigation/GameScreen';
import GlobalFooter from './src/core/components/GlobalFooter';
import DonationPopup from './src/core/components/DonateModal';
import { Colors } from './src/core/theme';
import { useGameStore } from './src/core/store';

// Keep splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = createNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState<string | null>('Home');
  const [showDonationFromFooter, setShowDonationFromFooter] = useState(false);
  const setHasDonated = useGameStore((s) => s.setHasDonated);
  const setDonationPopupSeen = useGameStore((s) => s.setDonationPopupSeen);
  const loadDonationState = useGameStore((s) => s.loadDonationState);
  const hasDonated = useGameStore((s) => s.hasDonated);
  const donationPopupSeen = useGameStore((s) => s.donationPopupSeen);

  // Load Pacifico font for display text
  const [fontsLoaded] = useFonts({ Pacifico_400Regular });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  // On app start, load persisted donation state and show popup if needed
  useEffect(() => {
    (async () => {
      try {
        await loadDonationState();
        const state = useGameStore.getState();
        if (!state.hasDonated && !state.donationPopupSeen) {
          setShowDonationFromFooter(true);
        }
      } catch (e) {
        console.warn('Failed to load donation state on startup', e);
      }
    })();
  }, []);

  if (!fontsLoaded) return null;

  const handleDonate = () => {
    setHasDonated(true);
    setDonationPopupSeen(true);
    setShowDonationFromFooter(false);
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <View style={styles.root}>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name ?? null)}
          onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name ?? null)}
        >
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Colors.background },
              animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Game" component={GameScreen as any} />
          </Stack.Navigator>
        </NavigationContainer>

        {/* Global footer overlays navigation except on the Game screen */}
        {currentRoute !== 'Game' && (
          <GlobalFooter onDonatePress={() => setShowDonationFromFooter(true)} />
        )}

        {/* Donation popup triggered from footer donate button */}
        <DonationPopup
          visible={showDonationFromFooter}
          onClose={() => setShowDonationFromFooter(false)}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
