# Quick Reference: iOS App Store Compliance

## What Was Changed?

### ✅ Problem 1: Payment (Guideline 3.1.1) - SOLVED
**Before**: iOS app showed Razorpay payment buttons and prices
**After**: iOS app hides all payment UI - operates as "Reader" app only

### ✅ Problem 2: Account Deletion (Guideline 5.1.1) - SOLVED  
**Before**: No in-app account deletion
**After**: Full account deletion available in Profile page

---

## How It Works

### Platform Detection
New file: `client/src/lib/platformDetection.ts`

```typescript
import { Capacitor } from '@capacitor/core';

// Returns true if running on iOS native app
const isIOSApp = () => Capacitor.getPlatform() === 'ios';

// Returns false on iOS (hides payment features)
const shouldShowPaymentFeatures = () => !isIOSApp();

// Returns false on iOS (hides pricing)
const shouldShowPricing = () => !isIOSApp();
```

### What's Hidden on iOS?
- ❌ Payment modal/buttons
- ❌ Course prices (₹ symbols)
- ❌ "Buy" or "Purchase" text
- ❌ Razorpay integration

### What Still Works on iOS?
- ✅ Browse courses
- ✅ View course details (no prices)
- ✅ Access enrolled courses
- ✅ Play lessons
- ✅ Track progress
- ✅ Delete account

---

## User Flow

### iOS Users
1. Visit website (desktop/mobile browser)
2. Purchase course with Razorpay
3. Open iOS app
4. Log in
5. Access purchased courses

### Web/Android Users
1. Open app
2. Browse courses with prices
3. Purchase directly in app
4. Access courses immediately

---

## Files Modified

1. **`client/src/lib/platformDetection.ts`** - NEW
   - Platform detection utilities

2. **`client/src/components/learner/PaymentModal.tsx`**
   - Returns null on iOS

3. **`client/src/pages/LearnerHome.tsx`**
   - Hides payment modal on iOS
   - Shows info message for locked courses

4. **`client/src/pages/CourseDetail.tsx`**
   - Hides prices on iOS

5. **`client/src/pages/Profile.tsx`**
   - Account deletion already implemented
   - Works on all platforms

---

## Testing

### Test on iOS
```bash
cd client
npm run build
npx cap sync ios
npx cap open ios
```

**Verify**:
- [ ] No payment buttons visible
- [ ] No prices/₹ symbols visible
- [ ] Locked courses show "not available" message
- [ ] Enrolled courses work normally
- [ ] Account deletion works

### Test on Web
```bash
cd client
npm run dev
```

**Verify**:
- [ ] Payment buttons visible
- [ ] Prices visible
- [ ] Razorpay payment works
- [ ] Account deletion works

---

## Important Rules for iOS

### ❌ NEVER Show in iOS App:
- "Buy" or "Purchase" buttons
- Price tags (₹, $)
- Payment forms
- Links to website
- "Cheaper on website" messages

### ✅ ALWAYS Allowed in iOS App:
- Course library/catalog
- Enrolled course content
- Progress tracking
- Account settings
- Account deletion

---

## Backend API

### Account Deletion
**Endpoint**: `DELETE /api/auth/delete-account`
**Auth**: Required (Bearer token)
**Access**: Learners only

**What Gets Deleted**:
- User account
- Progress records
- Enrollments
- Payments history
- Notifications
- All related data (CASCADE)

**Response**:
```json
{
  "message": "Your account has been permanently deleted."
}
```

---

## Deployment Checklist

Before submitting to App Store:

- [ ] Build iOS app with latest changes
- [ ] Test on iOS device/simulator
- [ ] Verify NO payment UI appears
- [ ] Verify NO prices appear
- [ ] Test account deletion
- [ ] Test login after web purchase
- [ ] Test course access after web purchase
- [ ] Review App Store screenshots (no payment UI)
- [ ] Update App Store description (mention web purchase)

---

## App Store Description Suggestion

**For iOS App Store listing**:

> Access your Shadanga Kriya meditation courses on the go. This app allows you to listen to your purchased courses and track your progress. 
> 
> To purchase new courses, please visit our website at [your-website.com]. Once purchased, log into this app to access your content.
>
> Features:
> - Access your enrolled courses
> - Listen to guided meditation sessions
> - Track your progress
> - Manage your account
> - Delete your account anytime

---

## Support

If users ask "How do I buy courses?":

**iOS Users**: 
"Please visit our website at [your-website.com] to browse and purchase courses. Once purchased, log into the app to access your content."

**Web/Android Users**:
"You can purchase courses directly in the app using the Buy button on any course."

---

## Summary

✅ iOS app is now compliant with App Store guidelines
✅ Web and Android apps maintain full functionality  
✅ Single codebase with platform-specific features
✅ Account deletion available on all platforms
✅ Ready for App Store resubmission
