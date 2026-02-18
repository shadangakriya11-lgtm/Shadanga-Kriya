# Screen Recording Protection Guide

This guide explains how screen recording protection is implemented in the app for both Android and iOS platforms.

## Features

### Android
- **FLAG_SECURE**: Prevents screenshots and screen recording at the system level
- **Content Observer**: Monitors for screen recording attempts and shows toast messages
- Screen appears black in screenshots and recordings

### iOS
- **Screen Capture Detection**: Monitors `UIScreen.capturedDidChangeNotification`
- **Real-time Alerts**: Shows alert dialog when screen recording is detected
- **Continuous Monitoring**: Detects when recording starts and stops

## Implementation

### 1. Native Code (Automatic)

The protection is automatically enabled when the app starts:

**Android**: `MainActivity.java`
- Sets `FLAG_SECURE` on the window
- Registers content observer for screen recording detection

**iOS**: `AppDelegate.swift` & `ScreenProtectionPlugin.swift`
- Monitors screen capture notifications
- Shows alerts when recording is detected

### 2. Using in React Components

#### Option A: Use the Hook (Recommended)

```typescript
import { useScreenProtection } from '@/hooks/useScreenProtection';

function MyComponent() {
  const { showToast, checkScreenCapture } = useScreenProtection();

  // Protection is automatically enabled!
  
  // Optionally show custom toast
  const handleSomething = () => {
    showToast('Custom message: Screen recording not allowed');
  };

  // Check if screen is being captured
  const checkStatus = async () => {
    const isCaptured = await checkScreenCapture();
    console.log('Screen being captured:', isCaptured);
  };

  return <div>Your content</div>;
}
```

#### Option B: Use the Plugin Directly

```typescript
import ScreenProtection from '@/plugins/screenProtection';
import { Capacitor } from '@capacitor/core';

// Enable protection
if (Capacitor.isNativePlatform()) {
  await ScreenProtection.enableProtection();
}

// Show toast message
await ScreenProtection.showToast({
  message: 'Screen recording is not allowed'
});

// Check if screen is being captured (iOS)
const result = await ScreenProtection.isScreenBeingCaptured();
console.log('Is captured:', result.isCaptured);

// Listen for screen capture events (iOS)
ScreenProtection.addListener('screenCaptureChanged', (info) => {
  if (info.isCaptured) {
    console.log('Screen recording started!');
  } else {
    console.log('Screen recording stopped');
  }
});
```

### 3. Add to Your App Component

Add the hook to your main App component to enable protection app-wide:

```typescript
// src/App.tsx
import { useScreenProtection } from '@/hooks/useScreenProtection';

function App() {
  useScreenProtection(); // Enable protection for entire app
  
  return (
    // Your app content
  );
}
```

## How It Works

### Android
1. `FLAG_SECURE` is set on the window in `onCreate()`
2. This makes the screen appear black in screenshots and recordings
3. Content observer monitors for recording attempts
4. Toast message is shown when recording is detected

### iOS
1. App monitors `UIScreen.capturedDidChangeNotification`
2. When screen recording starts, `isCaptured` becomes `true`
3. Alert dialog is shown automatically
4. Plugin can also be used to show custom messages

## Testing

### Android
1. Build and install the app
2. Try to take a screenshot - it will appear black
3. Try to screen record - the app content will appear black
4. Toast message will appear when recording is attempted

### iOS
1. Build and install the app
2. Start screen recording from Control Center
3. Alert dialog will appear immediately
4. Recording will continue but you'll be notified

## Building the App

After making these changes, rebuild your native apps:

```bash
# Build web assets
cd client
npm run build

# Sync with native projects
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios
```

## Notes

- **Android**: Protection is enforced at the system level (FLAG_SECURE)
- **iOS**: Detection only - iOS doesn't allow apps to block screen recording, but we notify users
- **Web**: No protection available (browser limitation)
- Protection is automatically enabled when the app starts
- No additional configuration needed in most cases

## Troubleshooting

### Android
- If protection doesn't work, ensure `FLAG_SECURE` is set in `onCreate()`
- Check Android Studio logcat for any errors
- Verify the app has proper permissions

### iOS
- Ensure the plugin is properly registered in Xcode
- Check that `ScreenProtectionPlugin.swift` and `.m` files are included in the build
- Verify notifications are being observed

## API Reference

### Methods

- `enableProtection()`: Enable screen recording protection
- `disableProtection()`: Disable screen recording protection
- `showToast(options)`: Show a toast/alert message
- `isScreenBeingCaptured()`: Check if screen is being captured (iOS only)

### Events

- `screenCaptureChanged`: Fired when screen capture status changes (iOS only)

## Security Considerations

- This provides a layer of protection but is not 100% foolproof
- Rooted/jailbroken devices may bypass these protections
- Consider additional server-side security measures for sensitive content
- Watermarking can be an additional deterrent
