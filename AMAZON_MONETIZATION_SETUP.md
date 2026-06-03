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

## 3. Copy the plugin into the project

Copy the plugin to match its package path:

```
native/android/MonetizationPlugin.java
  → android/app/src/main/java/com/midnightcartographer/game/MonetizationPlugin.java
```

Then set your **Amazon Mobile Ads Application Key** at the top of the file:

```java
private static final String AMAZON_ADS_APP_KEY = "YOUR_AMAZON_ADS_APP_KEY";
```

## 4. Register the plugin in MainActivity

Edit `android/app/src/main/java/com/midnightcartographer/game/MainActivity.java`:

```java
import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MonetizationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

## 5. AndroidManifest permissions

In `android/app/src/main/AndroidManifest.xml`, inside `<manifest>`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

And inside `<application>` add the Amazon Ads activity (per the Mobile Ads SDK docs):

```xml
<activity
    android:name="com.amazon.device.ads.AdActivity"
    android:configChanges="keyboardHidden|orientation|screenSize" />
```

## 6. Create the SKU in the Developer Console

1. Go to **Amazon Developer Console → your app → In-App Items**.
2. Add a **Consumable? No → Entitlement** item.
3. **SKU:** `com.midnightcartographer.game.remove_ads`
4. Set the title, description, and price (e.g. $2.99), then submit it with the
   app (entitlements must be published with/before the build that uses them).

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
