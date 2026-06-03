# `android/app/build.gradle` additions

Apply these edits to the **app module** Gradle file after `npx cap add android`.

The game is free with no ads, so the only native dependency is the Amazon
Appstore SDK (IAP) for the optional "Tip the Owl" purchase.

## 1. Load signing keys from `key.properties` (top of the file)

Add **above** the `android { … }` block:

```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

## 2. Signing config (inside `android { … }`)

```gradle
android {
    // ...existing config (namespace, compileSdk, defaultConfig, etc.)...

    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false        // keep simple; enable + add ProGuard rules if you shrink
            // ...existing release settings...
        }
    }
}
```

## 3. Dependencies — pick up the Amazon IAP jar from `libs/`

```gradle
dependencies {
    // Amazon Appstore SDK (IAP) — the one jar you download from the Amazon
    // developer portal. Drop it in android/app/libs/.
    implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])

    // ...existing Capacitor / AndroidX deps...
}
```

Put the downloaded jar in `android/app/libs/`:

```
android/app/libs/in-app-purchasing-3.0.x.jar      # Amazon Appstore SDK (IAP)
```

> No ad SDK is used. Amazon retired its own Mobile Ads SDK, and standalone
> third-party ad networks gate signup behind Google Play / Apple URLs that an
> Amazon-only app cannot provide. v1 ships free with an optional tip instead.
