# 📱 EcoCapture Native Mobilapp - Komplett Guide

## Vad har gjorts?

Din PWA har nu förberedts för konvertering till en **riktig native mobilapp** med Capacitor! Detta ger:

✅ Tillgång till AdMob (bättre annonsintäkter än AdSense)
✅ Full tillgång till telefonfunktioner (kamera, GPS, notifikationer)
✅ Publicering till App Store och Google Play
✅ Bättre prestanda och användarupplevelse
✅ Native känsla på iOS och Android

## Nästa Steg - Bygg din mobilapp lokalt

### 1. Exportera projektet till GitHub

1. Klicka på **"Export to GitHub"** i Lovable (högst upp till höger)
2. Följ instruktionerna för att skapa ett GitHub-repo
3. Git pull projektet till din lokala maskin:
   ```bash
   git clone https://github.com/ditt-användarnamn/eco-capture-guide.git
   cd eco-capture-guide
   ```

### 2. Installera dependencies

```bash
npm install
```

### 3. Initiera Capacitor (om inte redan gjort)

```bash
npx cap init
```

När promptad, använd:
- **App ID:** `app.lovable.56a119db65174f22a5fe62ee00c11a56`
- **App Name:** `eco-capture-guide`

### 4. Lägg till plattformar

**För iOS (kräver Mac med Xcode):**
```bash
npx cap add ios
npx cap update ios
```

**För Android:**
```bash
npx cap add android
npx cap update android
```

### 5. Bygg projektet

```bash
npm run build
```

### 6. Synka med native projekt

```bash
npx cap sync
```

**OBS:** Kör `npx cap sync` varje gång du gör git pull med nya ändringar!

### 7. Öppna i native IDE

**För iOS:**
```bash
npx cap open ios
```
Detta öppnar Xcode. Du kan nu köra appen på iOS Simulator eller din iPhone.

**För Android:**
```bash
npx cap open android
```
Detta öppnar Android Studio. Du kan nu köra appen på Android Emulator eller din Android-telefon.

### 8. Alternativt: Kör direkt från terminalen

**För Android:**
```bash
npx cap run android
```

**För iOS:**
```bash
npx cap run ios
```

## Hot Reload under utveckling

Din app är konfigurerad för **hot reload** från Lovable sandbox:
- Gör ändringar i Lovable
- Appen uppdateras automatiskt på din telefon/emulator
- Perfekt för snabb utveckling!

**URL:** `https://56a119db-6517-4f22-a5fe-62ee00c11a56.lovableproject.com?forceHideBadge=true`

## Nästa: Integrera AdMob

### 1. Skapa AdMob-konto

1. Gå till [admob.google.com](https://admob.google.com/)
2. Registrera dig och skapa ditt konto
3. Skapa två appar: en för iOS, en för Android

### 2. Få dina Ad Unit IDs

Skapa dessa ad units för varje app:
- **Interstitial Ad** (helskärmsannons innan analys)
- **Rewarded Ad** (videoannons för bonusar)
- **Banner Ad** (banner i loggbok)

### 3. Installera AdMob Capacitor Plugin

```bash
npm install @capacitor-community/admob
npx cap sync
```

### 4. Lägg till AdMob Secrets i Lovable

I Lovable-projektet, använd Secrets-funktionen:
```
ADMOB_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/1111111111
ADMOB_REWARDED_ID=ca-app-pub-XXXXXXXXXXXXXXXX/2222222222
ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/3333333333
```

### 5. Uppdatera Ad-komponenter

Dina `AdDisplay`, `BannerAd`, och `RewardedAdDialog` komponenter måste uppdateras för att använda native AdMob API istället för simulerade annonser.

## Publicera till App Stores

### Apple App Store

**Krav:**
- Mac med Xcode installerat
- Apple Developer-konto ($99/år)
- [Registrera här](https://developer.apple.com/)

**Steg:**
1. Öppna projektet i Xcode: `npx cap open ios`
2. Konfigurera signing & capabilities
3. Välj Generic iOS Device eller din connected iPhone
4. Product → Archive
5. Följ guiden för att ladda upp till App Store Connect

### Google Play Store

**Krav:**
- Android Studio installerat
- Google Play Developer-konto ($25 engångsavgift)
- [Registrera här](https://play.google.com/console/)

**Steg:**
1. Öppna projektet i Android Studio: `npx cap open android`
2. Build → Generate Signed Bundle / APK
3. Skapa en keystore och signera din app
4. Ladda upp AAB-filen till Google Play Console

## Systemkrav

**För iOS-utveckling:**
- Mac med macOS 12.0 eller senare
- Xcode 14 eller senare
- CocoaPods (installeras automatiskt)

**För Android-utveckling:**
- Windows, Mac, eller Linux
- Android Studio Arctic Fox eller senare
- Java Development Kit (JDK) 11 eller senare

## Felsökning

**Problem med iOS build:**
```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

**Problem med Android build:**
1. Öppna Android Studio
2. Tools → SDK Manager → Installera senaste SDK
3. File → Invalidate Caches / Restart

**Hot reload fungerar inte:**
- Kontrollera att appen och datorn är på samma WiFi
- Verifiera URL:en i `capacitor.config.ts`

## Mer information

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Publishing Guide](https://capacitorjs.com/docs/ios/deploying-to-app-store)
- [Android Publishing Guide](https://capacitorjs.com/docs/android/deploying-to-google-play)
- [AdMob Integration](https://github.com/capacitor-community/admob)

## Support

Behöver du hjälp? Fråga mig om:
- Att uppdatera native konfiguration
- Att integrera AdMob native ads
- Att lösa build-problem
- Att optimera för App Store submission

---

**🎉 Grattis!** Din app är nu redo att bli en riktig mobilapp på iOS och Android!
