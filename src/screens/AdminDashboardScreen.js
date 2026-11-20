
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const AdminDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('payouts');

  const [applications, setApplications] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [tutors, setTutors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [totalEscrow, setTotalEscrow] = useState(0);
  const [totalAdminCut, setTotalAdminCut] = useState(0);

  // ==========================================
  // WEB AND MOBILE ALERT HELPERS
  // ==========================================

  const showMessage = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const showConfirmation = (
    title,
    message,
    confirmText,
    onConfirm,
    destructive = false
  ) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `${title}\n\n${message}`
      );

      if (confirmed) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: confirmText,
          style: destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ]);
    }
  };

  // ==========================================
  // LOAD ADMIN DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Load pending applications
      const { data: apps, error: appsError } = await supabase
        .from('tutor_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;

      setApplications(apps || []);

      // 2. Load pending payouts
      const { data: payouts, error: payoutsError } = await supabase
        .from('bookings')
        .select('*, tutors(name, email)')
        .in('status', ['confirmed', 'approved', 'completed'])
        .eq('payout_status', 'pending')
        .order('created_at', { ascending: false });

      if (payoutsError) throw payoutsError;

      setPendingPayouts(payouts || []);

      // 3. Calculate financial summaries
      let escrowSum = 0;
      let adminCutSum = 0;

      (payouts || []).forEach((booking) => {
        const amount = Number(booking.total_amount || 0);

        escrowSum += amount;
        adminCutSum += amount * 0.10;
      });

      setTotalEscrow(escrowSum);
      setTotalAdminCut(adminCutSum);

      // 4. Load tutors
      const { data: tutorData, error: tutorError } = await supabase
        .from('tutors')
        .select('*')
        .order('name', { ascending: true });

      if (tutorError) throw tutorError;

      setTutors(tutorData || []);

    } catch (error) {
      console.error('Error loading dashboard:', error);

      showMessage(
        'Dashboard Error',
        error.message || 'Could not load admin data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // ==========================================
  // RELEASE PAYOUT
  // ==========================================

  const handleReleasePayout = (
    bookingId,
    tutorName,
    payoutAmount
  ) => {
    showConfirmation(
      'Release Payout',
      `Have you already sent ₱${payoutAmount.toFixed(2)} to ${tutorName}?`,
      'Yes, Mark as Paid',
      async () => {
        try {
          const { data, error } = await supabase
            .from('bookings')
            .update({
              payout_status: 'released',
              status: 'completed',
            })
            .eq('id', bookingId)
            .select('id')
            .maybeSingle();

          if (error) {
            console.error('PAYOUT UPDATE ERROR:', error);

            showMessage(
              'Payout Update Failed',
              error.message
            );

            return;
          }

          if (!data) {
            showMessage(
              'Payout Not Updated',
              'No booking was updated. Check the booking ID and your admin database permissions.'
            );

            return;
          }

          showMessage(
            'Success',
            `The payout for ${tutorName} has been marked as paid.`
          );

          await loadDashboardData();

        } catch (error) {
          console.error('PAYOUT ERROR:', error);

          showMessage('Error', error.message);
        }
      }
    );
  };

  // ==========================================
  // APPLICATION ACTIONS
  // ==========================================

  const handleApplicationAction = (id, status, name) => {
    const action = status === 'approved' ? 'approve' : 'reject';

    showConfirmation(
      `${status === 'approved' ? 'Approve' : 'Reject'} Application`,
      `Are you sure you want to ${action} ${name}?`,
      status === 'approved' ? 'Approve' : 'Reject',
      async () => {
        try {
          const { data, error } = await supabase
            .from('tutor_applications')
            .update({ status })
            .eq('id', id)
            .select('id')
            .maybeSingle();

          if (error) throw error;

          if (!data) {
            showMessage(
              'Update Failed',
              'No application was updated. Check your permissions.'
            );
            return;
          }

          showMessage(
            'Success',
            `${name}'s application has been ${status}.`
          );

          await loadDashboardData();

        } catch (error) {
          console.error('APPLICATION UPDATE ERROR:', error);

          showMessage(
            'Application Error',
            error.message
          );
        }
      },
      status === 'rejected'
    );
  };

  // ==========================================
  // DEACTIVATE / REACTIVATE TUTORS
  // ==========================================

  const handleToggleTutor = (tutor) => {
    const newStatus = tutor.is_active === false;

    const action = newStatus ? 'reactivate' : 'deactivate';

    showConfirmation(
      newStatus ? 'Reactivate Tutor' : 'Deactivate Tutor',

      newStatus
        ? `Are you sure you want to reactivate ${tutor.name}? Students will be able to see this tutor again.`
        : `Are you sure you want to deactivate ${tutor.name}? This tutor will be hidden from students, but their records and booking history will be preserved.`,

      newStatus ? 'Reactivate' : 'Deactivate',

      async () => {
        try {
          const { data, error } = await supabase
            .from('tutors')
            .update({
              is_active: newStatus,
            })
            .eq('id', tutor.id)
            .select('id, is_active')
            .maybeSingle();

          if (error) {
            console.error('TUTOR UPDATE ERROR:', error);

            showMessage(
              'Tutor Update Failed',
              error.message
            );

            return;
          }

          if (!data) {
            showMessage(
              'Tutor Not Updated',
              'No tutor was updated. Check the tutor ID and your admin database permissions.'
            );

            return;
          }

          showMessage(
            'Success',
            `${tutor.name} has been ${action}d successfully.`
          );

          await loadDashboardData();

        } catch (error) {
          console.error('TUTOR UPDATE ERROR:', error);

          showMessage(
            'Tutor Error',
            error.message
          );
        }
      },
      !newStatus
    );
  };

  // ==========================================
  // PAYOUT CARD
  // ==========================================

  const renderPayoutCard = ({ item }) => {
    const totalAmount = Number(item.total_amount || 0);
    const adminCut = totalAmount * 0.10;
    const tutorPayout = totalAmount * 0.90;

    const tutorName = item.tutors?.name || 'Unknown Tutor';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <Ionicons
              name="wallet-outline"
              size={14}
              color="#7c3aed"
            />

            <Text style={styles.badgeText}>
              Held in Escrow
            </Text>
          </View>

          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>

        <Text style={styles.escrowTutorName}>
          Tutor: {tutorName}
        </Text>

        <Text style={styles.escrowTopicText}>
          Session: {item.topic}
        </Text>

        <Text style={styles.paymentMethodText}>
          Paid via: {item.payment_method || 'Not specified'}
        </Text>

        <View style={styles.financialBox}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>
              Total Paid by Student:
            </Text>

            <Text style={styles.finValue}>
              ₱{totalAmount.toFixed(2)}
            </Text>
          </View>

          <View style={styles.finRow}>
            <Text style={styles.finLabelAdmin}>
              Admin Platform Cut (10%):
            </Text>

            <Text style={styles.finValueAdmin}>
              ₱{adminCut.toFixed(2)}
            </Text>
          </View>

          <View style={styles.finRowOwed}>
            <Text style={styles.finLabelOwed}>
              Owed to Tutor (90%):
            </Text>

            <Text style={styles.finValueOwed}>
              ₱{tutorPayout.toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.releaseButton}
          onPress={() =>
            handleReleasePayout(
              item.id,
              tutorName,
              tutorPayout
            )
          }
        >
          <Ionicons
            name="checkmark-done-circle"
            size={18}
            color="#fff"
          />

          <Text style={styles.releaseButtonText}>
            Mark Payout as Released
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================
  // APPLICATION CARD
  // ==========================================

  const renderAppCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.initials || 'TU'}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {item.full_name}
          </Text>

          <Text style={styles.program}>
            {item.program}
          </Text>
        </View>

        <View style={styles.rateBadge}>
          <Text style={styles.rateText}>
            ₱{item.requested_rate}/hr
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.label}>
        Subjects to Teach:
      </Text>

      <View style={styles.badgesContainer}>
        {(item.subjects || []).map((subject, index) => (
          <View key={index} style={styles.subjectBadge}>
            <Text style={styles.subjectBadgeText}>
              {subject}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.detailRow}>
        <Text style={styles.labelDark}>
          Available Days:
        </Text>

        <Text style={styles.value}>
          {item.available_days || 'Flexible'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() =>
            handleApplicationAction(
              item.id,
              'rejected',
              item.full_name
            )
          }
        >
          <Text style={styles.rejectButtonText}>
            ✕ Reject
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() =>
            handleApplicationAction(
              item.id,
              'approved',
              item.full_name
            )
          }
        >
          <Text style={styles.approveButtonText}>
            ✓ Approve Tutor
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ==========================================
  // TUTOR MANAGEMENT CARD
  // ==========================================

  const renderTutorCard = ({ item }) => {
    const isActive = item.is_active !== false;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.initials || 'TU'}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.name}>
              {item.name}
            </Text>

            <Text style={styles.program}>
              {item.program}
            </Text>

            <Text style={styles.program}>
              ₱{item.rate}/hr
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              isActive
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isActive
                  ? styles.activeStatusText
                  : styles.inactiveStatusText,
              ]}
            >
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.label}>
          Subjects
        </Text>

        <Text style={styles.tutorSubjects}>
          {(item.subjects || []).join(' • ') ||
            'No subjects listed'}
        </Text>

        <View style={styles.detailRow}>
          <Text style={styles.labelDark}>
            Rating:
          </Text>

          <Text style={styles.value}>
            {item.rating || 'N/A'} ({item.reviews || 0} reviews)
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.toggleTutorButton,
            isActive
              ? styles.deactivateButton
              : styles.reactivateButton,
          ]}
          onPress={() => handleToggleTutor(item)}
        >
          <Ionicons
            name={
              isActive
                ? 'eye-off-outline'
                : 'eye-outline'
            }
            size={18}
            color={isActive ? '#dc2626' : '#fff'}
          />

          <Text
            style={[
              styles.toggleTutorButtonText,
              isActive
                ? styles.deactivateText
                : styles.reactivateText,
            ]}
          >
            {isActive
              ? 'Deactivate Tutor'
              : 'Reactivate Tutor'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#7c3aed"
        />

        <Text style={styles.loadingText}>
          Loading admin dashboard...
        </Text>
      </View>
    );
  }

  // ==========================================
  // DASHBOARD DATA
  // ==========================================

  const activeTutorsCount = tutors.filter(
    (tutor) => tutor.is_active !== false
  ).length;

  const inactiveTutorsCount =
    tutors.length - activeTutorsCount;

  const currentData =
    activeTab === 'payouts'
      ? pendingPayouts
      : activeTab === 'applications'
      ? applications
      : tutors;

  const currentRenderer =
    activeTab === 'payouts'
      ? renderPayoutCard
      : activeTab === 'applications'
      ? renderAppCard
      : renderTutorCard;

  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  return (
    <View style={styles.container}>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'payouts' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('payouts')}
        >
          <Ionicons
            name="wallet-outline"
            size={17}
            color={
              activeTab === 'payouts' ? '#fff' : '#64748b'
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === 'payouts' && styles.tabTextActive,
            ]}
          >
            Payouts ({pendingPayouts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'applications' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('applications')}
        >
          <Ionicons
            name="document-text-outline"
            size={17}
            color={
              activeTab === 'applications' ? '#fff' : '#64748b'
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === 'applications' && styles.tabTextActive,
            ]}
          >
            Applications ({applications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'tutors' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('tutors')}
        >
          <Ionicons
            name="people-outline"
            size={17}
            color={
              activeTab === 'tutors' ? '#fff' : '#64748b'
            }
          />

          <Text
            style={[
              styles.tabText,
              activeTab === 'tutors' && styles.tabTextActive,
            ]}
          >
            Tutors ({tutors.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* PAYOUT SUMMARY */}

      {activeTab === 'payouts' && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>
              Total in Escrow
            </Text>

            <Text style={styles.summaryValueEscrow}>
              ₱{totalEscrow.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>
              Admin Revenue (10%)
            </Text>

            <Text style={styles.summaryValueAdmin}>
              ₱{totalAdminCut.toFixed(2)}
            </Text>
          </View>
        </View>
      )}

      {/* TUTOR SUMMARY */}

      {activeTab === 'tutors' && (
        <View style={styles.tutorSummaryContainer}>
          <View style={styles.tutorSummaryBox}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#059669"
            />

            <Text style={styles.tutorSummaryNumber}>
              {activeTutorsCount}
            </Text>

            <Text style={styles.tutorSummaryLabel}>
              Active Tutors
            </Text>
          </View>

          <View style={styles.tutorSummaryBox}>
            <Ionicons
              name="eye-off"
              size={22}
              color="#dc2626"
            />

            <Text style={styles.tutorSummaryNumber}>
              {inactiveTutorsCount}
            </Text>

            <Text style={styles.tutorSummaryLabel}>
              Inactive Tutors
            </Text>
          </View>
        </View>
      )}

      {/* CONTENT LIST */}

      <FlatList
        key={activeTab}
        data={currentData}
        renderItem={currentRenderer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#7c3aed']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name={
                activeTab === 'payouts'
                  ? 'wallet-outline'
                  : activeTab === 'applications'
                  ? 'checkmark-circle-outline'
                  : 'people-outline'
              }
              size={48}
              color="#cbd5e1"
            />

            <Text style={styles.emptyTitle}>
              {activeTab === 'payouts'
                ? 'No Pending Payouts'
                : activeTab === 'applications'
                ? 'All Caught Up!'
                : 'No Tutors Found'}
            </Text>

            <Text style={styles.emptySubtext}>
              {activeTab === 'payouts'
                ? 'All eligible sessions have been paid out to tutors.'
                : activeTab === 'applications'
                ? 'There are no pending tutor applications to review right now.'
                : 'There are currently no tutor records in the database.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 13,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },

  tabButton: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActive: {
    backgroundColor: '#7c3aed',
  },

  tabText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textAlign: 'center',
  },

  tabTextActive: {
    color: '#fff',
  },

  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },

  summaryBox: {
    flex: 1,
    backgroundColor: '#faf5ff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },

  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  summaryValueEscrow: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },

  summaryValueAdmin: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },

  tutorSummaryContainer: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },

  tutorSummaryBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
  },

  tutorSummaryNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 4,
  },

  tutorSummaryLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 2,
  },

  list: {
    padding: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },

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

  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#7c3aed',
  },

  headerInfo: {
    flex: 1,
  },

  name: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
  },

  program: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
    fontWeight: '500',
  },

  rateBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  rateText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#7c3aed',
  },

  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },

  label: {
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  labelDark: {
    fontSize: 11,
    color: '#555',
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },

  subjectBadge: {
    backgroundColor: '#f5f3ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd6fe',
    marginRight: 5,
    marginBottom: 5,
  },

  subjectBadgeText: {
    fontSize: 11,
    color: '#6d28d9',
    fontWeight: '600',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },

  value: {
    fontSize: 12,
    color: '#111',
    fontWeight: '700',
  },

  actions: {
    flexDirection: 'row',
    gap: 10,
  },

  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rejectButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  approveButton: {
    backgroundColor: '#10b981',
  },

  rejectButtonText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#ef4444',
  },

  approveButtonText: {
    fontWeight: '700',
    fontSize: 13,
    color: '#fff',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c3aed',
    textTransform: 'uppercase',
  },

  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },

  escrowTutorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },

  escrowTopicText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 4,
  },

  paymentMethodText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },

  financialBox: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },

  finRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },

  finRowOwed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    marginTop: 4,
  },

  finLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },

  finValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },

  finLabelAdmin: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },

  finValueAdmin: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '800',
  },

  finLabelOwed: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '800',
  },

  finValueOwed: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '900',
  },

  releaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },

  releaseButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  tutorSubjects: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 12,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  activeBadge: {
    backgroundColor: '#dcfce7',
  },

  inactiveBadge: {
    backgroundColor: '#fee2e2',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '900',
  },

  activeStatusText: {
    color: '#15803d',
  },

  inactiveStatusText: {
    color: '#dc2626',
  },

  toggleTutorButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 7,
  },

  deactivateButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },

  reactivateButton: {
    backgroundColor: '#10b981',
  },

  toggleTutorButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },

  deactivateText: {
    color: '#dc2626',
  },

  reactivateText: {
    color: '#fff',
  },

  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
    marginTop: 12,
  },

  emptySubtext: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AdminDashboardScreen;
