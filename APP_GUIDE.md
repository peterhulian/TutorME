# TutorMe CEA — App Guide & Function Reference

> **App:** TutorMe | **Platform:** Expo React Native (SDK 57) | **Backend:** Supabase
> **Primary Color:** `#7C3AED` (Purple) | **Currency:** Philippine Peso (₱)

---

## 🔐 Admin Credentials

| Role  | Email / Username | Password |
|-------|-----------------|----------|
| Admin | `Admin@test.com` | `123456`  |

> **Note:** The app auto-appends `@tutorme.local` when signing in without an `@` in the input. For the admin account, enter `Admin@test.com` exactly as shown (includes the `@`).

---

## 📱 Navigation Structure

```
Bottom Tab Navigator
├── 🏠  Home          → HomeScreen
├── 👥  Tutors        → TutorsStack
│   ├── TutorsList    → TutorsScreen
│   ├── TutorDetail   → TutorDetailScreen
│   └── Booking       → BookingScreen
├── 📅  Bookings      → BookingsScreen
└── 👤  Profile       → ProfileStack
    ├── ProfileMain   → ProfileScreen
    └── AdminDashboard → AdminDashboardScreen
```

---

## 🏠 Home Screen (`HomeScreen.js`)

Entry point of the app. Displays an overview of the platform and quick-access sections.

### Functions
| Function | What It Does |
|----------|-------------|
| `loadData()` | Fetches top 6 tutors (sorted by rating) + all crash courses from Supabase on mount |
| `openTutorDetail(tutorId)` | Navigates to `TutorDetail` screen with the selected tutor's ID |

### UI Sections
- **Hero Banner** — App tagline and "Browse Tutors" CTA button
- **Popular Subjects** — 5 subject pills (tap to open Tutors screen pre-filtered):
  - Mathematics / Calculus
  - Solid Mensuration
  - Physics
  - Chemistry
  - Engineering / Architecture
- **Crash Courses** — Lists available crash courses with "Reserve Spot" button (displays Alert with course info)
- **Featured Tutors** — Top 3 tutors by rating with a "View All" link
- **How TutorMe Works** — 3-step explainer (Browse → Book → Learn)
- **Become a Peer Tutor CTA** — Button that navigates to the Profile tab

---

## 👥 Tutors Screen (`TutorsScreen.js`)

Browse and filter the full directory of verified CEA peer tutors.

### Functions
| Function | What It Does |
|----------|-------------|
| `loadTutors()` | Fetches all tutors from Supabase, sorted by `rating` descending |
| `applyFilters()` | Runs whenever `tutors`, `searchQuery`, `selectedSubject`, or `selectedRate` changes; updates `filteredTutors` |

### Filter Options
| Filter Type | Options |
|-------------|---------|
| **Search Bar** | Free-text search on tutor name and subjects |
| **Subject Pills** | All · Mathematics/Calculus · Solid Mensuration · Chemistry · Physics · Engineering/Architecture |
| **Rate Pills** | All · Under ₱75 · ₱76–₱100 · Over ₱100 |

### Tutor Card Info Displayed
- Avatar with initials, name, badge (e.g. "Top Rated")
- Star rating + review count
- Subject tags
- Available days
- Hourly rate
- **"View Profile & Book"** button → navigates to `TutorDetail`

---

## 👤 Tutor Detail Screen (`TutorDetailScreen.js`)

Full profile page for a single tutor.

### Functions
| Function | What It Does |
|----------|-------------|
| `loadTutor()` | Fetches a single tutor record by `tutorId` from Supabase |

### Sections Displayed
| Section | Content |
|---------|---------|
| Header Card | Avatar, name, badge, star rating, review count |
| About | Program, hourly rate, available days |
| Specialties | Subject badges |
| Session Pricing | Auto-calculated prices for 1 hr, 1.5 hr, 2 hr sessions + 5% platform fee note |
| Session Modes | In-Person on Campus / Virtual via Google Meet |

### CTA
- **"Book a Session with [First Name]"** — navigates to `BookingScreen` passing `tutorId`, `tutorName`, `tutorRate`, `tutorInitials`

---

## 📝 Booking Screen (`BookingScreen.js`)

Form to create a tutoring session booking.

### Functions
| Function | What It Does |
|----------|-------------|
| `calculatePricing()` | `subtotal = rate × duration`, `platformFee = subtotal × 0.05`, `total = subtotal + fee` |
| `handleBooking()` | Validates topic field → checks auth → inserts booking to `bookings` table → navigates to Bookings tab |

