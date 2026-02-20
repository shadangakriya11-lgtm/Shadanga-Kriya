# Simple Testing Steps - iOS Compliance

## 🎯 Goal
Test that payment features are hidden on iOS without needing an iPhone.

---

## 📝 Steps (Takes 2 minutes)

### 1. Start the App
```bash
cd client
npm run dev
```

### 2. Open Browser Console
Press **F12** (or Ctrl+Shift+I)

### 3. Enable iOS Mode
Type in console:
```javascript
window.simulateIOS()
```

### 4. Reload Page
Press **F5**

### 5. Check These Things

#### ✅ What You Should SEE:
- Course list
- Course titles and descriptions
- "Enrolled" or "Active" badges
- Lesson content (if enrolled)
- Account deletion button in Profile

#### ❌ What You Should NOT SEE:
- ₹ (Rupee symbol)
- $ (Dollar symbol)
- "Buy" button
- "Purchase" button
- Payment modal/popup
- Razorpay logo
- Price numbers

### 6. Test Locked Course
- Click on a locked course (one you haven't purchased)
- Should show message: "This course is not available in your account. Visit our website to learn more."
- Should NOT show payment modal

### 7. Test Account Deletion
- Go to Profile page
- Scroll down
- See "Delete Account" button
- Click it - should show confirmation dialog

### 8. Done! Turn Off iOS Mode
```javascript
window.simulateWeb()
```
Press **F5** to reload

---

## 🔄 Quick Commands

```javascript
// Turn ON iOS mode (hides payments)
window.simulateIOS()

// Turn OFF iOS mode (shows payments)
window.simulateWeb()

// Check what mode you're in
window.getPlatformInfo()
```

**Remember**: Always reload page (F5) after changing mode!

---

## ✅ Success Criteria

If you see this behavior, iOS compliance is working:

| Feature | iOS Mode | Web Mode |
|---------|----------|----------|
| Course prices | ❌ Hidden | ✅ Visible |
| Buy buttons | ❌ Hidden | ✅ Visible |
| Payment modal | ❌ Never shows | ✅ Shows on click |
| Locked course click | Shows message | Opens payment |
| Account deletion | ✅ Works | ✅ Works |
| Enrolled courses | ✅ Works | ✅ Works |

---

## 🎬 Video Recording Tip

If you want to record for Apple:

1. Enable iOS mode: `window.simulateIOS()`
2. Reload page
3. Start screen recording (Win+G on Windows)
4. Navigate through app showing:
   - No prices visible
   - No payment buttons
   - Locked course shows message only
   - Account deletion works
5. Stop recording

---

## 🆘 Troubleshooting

**Problem**: Still seeing prices in iOS mode
**Solution**: 
1. Check console: `window.getPlatformInfo()`
2. Should say "Platform: ios"
3. If not, run `window.simulateIOS()` again
4. Hard reload: Ctrl+Shift+R

**Problem**: Mode resets after reload
**Solution**: This is now fixed! Mode persists. If it doesn't:
1. Check localStorage: `localStorage.getItem('__platform_simulation__')`
2. Should return "ios"
3. If null, browser might be blocking localStorage

**Problem**: Want to reset everything
**Solution**:
```javascript
window.simulateWeb()
localStorage.clear()
location.reload()
```

---

## 📱 Real iPhone Testing (Optional)

If you have access to a Mac:

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Run in Xcode on iPhone simulator or device.

---

## ✨ That's It!

The implementation is complete and working. You can now:
- ✅ Test iOS behavior in browser
- ✅ Verify no payment UI on iOS
- ✅ Confirm account deletion works
- ✅ Submit to App Store with confidence

**The simulation persists across reloads, so you can test thoroughly without repeating commands!**
