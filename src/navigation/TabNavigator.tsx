import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Search, Calendar, User } from 'lucide-react-native';
import { BrowseRoomsScreen } from '../screens/BrowseRoomsScreen';
import { MyBookingsScreen } from '../screens/MyBookingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: { height: 60, paddingBottom: 8, paddingTop: 8 },
      }}
    >
      <Tab.Screen
        name="Browse"
        component={BrowseRoomsScreen}
        options={{
          tabBarLabel: 'Tìm phòng',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'Lịch đặt',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
};