### Booking Form Fields
| Field | Options / Input |
|-------|----------------|
| **Topic** | Free-text input (required) |
| **Location** | CEA Library Study Pod · CEA Engineering Lobby · Architecture Drafting Hall 3rd Floor · Google Meet Virtual |
| **Time Slot** | 8:00 AM · 10:00 AM · 1:00 PM · 3:00 PM |
| **Duration** | 1 hr · 1.5 hrs · 2 hrs |
| **Payment Method** | Cash (instant) · GCash (simulated 2s processing) · Card (simulated 2s processing) |

### Pricing Display (Live)
- Subtotal (rate × duration)
- Platform Fee (5%)
- **Total Amount**

### Booking Record Saved To Supabase
```
bookings table:
  student_id, tutor_id, topic, location, time, duration,
  payment_method, total_amount, status ('pending')
```

---

## 📅 Bookings Screen (`BookingsScreen.js`)

Manages all tutoring session requests and bookings.

### Functions
| Function | What It Does |
|----------|-------------|
| `loadBookings()` | Loads student bookings (with tutor join) + tutor incoming bookings (with student name lookup) |
| `handleUpdateStatus(bookingId, newStatus, actionLabel)` | Shows confirmation Alert, then updates `status` in `bookings` table |
| `getStatusStyle(status)` | Returns badge color, text color, label, and icon per status |
| `getInitials(name)` | Generates 2-letter initials from a full name |
| `onRefresh()` | Pull-to-refresh handler |

### Tab Views (Tutors Only)
| Tab | Who Sees It | Actions Available |
|-----|-------------|------------------|
| **Incoming Requests** | Tutors only | Accept (→ `confirmed`) / Decline (→ `rejected`) on pending bookings |
| **My Study Bookings** | All users | Cancel (→ `cancelled`) on pending bookings |

### Booking Status Values
| Status | Color | Meaning |
|--------|-------|---------|
| `pending` | 🟡 Amber | Awaiting tutor acceptance |
| `confirmed` / `approved` | 🟢 Green | Tutor accepted |
| `cancelled` / `rejected` | 🔴 Red | Cancelled by student or declined by tutor |

### Booking Card Info Displayed
- Tutor/student avatar with initials, name, role label
- Topic, location, schedule (time + duration)
- Payment method + total amount
- Status badge with icon
- Action buttons (context-dependent)

---

## 👤 Profile Screen (`ProfileScreen.js`)

Authentication hub and user dashboard. Behavior changes based on role.

### Functions
| Function | What It Does |
|----------|-------------|
| `checkUser()` | Gets current Supabase auth session on mount |
| `loadUserProfile(userId)` | Fetches `profiles` row + checks for existing `tutor_applications` row |
| `checkExistingApplication(userId)` | Queries `tutor_applications` for the current user's application status |
| `handleAuth()` | Sign in or sign up with email/password; auto-appends `@tutorme.local` if no `@` present |
| `handleApplyTutor()` | Validates application modal fields → inserts to `tutor_applications` table |
| `handleSignOut()` | Signs out from Supabase and clears local state |
| `toggleSubject(subject)` | Adds/removes a subject from the application's selected subjects list |
| `getInitials(name)` | Generates 2-letter initials from full name |

### Auth Flow
1. User enters username (e.g. `Juan`) or full email
2. App auto-appends `@tutorme.local` if no `@` in input → becomes `Juan@tutorme.local`
3. First attempt → Sign In; if user not found → auto Sign Up (creates account)
4. Session persisted via `AsyncStorage`

### Role-Based Dashboard Views

#### 🛡️ Admin Dashboard
- **"Review Applications"** → navigates to `AdminDashboard` screen
- **"View Tutor Directory"** → navigates to Tutors tab
- Profile header shows "Administrator" badge

#### 🎓 Tutor Dashboard
- Profile card with initials, name, program, "Active Tutor" status badge
- **"View My Sessions"** → navigates to Bookings tab
- **"View Tutor Directory"** → navigates to Tutors tab

#### 📚 Tutee (Student) Dashboard
- Application status display (pending / approved / none)
- **"Apply to Become a Tutor"** → opens application modal (if no existing application)
- **"View My Bookings"** → navigates to Bookings tab
- **"Browse Tutors"** → navigates to Tutors tab

