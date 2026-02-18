# Rebuild Native Apps with Screen Protection

Follow these steps to rebuild your Android and iOS apps with screen recording protection:

## Step 1: Install Dependencies (if needed)
```bash
cd client
npm install
```

## Step 2: Build Web Assets
```bash
npm run build
```

## Step 3: Sync with Native Projects
```bash
npx cap sync
```

This will copy the web assets and update the native projects with the new plugins.

## Step 4: Build Android

### Option A: Using Android Studio (Recommended)
```bash
npx cap open android
```
Then in Android Studio:
1. Wait for Gradle sync to complete
2. Build > Clean Project
3. Build > Rebuild Project
4. Run > Run 'app' (or click the green play button)

### Option B: Using Command Line
```bash
cd android
./gradlew clean
./gradlew assembleDebug
# Or for release:
./gradlew assembleRelease
```

## Step 5: Build iOS

### Using Xcode (Required for iOS)
```bash
npx cap open ios
```
Then in Xcode:
1. Select your development team in Signing & Capabilities
2. Product > Clean Build Folder (Cmd+Shift+K)
3. Product > Build (Cmd+B)
4. Product > Run (Cmd+R) or click the play button

## Testing Screen Protection

### Android
1. Install the app on your device
2. Open the app
3. Try to take a screenshot - it should appear black
4. Try to start screen recording - the app content should appear black
5. You should see a toast message: "Screen recording is not allowed"

### iOS
1. Install the app on your device
2. Open the app
3. Start screen recording from Control Center
4. You should see an alert: "Screen Recording Not Allowed"
5. The recording will continue but you'll be notified

## Troubleshooting

### Android Issues
- **Build fails**: Run `./gradlew clean` in the android folder
- **Plugin not found**: Make sure `ScreenProtectionPlugin.java` is in the correct package
- **No toast showing**: Check logcat for errors: `adb logcat | grep ScreenProtection`

### iOS Issues
- **Build fails**: Clean build folder in Xcode (Cmd+Shift+K)
- **Plugin not registered**: Verify `.swift` and `.m` files are in the Xcode project
- **No alert showing**: Check Xcode console for errors

### General
- Make sure you ran `npx cap sync` after building web assets
- Verify all plugin files are in the correct locations
- Check that plugins are registered in MainActivity.java (Android)

## File Locations

### Android
- `android/app/src/main/java/com/shadangakriya/app/MainActivity.java`
- `android/app/src/main/java/com/shadangakriya/app/ScreenProtectionPlugin.java`

### iOS
- `ios/App/App/AppDelegate.swift`
- `ios/App/App/ScreenProtectionPlugin.swift`
- `ios/App/App/ScreenProtectionPlugin.m`

### Web/TypeScript
- `src/plugins/screenProtection.ts`
- `src/plugins/screenProtection.web.ts`
- `src/hooks/useScreenProtection.ts`
- `src/App.tsx` (hook is used here)

## Next Steps

After successful build:
1. Test on real devices (emulators may not accurately simulate screen recording)
2. Test both screenshot and screen recording scenarios
3. Verify toast/alert messages appear correctly
4. Consider adding additional security measures if needed
