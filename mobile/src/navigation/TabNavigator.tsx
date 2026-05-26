import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import VotingScreen from '../screens/VotingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = ({ onLogout }: { onLogout: () => void }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof MaterialIcons.glyphMap = 'help-outline';

          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Elections') {
            iconName = 'how-to-vote';
          } else if (route.name === 'Analytics') {
            iconName = 'bar-chart';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return (
            <View style={[
              styles.iconWrapper,
              focused && styles.iconWrapperActive
            ]}>
              <MaterialIcons name={iconName} size={focused ? 26 : 24} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Elections" component={VotingScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    height: Platform.OS === 'ios' ? 88 : 65,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    paddingTop: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconWrapper: {
    width: 40,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperActive: {
    // Optional: add a small indicator or effect here
  }
});

export default TabNavigator;
