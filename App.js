
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';

import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import HomeScreen from './src/screens/HomeScreen';
import TutorsScreen from './src/screens/TutorsScreen';
import TutorDetailScreen from './src/screens/TutorDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import BookingsScreen from './src/screens/BookingsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import ChatScreen from './src/screens/ChatScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Deep linking configuration
const linking = {
  prefixes: [
    'tutormeapp://',
    'https://tutrapp.netlify.app',
  ],
  config: {
    screens: {
      Home: '',
      Tutors: 'tutors',
      Bookings: 'bookings',
      Profile: 'profile',
    },
  },
};

// Tutors navigation
function TutorsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#7c3aed' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="TutorsList"
        component={TutorsScreen}
        options={{ title: 'Browse Tutors' }}
      />

      <Stack.Screen
        name="TutorDetail"
        component={TutorDetailScreen}
        options={{ title: 'Tutor Profile' }}
      />

      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Book a Session' }}
      />
    </Stack.Navigator>
  );
}

// Bookings navigation
function BookingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#7c3aed' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="BookingsMain"
        component={BookingsScreen}
        options={{ title: 'My Bookings' }}
      />

      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ title: 'Session Chat' }}
      />
    </Stack.Navigator>
  );
}

// Profile navigation
function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#7c3aed' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />

      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: 'Tutor Applications' }}
      />
    </Stack.Navigator>
  );
}

// Main application
export default function App() {
  // Load Ionicons font before rendering the app
  const [fontsLoaded, fontError] = useFonts({
    ...Ionicons.font,
  });

  // Display an error if the font cannot load
  if (fontError) {
    console.error('Ionicons font failed to load:', fontError);
  }

  // Wait until the font is ready
  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.webContainer}>
      <NavigationContainer linking={linking}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: {
              backgroundColor: '#7c3aed',
            },

            headerTintColor: '#fff',

            headerTitleStyle: {
              fontWeight: 'bold',
            },

            tabBarActiveTintColor: '#7c3aed',
            tabBarInactiveTintColor: '#888',

            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Tutors') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'Bookings') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else if (route.name === 'Profile') {
                iconName = focused ? 'person' : 'person-outline';
              }

              return (
                <Ionicons
                  name={iconName}
                  size={size || 22}
                  color={color}
                />
              );
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: 'TutorMe',
              tabBarLabel: 'Home',
            }}
          />

          <Tab.Screen
            name="Tutors"
            component={TutorsStack}
            options={{
              headerShown: false,
              tabBarLabel: 'Tutors',
            }}
          />

          <Tab.Screen
            name="Bookings"
            component={BookingsStack}
            options={{
              headerShown: false,
              tabBarLabel: 'My Bookings',
            }}
          />

          <Tab.Screen
            name="Profile"
            component={ProfileStack}
            options={{
              headerShown: false,
              tabBarLabel: 'Profile',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    height: Platform.OS === 'web' ? '100vh' : '100%',
    width: '100%',
    backgroundColor: '#fff',
  },
});
