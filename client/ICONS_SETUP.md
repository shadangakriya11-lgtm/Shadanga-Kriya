# App Icons Setup for Shadanga Kriya

## Current Status

✅ Logo renamed: `shadanga-kriya-logo.png`
✅ HTML favicon links added
✅ Android app name updated to "Shadanga Kriya"

## Generate App Icons (Required for Mobile)

### Option 1: Using Capacitor Assets (Recommended)

1. **Install Capacitor Assets tool:**

```bash
npm install -g @capacitor/assets
```

2. **Prepare your logo:**

   - Use `public/shadanga-kriya-logo.png` as source
   - Icon should be at least 1024x1024px with transparent background
   - Logo should be centered with padding

3. **Create resources folder:**

```bash
mkdir -p resources
```

4. **Copy logo to resources (rename as required by tool):**

```bash
# For Android & iOS
cp public/shadanga-kriya-logo.png resources/icon.png
# For splash screen (optional)
cp public/shadanga-kriya-logo.png resources/splash.png
```

5. **Generate all icon sizes:**

```bash
npx @capacitor/assets generate --iconBackgroundColor '#ffffff' --splashBackgroundColor '#ffffff'
```

This will automatically generate:

- Android: `mipmap-*` folders with all density icons
- iOS: `Assets.xcassets/AppIcon.appiconset` (if iOS folder exists)

### Option 2: Using Online Icon Generator

1. Go to https://icon.kitchen/ or https://www.appicon.co/
2. Upload `public/shadanga-kriya-logo.png`
3. Download Android and iOS icon sets
4. Extract and replace icons in:
   - **Android:** `android/app/src/main/res/mipmap-*/ic_launcher*.png`
   - **iOS:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

### Option 3: Manual Creation (For Designers)

Create icons in these sizes:

**Android (mipmap folders):**

- mdpi: 48x48
- hdpi: 72x72
- xhdpi: 96x96
- xxhdpi: 144x144
- xxxhdpi: 192x192

**iOS (if applicable):**

- 20x20, 29x29, 40x40, 58x58, 60x60, 76x76, 80x80, 87x87, 120x120, 152x152, 167x167, 180x180, 1024x1024

## After Generating Icons

1. **Sync with native projects:**

```bash
npx cap sync
```

2. **Build and test:**

```bash
# Android
npx cap open android
# Then build in Android Studio

# iOS (Mac only)
npx cap open ios
# Then build in Xcode
```

## Current Icon Files Location

- **Web favicon:** `public/favicon.ico`
- **Web logo:** `public/shadanga-kriya-logo.png`
- **Android icons:** `android/app/src/main/res/mipmap-*/ic_launcher*.png`
- **Android manifest:** Already configured to use `@mipmap/ic_launcher`

## Notes

- The current icons in Android folders are default Capacitor icons
- You must replace them with your Shadanga Kriya branded icons
- Recommended to use a square logo with padding for best results
- Icon should work on both light and dark backgrounds
