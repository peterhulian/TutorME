import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#f59e0b" />
            <Text style={styles.ratingValue}>{tutor.rating}</Text>
          </View>
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
              10% platform service fee applies. Payments are protected.
            </Text>
          </View>
        </View>
      </View>

      {/* Booking Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session Modes</Text>
        <View style={styles.optionCard}>
          <View style={styles.optionIconBox}>
            <Ionicons name="location-outline" size={20} color="#7c3aed" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>In-Person on Campus</Text>
            <Text style={styles.optionDesc}>
              CEA Library Pods, Engineering Lobby, or Architecture Drafting Hall
            </Text>
          </View>
        </View>
        <View style={styles.optionCard}>
          <View style={styles.optionIconBox}>
            <Ionicons name="videocam-outline" size={20} color="#7c3aed" />
          </View>
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
        <Text style={styles.bookButtonText}>
          Book a Session with {tutor.name.split(' ')[0]}
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    alignItems: 'center',
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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