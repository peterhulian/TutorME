# TutorMe CEA - Expo React Native App

A peer-tutoring marketplace mobile app built with Expo and React Native, powered by Supabase.

## 📱 Features

- **Browse Tutors**: Filter verified peer tutors by subject, availability, and hourly rate
- **Book Sessions**: Schedule 1-on-1 tutoring sessions on campus or online
- **Crash Courses**: Register for group pre-exam intensive sessions
- **Become a Tutor**: Apply to become a verified peer tutor
- **Booking Management**: Track all your upcoming and past sessions
- **User Profiles**: Manage your account and preferences

## 🛠 Tech Stack

- **Framework**: Expo with React Native
- **Backend**: Supabase (PostgreSQL + Auth)
- **Navigation**: React Navigation (Bottom Tabs + Native Stack)
- **State Management**: React Hooks
- **Styling**: StyleSheet (Native)

## 📋 Prerequisites

- Node.js 16+ and npm
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier available at supabase.com)
- Expo Go app (iOS/Android) for testing

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd TutorMeApp
npm install
```

### 2. Set Up Supabase

Follow the **SUPABASE_SETUP.md** guide to:
- Create a Supabase project
- Set up database tables
- Insert sample data
- Configure authentication

### 3. Configure Environment Variables

Create `.env.local` in the project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Start the App

```bash
npx expo start
```

Then:
- Press `w` to open in web browser
- Scan QR code with Expo Go app on your phone
- Press `i` for iOS simulator / `a` for Android emulator (if installed)

## 📱 App Structure

```
TutorMeApp/
├── App.js                 # Main app & navigation setup
├── src/
│   ├── config/
│   │   └── supabase.js   # Supabase client configuration
│   └── screens/
│       ├── HomeScreen.js              # Home & featured tutors
│       ├── TutorsScreen.js            # Browse & filter tutors
│       ├── TutorDetailScreen.js       # Tutor profile & booking
│       ├── BookingScreen.js           # Create booking with pricing
│       ├── MyBookingsScreen.js        # View user bookings
│       ├── BecomeTutorScreen.js       # Tutor application form
│       └── ProfileScreen.js           # User profile & settings
├── .env.local             # Environment variables
├── SUPABASE_SETUP.md      # Database setup guide
└── app.json               # Expo configuration
```

## 🎨 Design System

- **Primary Color**: `#7c3aed` (Purple)
- **Accent**: `#f3e8ff` (Light Purple)
- **Text**: `#000` (Dark) / `#666` (Gray)
- **Background**: `#fff` (White) / `#f9f9f9` (Light Gray)

## 🔐 Authentication

Users can:
- Sign up with email/password
- Browse tutors (public access)
- Book sessions (after login)
- Apply as tutor (after login)

## 💾 Database Schema

### Tables
- **profiles**: User account information
- **tutors**: Verified tutor profiles
- **bookings**: Session bookings
- **crash_courses**: Group study sessions
- **tutor_applications**: Pending tutor verifications

See **SUPABASE_SETUP.md** for complete schema details.

## 📊 Sample Data

The app comes with sample tutors and crash courses included in the Supabase setup guide. You can add more tutors directly via the Supabase dashboard.

## 🔄 Key Workflows

### Booking a Session

1. Browse tutors → TutorsScreen
2. View profile → TutorDetailScreen
3. Book session → BookingScreen
4. Confirm booking → creates entry in `bookings` table
5. View booking → MyBookingsScreen

### Becoming a Tutor

1. Tap "Become a Tutor" → BecomeTutorScreen
2. Fill application form
3. Submit → creates entry in `tutor_applications` table
4. (Admin verifies and creates `tutors` entry)

### Crash Course Registration

1. Home screen shows available crash courses
2. Tap "Reserve Seat"
3. Creates booking with type "crash_course"

## ⚙️ Configuration

### Expo Config (app.json)

The app is configured for:
- iOS and Android
- Landscape and portrait orientation
- Splash screen with branding
- App icon and adaptive icon

Update `app.json` with your app details:
- `name`: App display name
- `slug`: URL-safe name
- `version`: Version number
- `ios` / `android`: Platform-specific settings

## 📚 Navigation Structure

```
Root Navigator (Bottom Tabs)
├── Home Stack
│   ├── HomeScreen
│   └── BecomeTutorScreen
├── Tutors Stack
│   ├── TutorsScreen
│   ├── TutorDetailScreen
│   └── BookingScreen
├── MyBookingsScreen
└── ProfileScreen
```

## 🧪 Testing

### Test Accounts

1. **Student Account**:
   - Email: `student@tutorme.dev`
   - Password: `TestPass123!`

2. **Tutor Account**:
   - Email: `tutor@tutorme.dev`
   - Password: `TestPass123!`

### Test Flow

1. Sign up as new user
2. Browse and filter tutors
3. View tutor details
4. Book a session
5. Check MyBookings
6. Apply as tutor

## 🚢 Deployment

### Build for iOS/Android

```bash
# Preview before building
npx expo preview --ios
npx expo preview --android

# Build production apps
eas build --platform ios
eas build --platform android
```

### Submit to App Stores

```bash
# After building
eas submit --platform ios --latest
eas submit --platform android --latest
```

## 📝 Notes

- **Row Level Security**: All tables have RLS enabled for user data privacy
- **Real-time Sync**: Subscribe to booking updates with Supabase realtime
- **File Storage**: Ready for profile photos via Supabase Storage (not yet implemented)
- **Email Notifications**: Can integrate with SendGrid or Supabase email (future feature)

## 🔧 Troubleshooting

### Supabase Connection Issues
- Verify `.env.local` has correct credentials
- Check network connectivity
- Ensure Supabase project is active in dashboard

### Authentication Issues
- Clear app cache: `npx expo start --clear`
- Check user exists in Supabase Auth dashboard
- Verify email/password are correct

### Performance
- Use `expo start --localhost` for faster local development
- Profile with Expo DevTools
- Check network tab for slow requests

## 📖 Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Supabase Docs](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org)

## 📄 License

This project is built for TutorMe CEA Technopreneurship Program.

## 👥 Team

Developed as an Expo/React Native implementation of the TutorMe CEA peer-tutoring marketplace for the College of Engineering & Architecture at [Your University].

---

**Need Help?** Check SUPABASE_SETUP.md for database configuration or review the sample code in `src/screens/`.
