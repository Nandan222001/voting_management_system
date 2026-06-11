import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { navigationRef } from './src/utils/navigationService';
import { pushNotificationService } from './src/services/pushNotificationService';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { hs, vs, ms } from './src/utils/responsive';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#10b981',
        backgroundColor: '#ffffff',
        borderRadius: ms(16),
        height: vs(80),
        width: '94%',
        marginHorizontal: '3%',
        ...Platform.select({
          ios: {
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 15,
          },
          android: {
            elevation: 8,
          },
          web: {
            boxShadow: '0px 10px 30px rgba(16, 185, 129, 0.12)',
          },
        }),
        borderLeftWidth: hs(6),
      }}
      contentContainerStyle={{ paddingHorizontal: hs(20) }}
      text1Style={{
        fontSize: ms(16),
        fontWeight: '800',
        color: '#064e3b',
        marginBottom: vs(2),
      }}
      text2Style={{
        fontSize: ms(13),
        color: '#065f46',
        fontWeight: '500',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: hs(20) }}>
          <View style={{ backgroundColor: '#d1fae5', padding: ms(8), borderRadius: ms(12) }}>
            <MaterialIcons name="check-circle" size={ms(24)} color="#10b981" />
          </View>
        </View>
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#ef4444',
        backgroundColor: '#ffffff',
        borderRadius: ms(16),
        height: vs(80),
        width: '94%',
        marginHorizontal: '3%',
        ...Platform.select({
          ios: {
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 15,
          },
          android: {
            elevation: 8,
          },
          web: {
            boxShadow: '0px 10px 30px rgba(239, 68, 68, 0.12)',
          },
        }),
        borderLeftWidth: hs(6),
      }}
      contentContainerStyle={{ paddingHorizontal: hs(20) }}
      text1Style={{
        fontSize: ms(16),
        fontWeight: '800',
        color: '#7f1d1d',
        marginBottom: vs(2),
      }}
      text2Style={{
        fontSize: ms(13),
        color: '#991b1b',
        fontWeight: '500',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: hs(20) }}>
          <View style={{ backgroundColor: '#fee2e2', padding: ms(8), borderRadius: ms(12) }}>
            <MaterialIcons name="error-outline" size={ms(24)} color="#ef4444" />
          </View>
        </View>
      )}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#003d9b',
        backgroundColor: '#ffffff',
        borderRadius: ms(16),
        height: vs(80),
        width: '94%',
        marginHorizontal: '3%',
        ...Platform.select({
          ios: {
            shadowColor: '#003d9b',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.12,
            shadowRadius: 15,
          },
          android: {
            elevation: 8,
          },
          web: {
            boxShadow: '0px 10px 30px rgba(0, 61, 155, 0.12)',
          },
        }),
        borderLeftWidth: hs(6),
      }}
      contentContainerStyle={{ paddingHorizontal: hs(20) }}
      text1Style={{
        fontSize: ms(16),
        fontWeight: '800',
        color: '#1e3a8a',
        marginBottom: vs(2),
      }}
      text2Style={{
        fontSize: ms(13),
        color: '#1e40af',
        fontWeight: '500',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: hs(20) }}>
          <View style={{ backgroundColor: '#dbeafe', padding: ms(8), borderRadius: ms(12) }}>
            <MaterialIcons name="info-outline" size={ms(24)} color="#003d9b" />
          </View>
        </View>
      )}
    />
  ),
};

function AppContent() {
  const { user, token, isLoading, logout } = useAuth();

  React.useEffect(() => {
    pushNotificationService.init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#003d9b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer ref={navigationRef}>
        <StatusBar barStyle="dark-content" />
        {token ? (
          <TabNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
      <Toast config={toastConfig} />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
