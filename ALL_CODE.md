# TutorMe CEA - Complete Expo React Native App Code

## Table of Contents
1. [App.js - Main Entry Point](#appjs)
2. [Supabase Config](#supabase-config)
3. [Screens](#screens)
4. [Configuration Files](#configuration-files)
5. [Database Setup](#database-setup)

---

## App.js

```javascript
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from './src/config/supabase';

// Screen Imports
import HomeScreen from './src/screens/HomeScreen';
import TutorsScreen from './src/screens/TutorsScreen';
import TutorDetailScreen from './src/screens/TutorDetailScreen';
import BookingScreen from './src/screens/BookingScreen';
import MyBookingsScreen from './src/screens/MyBookingsScreen';
import BecomeTutorScreen from './src/screens/BecomeTutorScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TutorsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#7C3AED' },
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
        options={{ title: 'Book Session' }}
      />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
      />
      <Stack.Screen 
        name="BecomeTutor" 
        component={BecomeTutorScreen}
        options={{ 
          headerShown: true,
          title: 'Become a Tutor',
          headerStyle: { backgroundColor: '#7C3AED' },
          headerTintColor: '#fff',
        }}
      />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <View style={{ fontSize: 24 }}>📚</View>
          ),
        }}
      />
      <Tab.Screen
        name="Tutors"
        component={TutorsStack}
        options={{
          tabBarLabel: 'Tutors',
          tabBarIcon: ({ color, size }) => (
            <View style={{ fontSize: 24 }}>👨‍🏫</View>
          ),
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={MyBookingsScreen}
        options={{
          tabBarLabel: 'My Bookings',
          tabBarIcon: ({ color, size }) => (
            <View style={{ fontSize: 24 }}>📅</View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <View style={{ fontSize: 24 }}>👤</View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking session:', error);
        setIsLoading(false);
      } finally {
        setInitializing(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, _session) => {
      setInitializing(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}
```

---

## Supabase Config

### src/config/supabase.js

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required. Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## Screens

### src/screens/HomeScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { supabase } from '../config/supabase';

const HomeScreen = ({ navigation }) => {
  const [tutors, setTutors] = useState([]);
  const [crashCourses, setCrashCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('*')
        .limit(6);

      if (tutorsError) throw tutorsError;

      // Fetch crash courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('crash_courses')
        .select('*');

      if (coursesError) throw coursesError;

      setTutors(tutorsData || []);
      setCrashCourses(coursesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🎓 Validated Prototype</Text>
        </View>
        
        <Text style={styles.heroTitle}>
          Find the Right Peer Tutor. Learn with Confidence.
        </Text>
        
        <Text style={styles.heroSubtitle}>
          On-demand peer matching built specifically for 1st- and 2nd-year CEA undergraduates.
        </Text>

        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Tutors')}
        >
          <Text style={styles.buttonText}>Browse Tutors →</Text>
        </TouchableOpacity>
      </View>

      {/* Popular Subjects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Subjects</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsContainer}>
          {['📐 Calculus', '📏 Solid Mensuration', '⚡ Physics', '🧪 Chemistry', '🏛️ Architecture'].map((subject, idx) => (
            <TouchableOpacity key={idx} style={styles.pill}>
              <Text style={styles.pillText}>{subject}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Crash Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Crash Courses</Text>
          <Text style={styles.badge}>⚡ High-Yield</Text>
        </View>
        
        {crashCourses.map((course) => (
          <View key={course.id} style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseCode}>{course.code}</Text>
              <Text style={styles.courseDuration}>2 Hours</Text>
            </View>
            <Text style={styles.courseName}>{course.name}</Text>
            <Text style={styles.courseInstructor}>Lead: {course.instructor}</Text>
            <View style={styles.courseFooter}>
              <Text style={styles.coursePrice}>₱{course.price}</Text>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Reserve</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Featured Tutors */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Tutors</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tutors')}>
            <Text style={styles.viewAllLink}>View All →</Text>
          </TouchableOpacity>
        </View>
        
        {tutors.slice(0, 3).map((tutor) => (
          <TouchableOpacity 
            key={tutor.id} 
            style={styles.tutorCard}
            onPress={() => navigation.navigate('TutorDetail', { tutorId: tutor.id })}
          >
            <View style={styles.tutorAvatar}>
              <Text style={styles.avatarText}>{tutor.initials}</Text>
            </View>
            <View style={styles.tutorInfo}>
              <Text style={styles.tutorName}>{tutor.name}</Text>
              <Text style={styles.tutorSubjects}>{tutor.subjects?.join(', ')}</Text>
              <Text style={styles.tutorRating}>⭐ {tutor.rating} ({tutor.reviews} reviews)</Text>
            </View>
            <View style={styles.tutorRate}>
              <Text style={styles.rateValue}>₱{tutor.rate}</Text>
              <Text style={styles.rateLabel}>/hr</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* How It Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How TutorMe Works</Text>
        
        {[
          { step: '1', title: 'Find by Subject', desc: 'Filter through verified CEA tutors' },
          { step: '2', title: 'Pick Your Slot', desc: 'Choose time and location' },
          { step: '3', title: 'Pass Exams', desc: 'Get high-yield review and ace your course' },
        ].map((item, idx) => (
          <View key={idx} style={styles.howItWorksItem}>
            <View style={styles.stepCircle}>
              <Text style={styles.stepText}>{item.step}</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>{item.title}</Text>
              <Text style={styles.stepDesc}>{item.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA Section */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaTitle}>Become a Peer Tutor</Text>
        <Text style={styles.ctaSubtitle}>Monetize your high grades and help underclassmen</Text>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('BecomeTutor')}
        >
          <Text style={styles.buttonText}>Apply Now →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd5fe',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b21a8',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  viewAllLink: {
    color: '#7c3aed',
    fontWeight: '600',
    fontSize: 14,
  },
  pillsContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  pill: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  courseCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd5fe',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  courseCode: {
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#f3e8ff',
    color: '#6b21a8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  courseDuration: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  courseName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  coursePrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7c3aed',
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  tutorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    borderWidth: 2,
    borderColor: '#ddd5fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7c3aed',
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  tutorSubjects: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  tutorRating: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  tutorRate: {
    alignItems: 'flex-end',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
  },
  rateLabel: {
    fontSize: 11,
    color: '#999',
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 12,
  },
  howItWorksItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ddd5fe',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7c3aed',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  stepDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  ctaSection: {
    marginHorizontal: 16,
    marginVertical: 20,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#ddd5fe',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  ctaSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 12,
  },
});

export default HomeScreen;
```

### src/screens/TutorsScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { supabase } from '../config/supabase';

const TutorsScreen = ({ navigation }) => {
  const [tutors, setTutors] = useState([]);
  const [filteredTutors, setFilteredTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedRate, setSelectedRate] = useState('All');

  const subjects = [
    'All',
    'Mathematics/Calculus',
    'Solid Mensuration',
    'Chemistry',
    'Physics',
    'Engineering/Architecture',
  ];

  const rateFilters = ['All', 'Under ₱75', '₱76–₱100', 'Over ₱100'];

  useEffect(() => {
    loadTutors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tutors, searchQuery, selectedSubject, selectedRate]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('rating', { ascending: false });

      if (error) throw error;
      setTutors(data || []);
    } catch (error) {
      console.error('Error loading tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = tutors;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tutor.subjects || []).some((s) =>
            s.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Subject filter
    if (selectedSubject !== 'All') {
      filtered = filtered.filter((tutor) =>
        (tutor.subjects || []).includes(selectedSubject)
      );
    }

    // Rate filter
    if (selectedRate !== 'All') {
      filtered = filtered.filter((tutor) => {
        const rate = tutor.rate || 0;
        if (selectedRate === 'Under ₱75') return rate < 75;
        if (selectedRate === '₱76–₱100') return rate >= 76 && rate <= 100;
        if (selectedRate === 'Over ₱100') return rate > 100;
        return true;
      });
    }

    setFilteredTutors(filtered);
  };

  const renderTutorCard = ({ item: tutor }) => (
    <TouchableOpacity
      style={styles.tutorCard}
      onPress={() => navigation.navigate('TutorDetail', { tutorId: tutor.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{tutor.initials || 'TU'}</Text>
          </View>
          <View style={styles.tutorHeaderInfo}>
            <Text style={styles.tutorName}>{tutor.name}</Text>
            <Text style={styles.tutorBadge}>{tutor.badge}</Text>
          </View>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {tutor.rating}</Text>
          <Text style={styles.reviewsText}>({tutor.reviews})</Text>
        </View>
      </View>

      <Text style={styles.tutorSubjects}>
        {(tutor.subjects || []).join(' • ')}
      </Text>

      <View style={styles.tutorDetails}>
        <View>
          <Text style={styles.detailLabel}>Available</Text>
          <Text style={styles.detailValue}>{tutor.days_display || 'Varied'}</Text>
        </View>
        <View>
          <Text style={styles.detailLabel}>Rate</Text>
          <Text style={styles.detailValue}>₱{tutor.rate}/hr</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() => navigation.navigate('TutorDetail', { tutorId: tutor.id })}
      >
        <Text style={styles.bookButtonText}>View Profile & Book →</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterSection}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search tutor name, subject..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Subject Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {subjects.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterPill,
                selectedSubject === subject && styles.filterPillActive,
              ]}
              onPress={() => setSelectedSubject(subject)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedSubject === subject && styles.filterPillTextActive,
                ]}
              >
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Rate Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
        >
          {rateFilters.map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[
                styles.filterPill,
                selectedRate === rate && styles.filterPillActive,
              ]}
              onPress={() => setSelectedRate(rate)}
            >
              <Text
                style={[
                  styles.filterPillText,
                  selectedRate === rate && styles.filterPillTextActive,
                ]}
              >
                {rate}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tutors List */}
      <FlatList
        data={filteredTutors}
        renderItem={renderTutorCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No tutors found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your filters
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 13,
    color: '#000',
  },
  filterScroll: {
    marginBottom: 10,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
  },
  filterPillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tutorCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#ddd5fe',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7c3aed',
  },
  tutorHeaderInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  tutorBadge: {
    fontSize: 11,
    color: '#7c3aed',
    marginTop: 2,
    fontWeight: '600',
  },
  ratingBadge: {
    alignItems: 'flex-end',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f59e0b',
  },
  reviewsText: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  tutorSubjects: {
    fontSize: 11,
    color: '#666',
    marginBottom: 10,
  },
  tutorDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
    marginTop: 3,
  },
  bookButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default TutorsScreen;
```

### src/screens/TutorDetailScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../config/supabase';

const TutorDetailScreen = ({ route, navigation }) => {
  const { tutorId } = route.params;
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutor();
  }, [tutorId]);

  const loadTutor = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', tutorId)
        .single();

      if (error) throw error;
      setTutor(data);
    } catch (error) {
      console.error('Error loading tutor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!tutor) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Tutor not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tutor.initials || 'TU'}</Text>
        </View>
        <Text style={styles.tutorName}>{tutor.name}</Text>
        <Text style={styles.tutorBadge}>{tutor.badge}</Text>
        
        <View style={styles.ratingSection}>
          <Text style={styles.ratingValue}>⭐ {tutor.rating}</Text>
          <Text style={styles.reviewsCount}>({tutor.reviews} reviews)</Text>
        </View>
      </View>

      {/* Key Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Program</Text>
          <Text style={styles.infoValue}>{tutor.program}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Hourly Rate</Text>
          <Text style={styles.infoValue}>₱{tutor.rate}/hr</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Available Days</Text>
          <Text style={styles.infoValue}>{tutor.days_display || 'Varied'}</Text>
        </View>
      </View>

      {/* Subjects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Specialties</Text>
        <View style={styles.subjectsContainer}>
          {(tutor.subjects || []).map((subject, idx) => (
            <View key={idx} style={styles.subjectBadge}>
              <Text style={styles.subjectText}>{subject}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pricing Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Pricing</Text>
        <View style={styles.pricingCard}>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>1 Hour Session</Text>
            <Text style={styles.pricingValue}>₱{tutor.rate}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>1.5 Hour Session</Text>
            <Text style={styles.pricingValue}>₱{Math.round(tutor.rate * 1.5)}</Text>
          </View>
          <View style={styles.pricingRow}>
            <Text style={styles.pricingLabel}>2 Hour Session</Text>
            <Text style={styles.pricingValue}>₱{tutor.rate * 2}</Text>
          </View>
          <View style={styles.pricingNote}>
            <Text style={styles.pricingNoteText}>
              5% platform service fee applies. Payments are protected.
            </Text>
          </View>
        </View>
      </View>

      {/* Booking Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Modes</Text>
        <View style={styles.optionCard}>
          <Text style={styles.optionIcon}>📍</Text>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>In-Person on Campus</Text>
            <Text style={styles.optionDesc}>
              CEA Library Pods, Engineering Lobby, or Architecture Drafting Hall
            </Text>
          </View>
        </View>
        <View style={styles.optionCard}>
          <Text style={styles.optionIcon}>💻</Text>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Virtual via Google Meet</Text>
            <Text style={styles.optionDesc}>
              Online session for maximum flexibility
            </Text>
          </View>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() =>
          navigation.navigate('Booking', {
            tutorId: tutor.id,
            tutorName: tutor.name,
            tutorRate: tutor.rate,
            tutorInitials: tutor.initials,
          })
        }
      >
        <Text style={styles.bookButtonText}>Book a Session with {tutor.name.split(' ')[0]}</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  headerCard: {
    backgroundColor: '#f3e8ff',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd5fe',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  tutorName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
  },
  tutorBadge: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    marginBottom: 12,
  },
  ratingSection: {
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f59e0b',
  },
  reviewsCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd5fe',
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
  },
  pricingCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  pricingLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  pricingValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7c3aed',
  },
  pricingNote: {
    paddingTop: 10,
  },
  pricingNoteText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  optionDesc: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  bookButton: {
    backgroundColor: '#7c3aed',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
});

export default TutorDetailScreen;
```

### src/screens/BookingScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { supabase } from '../config/supabase';

const BookingScreen = ({ route, navigation }) => {
  const { tutorId, tutorName, tutorRate, tutorInitials } = route.params;
  const [duration, setDuration] = useState(1);
  const [location, setLocation] = useState('CEA Library Study Pod');
  const [time, setTime] = useState('4:00 PM - 5:00 PM');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  const locations = [
    'CEA Library Study Pod',
    'CEA Engineering Lobby',
    'Architecture Drafting Hall 3rd Floor',
    'Google Meet Virtual',
  ];

  const times = [
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '10:00 AM - 11:00 AM',
  ];

  const calculatePricing = () => {
    const subtotal = tutorRate * duration;
    const platformFee = subtotal * 0.05;
    const total = subtotal + platformFee;
    return { subtotal, platformFee, total };
  };

  const { subtotal, platformFee, total } = calculatePricing();

  const handleBooking = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter the exam topic or struggle area');
      return;
    }

    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          tutor_id: tutorId,
          student_id: user?.id,
          location,
          time,
          duration,
          topic,
          total_amount: total,
          status: 'pending',
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert('Success', `Booking request sent to ${tutorName}!`);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Tutor Info */}
      <View style={styles.tutorCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tutorInitials}</Text>
        </View>
        <View>
          <Text style={styles.tutorName}>{tutorName}</Text>
          <Text style={styles.tutorRate}>₱{tutorRate}/hr</Text>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location & Time</Text>

        <Text style={styles.label}>Session Mode</Text>
        <View style={styles.optionsContainer}>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[
                styles.option,
                location === loc && styles.optionSelected,
              ]}
              onPress={() => setLocation(loc)}
            >
              <Text
                style={[
                  styles.optionText,
                  location === loc && styles.optionTextSelected,
                ]}
              >
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Time Slot</Text>
        <View style={styles.optionsContainer}>
          {times.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.option, time === t && styles.optionSelected]}
              onPress={() => setTime(t)}
            >
              <Text
                style={[
                  styles.optionText,
                  time === t && styles.optionTextSelected,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.label}>Session Duration</Text>
        <View style={styles.durationContainer}>
          {[1, 1.5, 2].map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[
                styles.durationOption,
                duration === dur && styles.durationOptionSelected,
              ]}
              onPress={() => setDuration(dur)}
            >
              <Text
                style={[
                  styles.durationOptionText,
                  duration === dur && styles.durationOptionTextSelected,
                ]}
              >
                {dur} hr{dur > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topic */}
      <View style={styles.section}>
        <Text style={styles.label}>Exam Topic or Struggle Area</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Chemical Equilibrium or Solid Mensuration Prisms"
          value={topic}
          onChangeText={setTopic}
          placeholderTextColor="#999"
        />
      </View>

      {/* Pricing */}
      <View style={styles.pricingSection}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>
            Tutor Base ({duration} hr @ ₱{tutorRate}/hr):
          </Text>
          <Text style={styles.pricingValue}>₱{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Platform Fee (5%):</Text>
          <Text style={styles.pricingValue}>₱{platformFee.toFixed(2)}</Text>
        </View>
        <View style={styles.pricingRowTotal}>
          <Text style={styles.pricingLabelTotal}>Total Due:</Text>
          <Text style={styles.pricingValueTotal}>₱{total.toFixed(2)}</Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.bookButton, loading && styles.bookButtonDisabled]}
        onPress={handleBooking}
        disabled={loading}
      >
        <Text style={styles.bookButtonText}>
          {loading ? 'Confirming...' : 'Confirm & Request Booking'}
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ddd5fe',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#7c3aed',
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  tutorRate: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: '#f3e8ff',
    borderColor: '#7c3aed',
  },
  optionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  durationOptionSelected: {
    backgroundColor: '#f3e8ff',
    borderColor: '#7c3aed',
  },
  durationOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  durationOptionTextSelected: {
    color: '#7c3aed',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  pricingSection: {
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#ddd5fe',
    borderRadius: 12,
    padding: 12,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd5fe',
  },
  pricingRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd5fe',
    marginTop: 4,
  },
  pricingLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  pricingLabelTotal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  pricingValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7c3aed',
  },
  pricingValueTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#7c3aed',
  },
  bookButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
});

export default BookingScreen;
```

### src/screens/MyBookingsScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../config/supabase';

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setBookings([]);
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          tutor:tutor_id(name, initials, rate)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'completed':
        return '#6b7280';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#999';
    }
  };

  const renderBookingCard = ({ item: booking }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingTypeIcon}>
          <Text style={styles.bookingIcon}>📅</Text>
        </View>
        <View style={styles.bookingHeaderInfo}>
          <Text style={styles.bookingType}>1-on-1 Session</Text>
          <Text style={styles.bookingTutor}>
            with {booking.tutor?.name || 'Tutor'}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(booking.status)}20` },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: getStatusColor(booking.status) },
            ]}
          >
            {booking.status?.charAt(0).toUpperCase() +
              booking.status?.slice(1)}
          </Text>
        </View>
      </View>

      <Text style={styles.bookingTopic}>{booking.topic}</Text>

      <View style={styles.bookingDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{booking.location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>⏰</Text>
          <Text style={styles.detailText}>{booking.time}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>💵</Text>
          <Text style={styles.detailText}>₱{booking.total_amount?.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {booking.status === 'pending' && (
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptyText}>
            Browse tutors and book your first session
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookingTypeIcon: {
    marginRight: 10,
  },
  bookingIcon: {
    fontSize: 24,
  },
  bookingHeaderInfo: {
    flex: 1,
  },
  bookingType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  bookingTutor: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bookingTopic: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  bookingDetails: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  bookingFooter: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
  },
  cancelButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MyBookingsScreen;
```

### src/screens/BecomeTutorScreen.js

```javascript
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../config/supabase';

const BecomeTutorScreen = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [program, setProgram] = useState('3rd Year Civil Eng.');
  const [rate, setRate] = useState('75');
  const [subjects, setSubjects] = useState('');
  const [availableDays, setAvailableDays] = useState('');
  const [loading, setLoading] = useState(false);

  const programs = [
    '3rd Year Civil Eng.',
    '4th Year Civil Eng.',
    '3rd Year Electronics Eng.',
    '4th Year Electronics Eng.',
    '3rd Year Architecture',
    '4th Year Architecture',
    '3rd Year Computer Eng.',
    '4th Year Mechanical Eng.',
  ];

  const rates = ['60', '75', '85', '100'];

  const handleSubmit = async () => {
    if (!fullName.trim() || !subjects.trim() || !availableDays.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const nameParts = fullName.trim().split(/\s+/);
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
        : nameParts[0].slice(0, 2).toUpperCase();

      const subjectsList = subjects
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const { error } = await supabase
        .from('tutor_applications')
        .insert({
          full_name: fullName,
          program,
          requested_rate: parseInt(rate),
          subjects: subjectsList,
          available_days: availableDays,
          initials,
          status: 'pending',
          user_id: user?.id,
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      Alert.alert(
        'Application Submitted',
        'Welcome! Your application is under review. We\'ll verify your transcript soon.'
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tutor Application</Text>
        <Text style={styles.sectionDesc}>
          Monetize your high grades and help underclassmen pass their courses.
        </Text>
      </View>

      {/* Full Name */}
      <View style={styles.section}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Juan De La Cruz"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#999"
        />
      </View>

      {/* Program & Rate */}
      <View style={styles.section}>
        <Text style={styles.label}>CEA Program & Year</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollContainer}
        >
          {programs.map((prog) => (
            <TouchableOpacity
              key={prog}
              style={[
                styles.optionButton,
                program === prog && styles.optionButtonSelected,
              ]}
              onPress={() => setProgram(prog)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  program === prog && styles.optionButtonTextSelected,
                ]}
              >
                {prog}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 16 }]}>Hourly Rate (₱)</Text>
        <View style={styles.rateButtonsContainer}>
          {rates.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.rateButton,
                rate === r && styles.rateButtonSelected,
              ]}
              onPress={() => setRate(r)}
            >
              <Text
                style={[
                  styles.rateButtonText,
                  rate === r && styles.rateButtonTextSelected,
                ]}
              >
                ₱{r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Subjects */}
      <View style={styles.section}>
        <Text style={styles.label}>Subjects You Can Teach</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g. Calculus, Physics, Solid Mensuration (separate by comma)"
          value={subjects}
          onChangeText={setSubjects}
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />
      </View>

      {/* Available Days */}
      <View style={styles.section}>
        <Text style={styles.label}>Available Days</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Friday, Saturday, Sunday"
          value={availableDays}
          onChangeText={setAvailableDays}
          placeholderTextColor="#999"
        />
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoIcon}>ℹ️</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Verification Process</Text>
          <Text style={styles.infoText}>
            We verify your transcript and teaching credentials before you appear in
            the tutor directory. Most applications are reviewed within 48 hours.
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitButtonText}>
          {loading ? 'Submitting...' : 'Submit Application'}
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#000',
    backgroundColor: '#f9f9f9',
  },
  multilineInput: {
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  scrollContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#f3e8ff',
    borderColor: '#7c3aed',
  },
  optionButtonText: {
    fontSize: 11,
    color: '#333',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  optionButtonTextSelected: {
    color: '#7c3aed',
    fontWeight: '600',
  },
  rateButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  rateButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  rateButtonSelected: {
    backgroundColor: '#f3e8ff',
    borderColor: '#7c3aed',
  },
  rateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  rateButtonTextSelected: {
    color: '#7c3aed',
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#ddd5fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6b21a8',
  },
  infoText: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    lineHeight: 16,
  },
  submitButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
});

export default BecomeTutorScreen;
```

### src/screens/ProfileScreen.js

```javascript
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../config/supabase';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 20 }} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.guestSection}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Sign In Required</Text>
          <Text style={styles.guestText}>
            Sign in to your account to access your profile
          </Text>
          <TouchableOpacity style={styles.signInButton}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>
            {user.email?.[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.profileEmail}>{user.email}</Text>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user.email}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {new Date(user.created_at).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{profile?.role || 'Tutee'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>🔐</Text>
          <Text style={styles.actionLabel}>Change Password</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>📧</Text>
          <Text style={styles.actionLabel}>Notification Settings</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem}>
          <Text style={styles.actionIcon}>❓</Text>
          <Text style={styles.actionLabel}>Help & Support</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About TutorMe</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Platform</Text>
          <Text style={styles.infoValue}>Expo React Native</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  guestSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  guestIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  guestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  guestText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signInButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#7c3aed',
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#7c3aed',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  profileEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  actionArrow: {
    fontSize: 16,
    color: '#999',
  },
  logoutButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  spacer: {
    height: 20,
  },
});

