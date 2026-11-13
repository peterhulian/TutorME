import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const HomeScreen = ({ navigation }) => {
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [crashCourses, setCrashCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservingId, setReservingId] = useState(null);

  // Tutor / Admin Host Crash Course Modal State
  const [canHostCourse, setCanHostCourse] = useState(false);
  const [hostTutorInfo, setHostTutorInfo] = useState(null);
  const [hostModalVisible, setHostModalVisible] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseSchedule, setCourseSchedule] = useState('Friday • 5:30 PM - 7:30 PM');
  const [courseVenue, setCourseVenue] = useState('Audio-Visual Hall / Library');
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Responsive hook to detect desktop/wide screens
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const popularSubjects = [
    { label: 'Calculus 1 & 2', value: 'Mathematics/Calculus', icon: 'calculator-outline' },
    { label: 'Solid Mensuration', value: 'Solid Mensuration', icon: 'cube-outline' },
    { label: 'Physics', value: 'Physics', icon: 'flash-outline' },
    { label: 'Chemistry', value: 'Chemistry', icon: 'flask-outline' },
    { label: 'Drawing & Arch', value: 'Engineering/Architecture', icon: 'compass-outline' },
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Load Crash Courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('crash_courses')
        .select('*')
        .order('id', { ascending: true });

      if (!coursesError) {
        setCrashCourses(coursesData || []);
      }

      // 2. Load Featured Tutors
      const { data: tutorsData, error: tutorsError } = await supabase
        .from('tutors')
        .select('*')
        .order('rating', { ascending: false })
        .limit(4);

      if (tutorsError) throw tutorsError;
      setFeaturedTutors(tutorsData || []);

      // 3. Check if logged-in user is a Tutor or Admin so they can create Crash Courses
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .maybeSingle();

        const { data: tutorRow } = await supabase
          .from('tutors')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (tutorRow || profile?.role === 'tutor' || profile?.role === 'admin') {
          setCanHostCourse(true);
          setHostTutorInfo({
            id: tutorRow?.id || null,
            name: tutorRow?.name || profile?.full_name || 'Verified Tutor',
            initials: tutorRow?.initials || 'TU',
            cred: tutorRow?.badge || 'Verified Peer Tutor',
          });
        } else {
          setCanHostCourse(false);
        }
      } else {
        setCanHostCourse(false);
      }
    } catch (error) {
      console.error('Error loading data:', error.message || error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveSeat = async (course) => {
    const maxSeats = course.max_seats || 30;
    const enrolled = course.enrolled_count || 0;
    const remaining = maxSeats - enrolled;

    if (remaining <= 0) {
      Alert.alert('Session Full', 'All 30 seats for this crash course have been reserved.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'Please sign in on the Profile tab to reserve a crash course seat.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to Profile', onPress: () => navigation.navigate('Profile') },
        ]
      );
      return;
    }

    Alert.alert(
      'Reserve Crash Course Seat (Online Escrow)',
      `Reserve 1 seat for "${course.title}" with ${course.tutor_name}?\n\nDuration: 2 Hours Intensive\nSchedule: ${course.schedule}\nSeat Fee: ₱${course.price} (via Admin GCash Escrow: 0917 882 4910)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay & Reserve (₱${course.price})`,
          onPress: async () => {
            try {
              setReservingId(course.id);

              let tutorId = course.tutor_id;
              if (!tutorId && course.tutor_name) {
                const { data: matchedTutor } = await supabase
                  .from('tutors')
                  .select('id')
                  .ilike('name', course.tutor_name)
                  .maybeSingle();
                if (matchedTutor) tutorId = matchedTutor.id;
              }

              // 1. Increment enrolled_count in crash_courses
              const newCount = enrolled + 1;
              const { error: updateError } = await supabase
                .from('crash_courses')
                .update({ enrolled_count: newCount })
                .eq('id', course.id);

              if (updateError) throw updateError;

              // 2. Record the pass in bookings under Online Admin Escrow
              const { error: bookingError } = await supabase
                .from('bookings')
                .insert({
                  tutor_id: tutorId,
                  student_id: user.id,
                  location: course.venue || 'Audio-Visual Hall / Library',
                  time: course.schedule || 'Pre-Midterm Friday 5:30 PM',
                  duration: 2,
                  topic: `[Crash Course] ${course.course_code}: ${course.title}`,
                  total_amount: course.price || 60,
                  payment_method: 'GCash (Admin Escrow)',
                  status: 'confirmed',
                });

              if (bookingError) throw bookingError;

              Alert.alert(
                'Seat Reserved',
                `Your pass for ${course.title} is confirmed via Admin Online Escrow! (${maxSeats - newCount} slots remaining). View or manage your pass in My Bookings.`
              );
              loadData();
            } catch (err) {
              console.error('Error reserving seat:', err);
              Alert.alert('Error', err.message || 'Could not reserve seat.');
            } finally {
              setReservingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCreateCrashCourse = async () => {
    if (!courseCode.trim() || !courseTitle.trim() || !courseDesc.trim()) {
      Alert.alert('Missing Fields', 'Please fill in the course code, title, and topic summary.');
      return;
    }

    try {
      setCreatingCourse(true);
      const { error } = await supabase.from('crash_courses').insert({
        course_code: courseCode.trim().toUpperCase(),
        title: courseTitle.trim(),
        description: courseDesc.trim(),
        tutor_id: hostTutorInfo?.id || null,
        tutor_name: hostTutorInfo?.name || 'Verified Tutor',
        tutor_initials: hostTutorInfo?.initials || 'TU',
        tutor_cred: hostTutorInfo?.cred || 'Verified Peer Tutor',
        price: 60,
        duration_hours: 2,
        min_seats: 20,
        max_seats: 30,
        enrolled_count: 0,
        schedule: courseSchedule.trim(),
        venue: courseVenue.trim(),
      });

      if (error) throw error;

      setHostModalVisible(false);
      setCourseCode('');
      setCourseTitle('');
      setCourseDesc('');
      Alert.alert(
        'Crash Course Published',
        'Your 2-hour group crash course is now open for student reservations (Min 20, Max 30 seats).'
      );
      loadData();
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to publish crash course.');
    } finally {
      setCreatingCourse(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 
        This is the new web content wrapper that centers your design on desktop
      */}
      <View style={styles.webContentWrapper}>
        
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            Find the Right Peer Tutor. Learn with Confidence.
          </Text>

          <Text style={styles.heroSubtitle}>
            On-demand peer matching built specifically for undergraduates.
          </Text>

          {/* Quick Subject Filters */}
          <Text style={styles.popularLabel}>POPULAR SUBJECTS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.QuickScroll}
          >
            {popularSubjects.map((sub) => (
              <TouchableOpacity
                key={sub.value}
                style={styles.subjectChip}
                onPress={() =>
                  navigation.navigate('Tutors', {
                    screen: 'TutorsMain',
                    params: { initialSubject: sub.value },
                  })
                }
              >
                <Ionicons name={sub.icon} size={14} color="#7c3aed" />
                <Text style={styles.subjectChipText}>{sub.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* DEPARTMENTAL GROUP CRASH COURSES SECTION */}
        <View style={styles.crashSection}>
          <View style={styles.crashHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.prepBadge}>
                <Ionicons name="flash" size={12} color="#f59e0b" />
                <Text style={styles.prepBadgeText}>High-Yield Exam Prep • 2 Hours</Text>
              </View>
              <Text style={styles.sectionTitle}>Group Crash Courses</Text>
              <Text style={styles.crashSubtitle}>
                Intensive 2-hour pre-exam problem-solving bootcamps led by top tutors. Only ₱60/seat (Min 20 • Max 30 students).
              </Text>
            </View>

            {canHostCourse && (
              <TouchableOpacity
                style={styles.hostButton}
                onPress={() => setHostModalVisible(true)}
              >
                <Ionicons name="add-circle-outline" size={15} color="#fff" />
                <Text style={styles.hostButtonText}>Host</Text>
              </TouchableOpacity>
            )}
          </View>

          {crashCourses.map((course) => {
            const minSeats = course.min_seats || 20;
            const maxSeats = course.max_seats || 30;
            const enrolled = course.enrolled_count || 0;
            const remainingSlots = Math.max(0, maxSeats - enrolled);
            const isFull = remainingSlots === 0;
            const metMinimum = enrolled >= minSeats;
            const fillPercent = Math.min(100, Math.round((enrolled / maxSeats) * 100));

            return (
              <View key={course.id} style={styles.crashCard}>
                <View style={styles.crashCornerRibbon}>
                  <Text style={styles.crashCornerText}>Midterm Cram Session</Text>
                </View>

                {/* Top Meta Row */}
                <View style={styles.crashMetaRow}>
                  <View style={styles.courseCodeBadge}>
                    <Text style={styles.courseCodeText}>{course.course_code}</Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <Ionicons name="time-outline" size={13} color="#7c3aed" />
                  <Text style={styles.durationText}>{course.duration_hours || 2} Hours Intensive</Text>
                </View>

                <Text style={styles.crashTitle}>{course.title}</Text>
                <Text style={styles.crashDesc}>{course.description}</Text>

                {/* Lead Tutor Box */}
                <View style={styles.leadTutorBox}>
                  <View style={styles.leadAvatar}>
                    <Text style={styles.leadAvatarText}>{course.tutor_initials || 'TU'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.leadTutorName}>Lead Tutor: {course.tutor_name}</Text>
                    <Text style={styles.leadTutorCred}>{course.tutor_cred}</Text>
                  </View>
                </View>

                {/* Schedule & Venue */}
                <View style={styles.scheduleVenueBox}>
                  <View style={styles.scheduleRow}>
                    <Ionicons name="calendar-outline" size={13} color="#7c3aed" />
                    <Text style={styles.scheduleText}>{course.schedule}</Text>
                  </View>
                  <View style={styles.scheduleRow}>
                    <Ionicons name="location-outline" size={13} color="#7c3aed" />
                    <Text style={styles.scheduleText}>{course.venue}</Text>
                  </View>
                </View>

                {/* Live Slot Counter & Min 20 / Max 30 Progress Bar */}
                <View style={styles.slotBox}>
                  <View style={styles.slotHeaderRow}>
                    <View style={styles.slotBadgeRow}>
                      <Ionicons
                        name={isFull ? 'close-circle' : 'people'}
                        size={14}
                        color={isFull ? '#dc2626' : '#7c3aed'}
                      />
                      <Text style={[styles.remainingSlotsText, isFull && { color: '#dc2626' }]}>
                        {isFull
                          ? '0 slots left (Full)'
                          : `${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} left`}
                      </Text>
                    </View>
                    <Text style={styles.seatCountText}>
                      {enrolled}/{maxSeats} booked (Min {minSeats})
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${fillPercent}%`,
                          backgroundColor: isFull
                            ? '#dc2626'
                            : metMinimum
                            ? '#10b981'
                            : '#7c3aed',
                        },
                      ]}
                    />
                  </View>

                  <Text style={[styles.minStatusText, metMinimum && { color: '#059669' }]}>
                    {isFull
                      ? 'Maximum 30-seat capacity reached.'
                      : metMinimum
                      ? 'Minimum 20 seats reached — Session Guaranteed!'
                      : `${minSeats - enrolled} more student${minSeats - enrolled === 1 ? '' : 's'} needed to reach 20-seat minimum`}
                  </Text>
                </View>

                {/* Price & Reserve CTA */}
                <View style={styles.crashFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.crashPrice}>₱{course.price}</Text>
                    <Text style={styles.crashPerSeat}> / seat</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.reserveButton, isFull && styles.reserveButtonDisabled]}
                    disabled={isFull || reservingId === course.id}
                    onPress={() => handleReserveSeat(course)}
                  >
                    <Text style={styles.reserveButtonText}>
                      {reservingId === course.id
                        ? 'Reserving...'
                        : isFull
                        ? 'Sold Out'
                        : `Reserve Seat (₱${course.price})`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Featured Tutors Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Top Verified Tutors</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Tutors')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          {/* Flexbox row for desktop, column for mobile */}
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', flexWrap: 'wrap', gap: 10 }}>
            {featuredTutors.map((tutor) => (
              <TouchableOpacity
                key={tutor.id}
                style={[styles.tutorCard, isDesktop && { flex: 1, minWidth: '45%' }]}
                onPress={() =>
                  navigation.navigate('Tutors', {
                    screen: 'TutorDetail',
                    params: { tutorId: tutor.id },
                  })
                }
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{tutor.initials || 'TU'}</Text>
                </View>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>{tutor.name}</Text>
                  <Text style={styles.tutorSubject} numberOfLines={1}>
                    {(tutor.subjects || []).join(' • ')}
                  </Text>
                  <Text style={styles.tutorRating}>
                    Rating: {tutor.rating} ({tutor.reviews} reviews)
                  </Text>
                </View>
                <View style={styles.rateBox}>
                  <Text style={styles.rateAmount}>₱{tutor.rate}</Text>
                  <Text style={styles.rateUnit}>/hr</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How TutorMe Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How TutorMe Works</Text>
          
          {/* Flexbox row for desktop, column for mobile */}
          <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 16 }}>
            <View style={[styles.stepRow, isDesktop && { flex: 1, marginTop: 0 }]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Find by Subject</Text>
                <Text style={styles.stepDesc}>Filter through verified peer tutors</Text>
              </View>
            </View>
            <View style={[styles.stepRow, isDesktop && { flex: 1, marginTop: 0 }]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Pick Your Slot</Text>
                <Text style={styles.stepDesc}>Choose time and location</Text>
              </View>
            </View>
            <View style={[styles.stepRow, isDesktop && { flex: 1, marginTop: 0 }]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNumber}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Pass Exams</Text>
                <Text style={styles.stepDesc}>Get high-yield review and ace your course</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Become a Peer Tutor CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Become a Peer Tutor</Text>
          <Text style={styles.ctaSubtitle}>
            Monetize your high grades and help underclassmen
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.ctaButtonText}>Apply Now</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Modal for Tutors/Admins to Host a New 2-Hour Crash Course */}
      <Modal visible={hostModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Host a 2-Hour Crash Course</Text>
              <TouchableOpacity onPress={() => setHostModalVisible(false)}>
                <Ionicons name="close" size={22} color="#555" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalHelper}>
              Lead Tutor: {hostTutorInfo?.name} • ₱60/seat • Min 20 / Max 30 seats
            </Text>

            <Text style={styles.inputLabel}>Course Code</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., MATH 101 or PHYS 102"
              value={courseCode}
              onChangeText={setCourseCode}
            />

            <Text style={styles.inputLabel}>Crash Course Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Differential Calculus Midterm Bootcamp"
              value={courseTitle}
              onChangeText={setCourseTitle}
            />

            <Text style={styles.inputLabel}>What You Will Cover (2 Hours)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              multiline
              placeholder="Describe the key formulas and exam drills..."
              value={courseDesc}
              onChangeText={setCourseDesc}
            />

            <Text style={styles.inputLabel}>Schedule (2-Hour Slot)</Text>
            <TextInput
              style={styles.input}
              value={courseSchedule}
              onChangeText={setCourseSchedule}
            />

            <Text style={styles.inputLabel}>Venue / Room</Text>
            <TextInput
              style={styles.input}
              value={courseVenue}
              onChangeText={setCourseVenue}
            />

            <TouchableOpacity
              style={styles.publishButton}
              onPress={handleCreateCrashCourse}
              disabled={creatingCourse}
            >
              <Text style={styles.publishButtonText}>
                {creatingCourse ? 'Publishing...' : 'Publish Crash Course'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  // Responsive content wrapper to center the design on desktop
  webContentWrapper: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1024 : '100%',
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 24 : 0,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  heroSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 24, fontWeight: '900', color: '#0f172a', lineHeight: 31 },
  heroSubtitle: { fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 19 },
  popularLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', marginTop: 16, marginBottom: 8, letterSpacing: 0.6 },
  QuickScroll: { marginHorizontal: -4 },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  subjectChipText: { fontSize: 12, fontWeight: '600', color: '#334155' },

  /* Crash Courses Styles */
  crashSection: {
    backgroundColor: '#faf5ff',
    padding: 18,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3e8ff',
  },
  crashHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  prepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginBottom: 6,
    gap: 4,
  },
  prepBadgeText: { fontSize: 10, fontWeight: '700', color: '#6d28d9' },
  crashSubtitle: { fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 17 },
  hostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  hostButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  crashCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    overflow: 'hidden',
  },
  crashCornerRibbon: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  crashCornerText: { color: '#fff', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  crashMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 },
  courseCodeBadge: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courseCodeText: { fontSize: 11, fontWeight: '800', color: '#6d28d9' },
  metaDot: { marginHorizontal: 6, color: '#cbd5e1' },
  durationText: { fontSize: 11, fontWeight: '600', color: '#64748b', marginLeft: 4 },
  crashTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 },
  crashDesc: { fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 12 },
  leadTutorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  leadAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  leadAvatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  leadTutorName: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  leadTutorCred: { fontSize: 11, color: '#64748b', marginTop: 1 },
  scheduleVenueBox: { gap: 4, marginBottom: 12 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { fontSize: 11, color: '#475569', fontWeight: '600' },

  /* Slot Counter Styles */
  slotBox: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e9d5ff',
    marginBottom: 12,
  },
  slotHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  slotBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  remainingSlotsText: { fontSize: 12, fontWeight: '800', color: '#7c3aed' },
  seatCountText: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  progressTrack: {
    height: 7,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  minStatusText: { fontSize: 10, fontWeight: '600', color: '#64748b' },

  crashFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  crashPrice: { fontSize: 22, fontWeight: '900', color: '#6d28d9' },
  crashPerSeat: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  reserveButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  reserveButtonDisabled: { backgroundColor: '#cbd5e1' },
  reserveButtonText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  /* Tutors & Steps Sections */
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  viewAllText: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 15, fontWeight: '900', color: '#7c3aed' },
  tutorInfo: { flex: 1 },
  tutorName: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  tutorSubject: { fontSize: 12, color: '#64748b', marginTop: 2 },
  tutorRating: { fontSize: 11, color: '#64748b', marginTop: 4 },
  rateBox: { alignItems: 'flex-end' },
  rateAmount: { fontSize: 16, fontWeight: '900', color: '#0f172a' },
  rateUnit: { fontSize: 11, color: '#94a3b8' },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3e8ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumber: { fontSize: 14, fontWeight: '800', color: '#7c3aed' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  stepDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ctaCard: {
    margin: 20,
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  ctaTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  ctaSubtitle: { fontSize: 12, color: '#475569', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  ctaButton: { backgroundColor: '#7c3aed', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  ctaButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  /* Host Modal Styles */
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', padding: 18 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  modalHelper: { fontSize: 11, color: '#6d28d9', fontWeight: '600', marginBottom: 12 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#334155', marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  publishButton: { backgroundColor: '#7c3aed', paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  publishButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export default HomeScreen;