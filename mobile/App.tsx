import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: '#056e00',
        backgroundColor: '#fff',
        borderRadius: 12,
        height: 70,
        width: '90%',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 5,
          },
          web: {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        }),
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '800',
        color: '#191c1e',
      }}
      text2Style={{
        fontSize: 13,
        color: '#434654',
        fontWeight: '500',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <MaterialIcons name="check-circle" size={24} color="#056e00" />
        </View>
      )}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: '#d32f2f',
        backgroundColor: '#fff',
        borderRadius: 12,
        height: 70,
        width: '90%',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 5,
          },
          web: {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        }),
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '800',
        color: '#191c1e',
      }}
      text2Style={{
        fontSize: 13,
        color: '#434654',
        fontWeight: '500',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <MaterialIcons name="error" size={24} color="#d32f2f" />
        </View>
      )}
    />
  ),
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        borderLeftColor: '#003d9b',
        backgroundColor: '#fff',
        borderRadius: 12,
        height: 70,
        width: '90%',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          android: {
            elevation: 5,
          },
          web: {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          },
        }),
        borderLeftWidth: 6,
      }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '800',
        color: '#191c1e',
      }}
      text2Style={{
        fontSize: 13,
        color: '#434654',
        fontWeight: '500',
      }}
      renderLeadingIcon={() => (
        <View style={{ justifyContent: 'center', paddingLeft: 15 }}>
          <MaterialIcons name="info" size={24} color="#003d9b" />
        </View>
      )}
    />
  ),
};

function AppContent() {
  const { user, token, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#003d9b" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar style="auto" />
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
