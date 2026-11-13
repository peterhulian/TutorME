import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const BookingsScreen = ({ navigation }) => {
  const [studentBookings, setStudentBookings] = useState([]);
  const [tutorBookings, setTutorBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('student');
  const [isTutor, setIsTutor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);

  // Reschedule Modal State
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newDay, setNewDay] = useState('Saturday');
  const [newTime, setNewTime] = useState('4:00 PM - 5:00 PM');
  const [newLocation, setNewLocation] = useState('CEA Library Study Pod');
  const [savingReschedule, setSavingReschedule] = useState(false);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = [
    '4:00 PM - 5:00 PM',
    '5:00 PM - 6:00 PM',
    '6:00 PM - 7:00 PM',
    '10:00 AM - 11:00 AM',
  ];
  const locations = [
    'CEA Library Study Pod',
    'CEA Engineering Lobby',
    'Architecture Drafting Hall 3rd Floor',
    'Google Meet Virtual',
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadBookings();
    });
    loadBookings();
    return unsubscribe;
  }, [navigation]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setStudentBookings([]);
        setTutorBookings([]);
        setIsTutor(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', currentUser.id)
        .maybeSingle();

      let tutorRecord = null;
      const { data: tutorByUser } = await supabase
        .from('tutors')
        .select('id, name')
        .eq('user_id', currentUser.id)
        .maybeSingle();

      if (tutorByUser) {
        tutorRecord = tutorByUser;
      } else if (profileData?.full_name) {
        const { data: tutorByName } = await supabase
          .from('tutors')
          .select('id, name')
          .ilike('name', profileData.full_name)
          .maybeSingle();
        tutorRecord = tutorByName;
      }

      const userIsTutor = Boolean(tutorRecord || profileData?.role === 'tutor');
      setIsTutor(userIsTutor);

      const { data: sBookings, error: sError } = await supabase
        .from('bookings')
        .select('*, tutors(name, initials, program, rate)')
        .eq('student_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (sError) throw sError;
      setStudentBookings(sBookings || []);

      if (tutorRecord) {
        const { data: tBookings, error: tError } = await supabase
          .from('bookings')
          .select('*')
          .eq('tutor_id', tutorRecord.id)
          .order('created_at', { ascending: false });

        if (tError) throw tError;

        const studentIds = [...new Set((tBookings || []).map((b) => b.student_id).filter(Boolean))];
        let studentMap = {};

        if (studentIds.length > 0) {
          const { data: studentsData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', studentIds);

          (studentsData || []).forEach((st) => {
            studentMap[st.id] = st.full_name;
          });
        }

        const enrichedTutorBookings = (tBookings || []).map((b) => ({
          ...b,
          student_name: studentMap[b.student_id] || 'Student',
        }));

        setTutorBookings(enrichedTutorBookings);

        if (enrichedTutorBookings.length > 0 && (sBookings || []).length === 0) {
          setActiveTab('tutor');
        }
      } else {
        setTutorBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBookings();
  };

  const handleUpdateStatus = (bookingId, newStatus, actionLabel) => {
    const isStudentCancel = newStatus === 'cancelled';
    const message = isStudentCancel
      ? 'Are you sure you want to cancel this booking? Your online payment held by the Admin Escrow account will be eligible for refund or rescheduling credit.'
      : `Are you sure you want to ${actionLabel.toLowerCase()} this tutoring session?`;

    Alert.alert(
      `${actionLabel} Session`,
      message,
      [
        { text: 'No', style: 'cancel' },
        {
          text: `Yes, ${actionLabel}`,
          style: newStatus === 'cancelled' || newStatus === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ status: newStatus })
                .eq('id', bookingId);

              if (error) throw error;

              Alert.alert(
                'Booking Updated',
                isStudentCancel
                  ? 'Your session has been cancelled. Admin Escrow has been notified.'
                  : `Session status updated to ${newStatus}.`
              );
              loadBookings();
            } catch (error) {
              Alert.alert('Error', `Could not update booking: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  const openRescheduleModal = (booking) => {
    setSelectedBooking(booking);
    setNewLocation(booking.location || 'CEA Library Study Pod');
    setRescheduleModalVisible(true);
  };

  const handleConfirmReschedule = async () => {
    if (!selectedBooking) return;

    try {
      setSavingReschedule(true);
      const updatedSchedule = `${newDay.slice(0, 3)} • ${newTime}`;

      const { error } = await supabase
        .from('bookings')
        .update({
          time: updatedSchedule,
          location: newLocation,
          status: 'pending', 
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      setRescheduleModalVisible(false);
      setSelectedBooking(null);
      Alert.alert(
        'Session Rescheduled',
        `Your booking has been moved to ${updatedSchedule} at ${newLocation}. The tutor has been notified to confirm the new slot.`
      );
      loadBookings();
    } catch (error) {
      Alert.alert('Error', `Failed to reschedule: ${error.message}`);
    } finally {
      setSavingReschedule(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'approved':
        return { bg: '#ecfdf5', text: '#059669', label: 'Confirmed', icon: 'checkmark-circle' };
      case 'cancelled':
      case 'rejected':
        return { bg: '#fef2f2', text: '#dc2626', label: 'Cancelled', icon: 'close-circle' };
      default:
        return { bg: '#fffbeb', text: '#d97706', label: 'Pending', icon: 'time' };
    }
  };

  const getInitials = (name) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const renderBookingCard = ({ item }) => {
    const statusInfo = getStatusStyle(item.status);
    const isIncomingView = isTutor && activeTab === 'tutor';
    const currentStatus = (item.status || 'pending').toLowerCase();
    const isActiveBooking = currentStatus === 'pending' || currentStatus === 'confirmed' || currentStatus === 'approved';

    const displayName = isIncomingView
      ? item.student_name || 'Student'
      : item.tutors?.name || 'Verified Peer Tutor';

    const displayInitials = isIncomingView
      ? getInitials(displayName)
      : item.tutors?.initials || 'TU';

    const roleSubtitle = isIncomingView ? 'Student Tutee' : 'Peer Tutor';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tutorInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayInitials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roleLabel}>{roleSubtitle}</Text>
              <Text style={styles.tutorName}>{displayName}</Text>
              <Text style={styles.topicText}>Topic: {item.topic}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Ionicons name={statusInfo.icon} size={13} color={statusInfo.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: statusInfo.text }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="location-outline" size={14} color="#777" />
              <Text style={styles.detailLabel}>Location</Text>
            </View>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>

          <View style={styles.detailItem}>
            <View style={styles.detailLabelRow}>
              <Ionicons name="time-outline" size={14} color="#777" />
              <Text style={styles.detailLabel}>Schedule</Text>
            </View>
            <Text style={styles.detailValue}>
              {item.time} ({item.duration} hr{item.duration > 1 ? 's' : ''})
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.paymentLabel} numberOfLines={1}>
              {item.payment_method?.includes('Escrow')
                ? item.payment_method
                : `Online (${item.payment_method || 'GCash'}) • Admin Escrow`}
            </Text>
            <Text style={styles.totalAmount}>
              ₱{Number(item.total_amount || 0).toFixed(2)}
            </Text>
          </View>

          {/* Tutor Actions for Incoming Requests */}
          {isIncomingView && currentStatus === 'pending' && (
            <View style={styles.tutorActionButtons}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => handleUpdateStatus(item.id, 'rejected', 'Decline')}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => handleUpdateStatus(item.id, 'confirmed', 'Accept')}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Student Actions: Reschedule & Cancel work for BOTH Pending and Confirmed bookings */}
          {!isIncomingView && isActiveBooking && (
            <View style={styles.studentActionButtons}>
              <TouchableOpacity
                style={styles.rescheduleButton}
                onPress={() => openRescheduleModal(item)}
              >
                <Ionicons name="calendar-outline" size={13} color="#7c3aed" />
                <Text style={styles.rescheduleButtonText}>Reschedule</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleUpdateStatus(item.id, 'cancelled', 'Cancel')}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* NEW: Open Session Chat Button (Only shows when confirmed or approved) */}
        {(currentStatus === 'confirmed' || currentStatus === 'approved') && (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() =>
              navigation.navigate('Chat', {
                bookingId: item.id,
                peerName: isIncomingView ? item.student_name : item.tutors?.name,
                topic: item.topic,
              })
            }
          >
            <Ionicons name="chatbubbles-outline" size={15} color="#fff" />
            <Text style={styles.chatButtonText}>Open Session Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.iconCircle}>
          <Ionicons name="lock-closed-outline" size={32} color="#7c3aed" />
        </View>
        <Text style={styles.emptyTitle}>Sign In Required</Text>
        <Text style={styles.emptySubtext}>
          Please sign in on the Profile tab to view and manage your tutoring sessions.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.ctaButtonText}>Go to Profile</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayedBookings = isTutor && activeTab === 'tutor' ? tutorBookings : studentBookings;

  return (
    <View style={styles.container}>
      {isTutor && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tutor' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tutor')}
          >
            <Text style={[styles.tabText, activeTab === 'tutor' && styles.tabTextActive]}>
              Incoming Requests ({tutorBookings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'student' && styles.tabButtonActive]}
            onPress={() => setActiveTab('student')}
          >
            <Text style={[styles.tabText, activeTab === 'student' && styles.tabTextActive]}>
              My Study Bookings ({studentBookings.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={displayedBookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.iconCircle}>
              <Ionicons name="calendar-outline" size={32} color="#7c3aed" />
            </View>
            <Text style={styles.emptyTitle}>
              {isTutor && activeTab === 'tutor'
                ? 'No Incoming Requests'
                : 'No Bookings Yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {isTutor && activeTab === 'tutor'
                ? 'When students book a tutoring session with you, their requests will appear here for you to accept or decline.'
                : 'You have not scheduled any study sessions yet. Browse verified tutors to get started.'}
            </Text>
            {(!isTutor || activeTab === 'student') && (
              <TouchableOpacity
                style={styles.ctaButton}
                onPress={() => navigation.navigate('Tutors')}
              >
                <Text style={styles.ctaButtonText}>Browse Tutors</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Reschedule Session Modal */}
      <Modal visible={rescheduleModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Session</Text>
              <TouchableOpacity onPress={() => setRescheduleModalVisible(false)}>
                <Ionicons name="close" size={22} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Select a new day, time slot, or meeting venue for your session. Your online payment in Admin Escrow remains protected.
            </Text>

            <Text style={styles.modalLabel}>Select New Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {days.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayPill, newDay === d && styles.dayPillSelected]}
                  onPress={() => setNewDay(d)}
                >
                  <Text style={[styles.dayPillText, newDay === d && styles.dayPillTextSelected]}>
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.modalLabel}>Select New Time Slot</Text>
            {times.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.modalOption, newTime === t && styles.modalOptionSelected]}
                onPress={() => setNewTime(t)}
              >
                <Text style={[styles.modalOptionText, newTime === t && styles.modalOptionTextSelected]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>Meeting Venue</Text>
            {locations.map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.modalOption, newLocation === loc && styles.modalOptionSelected]}
                onPress={() => setNewLocation(loc)}
              >
                <Text
                  style={[styles.modalOptionText, newLocation === loc && styles.modalOptionTextSelected]}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.confirmRescheduleBtn}
              onPress={handleConfirmReschedule}
              disabled={savingReschedule}
            >
              <Text style={styles.confirmRescheduleText}>
                {savingReschedule ? 'Saving New Schedule...' : 'Confirm Reschedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  tabButtonActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#555' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tutorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd5fe',
  },
  avatarText: { fontSize: 15, fontWeight: '900', color: '#7c3aed' },
  roleLabel: { fontSize: 10, fontWeight: '700', color: '#7c3aed', textTransform: 'uppercase' },
  tutorName: { fontSize: 15, fontWeight: '800', color: '#111' },
  topicText: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: { fontSize: 11, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  detailsGrid: { gap: 8, marginBottom: 12 },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabel: { fontSize: 12, color: '#777', fontWeight: '600' },
  detailValue: { fontSize: 12, color: '#111', fontWeight: '700' },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentLabel: { fontSize: 10, color: '#64748b', fontWeight: '600' },
  totalAmount: { fontSize: 16, fontWeight: '900', color: '#7c3aed', marginTop: 2 },
  tutorActionButtons: { flexDirection: 'row', gap: 8 },
  declineButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  declineButtonText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  acceptButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  acceptButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  studentActionButtons: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rescheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8b4fe',
    gap: 4,
  },
  rescheduleButtonText: { color: '#7c3aed', fontSize: 11, fontWeight: '700' },
  cancelButton: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelButtonText: { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  
  // NEW STYLES FOR THE CHAT BUTTON
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  chatButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 6 },
  emptySubtext: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  ctaButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* Reschedule Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 18,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalSubtext: { fontSize: 11, color: '#64748b', lineHeight: 16, marginBottom: 14 },
  modalLabel: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginRight: 6,
  },
  dayPillSelected: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  dayPillText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  dayPillTextSelected: { color: '#fff' },
  modalOption: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 6,
  },
  modalOptionSelected: { backgroundColor: '#f3e8ff', borderColor: '#7c3aed' },
  modalOptionText: { fontSize: 12, color: '#334155', fontWeight: '500' },
  modalOptionTextSelected: { color: '#7c3aed', fontWeight: '700' },
  confirmRescheduleBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  confirmRescheduleText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default BookingsScreen;