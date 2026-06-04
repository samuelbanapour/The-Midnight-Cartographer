# Amazon Monetization Setup — Free + optional "Tip the Owl" IAP

The game is **free with no ads**. Players can optionally make a one-time
**"Tip the Owl"** purchase to support the developer, which grants a permanent
"supporter" entitlement (a small thank-you state in the UI). The TypeScript
side is already wired up; this guide covers the native Android integration
needed before you ship to the **Amazon Appstore**.

> **Why no ads?** Amazon **retired its own Mobile Ads SDK**, and standalone
> third-party ad networks (Vungle, AdColony, etc.) gate signup behind Google
> Play / Apple Store URLs that an Amazon-exclusive app can't provide. APS is
> bidding-only and needs a separate primary ad server. So v1 ships free with an
> optional tip; an ad network can be added later if the app goes multi-store.

---

## How it fits together

| Layer | File | Role |
|-------|------|------|
| UI | `src/components/TipButton.tsx` | Tip / restore buttons (title + upgrade shop) |
| Bridge | `src/services/monetization.ts` | Calls the native plugin; web fallback |
| Native | `native/android/MonetizationPlugin.java` | Amazon IAP (supporter entitlement) |
| Test data | `native/android/amazon.sdktester.json` | Local IAP testing config |

The supporter entitlement is cached in `localStorage` (`mc_supporter`) and
re-synced from Amazon on every launch via `initialize()` → `getEntitlements()`.

**Tip tiers (SKUs):** the tip is offered as fixed-price tiers ($1 minimum,
$2.99 default) because Amazon IAP can't take an arbitrary amount. Owning **any**
tier grants the supporter entitlement. These must match across the JS service,
the Java plugin, the tester JSON, and the Developer Console:

| SKU | Price |
|-----|-------|
| `com.midnightcartographer.game.tip_1` | $1.00 |
| `com.midnightcartographer.game.tip_3` | $2.99 (default) |
| `com.midnightcartographer.game.tip_5` | $5.00 |
| `com.midnightcartographer.game.tip_10` | $10.00 |

---

## 1. Generate the Android project

```bash
npm install
npm run build
npx cap add android
npm run cap:sync
```

## 2. Add the Amazon IAP jar

1. Download the **Appstore SDK** (In-App Purchasing) from the Amazon Developer
   portal: **Monetization → Appstore SDK → Get started** (it contains the IAP
   JAR file).
2. Copy the single `in-app-purchasing-3.0.x.jar` into `android/app/libs/`.

> This is the only jar you download. No ad SDK is used.

## 3. Copy the native sources into the project

Run the helper script (copies `MonetizationPlugin.java` **and** `MainActivity.java`
into the right package folder):

```bash
bash native/android/integrate.sh
```

> ⚠️ Once the plugin is in place the build will **fail to compile** until the
> Amazon IAP jar (step 2) is present, because it imports `com.amazon.device.*`.
> Do steps 2 and 3 together.

## 4. Apply the Gradle additions

Edit `android/app/build.gradle` per
[`native/android/build.gradle.additions.md`](native/android/build.gradle.additions.md)
— this adds the `libs/` jar dependency **and** the release signing config.

## 5. Merge the AndroidManifest additions

Merge [`native/android/AndroidManifest.additions.xml`](native/android/AndroidManifest.additions.xml)
into `android/app/src/main/AndroidManifest.xml` — internet permissions and the
Amazon IAP `ResponseReceiver`.

## 6. Create the tip-tier SKUs in the Developer Console

1. Go to **Amazon Developer Console → your app → In-App Items**.
2. For **each** tier in the table above, add an **Entitlement** item
   (Consumable? **No**) with the matching SKU, title, and price:
   - `com.midnightcartographer.game.tip_1` → $1.00
   - `com.midnightcartographer.game.tip_3` → $2.99
   - `com.midnightcartographer.game.tip_5` → $5.00
   - `com.midnightcartographer.game.tip_10` → $10.00
3. Submit them with the app (entitlements must be published with/before the
   build that uses them). To offer a different set of amounts, edit `TIP_TIERS`
   in `src/services/monetization.ts` and `SUPPORTER_SKUS` in
   `MonetizationPlugin.java` to match.

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

Upload `app-release.aab` in the Amazon console, set **DRM → No** (free app),
and submit.

---

## Testing IAP locally (Amazon App Tester)

1. Install the **Amazon App Tester** on your Fire device / emulator.
2. Push the tester config:

   ```bash
   adb push native/android/amazon.sdktester.json /sdcard/amazon.sdktester.json
   ```

3. Open App Tester → it loads the tip-tier SKUs above.
4. Launch your app **through App Tester** and exercise:
   - **Tip the Owl** → pick a tier ($1 / $2.99 / $5 / $10) → purchase flow →
     button shows "Supporter — thank you".
   - **Restore purchase** → re-grants the entitlement on a fresh install.

---

## Behaviour summary

- **No ads.** The game is fully playable, start to finish, with no ad breaks.
- **Tip button:** appears on the title screen and at the bottom of the upgrade
  shop. Purchasing grants a permanent "supporter" thank-you state.
- **Supporter perk:** supporters can flip back through previously-seen clues
  during a contract (a "← Previous" button in the customer panel). Non-supporters
  see a gentle "🔒 Tip the Owl to revisit earlier clues" hint instead.
- **Web/browser:** no native plugin → *Tip the Owl* simulates a successful
  purchase so you can preview the supporter UI state and the clue-review perk.
