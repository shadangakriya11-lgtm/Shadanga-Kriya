# Shadanga Kriya - Test Cases Document

## Document Information

**Project:** Audio-Based Training Courses App (Shadanga Kriya)  
**Version:** 1.0  
**Date:** January 12, 2026  
**Test Type:** End-to-End Production-Grade Testing  
**Target Platform:** Android (Play Store Deployment)

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Authentication & User Management](#authentication--user-management)
3. [Public Pages (No Authentication)](#public-pages-no-authentication)
4. [Learner Mobile App](#learner-mobile-app)
5. [Admin Web Panel](#admin-web-panel)
6. [Facilitator Panel](#facilitator-panel)
7. [Security Testing](#security-testing)
8. [Performance Testing](#performance-testing)
9. [Device Compatibility](#device-compatibility)
10. [Offline Functionality](#offline-functionality)

---

## Test Environment Setup

### Prerequisites

- Android device (API 24+) or emulator
- Web browser (Chrome, Firefox, Safari)
- Test user accounts (Learner, Admin, Facilitator)
- Test payment gateway (Razorpay sandbox)
- Network simulation tools (for offline testing)

### Test Data

- **Admin Account:** admin@test.com / Admin@123
- **Facilitator Account:** facilitator@test.com / Faci@123
- **Learner Account:** learner@test.com / Learn@123
- **Test Course:** "Introduction to Meditation" (3 lessons, 60 min each)
- **Test Payment:** ₹999 (Razorpay test mode)

---

## 1. Authentication & User Management

### TC-AUTH-001: User Registration (Learner Only)

**Priority:** High  
**Type:** Functional

**Preconditions:**

- App is installed and launched
- No existing account with test email

**Test Steps:**

1. Navigate to registration screen
2. Enter valid details:
   - Email: newlearner@test.com
   - Password: Test@1234
   - First Name: Test
   - Last Name: User
3. Submit registration form

**Expected Results:**

- ✅ Registration successful
- ✅ User role is automatically set to "learner"
- ✅ JWT token is generated
- ✅ User is redirected to learner dashboard
- ✅ Admin receives notification about new registration

**Test Data:**

```json
{
  "email": "newlearner@test.com",
  "password": "Test@1234",
  "firstName": "Test",
  "lastName": "User"
}
```

---

### TC-AUTH-002: Login with Valid Credentials

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to login screen
2. Enter email: learner@test.com
3. Enter password: Learn@123
4. Click "Login"

**Expected Results:**

- ✅ Login successful
- ✅ JWT token stored securely
- ✅ User redirected to appropriate dashboard based on role
- ✅ Last active timestamp updated
- ✅ Login attempts counter reset to 0

---

### TC-AUTH-003: Login with Invalid Credentials

**Priority:** High  
**Type:** Negative Testing

**Test Steps:**

1. Navigate to login screen
2. Enter email: learner@test.com
3. Enter wrong password: WrongPass@123
4. Click "Login"

**Expected Results:**

- ✅ Login fails with error message
- ✅ "Invalid credentials" message displayed
- ✅ Login attempts counter incremented
- ✅ Remaining attempts shown (4 remaining after 1st failure)
- ✅ User remains on login screen

---

### TC-AUTH-004: Account Lockout After 5 Failed Attempts

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Attempt login with wrong password 5 times consecutively
2. Observe the response after 5th attempt
3. Wait 15 minutes
4. Attempt login with correct password

**Expected Results:**

- ✅ After 5 failed attempts, account is locked
- ✅ Error message: "Account locked due to multiple failed login attempts"
- ✅ `locked_until` timestamp set to current time + 15 minutes
- ✅ Login blocked for 15 minutes
- ✅ After 15 minutes, login with correct credentials succeeds
- ✅ Login attempts counter reset after successful login

---

### TC-AUTH-005: Password Reset Flow

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Click "Forgot Password" on login screen
2. Enter email: learner@test.com
3. Submit request
4. Check server logs for reset token
5. Navigate to reset URL with token
6. Enter new password: NewPass@123
7. Confirm new password
8. Submit reset form
9. Login with new password

**Expected Results:**

- ✅ Reset request accepted (generic success message)
- ✅ Reset token generated and stored in database
- ✅ Token expires after 1 hour
- ✅ Old tokens invalidated when new token generated
- ✅ Password reset successful with valid token
- ✅ Password meets strength requirements
- ✅ Token marked as "used" after successful reset
- ✅ Login with new password succeeds

---

### TC-AUTH-006: Strong Password Validation

**Priority:** High  
**Type:** Validation

**Test Data:**
| Password | Expected Result |
|----------|----------------|
| `weak` | ❌ Rejected - Too short |
| `weakpassword` | ❌ Rejected - No uppercase, number, special char |
| `WeakPass` | ❌ Rejected - No number, special char |
| `WeakPass1` | ❌ Rejected - No special char |
| `Weak@123` | ✅ Accepted - Meets all requirements |

**Expected Results:**

- ✅ Password must be at least 8 characters
- ✅ Must contain uppercase letter
- ✅ Must contain lowercase letter
- ✅ Must contain number
- ✅ Must contain special character (@$!%\*?&)

---

### TC-AUTH-007: JWT Token Expiration

**Priority:** Medium  
**Type:** Security

**Test Steps:**

1. Login successfully
2. Store JWT token
3. Wait for token expiration (7 days)
4. Attempt to access protected endpoint

**Expected Results:**

- ✅ Token expires after 7 days
- ✅ Expired token rejected with 401 Unauthorized
- ✅ User redirected to login screen
- ✅ Error message: "Session expired, please login again"

---

## 2. Public Pages (No Authentication)

### TC-PUBLIC-001: About Page Access

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Open app without logging in
2. Navigate to "About" page
3. Verify content is visible

**Expected Results:**

- ✅ Page loads without authentication
- ✅ Organization details displayed
- ✅ Team information visible
- ✅ Values and mission statement shown
- ✅ No course or lesson content accessible

---

### TC-PUBLIC-002: Vision/Mission Page

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Vision/Mission" page without login
2. Verify content accessibility

**Expected Results:**

- ✅ Page accessible without authentication
- ✅ Vision statement displayed
- ✅ Mission statement displayed
- ✅ Content properly formatted

---

### TC-PUBLIC-003: Gallery Page

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Gallery" page
2. Click on image thumbnails
3. Test image lightbox functionality

**Expected Results:**

- ✅ Gallery accessible without login
- ✅ Images load correctly
- ✅ Lightbox opens on image click
- ✅ Navigation between images works
- ✅ Close button functions properly
- ✅ No video content present (images only)

---

### TC-PUBLIC-004: Contact Page

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Contact" page
2. Fill contact form with valid data
3. Submit form

**Expected Results:**

- ✅ Contact form accessible without login
- ✅ Address, phone, email displayed
- ✅ Form submission works
- ✅ Validation errors shown for invalid input
- ✅ Success message after submission

---

### TC-PUBLIC-005: Protected Route Access Prevention

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Without logging in, attempt to access:
   - /learner/dashboard
   - /learner/courses
   - /admin/dashboard
   - /facilitator/dashboard

**Expected Results:**

- ✅ All protected routes redirect to login
- ✅ No course content accessible
- ✅ No audio files accessible
- ✅ Error message: "Please login to access this page"

---

## 3. Learner Mobile App

### 3.1 Course Discovery & Enrollment

### TC-LEARNER-001: View Available Courses

**Priority:** High  
**Type:** Functional

**Preconditions:**

- User logged in as learner
- At least 3 courses exist in system

**Test Steps:**

1. Navigate to "Courses" or "Home" screen
2. View list of available courses
3. Check course information displayed

**Expected Results:**

- ✅ All active courses displayed
- ✅ Course title visible
- ✅ Course description shown
- ✅ Course type badge (Self-paced/On-site)
- ✅ Duration displayed
- ✅ Lesson count shown
- ✅ Price displayed
- ✅ Thumbnail image loaded
- ✅ Status badge (Locked/Active/Completed)

---

### TC-LEARNER-002: Course Purchase Flow (Razorpay)

**Priority:** High  
**Type:** Integration

**Test Steps:**

1. Select a locked course (not enrolled)
2. Click "Purchase" or "Enroll"
3. Review course details and price
4. Click "Proceed to Payment"
5. Complete Razorpay payment (test mode)
6. Return to app after payment

**Expected Results:**

- ✅ Payment modal opens with course details
- ✅ Razorpay order created successfully
- ✅ Razorpay checkout opens
- ✅ Test payment completes successfully
- ✅ Payment webhook received by backend
- ✅ Enrollment created in database
- ✅ Course status changes to "Active"
- ✅ User redirected to course detail page
- ✅ Success notification shown

---

### TC-LEARNER-003: View Enrolled Courses Only

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Login as learner
2. Navigate to "My Courses"
3. Verify only enrolled courses shown

**Expected Results:**

- ✅ Only purchased/assigned courses displayed
- ✅ Locked courses not shown in "My Courses"
- ✅ Progress percentage displayed for each course
- ✅ Completion status visible

---

### 3.2 Lesson Access & Pre-Lesson Protocol

### TC-LEARNER-004: Sequential Lesson Unlocking

**Priority:** High  
**Type:** Business Logic

**Preconditions:**

- User enrolled in course with 3 lessons
- Lesson 1 not completed

**Test Steps:**

1. Open course detail page
2. Attempt to access Lesson 2 (without completing Lesson 1)
3. Complete Lesson 1
4. Attempt to access Lesson 2 again

**Expected Results:**

- ✅ Lesson 2 is locked initially
- ✅ Lock icon displayed on Lesson 2
- ✅ Click on Lesson 2 shows "Complete previous lesson first"
- ✅ After completing Lesson 1, Lesson 2 unlocks
- ✅ Lesson 2 becomes clickable
- ✅ Lesson 3 remains locked until Lesson 2 completed

---

### TC-LEARNER-005: Pre-Lesson Protocol - Flight Mode Check

**Priority:** High  
**Type:** Device Integration

**Test Steps:**

1. Click on available lesson
2. Pre-lesson protocol screen appears
3. Observe "Flight Mode Enabled" checkbox
4. Enable airplane mode on device
5. Click "Auto-check Device"
6. Observe checkbox status

**Expected Results:**

- ✅ Pre-lesson protocol screen displayed
- ✅ Flight mode checkbox initially unchecked
- ✅ Auto-check detects airplane mode when enabled
- ✅ Checkbox automatically checked when airplane mode detected
- ✅ Network status monitored in real-time
- ✅ If network detected, checkbox unchecks automatically
- ✅ Warning shown if network detected

---

### TC-LEARNER-006: Pre-Lesson Protocol - Earphone Check

**Priority:** High  
**Type:** Device Integration

**Test Steps:**

1. Navigate to pre-lesson protocol
2. Connect wired/Bluetooth earphones
3. Click "Auto-check Device"
4. Observe "Earphones Connected" checkbox

**Expected Results:**

- ✅ Earphone detection works on Android
- ✅ Checkbox auto-checked when earphones detected
- ✅ Toast notification: "Earphones detected"
- ✅ Works with wired headphones
- ✅ Works with Bluetooth headphones
- ✅ Manual checkbox override available

---

### TC-LEARNER-007: Pre-Lesson Protocol - Focus Commitment

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. On pre-lesson protocol screen
2. Check "Focus Commitment" checkbox
3. Verify all three checkboxes are checked
4. Click "Begin Session"

**Expected Results:**

- ✅ Focus commitment checkbox can be manually checked
- ✅ "Begin Session" button disabled until all checked
- ✅ "Begin Session" button enabled when all checked
- ✅ Button changes from gray to primary color
- ✅ Clicking button starts lesson

---

### TC-LEARNER-008: Pre-Lesson Protocol - Incomplete Checklist

**Priority:** Medium  
**Type:** Negative Testing

**Test Steps:**

1. On pre-lesson protocol screen
2. Check only 2 out of 3 items
3. Attempt to click "Begin Session"

**Expected Results:**

- ✅ "Begin Session" button remains disabled
- ✅ Button shows "Complete Checklist to Continue"
- ✅ Helper text: "Please confirm all items above to proceed"
- ✅ Lesson does not start

---

### TC-LEARNER-009: Admin-Configurable Protocol Checks

**Priority:** High  
**Type:** Configuration

**Preconditions:**

- Admin has disabled flight mode check in settings

**Test Steps:**

1. Admin disables "Flight Mode Check" in playback settings
2. Learner navigates to pre-lesson protocol
3. Observe checklist items

**Expected Results:**

- ✅ Flight mode checkbox not shown
- ✅ Only earphone and focus checks shown
- ✅ "Begin Session" enabled with 2 checks instead of 3
- ✅ Settings respected dynamically

---

### 3.3 Audio Playback & Controls

### TC-LEARNER-010: Audio Playback - Basic Play/Pause

**Priority:** High  
**Type:** Functional

**Preconditions:**

- Lesson downloaded for offline use
- Pre-lesson protocol completed
- Device in airplane mode

**Test Steps:**

1. Click "Begin Session"
2. Audio player screen loads
3. Click play button
4. Wait 10 seconds
5. Click pause button
6. Observe pause counter

**Expected Results:**

- ✅ Audio player loads successfully
- ✅ Play button visible and functional
- ✅ Audio starts playing
- ✅ Progress bar updates in real-time
- ✅ Current time updates every second
- ✅ Pause button works
- ✅ Audio pauses immediately
- ✅ Pause counter decrements (e.g., 3 → 2)
- ✅ Wake lock acquired during playback
- ✅ Wake lock released on pause

---

### TC-LEARNER-011: Audio Playback - Offline Enforcement

**Priority:** High  
**Type:** Business Logic

**Test Steps:**

1. Start lesson playback in airplane mode
2. Audio playing successfully
3. Disable airplane mode (connect to network)
4. Observe behavior

**Expected Results:**

- ✅ Audio pauses immediately when network detected
- ✅ Warning message: "Internet connection detected. Please disconnect to continue playback."
- ✅ Play button disabled while online
- ✅ Badge shows "Online - Go Offline"
- ✅ Re-enabling airplane mode allows playback to resume

---

### TC-LEARNER-012: Audio Playback - No Seeking

**Priority:** High  
**Type:** Business Logic

**Test Steps:**

1. Start audio playback
2. Attempt to click/drag progress bar
3. Attempt to skip forward/backward

**Expected Results:**

- ✅ Progress bar is non-interactive
- ✅ No seek controls visible
- ✅ Cannot skip to different time position
- ✅ Footer notice: "Seeking is disabled. Please listen continuously for best results."

---

### TC-LEARNER-013: Pause Limit - 3 Pauses Maximum

**Priority:** High  
**Type:** Business Logic

**Test Steps:**

1. Start lesson playback
2. Pause audio (1st pause)
3. Resume and pause again (2nd pause)
4. Resume and pause again (3rd pause)
5. Attempt to resume and pause again (4th attempt)

**Expected Results:**

- ✅ First 3 pauses work normally
- ✅ Pause counter shows: "3 pauses remaining" → "2" → "1" → "0"
- ✅ After 3rd pause, counter shows "0 pauses remaining"
- ✅ 30-second auto-complete timer starts
- ✅ Warning: "Auto-completing in 30 seconds. Contact admin for additional pauses."
- ✅ After 30 seconds, lesson marked as complete
- ✅ Completion screen shown

---

### TC-LEARNER-014: Pause Limit - Resume Before Auto-Complete

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Use all 3 pauses
2. 30-second timer starts
3. Resume playback within 30 seconds
4. Observe behavior

**Expected Results:**

- ✅ Timer cancelled when playback resumed
- ✅ Audio continues playing
- ✅ Lesson not auto-completed
- ✅ User can continue listening
- ✅ No more pauses available

---

### TC-LEARNER-015: Audio Playback - Screen Lock (Wake Lock)

**Priority:** Medium  
**Type:** Device Integration

**Test Steps:**

1. Start audio playback
2. Wait for device screen timeout period
3. Observe screen behavior

**Expected Results:**

- ✅ Screen stays on during playback (wake lock active)
- ✅ Screen dims but doesn't turn off
- ✅ Audio continues playing
- ✅ When paused, wake lock released
- ✅ Screen can turn off when paused

---

### TC-LEARNER-016: Audio Playback - Background Playback Prevention

**Priority:** High  
**Type:** Business Logic

**Test Steps:**

1. Start audio playback
2. Press home button (minimize app)
3. Observe audio behavior
4. Return to app

**Expected Results:**

- ✅ Audio pauses when app goes to background
- ✅ Pause counter decremented
- ✅ When returning to app, audio remains paused
- ✅ User must manually resume

---

### TC-LEARNER-017: Audio Playback - Encrypted Audio Loading

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Download lesson for offline use
2. Check device file system
3. Attempt to play audio file directly
4. Start lesson in app

**Expected Results:**

- ✅ Audio file stored in encrypted format (AES-256-CBC)
- ✅ File not playable outside app
- ✅ File manager shows encrypted blob
- ✅ App successfully decrypts and plays audio
- ✅ Blob URL created for in-app playback only

---

### TC-LEARNER-018: Lesson Completion

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Start lesson playback
2. Let audio play to completion (or fast-forward in test mode)
3. Observe completion screen

**Expected Results:**

- ✅ Audio plays to end
- ✅ Completion screen displayed
- ✅ Success icon and message shown
- ✅ "Continue to Course" button visible
- ✅ Lesson marked as completed in database
- ✅ Progress percentage updated
- ✅ Next lesson unlocked (if applicable)
- ✅ Certificate generated if course completed

---

### TC-LEARNER-019: Audio Download for Offline Use

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to course detail page
2. Click download icon on lesson
3. Wait for download to complete
4. Verify download status

**Expected Results:**

- ✅ Download button visible on each lesson
- ✅ Download progress indicator shown
- ✅ Audio encrypted during download
- ✅ Download stored in secure local storage
- ✅ "Downloaded" badge shown after completion
- ✅ Lesson playable offline
- ✅ Download size displayed

---

### 3.4 On-Site Course Flow

### TC-LEARNER-020: On-Site Course - Attendance Requirement

**Priority:** High  
**Type:** Business Logic

**Preconditions:**

- User enrolled in on-site course
- Facilitator has not marked attendance

**Test Steps:**

1. Navigate to on-site course detail
2. Attempt to start lesson
3. Observe behavior

**Expected Results:**

- ✅ Lesson shows "Attendance Required" status
- ✅ Lesson is locked
- ✅ Message: "Please check in with facilitator to mark attendance"
- ✅ Cannot access pre-lesson protocol
- ✅ Cannot start lesson

---

### TC-LEARNER-021: On-Site Course - After Attendance Marked

**Priority:** High  
**Type:** Business Logic

**Preconditions:**

- Facilitator has marked attendance for user

**Test Steps:**

1. Refresh course detail page
2. Observe lesson status
3. Click on lesson
4. Complete pre-lesson protocol
5. Start lesson

**Expected Results:**

- ✅ Lesson unlocked after attendance marked
- ✅ "Attendance Required" badge removed
- ✅ Pre-lesson protocol accessible
- ✅ Lesson starts normally
- ✅ Same playback rules apply (offline, pauses, etc.)

---

### 3.5 Progress & History

### TC-LEARNER-022: View Course Progress

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Progress" page
2. View enrolled courses
3. Check progress details

**Expected Results:**

- ✅ All enrolled courses listed
- ✅ Progress percentage displayed (0-100%)
- ✅ Completed lessons count shown
- ✅ Total lessons count shown
- ✅ Time spent displayed
- ✅ Completion date shown (if completed)

---

### TC-LEARNER-023: View Payment History

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Progress" page
2. Click "Payments" tab
3. View payment history

**Expected Results:**

- ✅ All payments listed chronologically
- ✅ Course name displayed
- ✅ Amount paid shown
- ✅ Payment date visible
- ✅ Payment status (Success/Failed/Pending)
- ✅ Transaction ID displayed
- ✅ Payment method shown

---

### TC-LEARNER-024: Dashboard Statistics

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Login as learner
2. Navigate to dashboard
3. View statistics

**Expected Results:**

- ✅ Total enrolled courses count displayed
- ✅ Completed courses count shown
- ✅ In-progress courses count visible
- ✅ Total time spent displayed (hours/minutes)
- ✅ Recent activity shown
- ✅ Next lesson recommendation displayed

---

## 4. Admin Web Panel

### 4.1 Admin Authentication & Dashboard

### TC-ADMIN-001: Admin Login

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to admin login page
2. Enter admin credentials
3. Submit login form

**Expected Results:**

- ✅ Admin can login successfully
- ✅ Redirected to admin dashboard
- ✅ Admin role verified
- ✅ Admin menu items visible
- ✅ Learner/Facilitator features not accessible

---

### TC-ADMIN-002: Admin Dashboard Overview

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Login as admin
2. View dashboard

**Expected Results:**

- ✅ Total users count displayed
- ✅ Total courses count shown
- ✅ Active enrollments count visible
- ✅ Revenue statistics displayed
- ✅ Recent activities shown
- ✅ Charts and graphs render correctly
- ✅ Quick action buttons available

---

### 4.2 User Management

### TC-ADMIN-003: Create New User (Manual)

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Users" section
2. Click "Add User"
3. Fill user details:
   - Email: testuser@example.com
   - Password: Test@1234
   - First Name: Test
   - Last Name: User
   - Role: Learner
4. Submit form

**Expected Results:**

- ✅ User creation form opens
- ✅ All fields validated
- ✅ User created successfully
- ✅ User appears in user list
- ✅ Default status: Active
- ✅ Notification sent to user (if configured)

---

### TC-ADMIN-004: Create Admin/Facilitator User

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Click "Add User"
2. Select role: "Admin" or "Facilitator"
3. Fill required details
4. Submit form

**Expected Results:**

- ✅ Admin can create admin/facilitator accounts
- ✅ Role properly assigned
- ✅ Appropriate permissions granted
- ✅ User can login with assigned role

---

### TC-ADMIN-005: Activate/Deactivate User

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to user list
2. Find active user
3. Click "Deactivate" button
4. Confirm action
5. User attempts to login

**Expected Results:**

- ✅ User status changed to "Inactive"
- ✅ Deactivated user cannot login
- ✅ Error: "Account is not active"
- ✅ Reactivation restores login access

---

### TC-ADMIN-006: Reset User Password

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to user list
2. Click "Edit" on user
3. Enter new password: NewPass@123
4. Save changes
5. User logs in with new password

**Expected Results:**

- ✅ Password reset successful
- ✅ Old password no longer works
- ✅ New password works immediately
- ✅ Password meets strength requirements

---

### TC-ADMIN-007: Assign Course to User

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to user detail page
2. Click "Assign Course"
3. Select course from dropdown
4. Submit assignment

**Expected Results:**

- ✅ Course assigned to user
- ✅ Enrollment created in database
- ✅ User can see course in "My Courses"
- ✅ No payment required for admin assignment
- ✅ Course status: Active

---

### 4.3 Course Management

### TC-ADMIN-008: Create New Course

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Courses" section
2. Click "Add Course"
3. Fill course details:
   - Title: "Advanced Meditation"
   - Description: "Deep meditation techniques"
   - Type: Self-paced
   - Price: ₹1499
   - Duration: 10 hours
   - Category: Meditation
4. Upload thumbnail image
5. Submit form

**Expected Results:**

- ✅ Course created successfully
- ✅ Course appears in course list
- ✅ Default status: Draft
- ✅ Creator name recorded
- ✅ Thumbnail uploaded and displayed
- ✅ All fields saved correctly

---

### TC-ADMIN-009: Edit Existing Course

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to course list
2. Click "Edit" on course
3. Modify title and price
4. Save changes

**Expected Results:**

- ✅ Course details updated
- ✅ Changes reflected immediately
- ✅ Updated timestamp recorded
- ✅ Enrolled users see updated info

---

### TC-ADMIN-010: Activate/Deactivate Course

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Select draft course
2. Change status to "Active"
3. Save changes
4. Verify course visibility

**Expected Results:**

- ✅ Course status changed to Active
- ✅ Course visible to learners
- ✅ Course appears in public catalog
- ✅ Deactivating hides from learners

---

### TC-ADMIN-011: Delete Course

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Select course with no enrollments
2. Click "Delete"
3. Confirm deletion

**Expected Results:**

- ✅ Confirmation dialog shown
- ✅ Course deleted from database
- ✅ Course removed from list
- ✅ Cannot delete course with active enrollments

---

### 4.4 Lesson Management

### TC-ADMIN-012: Add Lesson to Course

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to course detail
2. Click "Add Lesson"
3. Fill lesson details:
   - Title: "Breathing Techniques"
   - Description: "Learn proper breathing"
   - Duration: 60 minutes
   - Max Pauses: 3
   - Order: 1
4. Upload encrypted audio file
5. Submit form

**Expected Results:**

- ✅ Lesson created successfully
- ✅ Audio file uploaded and encrypted
- ✅ Lesson appears in course lessons list
- ✅ Order index set correctly
- ✅ Duration and pause settings saved

---

### TC-ADMIN-013: Upload Audio File with Encryption

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Create/edit lesson
2. Upload audio file (MP3, 50MB)
3. Wait for upload to complete
4. Verify file storage

**Expected Results:**

- ✅ File upload progress shown
- ✅ File encrypted with AES-256-CBC
- ✅ Encrypted file stored securely
- ✅ Original file not accessible
- ✅ File size and duration extracted
- ✅ Audio URL stored in database

---

### TC-ADMIN-014: Set Lesson Duration and Rules

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Edit lesson
2. Set duration: 65 minutes
3. Set max pauses: 5
4. Set access code (optional)
5. Save changes

**Expected Results:**

- ✅ Duration saved correctly
- ✅ Max pauses setting applied
- ✅ Access code stored (if provided)
- ✅ Settings enforced during playback

---

### TC-ADMIN-015: Reorder Lessons

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to course lessons
2. Drag lesson to new position
3. Save order

**Expected Results:**

- ✅ Lesson order updated
- ✅ Order index recalculated
- ✅ Sequential unlocking respects new order
- ✅ Changes visible to learners immediately

---

### 4.5 Lesson Monitoring & Control

### TC-ADMIN-016: View Lesson Statistics

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Monitoring" section
2. Select course and lesson
3. View statistics

**Expected Results:**

- ✅ Total plays count displayed
- ✅ Completed count shown
- ✅ Skipped/Interrupted count visible
- ✅ Average completion time displayed
- ✅ Pause usage statistics shown
- ✅ User-wise breakdown available

---

### TC-ADMIN-017: Grant Extra Pause to User

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to monitoring page
2. Find user who exhausted pauses
3. Click "Grant Extra Pause"
4. Specify number of pauses (e.g., 3)
5. Confirm action

**Expected Results:**

- ✅ Extra pauses granted successfully
- ✅ User's pause counter updated
- ✅ User can resume lesson
- ✅ Action logged in system
- ✅ Admin notification sent

---

### TC-ADMIN-018: Reset Lesson Progress

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to user's lesson progress
2. Click "Reset Progress"
3. Confirm action

**Expected Results:**

- ✅ Lesson progress deleted
- ✅ User can restart lesson
- ✅ Pause counter reset
- ✅ Time spent reset to 0
- ✅ Course progress percentage recalculated

---

### TC-ADMIN-019: Lock Lesson for User

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to monitoring
2. Select user and lesson
3. Click "Lock Lesson"
4. Confirm action

**Expected Results:**

- ✅ Lesson locked for user
- ✅ Status changed to "Interrupted"
- ✅ User cannot access lesson
- ✅ Lock icon displayed to user
- ✅ Admin can unlock later

---

### 4.6 Payment Management

### TC-ADMIN-020: View All Transactions

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Payments" section
2. View transaction list
3. Apply filters (date range, status)

**Expected Results:**

- ✅ All transactions listed
- ✅ Transaction details displayed:
  - User name
  - Course name
  - Amount
  - Payment date
  - Status
  - Transaction ID
- ✅ Filters work correctly
- ✅ Pagination works

---

### TC-ADMIN-021: Manual Course Activation

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to payments
2. Find pending payment
3. Click "Manual Activation"
4. Confirm activation

**Expected Results:**

- ✅ Course activated for user
- ✅ Enrollment created
- ✅ Payment status updated
- ✅ User can access course
- ✅ Action logged

---

### TC-ADMIN-022: Configure Payment Gateway

**Priority:** High  
**Type:** Configuration

**Test Steps:**

1. Navigate to "Settings" > "Payment"
2. Enter Razorpay credentials:
   - Key ID
   - Key Secret
3. Save settings
4. Test payment flow

**Expected Results:**

- ✅ Credentials saved securely
- ✅ Payment gateway initialized
- ✅ Test payment works
- ✅ Webhooks configured correctly

---

### TC-ADMIN-023: Download Payment Reports

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to payments
2. Select date range
3. Click "Export CSV"
4. Click "Export PDF"

**Expected Results:**

- ✅ CSV file downloads with all transactions
- ✅ PDF report generates correctly
- ✅ All columns included
- ✅ Formatting correct
- ✅ File names include date range

---

### 4.7 Facilitator Management

### TC-ADMIN-024: Create Facilitator Account

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Sub Admins" section
2. Click "Add Sub-Admin"
3. Fill details:
   - Email: facilitator@test.com
   - Password: Faci@1234
   - First Name: Test
   - Last Name: Facilitator
   - Role: Facilitator
4. Assign permissions:
   - ✓ Mark Attendance
   - ✓ View Sessions
5. Assign courses
6. Submit form

**Expected Results:**

- ✅ Facilitator account created
- ✅ Permissions saved correctly
- ✅ Course assignments recorded
- ✅ Facilitator can login
- ✅ Only assigned permissions available

---

### TC-ADMIN-025: Assign Courses to Facilitator

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Edit facilitator account
2. Select courses to assign
3. Save changes

**Expected Results:**

- ✅ Courses assigned successfully
- ✅ Facilitator can see only assigned courses
- ✅ Facilitator can manage assigned courses only

---

### TC-ADMIN-026: Control Facilitator Permissions

**Priority:** High  
**Type:** Authorization

**Test Steps:**

1. Edit facilitator
2. Enable/disable permissions:
   - Mark Attendance
   - View Reports
   - Supervise Sessions
3. Save changes
4. Facilitator logs in

**Expected Results:**

- ✅ Permissions updated
- ✅ Facilitator UI reflects permissions
- ✅ Disabled features not accessible
- ✅ API endpoints enforce permissions

---

### 4.8 Analytics & Reports

### TC-ADMIN-027: View Course Completion Analytics

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Analytics" section
2. View course performance chart

**Expected Results:**

- ✅ Chart displays course-wise completion rates
- ✅ Data accurate and up-to-date
- ✅ Interactive chart (hover, click)
- ✅ Export option available

---

### TC-ADMIN-028: View User Engagement Analytics

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to analytics
2. View engagement metrics

**Expected Results:**

- ✅ Weekly engagement chart displayed
- ✅ Active users count shown
- ✅ Average session duration displayed
- ✅ Trend analysis available

---

### TC-ADMIN-029: View Lesson Interruption Data

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to analytics
2. View session outcomes

**Expected Results:**

- ✅ Pie chart shows:
  - Completed sessions
  - Interrupted sessions
  - Skipped sessions
- ✅ Percentages calculated correctly
- ✅ Data filterable by date range

---

### TC-ADMIN-030: Payment Summary Analytics

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to analytics
2. View revenue section

**Expected Results:**

- ✅ Total revenue displayed
- ✅ Revenue by course shown
- ✅ Monthly revenue trend chart
- ✅ Payment success rate displayed

---

### 4.9 Playback Settings Configuration

### TC-ADMIN-031: Configure Pre-Lesson Protocol Checks

**Priority:** High  
**Type:** Configuration

**Test Steps:**

1. Navigate to "Settings" > "Playback"
2. Toggle settings:
   - Flight Mode Check: ON/OFF
   - Earphone Check: ON/OFF
   - Offline Mode Required: ON/OFF
3. Save settings
4. Learner starts lesson

**Expected Results:**

- ✅ Settings saved successfully
- ✅ Changes applied immediately
- ✅ Learner sees updated protocol
- ✅ Disabled checks auto-checked
- ✅ Enforcement respects settings

---

### TC-ADMIN-032: Configure Pause Behavior

**Priority:** High  
**Type:** Configuration

**Test Steps:**

1. Navigate to playback settings
2. Configure:
   - Auto-skip on max pauses: ON/OFF
   - Auto-skip delay: 30 seconds
   - Screen lock: ON/OFF
3. Save settings

**Expected Results:**

- ✅ Settings saved
- ✅ Auto-skip behavior updated
- ✅ Delay time respected
- ✅ Screen lock setting applied
- ✅ All learners affected

---

## 5. Facilitator Panel

### TC-FACILITATOR-001: Facilitator Login

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to login page
2. Enter facilitator credentials
3. Submit login

**Expected Results:**

- ✅ Facilitator logs in successfully
- ✅ Redirected to facilitator dashboard
- ✅ Only assigned courses visible
- ✅ Permissions enforced

---

### TC-FACILITATOR-002: View Assigned Courses

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Login as facilitator
2. Navigate to "Courses"

**Expected Results:**

- ✅ Only assigned courses displayed
- ✅ Course details visible
- ✅ Lesson list accessible
- ✅ Cannot see unassigned courses

---

### TC-FACILITATOR-003: Mark Attendance

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Attendance"
2. Select course and session
3. Select learners present
4. Click "Mark Attendance"
5. Submit

**Expected Results:**

- ✅ Attendance form loads
- ✅ Enrolled learners listed
- ✅ Checkboxes for each learner
- ✅ Attendance saved successfully
- ✅ Learners can access lessons
- ✅ Timestamp recorded

---

### TC-FACILITATOR-004: View Attendance History

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Attendance" > "History"
2. Select course
3. View attendance records

**Expected Results:**

- ✅ All attendance records displayed
- ✅ Date and time shown
- ✅ Learner names listed
- ✅ Present/Absent status visible
- ✅ Filterable by date range

---

### TC-FACILITATOR-005: Export Attendance Report

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to attendance history
2. Select date range
3. Click "Export CSV"

**Expected Results:**

- ✅ CSV file downloads
- ✅ All attendance data included
- ✅ Proper formatting
- ✅ File name includes date range

---

### TC-FACILITATOR-006: Supervise Live Sessions

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Sessions"
2. View active sessions
3. Monitor learner progress

**Expected Results:**

- ✅ Active sessions listed
- ✅ Learner names shown
- ✅ Current lesson displayed
- ✅ Progress percentage visible
- ✅ Real-time updates

---

### TC-FACILITATOR-007: View Session Reports

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Reports"
2. Select course
3. View session statistics

**Expected Results:**

- ✅ Total sessions count
- ✅ Completion rate displayed
- ✅ Average duration shown
- ✅ Learner-wise breakdown available

---

## 6. Security Testing

### TC-SECURITY-001: SQL Injection Prevention

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Attempt SQL injection in login form:
   - Email: `admin@test.com' OR '1'='1`
   - Password: `anything`
2. Attempt in search fields
3. Attempt in filter parameters

**Expected Results:**

- ✅ All inputs sanitized
- ✅ Parameterized queries used
- ✅ No SQL errors exposed
- ✅ Injection attempts logged
- ✅ No unauthorized access

---

### TC-SECURITY-002: XSS (Cross-Site Scripting) Prevention

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Attempt XSS in user input fields:
   - Name: `<script>alert('XSS')</script>`
   - Description: `<img src=x onerror=alert('XSS')>`
2. Submit forms
3. View rendered content

**Expected Results:**

- ✅ Scripts not executed
- ✅ HTML entities escaped
- ✅ Content sanitized
- ✅ No JavaScript execution
- ✅ CSP headers prevent inline scripts

---

### TC-SECURITY-003: JWT Token Security

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Login and capture JWT token
2. Decode token (jwt.io)
3. Attempt to modify token
4. Use modified token in API request
5. Wait for token expiration (7 days)

**Expected Results:**

- ✅ Token contains only user ID
- ✅ No sensitive data in token
- ✅ Modified token rejected
- ✅ Signature verification works
- ✅ Expired token rejected
- ✅ 401 Unauthorized returned

---

### TC-SECURITY-004: Password Hashing

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Create user with password: Test@1234
2. Check database password_hash field
3. Verify bcrypt hash format
4. Attempt to login with hash directly

**Expected Results:**

- ✅ Password stored as bcrypt hash
- ✅ Hash starts with $2a$ or $2b$
- ✅ 12 rounds used (cost factor)
- ✅ Plain password not stored
- ✅ Hash cannot be used for login

---

### TC-SECURITY-005: CORS Policy Enforcement

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Attempt API request from unauthorized origin
2. Check CORS headers in response
3. Verify allowed origins

**Expected Results:**

- ✅ Only whitelisted origins allowed
- ✅ CORS headers present
- ✅ Unauthorized origins blocked
- ✅ Preflight requests handled
- ✅ Credentials allowed only for trusted origins

---

### TC-SECURITY-006: Rate Limiting

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Make 100+ requests to API in 15 minutes
2. Attempt 10+ login requests in 15 minutes
3. Attempt 5+ registration requests in 1 hour

**Expected Results:**

- ✅ General API: 100 requests per 15 min limit
- ✅ Login: 5 requests per 15 min limit
- ✅ Registration: 3 requests per hour limit
- ✅ 429 Too Many Requests returned
- ✅ Retry-After header present

---

### TC-SECURITY-007: Helmet Security Headers

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Make API request
2. Inspect response headers

**Expected Results:**

- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Strict-Transport-Security present
- ✅ Content-Security-Policy present

---

### TC-SECURITY-008: Audio File Encryption

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Download lesson for offline use
2. Locate audio file in device storage
3. Attempt to play file with media player
4. Attempt to copy file to another device

**Expected Results:**

- ✅ File stored in encrypted format
- ✅ AES-256-CBC encryption used
- ✅ File not playable outside app
- ✅ File manager shows encrypted blob
- ✅ Copying file doesn't allow playback

---

### TC-SECURITY-009: Role-Based Access Control

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Login as learner
2. Attempt to access admin endpoints:
   - GET /api/admin/users
   - POST /api/admin/courses
3. Attempt to access facilitator endpoints

**Expected Results:**

- ✅ 403 Forbidden returned
- ✅ Error: "Insufficient permissions"
- ✅ No data leaked
- ✅ Action logged
- ✅ Role verification enforced

---

### TC-SECURITY-010: Session Hijacking Prevention

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Login from Device A
2. Copy JWT token
3. Use token on Device B
4. Logout from Device A
5. Attempt to use token on Device B

**Expected Results:**

- ✅ Token works on multiple devices (stateless)
- ✅ Token expires after 7 days
- ✅ No session fixation possible
- ✅ Logout doesn't invalidate token (client-side removal)
- ✅ Token refresh not implemented (7-day expiry)

---

## 7. Performance Testing

### TC-PERFORMANCE-001: Page Load Time

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Clear browser cache
2. Navigate to home page
3. Measure load time
4. Navigate to course detail page
5. Measure load time

**Expected Results:**

- ✅ Home page loads in < 3 seconds
- ✅ Course detail loads in < 2 seconds
- ✅ Images lazy-loaded
- ✅ No blocking resources
- ✅ Lighthouse score > 80

---

### TC-PERFORMANCE-002: API Response Time

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Make API requests and measure response time:
   - GET /api/courses
   - GET /api/courses/:id
   - POST /api/auth/login
   - GET /api/progress/course/:id

**Expected Results:**

- ✅ Course list: < 500ms
- ✅ Course detail: < 300ms
- ✅ Login: < 400ms
- ✅ Progress: < 400ms
- ✅ Database queries optimized

---

### TC-PERFORMANCE-003: Audio Streaming Performance

**Priority:** High  
**Type:** Performance

**Test Steps:**

1. Start lesson playback
2. Monitor audio buffering
3. Check memory usage
4. Play for 10 minutes

**Expected Results:**

- ✅ Audio starts within 2 seconds
- ✅ No buffering during playback
- ✅ Memory usage stable
- ✅ No memory leaks
- ✅ Smooth playback

---

### TC-PERFORMANCE-004: Concurrent Users

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Simulate 50 concurrent users
2. All users login simultaneously
3. All users browse courses
4. Monitor server performance

**Expected Results:**

- ✅ Server handles 50+ concurrent users
- ✅ Response times remain acceptable
- ✅ No timeouts
- ✅ No server crashes
- ✅ Database connections managed

---

### TC-PERFORMANCE-005: Large File Upload

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Upload audio file (100MB)
2. Monitor upload progress
3. Verify encryption performance

**Expected Results:**

- ✅ Upload completes successfully
- ✅ Progress indicator accurate
- ✅ Encryption doesn't timeout
- ✅ File size limit enforced (10MB payload limit)
- ✅ Error handling for large files

---

## 8. Device Compatibility

### TC-DEVICE-001: Android Version Compatibility

**Priority:** High  
**Type:** Compatibility

**Test Devices:**

- Android 7.0 (API 24)
- Android 10.0 (API 29)
- Android 12.0 (API 31)
- Android 13.0 (API 33)

**Test Steps:**

1. Install app on each device
2. Test core functionality
3. Test device-specific features

**Expected Results:**

- ✅ App installs on all versions
- ✅ UI renders correctly
- ✅ All features work
- ✅ Device checks work (flight mode, earphones)
- ✅ Audio playback works
- ✅ No crashes

---

### TC-DEVICE-002: Screen Size Compatibility

**Priority:** High  
**Type:** Compatibility

**Test Devices:**

- Small phone (5" screen)
- Medium phone (6" screen)
- Large phone (6.5" screen)
- Tablet (10" screen)

**Test Steps:**

1. Open app on each device
2. Navigate through all screens
3. Test UI responsiveness

**Expected Results:**

- ✅ UI adapts to screen size
- ✅ No content cut off
- ✅ Buttons accessible
- ✅ Text readable
- ✅ Images scale properly

---

### TC-DEVICE-003: Browser Compatibility (Web Admin)

**Priority:** High  
**Type:** Compatibility

**Test Browsers:**

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Test Steps:**

1. Open admin panel in each browser
2. Test all admin features
3. Verify UI consistency

**Expected Results:**

- ✅ Admin panel works in all browsers
- ✅ UI consistent across browsers
- ✅ No JavaScript errors
- ✅ All features functional

---

### TC-DEVICE-004: Orientation Change

**Priority:** Medium  
**Type:** Compatibility

**Test Steps:**

1. Open app in portrait mode
2. Rotate device to landscape
3. Navigate through screens
4. Start lesson playback
5. Rotate during playback

**Expected Results:**

- ✅ UI adapts to orientation
- ✅ No data loss on rotation
- ✅ Audio continues playing
- ✅ Layout remains usable
- ✅ No crashes

---

### TC-DEVICE-005: Low-End Device Performance

**Priority:** Medium  
**Type:** Performance

**Test Device:**

- Android device with 2GB RAM
- Older processor (Snapdragon 400 series)

**Test Steps:**

1. Install and run app
2. Test audio playback
3. Monitor performance

**Expected Results:**

- ✅ App runs smoothly
- ✅ Audio plays without stuttering
- ✅ UI responsive
- ✅ No excessive battery drain
- ✅ Memory usage acceptable

---

## 9. Offline Functionality

### TC-OFFLINE-001: Download Lesson for Offline Use

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Connect to internet
2. Navigate to course detail
3. Click download icon on lesson
4. Wait for download to complete
5. Verify download status

**Expected Results:**

- ✅ Download starts immediately
- ✅ Progress indicator shown
- ✅ Download completes successfully
- ✅ "Downloaded" badge displayed
- ✅ File stored in encrypted format
- ✅ Download size displayed

---

### TC-OFFLINE-002: Play Downloaded Lesson Offline

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Download lesson
2. Enable airplane mode
3. Navigate to lesson
4. Complete pre-lesson protocol
5. Start playback

**Expected Results:**

- ✅ Lesson accessible offline
- ✅ Pre-lesson protocol works
- ✅ Audio plays smoothly
- ✅ All playback controls work
- ✅ Progress tracked locally
- ✅ No network errors

---

### TC-OFFLINE-003: Progress Sync After Going Online

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Complete lesson offline
2. Disable airplane mode
3. Connect to internet
4. Wait for sync

**Expected Results:**

- ✅ Progress syncs automatically
- ✅ Completion status updated on server
- ✅ Next lesson unlocked
- ✅ Course progress updated
- ✅ No data loss

---

### TC-OFFLINE-004: Offline Mode Enforcement

**Priority:** High  
**Type:** Business Logic

**Test Steps:**

1. Start lesson in airplane mode
2. Audio playing
3. Disable airplane mode (connect to network)
4. Observe behavior

**Expected Results:**

- ✅ Audio pauses immediately
- ✅ Warning message displayed
- ✅ Play button disabled
- ✅ Badge shows "Online - Go Offline"
- ✅ Re-enabling airplane mode allows resume

---

### TC-OFFLINE-005: Download Management

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Download multiple lessons
2. View downloaded lessons list
3. Delete downloaded lesson
4. Re-download lesson

**Expected Results:**

- ✅ All downloads tracked
- ✅ Storage space shown
- ✅ Delete removes encrypted file
- ✅ Re-download works
- ✅ No duplicate downloads

---

## 10. Edge Cases & Error Handling

### TC-EDGE-001: Empty Course (No Lessons)

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Admin creates course
2. Don't add any lessons
3. Activate course
4. Learner enrolls in course
5. Learner views course detail

**Expected Results:**

- ✅ Course displays with 0 lessons
- ✅ Message: "No lessons available yet"
- ✅ No errors
- ✅ Progress shows 0%

---

### TC-EDGE-002: Network Interruption During Payment

**Priority:** High  
**Type:** Edge Case

**Test Steps:**

1. Start payment process
2. Disconnect network during payment
3. Reconnect network
4. Check payment status

**Expected Results:**

- ✅ Payment gateway handles interruption
- ✅ Webhook retries delivery
- ✅ Payment status eventually updated
- ✅ No duplicate charges
- ✅ User notified of status

---

### TC-EDGE-003: Audio File Corruption

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Corrupt downloaded audio file
2. Attempt to play lesson
3. Observe error handling

**Expected Results:**

- ✅ Error message displayed
- ✅ "Failed to decrypt offline audio"
- ✅ Suggestion to re-download
- ✅ No app crash
- ✅ User can re-download

---

### TC-EDGE-004: Simultaneous Login from Multiple Devices

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Login on Device A
2. Login on Device B with same credentials
3. Use app on both devices

**Expected Results:**

- ✅ Both logins successful (stateless JWT)
- ✅ Both devices work independently
- ✅ Progress syncs from both
- ✅ No conflicts
- ✅ Last update wins

---

### TC-EDGE-005: Expired JWT Token

**Priority:** High  
**Type:** Edge Case

**Test Steps:**

1. Login successfully
2. Wait 7 days (or modify token expiry for testing)
3. Attempt to access protected resource

**Expected Results:**

- ✅ 401 Unauthorized returned
- ✅ User redirected to login
- ✅ Error: "Session expired"
- ✅ User can login again
- ✅ New token issued

---

### TC-EDGE-006: Database Connection Failure

**Priority:** High  
**Type:** Error Handling

**Test Steps:**

1. Stop database server
2. Attempt to login
3. Attempt to fetch courses

**Expected Results:**

- ✅ Graceful error handling
- ✅ User-friendly error message
- ✅ No server crash
- ✅ Error logged
- ✅ Retry mechanism (if implemented)

---

### TC-EDGE-007: Invalid File Upload

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Attempt to upload non-audio file as lesson audio
2. Attempt to upload file > 100MB
3. Attempt to upload corrupted audio file

**Expected Results:**

- ✅ File type validation
- ✅ File size validation
- ✅ Error messages displayed
- ✅ Upload rejected
- ✅ No partial uploads

---

### TC-EDGE-008: Lesson Completion at Exactly Max Pauses

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Start lesson with 3 max pauses
2. Pause 3 times
3. Let 30-second timer run
4. Resume before timer expires
5. Complete lesson

**Expected Results:**

- ✅ Timer cancelled on resume
- ✅ Lesson continues normally
- ✅ Completion recorded
- ✅ No auto-skip triggered

---

### TC-EDGE-009: Course Prerequisite Chain

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Create Course A (no prerequisite)
2. Create Course B (prerequisite: Course A)
3. Create Course C (prerequisite: Course B)
4. Learner enrolls in Course C without completing A or B

**Expected Results:**

- ✅ Course C locked
- ✅ Message: "Complete prerequisite courses first"
- ✅ Prerequisite chain displayed
- ✅ Completing A unlocks B
- ✅ Completing B unlocks C

---

### TC-EDGE-010: Special Characters in Input

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Create course with title: "Test™ Course® 2024©"
2. Create user with name: "José María O'Brien"
3. Enter description with emojis: "Great course! 😊🎉"

**Expected Results:**

- ✅ Special characters saved correctly
- ✅ Unicode characters supported
- ✅ Display renders correctly
- ✅ No encoding issues
- ✅ Search works with special chars

---

## 11. Integration Testing

### TC-INTEGRATION-001: End-to-End User Journey

**Priority:** Critical  
**Type:** Integration

**Test Steps:**

1. User registers account
2. Admin assigns course
3. User downloads lesson
4. User completes pre-lesson protocol
5. User completes lesson
6. Progress syncs to server
7. Next lesson unlocks
8. User completes course
9. Certificate generated

**Expected Results:**

- ✅ All steps complete successfully
- ✅ Data flows correctly between components
- ✅ No errors at any step
- ✅ Progress tracked accurately
- ✅ Certificate generated

---

### TC-INTEGRATION-002: Payment to Enrollment Flow

**Priority:** Critical  
**Type:** Integration

**Test Steps:**

1. Learner selects course
2. Initiates payment
3. Completes Razorpay payment
4. Webhook received
5. Enrollment created
6. Course activated

**Expected Results:**

- ✅ Payment processed successfully
- ✅ Webhook received and processed
- ✅ Enrollment created automatically
- ✅ Course immediately accessible
- ✅ Payment recorded in database
- ✅ User notified

---

### TC-INTEGRATION-003: Facilitator Attendance to Lesson Access

**Priority:** High  
**Type:** Integration

**Test Steps:**

1. Learner enrolls in on-site course
2. Facilitator marks attendance
3. Learner attempts to access lesson
4. Learner completes lesson

**Expected Results:**

- ✅ Attendance recorded
- ✅ Lesson unlocked immediately
- ✅ Learner can access lesson
- ✅ Progress tracked
- ✅ Attendance visible to admin

---

### TC-INTEGRATION-004: Admin Grant Extra Pause to Learner

**Priority:** High  
**Type:** Integration

**Test Steps:**

1. Learner exhausts all pauses
2. 30-second auto-complete timer starts
3. Admin grants 3 extra pauses
4. Learner resumes lesson

**Expected Results:**

- ✅ Extra pauses granted immediately
- ✅ Timer cancelled
- ✅ Learner can pause again
- ✅ Pause counter updated
- ✅ Action logged

---

## 12. Accessibility Testing

### TC-ACCESSIBILITY-001: Screen Reader Compatibility

**Priority:** Medium  
**Type:** Accessibility

**Test Steps:**

1. Enable TalkBack (Android) or VoiceOver (iOS)
2. Navigate through app
3. Test all interactive elements

**Expected Results:**

- ✅ All buttons have labels
- ✅ Images have alt text
- ✅ Navigation announced correctly
- ✅ Form fields labeled
- ✅ Error messages read aloud

---

### TC-ACCESSIBILITY-002: Color Contrast

**Priority:** Medium  
**Type:** Accessibility

**Test Steps:**

1. Use color contrast checker
2. Test all text/background combinations
3. Verify WCAG AA compliance

**Expected Results:**

- ✅ Text contrast ratio ≥ 4.5:1
- ✅ Large text contrast ≥ 3:1
- ✅ Interactive eleme

### TC-FACILITATOR-004: View Attendance History

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Attendance" > "History"
2. Select course
3. View attendance records

**Expected Results:**

- ✅ All attendance records displayed
- ✅ Date and time shown
- ✅ Learner names listed
- ✅ Present/Absent status visible
- ✅ Export to CSV available

---

### TC-FACILITATOR-005: Supervise Live Sessions

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Navigate to "Sessions"
2. View active sessions
3. Monitor learner progress

**Expected Results:**

- ✅ Active sessions listed
- ✅ Learner names shown
- ✅ Current lesson displayed
- ✅ Progress percentage visible
- ✅ Real-time updates

---

### TC-FACILITATOR-006: View Session Reports

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to "Reports"
2. Select date range
3. View session statistics

**Expected Results:**

- ✅ Total sessions count
- ✅ Completion rate displayed
- ✅ Average duration shown
- ✅ Learner-wise breakdown
- ✅ Export functionality available

---

### TC-FACILITATOR-007: Export Attendance Report

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Navigate to attendance
2. Select date range
3. Click "Export CSV"

**Expected Results:**

- ✅ CSV file downloads
- ✅ All attendance data included
- ✅ Proper formatting
- ✅ File name includes date range

---

## 6. Security Testing

### TC-SECURITY-001: SQL Injection Prevention

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Attempt SQL injection in login:
   - Email: `admin@test.com' OR '1'='1`
   - Password: `anything`
2. Attempt in search fields
3. Attempt in course filters

**Expected Results:**

- ✅ All inputs sanitized
- ✅ Parameterized queries used
- ✅ No SQL errors exposed
- ✅ Injection attempts logged
- ✅ No unauthorized access

---

### TC-SECURITY-002: XSS Prevention

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Attempt XSS in course title:
   - `<script>alert('XSS')</script>`
2. Attempt in user profile fields
3. Attempt in comments/descriptions

**Expected Results:**

- ✅ Scripts not executed
- ✅ HTML entities escaped
- ✅ Content sanitized
- ✅ No JavaScript injection possible

---

### TC-SECURITY-003: CSRF Protection

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Capture legitimate request
2. Replay request without CSRF token
3. Attempt cross-origin request

**Expected Results:**

- ✅ CSRF tokens required
- ✅ Tokens validated on server
- ✅ Invalid tokens rejected
- ✅ 403 Forbidden response

---

### TC-SECURITY-004: JWT Token Security

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Capture JWT token
2. Attempt to modify token payload
3. Attempt to use expired token
4. Attempt token without signature

**Expected Results:**

- ✅ Modified tokens rejected
- ✅ Expired tokens rejected (401)
- ✅ Unsigned tokens rejected
- ✅ Token signature verified
- ✅ Secret key not exposed

---

### TC-SECURITY-005: Password Hashing

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Create user with password
2. Check database for password storage
3. Verify hashing algorithm

**Expected Results:**

- ✅ Passwords hashed with bcrypt
- ✅ 12 salt rounds used
- ✅ Plain text passwords never stored
- ✅ Hash format: `$2b$12$...`

---

### TC-SECURITY-006: Rate Limiting

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Make 100 requests in 1 minute (general)
2. Make 6 login attempts in 15 minutes
3. Make 4 registration attempts in 1 hour

**Expected Results:**

- ✅ General: 100 requests/15min limit enforced
- ✅ Login: 5 attempts/15min limit enforced
- ✅ Registration: 3 attempts/hour limit enforced
- ✅ 429 Too Many Requests response
- ✅ Retry-After header included

---

### TC-SECURITY-007: CORS Policy

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Attempt API request from unauthorized origin
2. Check CORS headers
3. Verify allowed origins

**Expected Results:**

- ✅ Only whitelisted origins allowed
- ✅ Credentials allowed for valid origins
- ✅ Unauthorized origins blocked
- ✅ CORS headers properly set

---

### TC-SECURITY-008: Security Headers (Helmet)

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Make API request
2. Inspect response headers

**Expected Results:**

- ✅ Content-Security-Policy header present
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security header
- ✅ X-XSS-Protection header

---

### TC-SECURITY-009: Audio File Encryption

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Download lesson for offline use
2. Locate audio file in device storage
3. Attempt to play file outside app
4. Inspect file format

**Expected Results:**

- ✅ File encrypted with AES-256-CBC
- ✅ File not playable outside app
- ✅ File extension: .enc or similar
- ✅ No metadata exposed
- ✅ Decryption only in-app

---

### TC-SECURITY-010: Role-Based Access Control

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Login as learner
2. Attempt to access admin endpoints:
   - GET /api/admin/users
   - POST /api/admin/courses
3. Attempt to access facilitator endpoints

**Expected Results:**

- ✅ 403 Forbidden response
- ✅ Role verified on every request
- ✅ Middleware enforces permissions
- ✅ No data leakage

---

### TC-SECURITY-011: Sensitive Data Exposure

**Priority:** Critical  
**Type:** Security

**Test Steps:**

1. Check API responses for sensitive data
2. Inspect error messages
3. Check logs for sensitive info

**Expected Results:**

- ✅ Passwords never in responses
- ✅ Password reset tokens not exposed
- ✅ Error messages generic
- ✅ Stack traces not exposed in production
- ✅ Logs don't contain passwords

---

### TC-SECURITY-012: Input Validation

**Priority:** High  
**Type:** Security

**Test Steps:**

1. Submit forms with invalid data:
   - Email: `notanemail`
   - Password: `123`
   - Phone: `abc`
2. Submit extremely long strings
3. Submit special characters

**Expected Results:**

- ✅ All inputs validated
- ✅ Appropriate error messages
- ✅ No server crashes
- ✅ Length limits enforced
- ✅ Type validation works

---

## 7. Performance Testing

### TC-PERF-001: Page Load Time

**Priority:** High  
**Type:** Performance

**Test Steps:**

1. Clear browser cache
2. Navigate to home page
3. Measure load time
4. Navigate to course detail page
5. Measure load time

**Expected Results:**

- ✅ Home page loads in < 3 seconds
- ✅ Course detail loads in < 2 seconds
- ✅ Images lazy-loaded
- ✅ No blocking resources
- ✅ Lighthouse score > 80

---

### TC-PERF-002: API Response Time

**Priority:** High  
**Type:** Performance

**Test Steps:**

1. Make API requests:
   - GET /api/courses
   - GET /api/courses/:id
   - POST /api/auth/login
2. Measure response times

**Expected Results:**

- ✅ GET requests < 500ms
- ✅ POST requests < 1000ms
- ✅ Database queries optimized
- ✅ Proper indexing used

---

### TC-PERF-003: Audio Streaming Performance

**Priority:** High  
**Type:** Performance

**Test Steps:**

1. Start lesson playback
2. Monitor audio buffering
3. Check memory usage
4. Test with slow network

**Expected Results:**

- ✅ Audio starts within 2 seconds
- ✅ No buffering during playback
- ✅ Memory usage < 100MB
- ✅ Graceful degradation on slow network

---

### TC-PERF-004: Concurrent Users Load Test

**Priority:** High  
**Type:** Performance

**Test Steps:**

1. Simulate 100 concurrent users
2. All users login simultaneously
3. All users browse courses
4. Monitor server resources

**Expected Results:**

- ✅ Server handles 100 concurrent users
- ✅ Response times remain acceptable
- ✅ No timeouts
- ✅ CPU usage < 80%
- ✅ Memory usage stable

---

### TC-PERF-005: Database Query Performance

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Execute complex queries:
   - Course list with filters
   - User progress aggregation
   - Analytics queries
2. Measure execution time

**Expected Results:**

- ✅ All queries < 1 second
- ✅ Proper indexes used
- ✅ No N+1 query problems
- ✅ Connection pooling works

---

### TC-PERF-006: Large File Upload

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Upload 100MB audio file
2. Monitor upload progress
3. Check server processing

**Expected Results:**

- ✅ Upload completes successfully
- ✅ Progress indicator accurate
- ✅ No timeout errors
- ✅ File processed correctly
- ✅ Encryption doesn't timeout

---

## 8. Device Compatibility

### TC-DEVICE-001: Android Version Compatibility

**Priority:** High  
**Type:** Compatibility

**Test Devices:**

- Android 7.0 (API 24)
- Android 10.0 (API 29)
- Android 13.0 (API 33)

**Test Steps:**

1. Install app on each device
2. Test core functionality
3. Test device-specific features

**Expected Results:**

- ✅ App installs on all versions
- ✅ All features work correctly
- ✅ UI renders properly
- ✅ No crashes
- ✅ Performance acceptable

---

### TC-DEVICE-002: Screen Size Compatibility

**Priority:** High  
**Type:** Compatibility

**Test Devices:**

- Small phone (5" screen)
- Medium phone (6" screen)
- Large phone (6.5" screen)
- Tablet (10" screen)

**Test Steps:**

1. Open app on each device
2. Navigate through all screens
3. Test UI elements

**Expected Results:**

- ✅ UI scales properly
- ✅ Text readable on all sizes
- ✅ Buttons accessible
- ✅ No overlapping elements
- ✅ Responsive design works

---

### TC-DEVICE-003: Browser Compatibility (Web Panel)

**Priority:** High  
**Type:** Compatibility

**Test Browsers:**

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Test Steps:**

1. Open admin panel in each browser
2. Test all functionality
3. Check UI rendering

**Expected Results:**

- ✅ All features work in all browsers
- ✅ UI consistent across browsers
- ✅ No JavaScript errors
- ✅ CSS renders correctly

---

### TC-DEVICE-004: Network Conditions

**Priority:** High  
**Type:** Compatibility

**Test Conditions:**

- 4G connection
- 3G connection
- 2G connection
- WiFi connection

**Test Steps:**

1. Test app on each network type
2. Download lesson
3. Stream audio
4. Sync progress

**Expected Results:**

- ✅ App works on all network types
- ✅ Downloads complete successfully
- ✅ Appropriate loading indicators
- ✅ Graceful error handling
- ✅ Offline mode works

---

### TC-DEVICE-005: Battery Impact

**Priority:** Medium  
**Type:** Performance

**Test Steps:**

1. Start lesson playback
2. Monitor battery usage for 1 hour
3. Check wake lock behavior

**Expected Results:**

- ✅ Battery drain < 15% per hour
- ✅ Wake lock released when paused
- ✅ No background battery drain
- ✅ Efficient resource usage

---

### TC-DEVICE-006: Storage Management

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Download 5 lessons (300MB total)
2. Check storage usage
3. Delete downloaded lessons
4. Verify storage freed

**Expected Results:**

- ✅ Storage usage accurate
- ✅ Downloaded files stored efficiently
- ✅ Deletion frees storage
- ✅ No orphaned files
- ✅ Storage warning when low

---

## 9. Offline Functionality

### TC-OFFLINE-001: Download Lesson for Offline Use

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Connect to WiFi
2. Navigate to course
3. Click download icon on lesson
4. Wait for download to complete
5. Disconnect from internet
6. Start lesson

**Expected Results:**

- ✅ Download starts immediately
- ✅ Progress indicator shown
- ✅ Download completes successfully
- ✅ "Downloaded" badge shown
- ✅ Lesson playable offline
- ✅ Audio encrypted during download

---

### TC-OFFLINE-002: Offline Playback Enforcement

**Priority:** High  
**Type:** Business Logic

**Test Steps:**

1. Download lesson
2. Enable airplane mode
3. Start lesson playback
4. Disable airplane mode during playback
5. Observe behavior

**Expected Results:**

- ✅ Lesson starts in offline mode
- ✅ Playback pauses when network detected
- ✅ Warning message displayed
- ✅ Cannot resume until offline
- ✅ Re-enabling airplane mode allows resume

---

### TC-OFFLINE-003: Progress Sync After Offline Session

**Priority:** High  
**Type:** Functional

**Test Steps:**

1. Complete lesson offline
2. Reconnect to internet
3. Wait for sync
4. Check progress on server

**Expected Results:**

- ✅ Progress syncs automatically
- ✅ Completion status updated
- ✅ Time spent recorded
- ✅ Pause count synced
- ✅ Next lesson unlocked

---

### TC-OFFLINE-004: Multiple Lesson Downloads

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Download 3 lessons simultaneously
2. Monitor download progress
3. Verify all downloads complete

**Expected Results:**

- ✅ Multiple downloads work
- ✅ Progress shown for each
- ✅ No conflicts
- ✅ All files encrypted
- ✅ Storage managed properly

---

### TC-OFFLINE-005: Delete Downloaded Lesson

**Priority:** Medium  
**Type:** Functional

**Test Steps:**

1. Download lesson
2. Click "Delete Download"
3. Confirm deletion
4. Verify storage freed

**Expected Results:**

- ✅ Confirmation dialog shown
- ✅ Download deleted
- ✅ Storage freed
- ✅ "Download" button shown again
- ✅ Lesson still accessible online

---

### TC-OFFLINE-006: Offline Mode Without Download

**Priority:** High  
**Type:** Negative Testing

**Test Steps:**

1. Do NOT download lesson
2. Enable airplane mode
3. Attempt to start lesson

**Expected Results:**

- ✅ Error message displayed
- ✅ "Please download lesson first"
- ✅ Download button shown
- ✅ Cannot proceed without download

---

## 10. Edge Cases & Error Handling

### TC-EDGE-001: Empty Course (No Lessons)

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Create course without lessons
2. Enroll user in course
3. User views course detail

**Expected Results:**

- ✅ Course displays correctly
- ✅ "No lessons available" message
- ✅ No errors
- ✅ Progress shows 0%

---

### TC-EDGE-002: Extremely Long Text Input

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Enter 10,000 character course description
2. Submit form

**Expected Results:**

- ✅ Validation error shown
- ✅ Character limit enforced
- ✅ No server error
- ✅ Appropriate error message

---

### TC-EDGE-003: Special Characters in Input

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Enter special characters in fields:
   - Course title: `Test™ Course® #1`
   - Description: `Émojis 😀 & symbols ©`
2. Submit form

**Expected Results:**

- ✅ Special characters accepted
- ✅ Properly encoded
- ✅ Display correctly
- ✅ No encoding issues

---

### TC-EDGE-004: Network Interruption During Payment

**Priority:** High  
**Type:** Edge Case

**Test Steps:**

1. Initiate payment
2. Disconnect network during payment
3. Reconnect network
4. Check payment status

**Expected Results:**

- ✅ Payment status verified via webhook
- ✅ Enrollment created if payment successful
- ✅ User notified of status
- ✅ No duplicate charges
- ✅ Graceful error handling

---

### TC-EDGE-005: Simultaneous Login from Multiple Devices

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Login on Device A
2. Login on Device B with same credentials
3. Perform actions on both devices

**Expected Results:**

- ✅ Both sessions valid
- ✅ JWT tokens independent
- ✅ No conflicts
- ✅ Progress syncs correctly

---

### TC-EDGE-006: Audio File Corruption

**Priority:** High  
**Type:** Edge Case

**Test Steps:**

1. Upload corrupted audio file
2. Attempt to play lesson

**Expected Results:**

- ✅ Upload validation detects corruption
- ✅ Error message shown
- ✅ File rejected
- ✅ No partial uploads

---

### TC-EDGE-007: Expired JWT Token During Session

**Priority:** High  
**Type:** Edge Case

**Test Steps:**

1. Login and get token
2. Wait for token expiration (7 days)
3. Attempt API request

**Expected Results:**

- ✅ 401 Unauthorized response
- ✅ User redirected to login
- ✅ Session data cleared
- ✅ Appropriate error message

---

### TC-EDGE-008: Database Connection Loss

**Priority:** Critical  
**Type:** Edge Case

**Test Steps:**

1. Simulate database connection loss
2. Attempt API requests
3. Restore connection

**Expected Results:**

- ✅ Graceful error handling
- ✅ 503 Service Unavailable response
- ✅ No server crash
- ✅ Connection retry logic works
- ✅ Service resumes after restore

---

### TC-EDGE-009: Lesson Completion at Exactly 100%

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Play lesson to exactly 100% completion
2. Check completion status

**Expected Results:**

- ✅ Lesson marked as completed
- ✅ Progress updated to 100%
- ✅ Next lesson unlocked
- ✅ Completion timestamp recorded
- ✅ Certificate generated (if applicable)

---

### TC-EDGE-010: Rapid Pause/Resume Clicks

**Priority:** Medium  
**Type:** Edge Case

**Test Steps:**

1. Start lesson playback
2. Rapidly click pause/resume 10 times
3. Observe behavior

**Expected Results:**

- ✅ No crashes
- ✅ Pause counter accurate
- ✅ Audio state consistent
- ✅ No race conditions
- ✅ UI updates correctly

---

## Test Execution Summary

### Test Coverage Matrix

| Module                | Total Tests | Priority High | Priority Medium | Priority Low |
| --------------------- | ----------- | ------------- | --------------- | ------------ |
| Authentication        | 7           | 6             | 1               | 0            |
| Public Pages          | 5           | 1             | 4               | 0            |
| Learner App           | 24          | 18            | 6               | 0            |
| Admin Panel           | 32          | 24            | 8               | 0            |
| Facilitator Panel     | 7           | 4             | 3               | 0            |
| Security              | 12          | 12            | 0               | 0            |
| Performance           | 6           | 4             | 2               | 0            |
| Device Compatibility  | 6           | 4             | 2               | 0            |
| Offline Functionality | 6           | 5             | 1               | 0            |
| Edge Cases            | 10          | 5             | 5               | 0            |
| **TOTAL**             | **115**     | **83**        | **32**          | **0**        |

---

## Test Environment Requirements

### Hardware Requirements

- **Mobile Device:** Android 7.0+ (API 24+)
- **RAM:** Minimum 2GB
- **Storage:** Minimum 500MB free space
- **Network:** WiFi or 4G connection

### Software Requirements

- **Backend:** Node.js 16+, PostgreSQL 13+
- **Frontend:** React 18+, Vite
- **Mobile:** Capacitor 5+
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+

### Test Data Requirements

- 3 test user accounts (Admin, Facilitator, Learner)
- 5 test courses (2 self-paced, 3 on-site)
- 15 test lessons with audio files
- Razorpay test credentials
- Sample audio files (MP3, 60-70 minutes each)

---

## Test Execution Guidelines

### Priority Levels

- **High Priority:** Must pass before production deployment
- **Medium Priority:** Should pass, can be fixed in patch release
- **Low Priority:** Nice to have, can be deferred

### Test Execution Order

1. Security tests (TC-SECURITY-\*)
2. Authentication tests (TC-AUTH-\*)
3. Core functionality tests (TC-LEARNER-_, TC-ADMIN-_)
4. Integration tests (Payment, Attendance)
5. Performance tests (TC-PERF-\*)
6. Compatibility tests (TC-DEVICE-\*)
7. Edge case tests (TC-EDGE-\*)

### Pass/Fail Criteria

- **Pass:** All expected results achieved, no critical bugs
- **Fail:** Any expected result not achieved, critical bug found
- **Blocked:** Cannot execute due to dependency failure
- **Skip:** Not applicable for current test cycle

---

## Bug Severity Classification

### Critical (P0)

- Security vulnerabilities
- Data loss or corruption
- Complete feature failure
- App crashes

### High (P1)

- Major feature not working
- Incorrect business logic
- Performance degradation
- Payment issues

### Medium (P2)

- Minor feature issues
- UI/UX problems
- Non-critical errors
- Workaround available

### Low (P3)

- Cosmetic issues
- Minor UI inconsistencies
- Enhancement requests
- Documentation errors

---

## Test Reporting

### Daily Test Report

- Tests executed: X/115
- Tests passed: X
- Tests failed: X
- Tests blocked: X
- Bugs found: X (P0: X, P1: X, P2: X, P3: X)

### Final Test Report

- Overall pass rate: X%
- Critical bugs: 0 (must be 0 for production)
- High priority bugs: < 5
- Test coverage: > 95%
- Recommendation: Go/No-Go for production

---

## Appendix

### Test Tools

- **API Testing:** Postman, Thunder Client
- **Load Testing:** Apache JMeter, k6
- **Security Testing:** OWASP ZAP, Burp Suite
- **Mobile Testing:** Android Studio Emulator, Real devices
- **Browser Testing:** BrowserStack, LambdaTest
- **Performance Monitoring:** Lighthouse, WebPageTest

### Reference Documents

- Requirements Audit: `REQUIREMENTS_AUDIT.md`
- Security Audit: `SECURITY_AUDIT_FIXES.md`
- API Documentation: Backend README
- User Manual: Client README

---

**Document Version:** 1.0  
**Last Updated:** January 12, 2026  
**Prepared By:** QA Team  
**Status:** Ready for Test Execution

---

**END OF TEST CASES DOCUMENT**
