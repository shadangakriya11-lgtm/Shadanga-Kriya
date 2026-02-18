# Testing Screen Recording Protection

## Important: Understanding FLAG_SECURE

`FLAG_SECURE` on Android has the following behavior:

### What FLAG_SECURE Does:
✅ **Prevents screenshots** - Screenshots will appear BLACK
✅ **Prevents screen recording via system recorder** - Recording will show BLACK screen
✅ **Prevents screen mirroring in some cases**
✅ **Prevents content from appearing in recent apps/task switcher**

### What FLAG_SECURE Does NOT Do:
❌ **Cannot prevent all third-party screen recorders** - Some apps use accessibility services or root access
❌ **Cannot prevent rooted devices** - Root users can bypass FLAG_SECURE
❌ **Cannot prevent external cameras** - Physical recording of the screen
❌ **Cannot prevent ADB screen recording** - Developer tools can bypass it

## How to Test Properly

### Test 1: Screenshot Test (Should Work)
1. Open your app
2. Try to take a screenshot using:
   - Power + Volume Down buttons
   - Screenshot gesture (if your phone has it)
3. **Expected Result**: Screenshot should be completely BLACK or show an error

### Test 2: Built-in Screen Recorder (Should Work)
1. Open your app
2. Start the built-in screen recorder:
   - Pull down notification shade
   - Tap "Screen Recorder" or "Screen Record"
   - Start recording
3. Navigate in your app
4. Stop recording and view the video
5. **Expected Result**: Your app content should appear BLACK in the recording

### Test 3: Third-Party Screen Recorders (May NOT Work)
Some third-party screen recording apps use:
- Accessibility services
- Root access
- System-level permissions

These MAY bypass FLAG_SECURE. This is a limitation of Android security.

### Test 4: Recent Apps (Should Work)
1. Open your app
2. Press the Recent Apps button (square/multitasking button)
3. **Expected Result**: Your app preview should be BLACK or blurred

## Troubleshooting

### "I can still record the screen!"

**Question 1**: What method are you using to record?
- Built-in screen recorder? → Should be blocked
- Third-party app (AZ Screen Recorder, Mobizen, etc.)? → May bypass FLAG_SECURE
- ADB/Developer tools? → Will bypass FLAG_SECURE

**Question 2**: Is your device rooted?
- Rooted devices can bypass FLAG_SECURE
- This is expected behavior

**Question 3**: Did you rebuild the app?
After making code changes, you MUST:
```bash
cd client
npm run build
npx cap sync
npx cap open android
```
Then in Android Studio:
- Build > Clean Project
- Build > Rebuild Project
- Uninstall old app from device
- Install new build

**Question 4**: Are you testing on an emulator?
- Emulators may not properly enforce FLAG_SECURE
- Always test on a REAL DEVICE

### Verify FLAG_SECURE is Applied

Add this test code temporarily to verify FLAG_SECURE is active:

```java
// In MainActivity.java onCreate() method, add:
android.util.Log.d("ScreenProtection", "Window flags: " + getWindow().getAttributes().flags);
android.util.Log.d("ScreenProtection", "FLAG_SECURE value: " + WindowManager.LayoutParams.FLAG_SECURE);
android.util.Log.d("ScreenProtection", "Is FLAG_SECURE set: " + 
    ((getWindow().getAttributes().flags & WindowManager.LayoutParams.FLAG_SECURE) != 0));
```

Then check Android Studio Logcat:
```bash
adb logcat | grep ScreenProtection
```

You should see: `Is FLAG_SECURE set: true`

## Additional Security Measures

If you need stronger protection, consider:

### 1. Server-Side Validation
- Implement device fingerprinting
- Detect rooted/jailbroken devices
- Block access from suspicious devices

### 2. DRM (Digital Rights Management)
- Use Widevine or PlayReady for video content
- Implement custom encryption for audio files

### 3. Watermarking
- Add user-specific watermarks to content
- Makes sharing less appealing

### 4. Time-Limited Access
- Content expires after viewing
- Requires re-authentication

### 5. Network-Based Detection
- Monitor for suspicious patterns
- Rate limiting
- Geographic restrictions

## Expected Behavior Summary

| Test Method | Expected Result | Why |
|-------------|----------------|-----|
| System Screenshot | ✅ BLACK | FLAG_SECURE blocks it |
| System Screen Recorder | ✅ BLACK | FLAG_SECURE blocks it |
| Recent Apps Preview | ✅ BLACK/Blurred | FLAG_SECURE blocks it |
| Third-Party Recorder (non-root) | ⚠️ May work | Some use accessibility services |
| Third-Party Recorder (root) | ❌ Will work | Root bypasses security |
| ADB Screen Recording | ❌ Will work | Developer tools bypass it |
| External Camera | ❌ Will work | Physical recording |

## Verification Checklist

Before reporting issues, verify:

- [ ] Tested on a REAL device (not emulator)
- [ ] Device is NOT rooted
- [ ] App was rebuilt after code changes
- [ ] Old app was uninstalled before installing new build
- [ ] Testing with SYSTEM screen recorder (not third-party app)
- [ ] Checked logcat to confirm FLAG_SECURE is set
- [ ] Screenshot test shows BLACK screen
- [ ] Recent apps preview shows BLACK screen

## Still Having Issues?

If you've verified all the above and system screenshots/recordings still work:

1. **Check Android version**: FLAG_SECURE works on Android 5.0+
2. **Check device manufacturer**: Some manufacturers modify Android and may have bugs
3. **Check for custom ROMs**: Custom ROMs may not properly enforce FLAG_SECURE
4. **Try a different device**: Test on multiple devices to isolate the issue

## Contact

If you've completed all tests and FLAG_SECURE is confirmed not working on a standard, non-rooted device with the system screen recorder, please provide:

1. Device model and Android version
2. Recording method used
3. Logcat output showing FLAG_SECURE status
4. Screenshot of the issue
