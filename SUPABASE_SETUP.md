# TutorMe CEA Expo App - Supabase Setup Guide

## Overview
This Expo React Native app requires a Supabase project to manage tutors, bookings, crash courses, and user profiles. Follow these steps to set up your database.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in the details:
   - **Project Name**: TutorMe CEA
   - **Password**: Create a strong password
   - **Region**: Choose the closest to your location
4. Wait for the project to initialize (2-3 minutes)

## 2. Get Your Credentials

1. Go to **Settings > API** in your Supabase project
2. Copy your `Project URL` and `anon public` key
3. Update your `.env.local` file:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Create Database Tables

Go to the **SQL Editor** in your Supabase dashboard and run these queries:

### 3.1 Create Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT CHECK (role IN ('tutee', 'tutor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 3.2 Create Tutors Table
```sql
CREATE TABLE tutors (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  program TEXT,
  badge TEXT,
  subjects TEXT[] DEFAULT '{}',
  rate INTEGER NOT NULL,
  rating DECIMAL(3,1) DEFAULT 5.0,
  reviews INTEGER DEFAULT 0,
  days TEXT[] DEFAULT '{}',
  days_display TEXT,
  email TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email)
);

ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified tutors"
  ON tutors FOR SELECT
  USING (verified = true);

CREATE POLICY "Tutors can update own profile"
  ON tutors FOR UPDATE
  USING (auth.uid() = user_id);
```

### 3.3 Create Bookings Table
```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  time TEXT NOT NULL,
  duration DECIMAL(2,1) NOT NULL,
  topic TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Tutors can view their bookings"
  ON bookings FOR SELECT
  USING (tutor_id IN (SELECT id FROM tutors WHERE user_id = auth.uid()));
```

### 3.4 Create Crash Courses Table
```sql
CREATE TABLE crash_courses (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  instructor TEXT NOT NULL,
  price INTEGER NOT NULL,
  max_students INTEGER DEFAULT 20,
  registered_students INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE crash_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view crash courses"
  ON crash_courses FOR SELECT
  USING (true);
```

### 3.5 Create Tutor Applications Table
```sql
CREATE TABLE tutor_applications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  program TEXT NOT NULL,
  requested_rate INTEGER NOT NULL,
  subjects TEXT[] DEFAULT '{}',
  available_days TEXT,
  initials TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tutor_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own application"
  ON tutor_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create application"
  ON tutor_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## 4. Insert Sample Data

### Add Sample Tutors
```sql
INSERT INTO tutors (name, initials, program, badge, subjects, rate, rating, reviews, days, days_display, email, verified)
VALUES
  ('Princess Ancheta', 'PA', 'CEA Upperclassman', 'Verified Tutor (Chemistry & Mensuration)', ARRAY['Chemistry', 'Solid Mensuration'], 80, 5.0, 22, ARRAY['MONDAY', 'TUESDAY', 'SATURDAY'], 'Mon, Tue, Sat', 'ancheta.princessmaris@gmail.com', TRUE),
  ('Wahari Maca-ayan', 'WM', 'CEA Senior Peer Tutor', 'Master Tutor (Calculus, Physics, Chem)', ARRAY['Mathematics/Calculus', 'Chemistry', 'Solid Mensuration', 'Engineering/Architecture', 'Physics'], 110, 5.0, 28, ARRAY['FRIDAY', 'SATURDAY', 'SUNDAY'], 'Fri, Sat, Sun', 'waharimacaayan@gmail.com', TRUE),
  ('Arvy Joy Aceron', 'AA', 'CEA Upperclassman', 'Verified Tutor (Physics & Chem)', ARRAY['Chemistry', 'Physics'], 65, 4.9, 14, ARRAY['SATURDAY', 'SUNDAY'], 'Sat, Sun', 'aceron.arvy@gmail.com', TRUE);
```

### Add Sample Crash Courses
```sql
INSERT INTO crash_courses (code, name, instructor, price, description)
VALUES
  ('MATH 101', 'Calculus 1 & 2: Integration & Application Survival', 'Wahari Maca-ayan', 60, 'Targeted problem drills on integration by parts, trigonometric substitutions, and common instructor trap questions.'),
  ('PHYS 102', 'Engineering Physics: Mechanics & Equilibrium', 'Arvy Joy Aceron', 60, 'Step-by-step free-body diagram breakdown, friction formulas, and rotational dynamics problem solving.');
```

## 5. Enable Authentication

1. Go to **Authentication > Providers** in Supabase
2. Enable **Email** provider:
   - Disable "Email Confirmations" for development
3. Users can now sign up with email/password

## 6. Set Environment Variables

Update `.env.local` with your credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

## 7. Run the App

```bash
cd TutorMeApp
npx expo start
```

Press `w` for web preview, or scan QR code with Expo Go app on your phone.

## 8. Test the Flow

1. **Sign up** a new account
2. **Browse tutors** - you should see the sample tutors
3. **Book a session** - create a booking
4. **Apply as tutor** - submit a tutor application
5. **View bookings** - check your bookings list

## Important Notes

- **Row Level Security (RLS)** is enabled on all tables for security
- Users can only see verified tutors
- Each user can only see/modify their own bookings
- Tutor applications are pending until verified by an admin
- All timestamps are in UTC (stored with `TIMESTAMP WITH TIME ZONE`)

## Next Steps

1. Set up a storage bucket for tutor profile photos (optional)
2. Create admin dashboard to verify tutor applications
3. Set up email notifications for bookings
4. Add payment integration (Stripe, GCash, etc.)
5. Deploy to Expo Go or build APK/IPA

---

For questions or issues, refer to:
- [Supabase Docs](https://supabase.com/docs)
- [Expo Docs](https://docs.expo.dev)