### Tutor Application Modal Fields
| Field | Options / Input |
|-------|----------------|
| **Full Name** | Free-text |
| **CEA Program** | BS Civil Eng. (3rd/4th Yr) · BS Electronics Eng. (3rd/4th Yr) · BS Architecture (3rd/4th Yr) · BS Computer Eng. · BS Mechanical Eng. |
| **Subjects** | Multi-select: Mathematics/Calculus · Solid Mensuration · Chemistry · Physics · Engineering/Architecture |
| **Hourly Rate** | ₱60 · ₱75 · ₱85 · ₱100 |
| **Available Days** | Free-text (e.g. "Friday, Saturday, Sunday") |

---

## 🛡️ Admin Dashboard Screen (`AdminDashboardScreen.js`)

Admin-only screen to review and act on pending tutor applications.

### Functions
| Function | What It Does |
|----------|-------------|
| `loadApplications()` | Fetches all `pending` applications from `tutor_applications` table |
| `handleAction(id, status, name)` | Shows confirmation Alert → updates application `status` to `approved` or `rejected` in Supabase |

### Application Card Info Displayed
- Applicant initials avatar, full name, program
- Requested rate, subjects list, available days
- **"Approve"** button (green) → sets status to `approved`
- **"Reject"** button (red) → sets status to `rejected`

### Empty State
Shows "All Caught Up! ✅" when no pending applications exist.

### Pull-to-Refresh
Swipe down to reload the applications list.

---

## 📋 My Bookings Screen (`MyBookingsScreen.js`)

Alternative bookings view (student-only, focused on their own sessions).

### Functions
| Function | What It Does |
|----------|-------------|
| `loadBookings(isRefresh?)` | Fetches current user's bookings with tutor name/initials/rate join |
| `handleCancelBooking(bookingId)` | Confirmation Alert → sets booking `status` to `cancelled` |
| `getStatusColor(status)` | Returns hex color for `confirmed` / `pending` / `completed` / `cancelled` |

### Booking Card Actions
- **"View Details"** — Alert showing tutor, topic, location, time, and status
- **"Cancel"** — Available only on `pending` bookings

---

## 📋 Become a Tutor Screen (`BecomeTutorScreen.js`)

Standalone tutor application form (alternate entry point to the in-profile modal).

### Functions
| Function | What It Does |
|----------|-------------|
| `handleSubmit()` | Validates all fields → checks auth → generates initials from name → parses comma-separated subjects → inserts to `tutor_applications` |

### Form Fields
| Field | Options / Input |
|-------|----------------|
| **Full Name** | Free-text |
| **CEA Program & Year** | Horizontal scrollable pill selector (8 options) |
| **Hourly Rate** | ₱60 · ₱75 · ₱85 · ₱100 |
| **Subjects** | Comma-separated free-text (e.g. "Calculus, Physics") |
| **Available Days** | Free-text (e.g. "Friday, Saturday, Sunday") |

### Verification Info
> Applications are reviewed within 48 hours. Transcripts and teaching credentials are verified before the tutor appears in the directory.

---

## 🗄️ Database Tables (Supabase)

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User accounts and roles | `id`, `full_name`, `role` (tutee/tutor/admin), `email` |
| `tutors` | Approved tutor directory listings | `id`, `user_id`, `name`, `initials`, `badge`, `program`, `subjects[]`, `rate`, `rating`, `reviews`, `days_display` |
| `bookings` | Session booking records | `id`, `student_id`, `tutor_id`, `topic`, `location`, `time`, `duration`, `payment_method`, `total_amount`, `status` |
| `tutor_applications` | Pending/reviewed tutor sign-up requests | `id`, `user_id`, `full_name`, `program`, `subjects[]`, `requested_rate`, `available_days`, `initials`, `status` |
| `crash_courses` | Group crash course listings | `id`, `title`, `subject`, `date`, `time`, `location`, `spots_left`, `price` |

---

## 👥 User Roles

| Role | Access | Key Capabilities |
|------|--------|-----------------|
| **tutee** | Default for new sign-ups | Browse tutors, book sessions, cancel pending bookings, apply to become tutor |
| **tutor** | Granted after application approval | All tutee features + view incoming booking requests, accept/decline sessions |
| **admin** | Pre-configured | All platform features + review/approve/reject tutor applications |

---

## 🔄 Key Workflows

