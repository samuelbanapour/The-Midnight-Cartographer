package com.midnightcartographer.game;

// ---------------------------------------------------------------------------
// MainActivity — registers the custom Monetization plugin.
// ---------------------------------------------------------------------------
// After `npx cap add android`, copy this over the generated file at:
//   android/app/src/main/java/com/midnightcartographer/game/MainActivity.java
// (the integrate.sh script does this for you).
// ---------------------------------------------------------------------------

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be registered before super.onCreate so the bridge picks it up.
        registerPlugin(MonetizationPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
