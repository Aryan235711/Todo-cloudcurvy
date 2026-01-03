# New Logo Assets - Placement Guide

## 📂 Folder Structure

After downloading from icon generator, place files here:

### `web/` folder - Place these files:
- favicon.ico (16x16, 32x32, 48x48)
- logo-192.png (192x192)
- logo-512.png (512x512)
- apple-touch-icon.png (180x180)

### `android/` folder - Place these files:
Copy the entire `mipmap-*` folders from the generated zip:
- mipmap-mdpi/ic_launcher.png (48x48)
- mipmap-hdpi/ic_launcher.png (72x72)
- mipmap-xhdpi/ic_launcher.png (96x96)
- mipmap-xxhdpi/ic_launcher.png (144x144)
- mipmap-xxxhdpi/ic_launcher.png (192x192)

Also place splash screen files:
- drawable-*/splash.png (various sizes)

### `ios/` folder - Place these files:
Copy the entire AppIcon.appiconset folder contents:
- All icon sizes (20pt to 1024pt)
- Contents.json

---

## 🎯 Recommended: Use Icon Kitchen

1. Go to **https://icon.kitchen/**
2. Upload your logo
3. Select "Capacitor" template
4. Download the zip
5. Extract and copy files to the folders above

Once done, let me know and I'll automatically:
✅ Move all files to correct locations
✅ Update index.html with favicon links
✅ Create manifest.json for PWA
✅ Update notification icons
✅ Clean up old logo files

---

## 📋 What Sizes You Need (if generating manually):

**Web/PWA:**
- favicon.ico: 16, 32, 48px
- PWA icons: 192px, 512px
- Apple touch: 180px

**Android:**
- mdpi: 48px
- hdpi: 72px
- xhdpi: 96px
- xxhdpi: 144px
- xxxhdpi: 192px
- Splash: Multiple sizes for different orientations

**iOS:**
- App icons: 20pt to 1024pt (many sizes)
- Multiple scales (@2x, @3x)
