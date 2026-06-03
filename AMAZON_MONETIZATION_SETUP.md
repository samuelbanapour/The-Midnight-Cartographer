# Amazon Monetization Setup — Ads + "Remove Ads" IAP

This game shows an **interstitial ad between nights** and offers a one-time
**"Remove Ads"** in-app purchase. The TypeScript side is already wired up; this
guide covers the native Android integration needed before you ship to the
**Amazon Appstore**.

> **Why not AdMob?** Amazon Fire tablets have no Google Play Services, so AdMob
> won't serve there. We use the **Amazon Mobile Ads SDK** (interstitial) and the
> **Amazon Appstore SDK** (in-app purchasing), both of which work on Fire OS.

---

## How it fits together

| Layer | File | Role |
|-------|------|------|
| UI | `src/components/RemoveAdsButton.tsx` | Buy / restore buttons (title + upgrade shop) |
| Bridge | `src/services/monetization.ts` | Calls the native plugin; web fallback |
| Native | `native/android/MonetizationPlugin.java` | Amazon Ads + Amazon IAP |
| Test data | `native/android/amazon.sdktester.json` | Local IAP testing config |

The remove-ads entitlement is cached in `localStorage` (`mc_ads_removed`) and
re-synced from Amazon on every launch via `initialize()` → `getEntitlements()`.
`showInterstitialIfNeeded()` is a no-op once the entitlement is owned.

**SKU:** `com.midnightcartographer.game.remove_ads` (must match in the JS
service, the Java plugin, the tester JSON, and the Developer Console).

---

## 1. Generate the Android project

```bash
npm install
npm run build
npx cap add android
npm run cap:sync
```

## 2. Add the Amazon SDK jars

1. Download the **Amazon Appstore SDK** (In-App Purchasing) and the
   **Amazon Mobile Ads SDK** from the
   [Amazon Developer Portal](https://developer.amazon.com/).
2. Copy the `.jar`/`.aar` files into `android/app/libs/`.
3. In `android/app/build.gradle`, ensure:

   ```gradle
   dependencies {
       implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])
       // ...existing Capacitor deps...
   }
   ```

## 3. Copy the native sources into the project

Run the helper script (copies `MonetizationPlugin.java` **and** `MainActivity.java`
into the right package folder):

```bash
bash native/android/integrate.sh
```

Then set your **Amazon Mobile Ads Application Key** near the top of
`android/app/src/main/java/com/midnightcartographer/game/MonetizationPlugin.java`:

```java
private static final String AMAZON_ADS_APP_KEY = "YOUR_AMAZON_ADS_APP_KEY";
```

> ⚠️ Once the plugin is in place the build will **fail to compile** until the
> Amazon jars (step 2) are present, because it imports `com.amazon.device.*`.
> Do steps 2 and 3 together.

## 4. Apply the Gradle additions

Edit `android/app/build.gradle` per
[`native/android/build.gradle.additions.md`](native/android/build.gradle.additions.md)
— this adds the `libs/` jar dependency **and** the release signing config.

## 5. Merge the AndroidManifest additions

Merge [`native/android/AndroidManifest.additions.xml`](native/android/AndroidManifest.additions.xml)
into `android/app/src/main/AndroidManifest.xml` — internet permissions, the
Amazon Ads `AdActivity`, and the Amazon IAP `ResponseReceiver`.

## 6. Create the SKU in the Developer Console

1. Go to **Amazon Developer Console → your app → In-App Items**.
2. Add a **Consumable? No → Entitlement** item.
3. **SKU:** `com.midnightcartographer.game.remove_ads`
4. Set the title, description, and price (e.g. $2.99), then submit it with the
   app (entitlements must be published with/before the build that uses them).

---

## Build a signed release AAB

The Amazon Appstore rejects debug builds (`app-debug.aab`). Ship a **signed
release** bundle.

### One-time: create a keystore

```bash
mkdir -p android/keystore
keytool -genkey -v \
  -keystore android/keystore/midnight-release.jks \
  -alias midnight -keyalg RSA -keysize 2048 -validity 10000
```

Keep the `.jks` file and passwords safe — you must reuse the **same** keystore
for every future update, or Amazon will reject the upload.

### One-time: point Gradle at the keystore

```bash
cp native/android/key.properties.example android/key.properties
# then edit android/key.properties with your real store/key passwords
```

`android/` is git-ignored, so the keystore and `key.properties` stay out of the
repo. Keep your own private backup of both.

### Every build

```bash
npm run build          # rebuild web assets into dist/
npm run cap:sync       # copy dist/ + plugins into android/
cd android && ./gradlew bundleRelease
# → android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` in the Amazon console, set **DRM → No** (free,
ad-supported app), and submit.

---

## Testing IAP locally (Amazon App Tester)

1. Install the **Amazon App Tester** on your Fire device / emulator.
2. Push the tester config:

   ```bash
   adb push native/android/amazon.sdktester.json /sdcard/amazon.sdktester.json
   ```

3. Open App Tester → it loads the SKU above.
4. Launch your app **through App Tester** and exercise:
   - **Remove Ads** → purchase flow → ads stop, button shows "Ad-free".
   - **Restore purchase** → re-grants entitlement on a fresh install.
   - Finish a night → interstitial appears **only** when ads are not removed.

---

## Testing ads

While developing, uncomment in `MonetizationPlugin.java`:

```java
AdRegistration.enableTesting(true);
```

so the Mobile Ads SDK serves test creatives. **Remove this before release.**

---

## Behaviour summary

- **Interstitial trigger:** when the player taps *Begin Night N* from the
  upgrade shop (`handleNextNight` in `GameScreen.tsx`).
- **Gating:** `showInterstitialIfNeeded()` returns immediately if `adsRemoved`
  is true or the platform is not native (web).
- **Web/browser:** no native plugin → ads never show, and *Remove Ads*
  simulates a purchase so you can preview the ad-free UI state.
