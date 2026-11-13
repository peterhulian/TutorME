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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const AdminDashboardScreen = () => {
  const [activeTab, setActiveTab] = useState('payouts'); // 'payouts' or 'applications'
  const [applications, setApplications] = useState([]);
  const [pendingPayouts, setPendingPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Financial Stats
  const [totalEscrow, setTotalEscrow] = useState(0);
  const [totalAdminCut, setTotalAdminCut] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Load Pending Tutor Applications
      const { data: apps, error: appsError } = await supabase
        .from('tutor_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (appsError) throw appsError;
      setApplications(apps || []);

      // 2. Load Escrow Bookings (Confirmed sessions pending payout)
      const { data: payouts, error: payoutsError } = await supabase
        .from('bookings')
        .select('*, tutors(name, email)')
        .in('status', ['confirmed', 'approved', 'completed'])
        .eq('payout_status', 'pending')
        .order('created_at', { ascending: false });

      if (payoutsError) throw payoutsError;
      setPendingPayouts(payouts || []);

      // Calculate Financial Summaries based on a 10% Admin Cut
      let escrowSum = 0;
      let adminCutSum = 0;
      (payouts || []).forEach(p => {
        const amount = Number(p.total_amount || 0);
        escrowSum += amount;
        adminCutSum += amount * 0.10; // 10% Platform Cut
      });

      setTotalEscrow(escrowSum);
      setTotalAdminCut(adminCutSum);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Could not load admin data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // --- ESCROW PAYOUT ACTIONS ---
  const handleReleasePayout = async (bookingId, tutorName, payoutAmount) => {
    Alert.alert(
      'Release Payout',
      `Confirm that you have sent ₱${payoutAmount.toFixed(2)} to ${tutorName}'s account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Mark as Paid',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ payout_status: 'released', status: 'completed' })
                .eq('id', bookingId);

              if (error) throw error;
              Alert.alert('Success', `Payout released to ${tutorName}.`);
              loadDashboardData();
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          }
        }
      ]
    );
  };

  // --- APPLICATION ACTIONS (From your original code) ---
  const handleApplicationAction = async (id, status, name) => {
    Alert.alert(
      `${status === 'approved' ? 'Approve' : 'Reject'} Application`,
      `Are you sure you want to ${status === 'approved' ? 'approve' : 'reject'} ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: status === 'rejected' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tutor_applications')
                .update({ status })
                .eq('id', id);

              if (error) throw error;
              Alert.alert('Success', `${name}'s application has been ${status}.`);
              loadDashboardData();
            } catch (error) {
              console.error('Error updating application:', error);
              Alert.alert('Error', `Failed to ${status} application: ${error.message}`);
            }
          },
        },
      ]
    );
  };

  // --- RENDER ESCROW PAYOUT CARDS ---
  const renderPayoutCard = ({ item }) => {
    const totalAmount = Number(item.total_amount || 0);
    const adminCut = totalAmount * 0.10; // 10% Admin Cut
    const tutorPayout = totalAmount * 0.90; // 90% Tutor Payout

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <Ionicons name="wallet-outline" size={14} color="#7c3aed" />
            <Text style={styles.badgeText}>Held in Escrow</Text>
          </View>
          <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        <Text style={styles.escrowTutorName}>Tutor: {item.tutors?.name || 'Unknown Tutor'}</Text>
        <Text style={styles.escrowTopicText}>Session: {item.topic}</Text>
        <Text style={styles.paymentMethodText}>Paid via: {item.payment_method}</Text>

        <View style={styles.financialBox}>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Total Paid by Student:</Text>
            <Text style={styles.finValue}>₱{totalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.finRow}>
            <Text style={styles.finLabelAdmin}>Admin Platform Cut (10%):</Text>
            <Text style={styles.finValueAdmin}>₱{adminCut.toFixed(2)}</Text>
          </View>
          <View style={[styles.finRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
            <Text style={styles.finLabelOwed}>Owed to Tutor (90%):</Text>
            <Text style={styles.finValueOwed}>₱{tutorPayout.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.releaseButton}
          onPress={() => handleReleasePayout(item.id, item.tutors?.name, tutorPayout)}
        >
          <Ionicons name="checkmark-done-circle" size={18} color="#fff" />
          <Text style={styles.releaseButtonText}>Mark Payout as Released</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- RENDER APPLICATION CARDS (Your original beautifully styled UI) ---
  const renderAppCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.initials || 'TU'}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{item.full_name}</Text>
          <Text style={styles.program}>{item.program}</Text>
        </View>
        <View style={styles.rateBadge}>
          <Text style={styles.rateText}>₱{item.requested_rate}/hr</Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <Text style={styles.label}>Subjects to Teach:</Text>
      <View style={styles.badgesContainer}>
        {(item.subjects || []).map((sub, idx) => (
          <View key={idx} style={styles.badge}>
            <Text style={styles.badgeText}>{sub}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.detailRow}>
        <Text style={styles.labelDark}>Available Days:</Text>
        <Text style={styles.value}>{item.available_days || 'Flexible'}</Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.rejectButton]}
          onPress={() => handleApplicationAction(item.id, 'rejected', item.full_name)}
        >
          <Text style={styles.rejectButtonText}>✕ Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.approveButton]}
          onPress={() => handleApplicationAction(item.id, 'approved', item.full_name)}
        >
          <Text style={styles.approveButtonText}>✓ Approve Tutor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Admin Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'payouts' && styles.tabActive]}
          onPress={() => setActiveTab('payouts')}
        >
          <Text style={[styles.tabText, activeTab === 'payouts' && styles.tabTextActive]}>
            Escrow Payouts ({pendingPayouts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'applications' && styles.tabActive]}
          onPress={() => setActiveTab('applications')}
        >
          <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>
            Applications ({applications.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Escrow Financial Summary Header (Only shows on Payouts tab) */}
      {activeTab === 'payouts' && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Total in Escrow</Text>
            <Text style={styles.summaryValueEscrow}>₱{totalEscrow.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Admin Revenue (10%)</Text>
            <Text style={styles.summaryValueAdmin}>₱{totalAdminCut.toFixed(2)}</Text>
          </View>
        </View>
      )}

      {/* Content List */}
      <FlatList
        data={activeTab === 'payouts' ? pendingPayouts : applications}
        renderItem={activeTab === 'payouts' ? renderPayoutCard : renderAppCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#7c3aed']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {activeTab === 'payouts' ? (
              <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
            ) : (
              <Text style={styles.emptyIcon}>🎉</Text>
            )}
            <Text style={styles.emptyTitle}>
              {activeTab === 'payouts' ? 'No Pending Payouts' : 'All Caught Up!'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'payouts' 
                ? 'All completed sessions have been paid out to tutors.' 
                : 'There are no pending tutor applications to review right now.'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  
  // Tab Styles
  tabContainer: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  tabButton: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  tabActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  
  // Summary Styles
  summaryContainer: { flexDirection: 'row', padding: 16, gap: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#e2e8f0' },
  summaryBox: { flex: 1, backgroundColor: '#faf5ff', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e9d5ff' },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  summaryValueEscrow: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  summaryValueAdmin: { fontSize: 20, fontWeight: '900', color: '#059669' },

  list: { padding: 16 },
  
  // Universal Card Styles (From your original code)
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
  
  // App Card Specific Styles
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#ddd5fe' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#7c3aed' },
  headerInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: '#111' },
  program: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' },
  rateBadge: { backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  rateText: { fontSize: 14, fontWeight: '900', color: '#7c3aed' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: 12 },
  label: { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  labelDark: { fontSize: 11, color: '#555', fontWeight: '700', textTransform: 'uppercase' },
  badgesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  badge: { backgroundColor: '#f5f3ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: '#ddd6fe' },
  badgeText: { fontSize: 11, color: '#6d28d9', fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', padding: 10, borderRadius: 8, marginBottom: 14 },
  value: { fontSize: 12, color: '#111', fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rejectButton: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  approveButton: { backgroundColor: '#10b981' },
  rejectButtonText: { fontWeight: '700', fontSize: 13, color: '#ef4444' },
  approveButtonText: { fontWeight: '700', fontSize: 13, color: '#fff' },

  // Escrow Payout Specific Styles
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3e8ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  badgeText: { fontSize: 10, fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase' },
  dateText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  escrowTutorName: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  escrowTopicText: { fontSize: 13, color: '#475569', marginBottom: 4 },
  paymentMethodText: { fontSize: 11, color: '#64748b', fontStyle: 'italic', marginBottom: 12 },
  financialBox: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 14 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  finLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  finValue: { fontSize: 12, color: '#0f172a', fontWeight: '700' },
  finLabelAdmin: { fontSize: 12, color: '#059669', fontWeight: '600' },
  finValueAdmin: { fontSize: 12, color: '#059669', fontWeight: '800' },
  finLabelOwed: { fontSize: 13, color: '#0f172a', fontWeight: '800' },
  finValueOwed: { fontSize: 15, color: '#7c3aed', fontWeight: '900' },
  releaseButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, gap: 6 },
  releaseButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Empty State Styles
  emptyState: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 6, marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#777', textAlign: 'center', lineHeight: 18 },
});

export default AdminDashboardScreen;