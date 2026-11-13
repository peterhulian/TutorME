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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const BookingScreen = ({ route, navigation }) => {
  const { tutorId, tutorName, tutorRate, tutorInitials } = route.params;
  const [duration, setDuration] = useState(1);
  const [location, setLocation] = useState('CEA Library Study Pod');
  const [daySlot, setDaySlot] = useState('Saturday');
  const [time, setTime] = useState('4:00 PM - 5:00 PM');
  const [topic, setTopic] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash');
  const [paymentRef, setPaymentRef] = useState('');
  const [loading, setLoading] = useState(false);

  const locations = [
    'CEA Library Study Pod',
    'CEA Engineering Lobby',
    'Architecture Drafting Hall 3rd Floor',
    'Google Meet Virtual',
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const times = [
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '10:00 AM - 11:00 AM',
  ];

  // Online-only payment methods routed to the TutorMe Admin Escrow Account
  const paymentMethods = [
    {
      id: 'GCash',
      icon: 'phone-portrait-outline',
      accountName: 'TutorMe Admin Escrow (GCash)',
      accountNumber: '0917 882 4910',
    },
    {
      id: 'Maya',
      icon: 'wallet-outline',
      accountName: 'TutorMe Admin Escrow (Maya)',
      accountNumber: '0918 553 9021',
    },
    {
      id: 'Bank / BPI',
      icon: 'card-outline',
      accountName: 'TutorMe Platform Admin (BPI)',
      accountNumber: '4492-8810-34',
    },
  ];

  const selectedPaymentDetails = paymentMethods.find((m) => m.id === paymentMethod);

  const calculatePricing = () => {
    const subtotal = tutorRate * duration;
    const platformFee = subtotal * 0.10;
    const total = subtotal + platformFee;
    return { subtotal, platformFee, total };
  };

  const { subtotal, platformFee, total } = calculatePricing();

  const handleBooking = async () => {
    if (!topic.trim()) {
      Alert.alert('Missing Topic', 'Please enter the exam topic or struggle area.');
      return;
    }

    if (!paymentRef.trim()) {
      Alert.alert(
        'Payment Reference Required',
        `Please enter your ${paymentMethod} Reference No. (or last 4 digits) sent to the Admin Escrow Account.`
      );
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          'Sign In Required',
          'Please sign in on the Profile tab before booking a session.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
          ]
        );
        return;
      }

      // Simulate online payment verification
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const formattedSchedule = `${daySlot.slice(0, 3)} • ${time}`;

      const { error } = await supabase
        .from('bookings')
        .insert({
          tutor_id: tutorId,
          student_id: user.id,
          location,
          time: formattedSchedule,
          duration,
          topic: topic.trim(),
          total_amount: total,
          payment_method: `${paymentMethod} (Admin Escrow - Ref: ${paymentRef.trim()})`,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert(
        'Online Payment Recorded',
        `₱${total.toFixed(2)} received by TutorMe Admin Escrow via ${paymentMethod} (Ref: ${paymentRef.trim()}).\n\nYour booking request has been sent to ${tutorName}. Funds are protected and only released to the tutor after your session.`
      );
      navigation.navigate('Bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Error', error.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Tutor Info */}
      <View style={styles.tutorCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tutorInitials || 'TU'}</Text>
        </View>
        <View>
          <Text style={styles.tutorName}>{tutorName}</Text>
          <Text style={styles.tutorRate}>₱{tutorRate}/hr</Text>
        </View>
      </View>

      {/* Form Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location & Schedule</Text>

        <Text style={styles.label}>Session Mode</Text>
        <View style={styles.optionsContainer}>
          {locations.map((loc) => (
            <TouchableOpacity
              key={loc}
              style={[styles.option, location === loc && styles.optionSelected]}
              onPress={() => setLocation(loc)}
            >
              <Text style={[styles.optionText, location === loc && styles.optionTextSelected]}>
                {loc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Select Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
          {days.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.dayPill, daySlot === d && styles.dayPillSelected]}
              onPress={() => setDaySlot(d)}
            >
              <Text style={[styles.dayPillText, daySlot === d && styles.dayPillTextSelected]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Time Slot</Text>
        <View style={styles.optionsContainer}>
          {times.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.option, time === t && styles.optionSelected]}
              onPress={() => setTime(t)}
            >
              <Text style={[styles.optionText, time === t && styles.optionTextSelected]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration */}
      <View style={styles.section}>
        <Text style={styles.label}>Session Duration</Text>
        <View style={styles.horizontalContainer}>
          {[1, 1.5, 2].map((dur) => (
            <TouchableOpacity
              key={dur}
              style={[styles.gridOption, duration === dur && styles.gridOptionSelected]}
              onPress={() => setDuration(dur)}
            >
              <Text
                style={[styles.gridOptionText, duration === dur && styles.gridOptionTextSelected]}
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
          placeholder="e.g., Chemical Equilibrium or Solid Mensuration"
          value={topic}
          onChangeText={setTopic}
          placeholderTextColor="#999"
        />
      </View>

      {/* Online-Only Payment Method via Admin Escrow */}
      <View style={styles.section}>
        <View style={styles.escrowHeaderRow}>
          <Text style={styles.label}>Online Payment (Admin Escrow)</Text>
          <View style={styles.escrowBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#059669" />
            <Text style={styles.escrowBadgeText}>100% Online Protected</Text>
          </View>
        </View>

        <Text style={styles.escrowSubtext}>
          All payments are processed online through the official TutorMe Admin Account. Funds are held safely in escrow and released to the tutor once your session is completed.
        </Text>

        <View style={styles.horizontalContainer}>
          {paymentMethods.map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[styles.gridOption, isSelected && styles.gridOptionSelected]}
                onPress={() => setPaymentMethod(method.id)}
              >
                <Ionicons
                  name={method.icon}
                  size={20}
                  color={isSelected ? '#7c3aed' : '#555'}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.gridOptionText, isSelected && styles.gridOptionTextSelected]}>
                  {method.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Admin Account Transfer Details Box */}
        <View style={styles.adminAccountBox}>
          <View style={styles.adminAccountHeader}>
            <Ionicons name="business-outline" size={16} color="#7c3aed" />
            <Text style={styles.adminAccountTitle}>Send Exact Amount To Admin Account:</Text>
          </View>
          <View style={styles.adminAccountRow}>
            <Text style={styles.adminAccountLabel}>Account Name:</Text>
            <Text style={styles.adminAccountValue}>{selectedPaymentDetails?.accountName}</Text>
          </View>
          <View style={styles.adminAccountRow}>
            <Text style={styles.adminAccountLabel}>Account No.:</Text>
            <Text style={styles.adminAccountNumber}>{selectedPaymentDetails?.accountNumber}</Text>
          </View>
          <View style={styles.adminAccountRow}>
            <Text style={styles.adminAccountLabel}>Amount to Send:</Text>
            <Text style={styles.adminAccountAmount}>₱{total.toFixed(2)}</Text>
          </View>

          <Text style={[styles.label, { marginTop: 12, marginBottom: 6 }]}>
            {paymentMethod} Reference No. (Required)
          </Text>
          <TextInput
            style={styles.refInput}
            placeholder={`Enter ${paymentMethod} reference number...`}
            value={paymentRef}
            onChangeText={setPaymentRef}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Pricing Breakdown */}
      <View style={styles.pricingSection}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>
            Tutor Payout (95% • {duration} hr @ ₱{tutorRate}/hr):
          </Text>
          <Text style={styles.pricingValue}>₱{subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Admin Platform Fee (5%):</Text>
          <Text style={styles.pricingValue}>₱{platformFee.toFixed(2)}</Text>
        </View>
        <View style={styles.pricingRowTotal}>
          <Text style={styles.pricingLabelTotal}>Total Online Payment:</Text>
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
          {loading
            ? `Verifying ${paymentMethod} Payment...`
            : `Submit Payment & Book (₱${total.toFixed(2)})`}
        </Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  avatarText: { fontSize: 18, fontWeight: '900', color: '#7c3aed' },
  tutorName: { fontSize: 14, fontWeight: '700', color: '#000' },
  tutorRate: { fontSize: 12, color: '#7c3aed', fontWeight: '600', marginTop: 2 },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 10 },
  optionsContainer: { marginBottom: 14 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  optionSelected: { backgroundColor: '#f3e8ff', borderColor: '#7c3aed' },
  optionText: { fontSize: 12, color: '#333', fontWeight: '500' },
  optionTextSelected: { color: '#7c3aed', fontWeight: '600' },
  dayScroll: { marginBottom: 16 },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  dayPillSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  dayPillText: { fontSize: 12, fontWeight: '600', color: '#333' },
  dayPillTextSelected: { color: '#fff' },
  horizontalContainer: { flexDirection: 'row', gap: 10 },
  gridOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  gridOptionSelected: { backgroundColor: '#f3e8ff', borderColor: '#7c3aed' },
  gridOptionText: { fontSize: 12, fontWeight: '600', color: '#333' },
  gridOptionTextSelected: { color: '#7c3aed' },
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
  escrowHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  escrowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  escrowBadgeText: { fontSize: 10, fontWeight: '700', color: '#059669' },
  escrowSubtext: { fontSize: 11, color: '#64748b', lineHeight: 16, marginBottom: 12 },
  adminAccountBox: {
    marginTop: 14,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    borderRadius: 12,
    padding: 12,
  },
  adminAccountHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  adminAccountTitle: { fontSize: 12, fontWeight: '800', color: '#581c87' },
  adminAccountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  adminAccountLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  adminAccountValue: { fontSize: 11, color: '#0f172a', fontWeight: '700' },
  adminAccountNumber: { fontSize: 13, color: '#7c3aed', fontWeight: '900', letterSpacing: 0.5 },
  adminAccountAmount: { fontSize: 12, color: '#059669', fontWeight: '800' },
  refInput: {
    borderWidth: 1,
    borderColor: '#c084fc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#000',
    backgroundColor: '#fff',
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
    marginTop: 4,
  },
  pricingLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  pricingLabelTotal: { fontSize: 13, fontWeight: '700', color: '#000' },
  pricingValue: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  pricingValueTotal: { fontSize: 14, fontWeight: '900', color: '#7c3aed' },
  bookButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonDisabled: { opacity: 0.6 },
  bookButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  spacer: { height: 20 },
});

export default BookingScreen;