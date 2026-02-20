# ⚠️ CRITICAL: Apple App Store Compliance Rules

## 🚨 What You CANNOT Say in iOS App

### ❌ FORBIDDEN Words/Phrases:
- "Visit our website"
- "Visit website"
- "Go to our website"
- "Buy on website"
- "Purchase on website"
- "Learn more on website"
- "Available on website"
- "Cheaper on website"
- Any website URL
- "Buy here" with link
- "Purchase here" with link
- "Get it here" with link

### ❌ FORBIDDEN Actions:
- Links to website
- Buttons that open website
- QR codes to website
- Email with purchase links
- Any external payment method mention
- Price comparisons
- "Save money by..."

---

## ✅ What You CAN Say in iOS App

### Acceptable Messages for Locked Content:

**GOOD** ✅:
- "This course is not available in your account."
- "This content is not available."
- "You don't have access to this course."
- "This course is locked."
- "Access not available."

**BAD** ❌:
- "This course is not available. Visit our website." ← NO!
- "Purchase on our website to unlock." ← NO!
- "Learn more at example.com" ← NO!
- "Contact us to purchase" ← NO!

---

## 📱 Current Implementation

### iOS Mode Messages:

**Locked Course Click**:
```
"This course is not available in your account."
```
✅ Compliant - No mention of website or purchase

**Course Cards**:
- No prices shown
- No "Buy" buttons
- No payment UI

**Profile**:
- Account deletion available
- No restrictions

---

## 🎯 Apple's "Reader" App Rules

### What Reader Apps Can Do:
✅ Display content user already purchased elsewhere
✅ Let users log in
✅ Show library of owned content
✅ Consume/play/read content
✅ Track progress
✅ Manage account settings
✅ Delete account

### What Reader Apps CANNOT Do:
❌ Show prices
❌ Show "Buy" buttons
❌ Link to website for purchase
❌ M