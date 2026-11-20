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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const TutorsScreen = ({ route, navigation }) => {
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
    const unsubscribe = navigation.addListener('focus', () => {
      loadTutors();
    });
    loadTutors();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route.params?.initialSubject) {
      setSelectedSubject(route.params.initialSubject);
    }
  }, [route.params?.initialSubject]);

  useEffect(() => {
    applyFilters();
  }, [tutors, searchQuery, selectedSubject, selectedRate]);

  const loadTutors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
      .from('tutors')
      .select('*')
      .eq('is_active', true)
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

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (tutor) =>
          tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (tutor.subjects || []).some((s) =>
            s.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    if (selectedSubject !== 'All') {
      filtered = filtered.filter((tutor) =>
        (tutor.subjects || []).includes(selectedSubject)
      );
    }

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
    <View style={styles.tutorCard}>
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
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={styles.ratingText}>{tutor.rating}</Text>
          </View>
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
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.detailLabel}>Rate</Text>
          <Text style={styles.detailValue}>₱{tutor.rate}/hr</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('TutorDetail', { tutorId: tutor.id })}
      >
        <Text style={styles.bookButtonText}>View Profile & Book</Text>
      </TouchableOpacity>
    </View>
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
          <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
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
            <Ionicons name="search-outline" size={36} color="#ccc" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyStateText}>No tutors found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or subject filters
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
    fontSize: 14,
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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