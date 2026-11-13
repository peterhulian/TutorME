import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  const loadBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

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
      setRefreshing(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this session request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('id', bookingId);

              if (error) throw error;
              loadBookings();
            } catch (err) {
              console.error('Error cancelling booking:', err);
              Alert.alert('Error', 'Could not cancel booking.');
            }
          },
        },
      ]
    );
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
          <Text style={styles.bookingType}>1-on-1 Session ({booking.duration} hr)</Text>
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
          <Text style={styles.detailText}>₱{Number(booking.total_amount || 0).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.bookingFooter}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            Alert.alert(
              'Booking Summary',
              `Tutor: ${booking.tutor?.name}\nTopic: ${booking.topic}\nLocation: ${booking.location}\nTime: ${booking.time}\nStatus: ${booking.status?.toUpperCase()}`
            )
          }
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
        {booking.status === 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => handleCancelBooking(booking.id)}
          >
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
      <FlatList
        data={bookings}
        renderItem={renderBookingCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          bookings.length === 0 ? styles.emptyContainer : styles.listContent
        }
        refreshing={refreshing}
        onRefresh={() => loadBookings(true)}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              Browse tutors and book your first session
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
    paddingTop: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
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
    paddingHorizontal: 10,
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