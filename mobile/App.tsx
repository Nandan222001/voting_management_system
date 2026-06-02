import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';

import TabNavigator from './src/navigation/TabNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Toast from 'react-native-toast-message';

function AppContent() {
  const { user, token, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="rgb(16 102 177)" />
      </View>
    );
  }

  return (
    <>
      <NavigationContainer>
        <StatusBar style="auto" />
        {token ? (
          <TabNavigator />
        ) : (
          <AuthNavigator />
        )}
      </NavigationContainer>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
