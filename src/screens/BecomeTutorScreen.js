import React, { useState } from 'react';
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

      if (!user) {
        Alert.alert(
          'Sign In Required',
          'Please sign in on the Profile tab before submitting a tutor application.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
          ]
        );
        return;
      }

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
          full_name: fullName.trim(),
          program,
          requested_rate: parseInt(rate, 10),
          subjects: subjectsList,
          available_days: availableDays.trim(),
          initials,
          status: 'pending',
          user_id: user.id,
        });

      if (error) throw error;

      Alert.alert(
        'Application Submitted',
        "Welcome! Your application is under review. We'll verify your transcript soon."
      );
      navigation.goBack();
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', error.message || 'Failed to submit application');
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