### Booking a Tutoring Session
1. Browse tutors on **Tutors** tab (filter by subject or rate)
2. Tap **"View Profile & Book"** on a tutor card
3. Review tutor profile and tap **"Book a Session"**
4. Fill in topic, location, time, duration, and payment method
5. Review the price breakdown (5% platform fee added)
6. Tap **"Confirm Booking"** → booking created with `pending` status
7. Tutor sees the request in their **"Incoming Requests"** tab
8. Tutor taps **"Accept"** → status becomes `confirmed`

### Becoming a Peer Tutor
1. Sign in on the **Profile** tab
2. Tap **"Apply to Become a Tutor"**
3. Fill in the application form (program, subjects, rate, available days)
4. Submit → application saved with `pending` status
5. Admin logs in and reviews on the **Admin Dashboard**
6. Admin taps **"Approve"** → application status becomes `approved`
7. User's dashboard updates to show Tutor view

### Admin Reviewing Applications
1. Log in with `Admin@test.com` / `123456`
2. Navigate to **Profile** tab → tap **"Review Applications"**
3. Review each applicant card
4. Tap **"Approve"** or **"Reject"** and confirm the prompt
5. Application status updates in Supabase

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary Purple | `#7C3AED` | Buttons, active states, badges, accents |
| Light Purple | `#F3E8FF` | Avatar backgrounds, badge fills |
| Border Purple | `#DDD5FE` | Avatar borders, card borders |
| Success Green | `#10B981` | Confirmed status, Accept button |
| Warning Amber | `#D97706` | Pending status |
| Danger Red | `#DC2626` | Rejected/cancelled, Decline button |
| Background | `#F9FAFB` | Screen backgrounds |
| Card White | `#FFFFFF` | Card surfaces |
| Text Primary | `#111111` | Headings and key values |
| Text Secondary | `#666666` | Labels and subtitles |

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 57 / React Native 0.86.3 / React 19.2.3 |
| Navigation | React Navigation 6 (Bottom Tabs + Native Stack) |
| Backend / DB | Supabase (PostgreSQL + Auth + RLS) |
| Session Storage | `@react-native-async-storage/async-storage` 2.2.0 |
| Icons | `@expo/vector-icons` (Ionicons) |
| Build / Deploy | EAS Build (project ID: `602927cb-daf4-46fc-985a-bc93c7fbfa15`) |
| Supabase Project | `ikbumqwuntyuqygubixn.supabase.co` |

---

## 🧪 Test / Demo Accounts

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `Admin@test.com` | `123456` | Full access; can approve/reject tutor applications |
| Student | Create via sign-up | Any | Auto-created as `tutee` role |
| Tutor | Apply via Profile tab | — | Must be approved by admin first |

> **Quick Sign-Up:** On the Profile screen, enter any username (no `@` needed) and a password. The app automatically creates the account on first sign-in attempt if the user doesn't exist.

---

## ⚠️ Known Issues & Architectural Notes

### Critical Gaps
1. **Tutor Approval Does Not Auto-Create Directory Entry**
   - When admin approves a tutor application, the `tutor_applications.status` is updated to `approved`
   - However, NO entry is automatically created in the `tutors` table
   - Result: Approved tutors won't appear in the Tutors directory until manually added to the `tutors` table
   - **Workaround**: Admin must manually insert approved applicants into the `tutors` table or implement an automated trigger/function

2. **Dual Booking Screens**
   - Two separate screens exist: `BookingsScreen.js` (advanced, dual tutor/student view) and `MyBookingsScreen.js` (simpler, student-only)
   - App.js uses only `BookingsScreen`; `MyBookingsScreen` is redundant
   - Consider consolidating to avoid maintenance issues

3. **Deprecated BecomeTutorScreen**
   - Original tutor application screen still exists in src/screens/
   - Functionality now resides in ProfileScreen as a modal
   - Screen is unreachable via navigation but should be removed or clarified

### Navigation Architecture Note
- **Expo Router files** in `src/app/` are template defaults and NOT used
- **Actual navigation** is implemented in `App.js` using React Navigation (Bottom Tabs + Native Stacks)
- Expo Router files (index.tsx, explore.tsx) serve as unused templates

### Authentication Notes
- When a user signs in without an `@` symbol, the system auto-appends `@tutorme.local`
- Example: Username `Juan` becomes `Juan@tutorme.local`
- The admin account is pre-configured as `Admin@test.com` (already includes `@`, so no appending occurs)

---

*Generated: 2026-10-18 | TutorMe CEA v1.0.0*
