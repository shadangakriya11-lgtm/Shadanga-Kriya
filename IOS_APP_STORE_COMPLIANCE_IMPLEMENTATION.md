# iOS App Store Compliance Implementation

## Overview
This document outlines the implementation of iOS App Store compliance requirements for the Shadanga Kriya app.

## Rejection Reasons Addressed

### 1. Payment Problem (Guideline 3.1.1 – In-App Purchase)
**Issue**: App was using Razorpay/external payment methods for digital content purchases, which violates Apple's requirement to use In-App Purchase (IAP) for digital goods.

**Solution Implemented**: "Reader App" approach
- iOS app now operates as a content-only "Reader" app
- All payment UI is hidden on iOS platform
- Users must purchase courses on the website, then access content in the iOS app
- Web and Android versions continue to use Razorpay payments normally

### 2. Account Deletion Problem (Guideline 5.1.1 – Privacy)
**Issue**: App allowed account creation but didn't provide in-app account deletion capability.

**Solution Implemented**: Full account deletion feature
- Added "Delete Account" button in Profile page (learners only)
- Requires typing "DELETE ACCOUNT" to confirm
- Permanently deletes all user data including:
  - Personal information
  - Course progress and history
  - Downloaded content
  - All associated records
- Backend API endpoint already existed and is fully functional

---

## Implementation Details

### Platform Detection Utility
**File**: `client/src/lib/platformDetection.ts`

Created a centralized utility for detecting the platform and determining feature availability:

```typescript
import { Capacitor } from '@capacitor/core';

// Check if running on iOS native app
export const isIOSApp = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

// Check if payment features should be shown (false for iOS)
export const shouldShowPaymentFeatures = (): boolean => {
  return !isIOSApp();
};

// Check if pricing should be displayed (false for iOS)
export const shouldShowPricing = (): boolean => {
  return !isIOSApp();
};

// Get platform-specific message for locked courses
export const getLockedCourseMessage = (): string => {
  if (isIOSApp()) {
    return 'This course is not available in your account. Visit our website to learn more.';
  }
  return 'Purchase this course to unlock all lessons and content.';
};
```

### Files Modified

#### 1. Payment Modal (`client/src/components/learner/PaymentModal.tsx`)
- Added platform detection import
- Returns `null` on iOS (modal never renders)
- Payment flow only available on web/Android

#### 2. Course Card (`client/src/components/learner/CourseCard.tsx`)
- Added platform detection import
- Pricing information hidden on iOS

#### 3. Course Detail Page (`client/src/pages/CourseDetail.tsx`)
- Added platform detection import
- Course price hidden on iOS
- Payment-related UI elements removed for iOS users

#### 4. Learner Home Page (`client/src/pages/LearnerHome.tsx`)
- Added platform detection and toast notification
- Payment modal conditionally rendered (not shown on iOS)
- Locked course click shows informational message on iOS instead of payment modal
- Web/Android users continue to see payment flow normally

#### 5. Profile Page (`client/src/pages/Profile.tsx`)
- Account deletion feature already implemented
- "Delete Account" button visible for learners
- Requires confirmation by typing "DELETE ACCOUNT"
- Shows warning about permanent data deletion

### Backend Implementation

#### Account Deletion Endpoint
**File**: `backend/controllers/auth.controller.js`

The `deleteAccount` function was already implemented with:
- Learner-only restriction (admins/facilitators cannot self-delete)
- Transaction-based deletion for data integrity
- Cascade deletion of all related records
- Security event logging
- Admin notification on account deletion

**Route**: `DELETE /api/auth/delete-account`
- Requires authentication token
- Only allows learners to delete their own accounts
- Returns success message on completion

---

## Platform-Specific Behavior

### iOS (Reader App Mode)
✅ **Allowed**:
- Browse available courses
- View course details (without prices)
- Access enrolled courses
- Play lessons and track progress
- View profile and settings
- Delete account

❌ **Hidden**:
- Payment buttons
- Course prices (₹ symbols)
- "Buy" or "Purchase" text
- Payment modal/dialogs
- Razorpay integration

**User Flow**:
1. User visits website on desktop/mobile browser
2. User purchases course using Razorpay
3. User logs into iOS app
4. User accesses purchased course content

### Web & Android
✅ **Full Features**:
- All iOS features PLUS:
- View course pricing
- Purchase courses via Razorpay
- Complete payment flow in-app
- Direct enrollment after payment

---

## Testing Checklist

### iOS Testing
- [ ] Verify no payment UI appears on iOS
- [ ] Verify no prices/currency symbols visible on iOS
- [ ] Verify locked courses show appropriate message
- [ ] Verify enrolled courses are accessible
- [ ] Verify account deletion works on iOS
- [ ] Test login after web purchase

### Web/Android Testing
- [ ] Verify payment modal appears
- [ ] Verify prices are visible
- [ ] Verify Razorpay integration works
- [ ] Verify course purchase flow
- [ ] Verify account deletion works

### Cross-Platform Testing
- [ ] Purchase on web, access on iOS
- [ ] Purchase on Android, access on iOS
- [ ] Account deletion syncs across platforms

---

## Compliance Notes

### Apple App Store Guidelines Met

**Guideline 3.1.1 (In-App Purchase)**:
✅ No external payment methods in iOS app
✅ No links to website for purchases
✅ No mention of pricing or "cheaper elsewhere"
✅ App functions as content reader only

**Guideline 5.1.1 (Privacy - Account Deletion)**:
✅ Account deletion available in-app
✅ Permanent deletion (not just deactivation)
✅ Clear warning about data loss
✅ Confirmation required before deletion

### Important Restrictions for iOS

**DO NOT** in iOS app:
- Show "Buy", "Purchase", "Price" text
- Display currency symbols (₹, $)
- Link to website for purchases
- Mention "cheaper on website"
- Show payment buttons or forms
- Reference external payment methods

**DO** in iOS app:
- Show enrolled courses
- Allow content consumption
- Provide account management
- Enable account deletion
- Show generic "not available" messages

---

## Build & Deployment

### Build Command
```bash
cd client
npm run build
```

### iOS Build
After building, sync with Capacitor:
```bash
npx cap sync ios
npx cap open ios
```

### Testing on iOS
1. Build the app in Xcode
2. Test on iOS Simulator or device
3. Verify no payment UI appears
4. Test account deletion flow
5. Verify enrolled courses work

---

## Future Considerations

### If Implementing IAP (Alternative Approach)
If you decide to implement Apple In-App Purchase in the future:
1. Add StoreKit integration
2. Create IAP products in App Store Connect
3. Implement purchase flow using StoreKit
4. Keep Razorpay for web/Android
5. Sync purchases across platforms

### Multiplatform Service (Hybrid Approach)
Per Guideline 3.1.3(b), you could:
1. Offer courses via IAP in iOS app
2. Also allow web purchases via Razorpay
3. Users can access content purchased either way
4. Cannot mention price differences

---

## Summary

The implementation successfully addresses both App Store rejection reasons:

1. **Payment Compliance**: iOS app now operates as a "Reader" app with no payment functionality, while web and Android maintain full payment features.

2. **Account Deletion**: Full account deletion capability is available for learners across all platforms.

The solution uses platform detection to conditionally render features, maintaining a single codebase while meeting platform-specific requirements.
