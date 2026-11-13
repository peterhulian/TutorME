import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

const ProfileScreen = ({ navigation }) => {
  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(''); // NEW: Inline error state

  // Tutor Application States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [program, setProgram] = useState('BS Architecture');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [requestedRate, setRequestedRate] = useState('100');
  const [availableDays, setAvailableDays] = useState('Mon, Wed, Fri');
  const [applying, setApplying] = useState(false);
  const [existingApp, setExistingApp] = useState(null);

  // Responsive layout hook for web/desktop screens
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const availableSubjectsList = [
    'Mathematics/Calculus',
    'Solid Mensuration',
    'Chemistry',
    'Physics',
    'Engineering/Architecture',
  ];

  const programsList = [
    'BS Civil Engineering',
    'BS Architecture',
    'BS Mechanical Engineering',
    'BS Electrical Engineering',
    'BS Electronics Engineering',
    'BS Computer Engineering',
  ];

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkUser();
    });
    checkUser();
    return unsubscribe;
  }, [navigation]);

  const checkUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await loadUserProfile(currentUser.id);
        await checkExistingApplication(currentUser.id);
      } else {
        setProfile(null);
        setExistingApp(null);
      }
    } catch (error) {
      console.error('Error checking user session:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const checkExistingApplication = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('tutor_applications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setExistingApp(data);
      } else {
        setExistingApp(null);
      }
    } catch (error) {
      console.error('Error checking application:', error);
    }
  };

  const handleAuth = async () => {
    setAuthError(''); // Clear previous errors on new attempt

    if (!email.trim() || !password.trim() || (isSignUp && !fullName.trim())) {
      setAuthError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const formattedEmail = email.trim().toLowerCase();
    if (!formattedEmail.includes('@') || !formattedEmail.includes('.')) {
      setAuthError('Invalid email format. Please check for typos.');
      return;
    }

    try {
      setAuthLoading(true);

      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: formattedEmail,
          password,
          options: { data: { full_name: fullName.trim() } },
        });

        if (error) throw error;

        if (data?.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            role: 'tutee',
          });
        }

        if (data?.session) {
          setUser(data.user);
          await checkUser();
        } else {
          Alert.alert('Verify Email', 'Account created! Please check your email.');
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formattedEmail,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Incorrect email or password.');
          }
          throw error;
        }

        if (!data?.session) throw new Error('No active session returned.');

        setUser(data.user);
        await checkUser();
      }

      setEmail('');
      setPassword('');
      setFullName('');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const toggleSubject = (subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== subject));
    } else {
      setSelectedSubjects([...selectedSubjects, subject]);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'TU';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleApplyTutor = async () => {
    if (selectedSubjects.length === 0) {
      Alert.alert('Missing Info', 'Please select at least one subject to teach.');
      return;
    }
    if (!requestedRate || isNaN(Number(requestedRate))) {
      Alert.alert('Invalid Rate', 'Please enter a valid hourly rate.');
      return;
    }

    try {
      setApplying(true);
      const applicantName = profile?.full_name || user?.user_metadata?.full_name || 'CEA Student';
      const initials = getInitials(applicantName);

      const { data, error } = await supabase
        .from('tutor_applications')
        .insert({
          user_id: user.id,
          full_name: applicantName,
          initials,
          program,
          subjects: selectedSubjects,
          requested_rate: parseInt(requestedRate, 10),
          available_days: availableDays.trim() || 'Flexible',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      setExistingApp(data);
      setShowApplyModal(false);
      Alert.alert(
        'Application Submitted',
        'Your tutor application has been sent to the administrator for verification.'
      );
    } catch (error) {
      console.error('Error submitting application:', error);
      Alert.alert('Application Error', error.message || 'Could not submit application.');
    } finally {
      setApplying(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setExistingApp(null);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  // ==========================================
  // 1. LOGGED IN VIEW (ROLE-SEPARATED DASHBOARDS)
  // ==========================================
  if (user) {
    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
    const rawRole = profile?.role || 'tutee';
    const displayRole =
      rawRole === 'admin'
        ? 'admin'
        : rawRole === 'tutor' || existingApp?.status === 'approved'
        ? 'tutor'
        : 'tutee';
    const initials = getInitials(displayName);

    return (
      <ScrollView style={styles.container}>
        <View style={styles.webContentWrapper}>
          {/* Profile Header */}
          <View style={styles.headerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.emailText}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {displayRole === 'admin'
                  ? 'Administrator'
                  : displayRole === 'tutor'
                  ? 'Verified Peer Tutor'
                  : 'CEA Student (Tutee)'}
              </Text>
            </View>
          </View>

          {/* ========================================== */}
          {/* A. ADMIN DASHBOARD VIEW                    */}
          {/* ========================================== */}
          {displayRole === 'admin' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Admin Controls</Text>
                <TouchableOpacity
                  style={styles.adminActionCard}
                  onPress={() => navigation.navigate('AdminDashboard')}
                >
                  <Ionicons name="shield-checkmark-outline" size={24} color="#5b21b6" style={styles.cardIcon} />
                  <View style={styles.actionContent}>
                    <Text style={styles.adminActionTitle}>Review Tutor Applications</Text>
                    <Text style={styles.adminActionSubtext}>
                      Approve or reject pending peer tutor requests
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6d28d9" />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Platform Directory</Text>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => navigation.navigate('Tutors')}
                >
                  <Ionicons name="people-outline" size={20} color="#444" style={styles.listIcon} />
                  <Text style={styles.actionLabel}>View Active Tutors Directory</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ========================================== */}
          {/* B. TUTOR DASHBOARD VIEW                    */}
          {/* ========================================== */}
          {displayRole === 'tutor' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tutor Workspace</Text>
                <View style={styles.statusBannerApproved}>
                  <Ionicons name="checkmark-circle" size={26} color="#059669" style={styles.cardIcon} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statusTitle}>Active Tutor Profile</Text>
                    <Text style={styles.statusSubtext}>
                      Your profile is verified and visible to students in the Tutors directory.
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => navigation.navigate('Bookings')}
                >
                  <Ionicons name="calendar-outline" size={20} color="#444" style={styles.listIcon} />
                  <Text style={styles.actionLabel}>View Scheduled Sessions</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => navigation.navigate('Tutors')}
                >
                  <Ionicons name="list-outline" size={20} color="#444" style={styles.listIcon} />
                  <Text style={styles.actionLabel}>View Public Tutor Directory</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ========================================== */}
          {/* C. TUTEE (STUDENT) DASHBOARD VIEW           */}
          {/* ========================================== */}
          {displayRole === 'tutee' && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Peer Tutoring Status</Text>

                {existingApp ? (
                  <View
                    style={
                      existingApp.status === 'pending'
                        ? styles.statusBannerPending
                        : styles.statusBannerRejected
                    }
                  >
                    <Ionicons
                      name={existingApp.status === 'pending' ? 'time-outline' : 'close-circle-outline'}
                      size={26}
                      color={existingApp.status === 'pending' ? '#d97706' : '#dc2626'}
                      style={styles.cardIcon}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusTitle}>
                        Application {existingApp.status.toUpperCase()}
                      </Text>
                      <Text style={styles.statusSubtext}>
                        {existingApp.status === 'pending'
                          ? 'An administrator is currently reviewing your tutor application.'
                          : 'Your previous tutor application was not approved.'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.applyCard}>
                    <Text style={styles.applyCardTitle}>Want to become a Peer Tutor?</Text>
                    <Text style={styles.applyCardDesc}>
                      Share your knowledge in Calculus, Physics, or Architecture subjects and earn helping fellow CEA students.
                    </Text>
                    <TouchableOpacity
                      style={styles.applyButton}
                      onPress={() => setShowApplyModal(true)}
                    >
                      <Text style={styles.applyButtonText}>Apply to Become a Tutor</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => navigation.navigate('Bookings')}
                >
                  <Ionicons name="calendar-outline" size={20} color="#444" style={styles.listIcon} />
                  <Text style={styles.actionLabel}>View My Scheduled Bookings</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => navigation.navigate('Tutors')}
                >
                  <Ionicons name="search-outline" size={20} color="#444" style={styles.listIcon} />
                  <Text style={styles.actionLabel}>Browse Available Tutors</Text>
                  <Ionicons name="chevron-forward" size={18} color="#999" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* App Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About TutorMe CEA</Text>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Peer-to-peer academic assistance platform tailored for the College of Engineering and Architecture.
              </Text>
            </View>
          </View>

          {/* Sign Out */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Modal for Tutor Application */}
        <Modal visible={showApplyModal} animationType="slide" transparent={false}>
          <ScrollView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tutor Application</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Your CEA Program</Text>
            <View style={styles.pillsContainer}>
              {programsList.map((prog) => (
                <TouchableOpacity
                  key={prog}
                  style={[styles.pill, program === prog && styles.pillActive]}
                  onPress={() => setProgram(prog)}
                >
                  <Text style={[styles.pillText, program === prog && styles.pillTextActive]}>
                    {prog}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Subjects You Can Teach (Tap to select)</Text>
            <View style={styles.pillsContainer}>
              {availableSubjectsList.map((sub) => {
                const isSelected = selectedSubjects.includes(sub);
                return (
                  <TouchableOpacity
                    key={sub}
                    style={[styles.pill, isSelected && styles.pillActive]}
                    onPress={() => toggleSubject(sub)}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                      {sub}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Hourly Rate (₱)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={requestedRate}
              onChangeText={setRequestedRate}
              placeholder="e.g., 100"
            />

            <Text style={styles.label}>Available Days</Text>
            <TextInput
              style={styles.input}
              value={availableDays}
              onChangeText={setAvailableDays}
              placeholder="e.g., Mon, Wed, Fri"
            />

            <TouchableOpacity
              style={[styles.authButton, { marginTop: 20 }]}
              onPress={handleApplyTutor}
              disabled={applying}
            >
              <Text style={styles.authButtonText}>
                {applying ? 'Submitting...' : 'Submit Application'}
              </Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </Modal>
      </ScrollView>
    );
  }

  // ==========================================
  // 2. LOGGED OUT VIEW (Sign In / Sign Up)
  // ==========================================
  return (
    <ScrollView contentContainerStyle={styles.authContainer}>
      <View style={styles.webContentWrapperAuth}>
        <View style={styles.logoCircle}>
          <Ionicons name="school-outline" size={32} color="#7c3aed" />
        </View>
        <Text style={styles.authTitle}>
          {isSignUp ? 'Create Account' : 'Welcome to TutorMe'}
        </Text>
        <Text style={styles.authSubtitle}>
          {isSignUp
            ? 'Sign up to book study sessions or apply as a peer tutor'
            : 'Sign in with your email address'}
        </Text>

        {isSignUp && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Juan Dela Cruz"
              placeholderTextColor="#999"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (authError) setAuthError('');
              }}
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., name@email.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (authError) setAuthError('');
            }}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Password (6+ characters)</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (authError) setAuthError('');
            }}
          />
        </View>

        {/* INLINE ERROR MESSAGE DISPLAY */}
        {authError ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" style={styles.errorIcon} />
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.authButton}
          onPress={handleAuth}
          disabled={authLoading}
        >
          <Text style={styles.authButtonText}>
            {authLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            setIsSignUp(!isSignUp);
            setAuthError(''); // Clear errors when switching modes
          }}
        >
          <Text style={styles.toggleText}>
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Text>
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
  webContentWrapper: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 1024 : '100%',
    alignSelf: 'center',
  },
  webContentWrapperAuth: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: '#f3e8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd5fe',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '900',
  },
  name: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  emailText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd5fe',
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#7c3aed',
    fontWeight: '700',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#444',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c4b5fd',
  },
  cardIcon: {
    marginRight: 12,
  },
  listIcon: {
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  adminActionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5b21b6',
  },
  adminActionSubtext: {
    fontSize: 12,
    color: '#6d28d9',
    marginTop: 2,
  },
  applyCard: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
  },
  applyCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111',
    marginBottom: 6,
  },
  applyCardDesc: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 14,
  },
  applyButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  statusBannerApproved: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 14,
  },
  statusBannerPending: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
  },
  statusBannerRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 14,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111',
  },
  statusSubtext: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
  },
  infoBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
  },
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f3e8ff',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111',
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 13,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    fontSize: 14,
    color: '#000',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorIcon: {
    marginRight: 6,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  authButton: {
    backgroundColor: '#7c3aed',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  authButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  toggleButton: {
    marginTop: 20,
    padding: 8,
  },
  toggleText: {
    color: '#7c3aed',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 13,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111',
  },
  closeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ef4444',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#222',
    marginTop: 14,
    marginBottom: 8,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  pillTextActive: {
    color: '#fff',
  },
});

export default ProfileScreen;