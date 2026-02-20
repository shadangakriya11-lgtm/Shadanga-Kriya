# How to Test iOS Behavior Without an iPhone

## Overview
You can test the iOS App Store compliance features in your browser without needing an actual iPhone. The simulation **persists across page reloads** using localStorage.

---

## Method 1: Browser Console Simulation ⭐ RECOMMENDED

### How It Works
The simulation uses localStorage to persist your choice. Once you enable iOS simulation, it stays active even after page reloads until you disable it.

### Step 1: Start Development Server
```bash
cd client
npm run dev
```

### Step 2: Open Browser Console
- Chrome/Edge: Press `F12` or `Ctrl+Shift+I`
- Firefox: Press `F12`
- Safari: Press `Cmd+Option+I` (Mac)

### Step 3: Simulate iOS Platform
In the browser console, type:
```javascript
window.simulateIOS()
```

You should see:
```
🍎 iOS Platform Simulation ENABLED
Platform: ios
Is Native: true
✅ Simulation will persist across page reloads
💡 Reload the page now to see iOS behavior
```

### Step 4: Reload the Page
Press `F5` or `Ctrl+R` to reload

**The simulation persists!** You'll see:
```
🍎 iOS Platform Simulation ACTIVE (persisted)
⚡ Active Simulation: IOS
   To disable: window.simulateWeb()
```

### Step 5: Verify iOS Behavior
Now the app behaves like it's running on iOS:
- ❌ No payment buttons visible
- ❌ No prices (₹ symbols) visible
- ❌ No "Buy" or "Purchase" text
- ✅ Courses are visible
- ✅ Enrolled courses work
- ✅ Account deletion works

**The simulation stays active even after multiple reloads!**

### Step 6: Switch Platforms
```javascript
// Test Android behavior (persists on reload)
window.simulateAndroid()
// Reload page - Android simulation stays active

// Back to Web behavior (clears simulation)
window.simulateWeb()
// Reload page - back to normal

// Check current platform
window.getPlatformInfo()
```

### Step 7: Disable Simulation
When done testing:
```javascript
window.simulateWeb()
```
Then reload the page to return to normal web behavior.

---

## Quick Test Commands

### Enable iOS Mode
```javascript
window.simulateIOS()
// Reload page (F5)
```

### Check What's Active
```javascript
window.getPlatformInfo()
```

### Disable iOS Mode
```javascript
window.simulateWeb()
// Reload page (F5)
```

---

## What to Test

### ✅ iOS Mode Checklist

#### Home Page (`/home`)
- [ ] Course cards show NO prices
- [ ] Clicking locked course shows message (no payment modal)
- [ ] Message says: "This course is not available in your account. Visit our website to learn more."
- [ ] Active/enrolled courses are clickable
- [ ] Reload page - iOS mode still active

#### Course Detail Page (`/course/:id`)
- [ ] Course price is HIDDEN (no ₹ symbol)
- [ ] No "Buy" or "Purchase" buttons
- [ ] Enrolled courses show lessons normally
- [ ] Progress tracking works

#### Profile Page (`/profile`)
- [ ] "Delete Account" button is visible
- [ ] Clicking shows confirmation dialog
- [ ] Requires typing "DELETE ACCOUNT"
- [ ] Shows warning about data loss

#### Payment Modal
- [ ] Should NEVER appear on iOS
- [ ] No Razorpay integration visible

### ✅ Web/Android Mode Checklist

#### Home Page
- [ ] Course cards show prices (₹)
- [ ] Clicking locked course opens payment modal
- [ ] Payment modal shows Razorpay options

#### Course Detail Page
- [ ] Course price is visible
- [ ] Payment flow works

---

## Visual Comparison

### iOS Mode (Reader App)
```
┌─────────────────────────┐
│  Course: Meditation 101 │
│  Self-Paced | Active    │
│  📚 10 lessons           │
│  ⏱️ 5 hours              │
│  [NO PRICE SHOWN]       │
│  [NO BUY BUTTON]        │
└─────────────────────────┘
```

### Web/Android Mode (Full Features)
```
┌─────────────────────────┐
│  Course: Meditation 101 │
│  Self-Paced | Locked    │
│  📚 10 lessons           │
│  ⏱️ 5 hours              │
│  💰 ₹999                │
│  [BUY NOW BUTTON]       │
└─────────────────────────┘
```

---

## Testing Workflow

### Complete Test Sequence

1. **Start in Web Mode** (default)
   ```bash
   npm run dev
   ```
   - Verify payment features work
   - Test course purchase flow

2. **Switch to iOS Mode**
   ```javascript
   window.simulateIOS()
   // Reload page (F5)
   ```
   - Verify NO payment features
   - Verify NO prices
   - Test locked course message
   - **Reload multiple times - simulation persists!**

3. **Switch to Android Mode**
   ```javascript
   window.simulateAndroid()
   // Reload page (F5)
   ```
   - Verify payment features work
   - Same as Web mode

4. **Back to Web Mode**
   ```javascript
   window.simulateWeb()
   // Reload page (F5)
   ```

---

## Debugging Tips

### Check Platform Detection
```javascript
// Check current platform
window.getPlatformInfo()

// Output shows:
// Platform: ios
// Is Native: true
// Simulation Active: ios
```

### Clear Simulation Manually
If something goes wrong:
```javascript
// Clear localStorage
localStorage.removeItem('__platform_simulation__')
// Then reload page
```

---

## Common Issues

### Issue 1: Simulation Not Persisting
**Solution**: 
- Check browser console for errors
- Try: `localStorage.setItem('__platform_simulation__', 'ios')`
- Reload page

### Issue 2: Payment Modal Still Appears on iOS
**Solution**: 
- Verify simulation is active: `window.getPlatformInfo()`
- Clear browser cache: `Ctrl+Shift+R`
- Check console logs

### Issue 3: Want to Reset Everything
**Solution**:
```javascript
window.simulateWeb()
localStorage.clear()
// Reload page
```

---

## iOS Simulator (Mac Only)

If you have a Mac, test on real iOS Simulator:

```bash
cd client
npm run build
npx cap sync ios
npx cap open ios
```

Then run in Xcode on iPhone simulator.

---

## Summary

✅ **Simulation persists across page reloads**
- Use `window.simulateIOS()` once
- Reload as many times as you want
- iOS mode stays active
- Use `window.simulateWeb()` to disable

✅ **Easy to test**
- No iPhone needed
- Works in any browser
- Instant switching between platforms

✅ **Implementation is complete**
- Platform detection works
- Payment UI hidden on iOS
- Account deletion available
- Ready for App Store submission

---

## Quick Reference Card

```javascript
// ENABLE iOS MODE (persists on reload)
window.simulateIOS()

// CHECK CURRENT MODE
window.getPlatformInfo()

// DISABLE iOS MODE (back to web)
window.simulateWeb()

// ENABLE ANDROID MODE (persists on reload)
window.simulateAndroid()
```

**Remember**: After calling any simulate function, reload the page (F5) to see the changes!
