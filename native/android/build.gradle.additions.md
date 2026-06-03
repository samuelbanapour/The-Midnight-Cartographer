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

## 2. Signing config + bundle Amazon jars (inside `android { … }`)

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

## 3. Dependencies — pick up the Amazon jars from `libs/`

In the `dependencies { … }` block (Capacitor already adds a `flatDir` for `libs`):

```gradle
dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar', '*.aar'])
    // ...existing Capacitor / AndroidX deps...
}
```

Put the downloaded SDK files in `android/app/libs/`:

```
android/app/libs/in-app-purchasing-3.0.x.jar      # Amazon Appstore SDK (IAP)
android/app/libs/amazon-ads-x.y.z.jar             # Amazon Mobile Ads SDK
```