export default ProfileScreen;
```

---

## Configuration Files

### .env.local

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key-here
```

### app.json

```json
{
  "expo": {
    "name": "TutorMe CEA",
    "slug": "tutorme-cea",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#7C3AED"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTabletMode": true,
      "bundleIdentifier": "com.tutorme.cea",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#7C3AED"
      },
      "package": "com.tutorme.cea",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

### package.json

```json
{
  "name": "tutorme-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "eject": "expo eject"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.74.1",
    "expo": "^52.0.0",
    "@react-navigation/native": "^6.1.10",
    "@react-navigation/bottom-tabs": "^6.5.10",
    "@react-navigation/native-stack": "^6.9.16",
    "react-native-screens": "^3.31.0",
    "react-native-safe-area-context": "^4.8.2",
    "react-native-gesture-handler": "^2.14.1",
    "react-native-reanimated": "^3.6.0",
    "@supabase/supabase-js": "^2.38.4",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@babel/core": "^7.24.0"
  }
}
```

### .gitignore

```
# Environment variables
.env
.env.local
.env.*.local

# Dependencies
node_modules/
*.pnp
.pnp.js

# Expo
.expo/
.expo-shared/
dist/

# Build outputs
ios/Pods/
android/.gradle/
android/build/
*.jks

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# Testing
coverage/

