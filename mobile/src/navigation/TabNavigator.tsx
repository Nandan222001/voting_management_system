import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { View, StyleSheet, Platform } from 'react-native';

import DashboardScreen from '../screens/DashboardScreen';
import AnnouncementsListScreen from '../screens/AnnouncementsListScreen';
import AnnouncementDetailScreen from '../screens/AnnouncementDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import VotingScreen from '../screens/VotingScreen';
import CandidateDetailScreen from '../screens/CandidateDetailScreen';
import NominationScreen from '../screens/NominationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const VoteStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Voting" component={VotingScreen} />
    <Stack.Screen name="CandidateDetail" component={CandidateDetailScreen} />
    <Stack.Screen name="Nomination" component={NominationScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
  </Stack.Navigator>
);

const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardHome" component={DashboardScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="AnnouncementsList" component={AnnouncementsListScreen} />
    <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
  </Stack.Navigator>
);

const AnalyticsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AnalyticsMain" component={AnalyticsScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => {
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
            iconName = 'groups';
          } else if (route.name === 'Profile') {
            iconName = 'settings';
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
        tabBarActiveTintColor: '#003d9b',
        tabBarInactiveTintColor: '#434654',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardStack} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Elections" 
        component={VoteStack} 
        options={{ tabBarLabel: 'Vote' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Force reset to the top of the stack and clear selected election
            navigation.navigate('Elections', { 
              screen: 'Voting', 
              params: { election: null } 
            });
          },
        })}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsStack} 
        options={{ tabBarLabel: 'People' }}
      />
      <Tab.Screen 
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: 'Account' }}
      />
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
