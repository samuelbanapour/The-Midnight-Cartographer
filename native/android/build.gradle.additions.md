# `android/app/build.gradle` additions

Apply these edits to the **app module** Gradle file after `npx cap add android`.

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

## 3. Dependencies

```gradle
dependencies {
    // Vungle (Liftoff) ads — resolved from Maven Central, no jar download needed.
    implementation 'com.vungle:vungle-ads:7.4.1'

    // Amazon Appstore SDK (IAP) — the one jar you still download from the
    // Amazon developer portal. Drop it in android/app/libs/.
    implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])

    // ...existing Capacitor / AndroidX deps...
}
```

`mavenCentral()` is already in the Capacitor-generated root `build.gradle`, so the
Vungle line resolves with no extra repository config.

Put the one downloaded jar in `android/app/libs/`:

```
android/app/libs/in-app-purchasing-3.0.x.jar      # Amazon Appstore SDK (IAP)
```

> The Amazon **Mobile Ads SDK no longer exists** — Amazon retired it. Ads on Fire
> tablets now come from third-party networks; we use Vungle. There is no
> `amazon-ads-*.jar` to download anymore.