# Misc
.cache/
tmp/
```

---

## Database Setup

### Supabase SQL Queries

Run these queries in your Supabase SQL Editor:

```sql
-- Create Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('tutee', 'tutor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create Tutors Table
CREATE TABLE tutors (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  program TEXT,
  badge TEXT,
  subjects TEXT[] DEFAULT '{}',
  rate INTEGER NOT NULL,
  rating DECIMAL(3,1) DEFAULT 5.0,
  reviews INTEGER DEFAULT 0,
  days TEXT[] DEFAULT '{}',
  days_display TEXT,
  email TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified tutors"
  ON tutors FOR SELECT
  USING (verified = true);

CREATE POLICY "Tutors can update own profile"
  ON tutors FOR UPDATE
  USING (auth.uid() = user_id);

-- Create Bookings Table
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  time TEXT NOT NULL,
  duration DECIMAL(2,1) NOT NULL,
  topic TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors can view their bookings"
  ON bookings FOR SELECT
  USING (tutor_id IN (SELECT id FROM tutors WHERE user_id = auth.uid()));

-- Create Crash Courses Table
CREATE TABLE crash_courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  instructor TEXT NOT NULL,
  price INTEGER NOT NULL,
  max_students INTEGER DEFAULT 20,
  registered_students INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE crash_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view crash courses"
  ON crash_courses FOR SELECT
  USING (true);

-- Create Tutor Applications Table
CREATE TABLE tutor_applications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  program TEXT NOT NULL,
  requested_rate INTEGER NOT NULL,
  subjects TEXT[] DEFAULT '{}',
  available_days TEXT,
  initials TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application"
  ON tutor_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create application"
  ON tutor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert Sample Tutors
INSERT INTO tutors (name, initials, program, badge, subjects, rate, rating, reviews, days, days_display, email, verified)
VALUES
  ('Princess Ancheta', 'PA', 'CEA Upperclassman', 'Verified Tutor (Chemistry & Mensuration)', ARRAY['Chemistry', 'Solid Mensuration'], 80, 5.0, 22, ARRAY['MONDAY', 'TUESDAY', 'SATURDAY'], 'Mon, Tue, Sat', 'ancheta.princessmaris@gmail.com', TRUE),
  ('Wahari Maca-ayan', 'WM', 'CEA Senior Peer Tutor', 'Master Tutor (Calculus, Physics, Chem)', ARRAY['Mathematics/Calculus', 'Chemistry', 'Solid Mensuration', 'Engineering/Architecture', 'Physics'], 110, 5.0, 28, ARRAY['FRIDAY', 'SATURDAY', 'SUNDAY'], 'Fri, Sat, Sun', 'waharimacaayan@gmail.com', TRUE),
  ('Arvy Joy Aceron', 'AA', 'CEA Upperclassman', 'Verified Tutor (Physics & Chem)', ARRAY['Chemistry', 'Physics'], 65, 4.9, 14, ARRAY['SATURDAY', 'SUNDAY'], 'Sat, Sun', 'aceron.arvy@gmail.com', TRUE),
  ('Aj Bernasor', 'AB', 'CEA Upperclassman', 'Verified Tutor (Calculus & Arch)', ARRAY['Mathematics/Calculus', 'Engineering/Architecture'], 85, 4.8, 19, ARRAY['TUESDAY', 'SATURDAY', 'SUNDAY'], 'Tue, Sat, Sun', 'bernasor.arnoldjames@gmail.com', TRUE),
  ('Michael Andre Quitoriano', 'MQ', 'CEA Upperclassman', 'Verified Tutor (Mensuration & Arch)', ARRAY['Solid Mensuration', 'Engineering/Architecture'], 105, 4.9, 17, ARRAY['SATURDAY', 'SUNDAY'], 'Sat, Sun', 'quitoriano.michaelandre@gmail.com', TRUE),
  ('Cleoffer Jhon Apa', 'CA', 'CEA Upperclassman', 'Verified Tutor (Engineering)', ARRAY['Engineering/Architecture'], 80, 4.7, 10, ARRAY['SATURDAY', 'SUNDAY'], 'Sat, Sun', 'apa.cleofferjhon.apa@gmail.com', TRUE),
  ('Joseph Jireh', 'JJ', 'CEA Upperclassman', 'Verified Tutor (Calculus Specialist)', ARRAY['Mathematics/Calculus'], 80, 4.8, 15, ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY'], 'Mon, Tue, Wed', 'tagaloguin.joseph2007@gmail.com', TRUE),
  ('Angel Grace Cabig', 'AC', 'CEA Upperclassman', 'Verified Tutor (Arch & Design)', ARRAY['Engineering/Architecture'], 65, 4.9, 9, ARRAY['MONDAY'], 'Monday', 'cabig.angelgrace12@gmail.com', TRUE),
  ('Lance Fabela', 'LF', 'CEA Upperclassman', 'Verified Tutor (Math & Mensuration)', ARRAY['Mathematics/Calculus', 'Solid Mensuration'], 75, 4.8, 13, ARRAY['MONDAY', 'FRIDAY', 'SATURDAY'], 'Mon, Fri, Sat', 'fabela.lance1@gmail.com', TRUE),
  ('Kimberly Rose A. Baja', 'KB', 'CEA Upperclassman', 'Senior Tutor (Architecture Subjects)', ARRAY['Engineering/Architecture'], 120, 5.0, 21, ARRAY['WEDNESDAY'], 'Wednesday', 'baja.kimberlyrose@gmail.com', TRUE),
  ('Nicole Vacalares', 'NV', 'CEA Upperclassman', 'Verified Tutor (Math & Drawing)', ARRAY['Mathematics/Calculus', 'Engineering/Architecture'], 60, 4.9, 11, ARRAY['MONDAY', 'TUESDAY'], 'Mon, Tue', 'vacalares.nicole23@gmail.com', TRUE),
  ('Mekaila Angela Eulogio', 'ME', 'CEA Upperclassman', 'Verified Tutor (Math & Physics)', ARRAY['Mathematics/Calculus', 'Physics'], 70, 4.7, 16, ARRAY['FRIDAY', 'SATURDAY'], 'Fri, Sat', 'eulogio.mekailaangela@gmail.com', TRUE),
  ('Cidric Tion III', 'CT', 'CEA Upperclassman', 'Senior Mentor (Engineering Courses)', ARRAY['Engineering/Architecture'], 115, 4.9, 20, ARRAY['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'], 'Mon - Fri', 'tion.cidriciii@gmail.com', TRUE),
  ('Marjie Mae T. Carillo', 'MC', 'CEA Upperclassman', 'Verified Tutor (Solid Mensuration)', ARRAY['Solid Mensuration'], 75, 4.8, 12, ARRAY['FRIDAY', 'SATURDAY'], 'Fri, Sat', 'carillo.marjiemae@gmail.com', TRUE);

-- Insert Sample Crash Courses
INSERT INTO crash_courses (code, name, instructor, price, description)
VALUES
  ('MATH 101', 'Calculus 1 & 2: Integration & Application Survival', 'Wahari Maca-ayan', 60, 'Targeted problem drills on integration by parts, trigonometric substitutions, and common instructor trap questions.'),
  ('PHYS 102', 'Engineering Physics: Mechanics & Equilibrium', 'Arvy Joy Aceron', 60, 'Step-by-step free-body diagram breakdown, friction formulas, and rotational dynamics problem solving.');
```

---

## Quick Start Instructions

1. **Create Supabase Account**: Go to supabase.com and create a new project
2. **Get Credentials**: Copy your Project URL and Anon Key from Settings > API
3. **Update .env.local**: Add your Supabase credentials
4. **Run SQL Queries**: Copy all database setup queries and run them in Supabase SQL Editor
5. **Install Dependencies**: `npm install`
6. **Start App**: `npx expo start`
7. **Test**: Press `w` for web, scan QR for mobile, or `a`/`i` for emulators

---

## All Done!

This Markdown file contains **all the complete code** for the TutorMe CEA Expo React Native app with Supabase integration. Copy each file section to its corresponding location in your project structure.
