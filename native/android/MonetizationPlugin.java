package com.midnightcartographer.game;

// ---------------------------------------------------------------------------
// MonetizationPlugin — Vungle (Liftoff) interstitials + Amazon IAP (remove ads)
// ---------------------------------------------------------------------------
// Copy this file into your generated Android project after `npx cap add android`:
//   android/app/src/main/java/com/midnightcartographer/game/MonetizationPlugin.java
// and register it in MainActivity (see AMAZON_MONETIZATION_SETUP.md).
//
// Ads:  Vungle Ads SDK (Maven Central — no jar download). Fire-tablet compatible.
// IAP:  Amazon Appstore SDK (in-app-purchasing) for the Remove Ads entitlement.
// Setup steps are in AMAZON_MONETIZATION_SETUP.md.
// ---------------------------------------------------------------------------

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// --- Amazon In-App Purchasing -------------------------------------------------
import com.amazon.device.iap.PurchasingListener;
import com.amazon.device.iap.PurchasingService;
import com.amazon.device.iap.model.FulfillmentResult;
import com.amazon.device.iap.model.ProductDataResponse;
import com.amazon.device.iap.model.PurchaseResponse;
import com.amazon.device.iap.model.PurchaseUpdatesResponse;
import com.amazon.device.iap.model.Receipt;
import com.amazon.device.iap.model.UserDataResponse;

// --- Vungle (Liftoff) Ads -----------------------------------------------------
import com.vungle.ads.BaseAd;
import com.vungle.ads.InitializationListener;
import com.vungle.ads.InterstitialAd;
import com.vungle.ads.InterstitialAdListener;
import com.vungle.ads.VungleAds;
import com.vungle.ads.VungleError;

@CapacitorPlugin(name = "Monetization")
public class MonetizationPlugin extends Plugin {

    private static final String TAG = "Monetization";

    // The SKU you create in the Amazon Developer Console (must match the JS side).
    private static final String REMOVE_ADS_SKU = "com.midnightcartographer.game.remove_ads";

    // From the Vungle/Liftoff dashboard (https://publisher.vungle.com).
    private static final String VUNGLE_APP_ID = "YOUR_VUNGLE_APP_ID";
    private static final String VUNGLE_PLACEMENT_ID = "YOUR_VUNGLE_INTERSTITIAL_PLACEMENT_ID";

    private boolean adsRemoved = false;
    private boolean adsInitialized = false;
    private InterstitialAd interstitialAd;

    // Outstanding calls awaiting an async callback.
    private PluginCall pendingPurchaseCall;
    private PluginCall pendingRestoreCall;
    private PluginCall pendingInterstitialCall;

    @Override
    public void load() {
        super.load();

        // --- Initialise Vungle Ads ---
        try {
            VungleAds.init(getContext(), VUNGLE_APP_ID, new InitializationListener() {
                @Override
                public void onSuccess() {
                    adsInitialized = true;
                    loadInterstitial(); // preload the first one
                }

                @Override
                public void onError(VungleError error) {
                    Log.w(TAG, "Vungle init failed: " + error.getErrorMessage());
                }
            });
        } catch (Exception e) {
            Log.w(TAG, "Vungle init threw", e);
        }

        // --- Register the IAP listener ---
        PurchasingService.registerListener(getContext(), purchasingListener);
    }

    // ===================== Capacitor bridge methods =========================

    @PluginMethod
    public void initialize(PluginCall call) {
        // Sync user + entitlements, then preload an interstitial.
        PurchasingService.getUserData();
        PurchasingService.getPurchaseUpdates(true);
        if (adsInitialized) {
            loadInterstitial();
        }
        call.resolve();
    }

    @PluginMethod
    public void getEntitlements(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("adsRemoved", adsRemoved);
        call.resolve(ret);
    }

    @PluginMethod
    public void showInterstitial(final PluginCall call) {
        if (adsRemoved) {
            JSObject ret = new JSObject();
            ret.put("shown", false);
            call.resolve(ret);
            return;
        }
        pendingInterstitialCall = call;
        getActivity().runOnUiThread(() -> {
            if (interstitialAd != null && interstitialAd.canPlayAd()) {
                interstitialAd.play(getContext());
            } else {
                // Not ready yet — resolve gracefully and start loading the next one.
                resolveInterstitial(false);
                loadInterstitial();
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String sku = call.getString("sku", REMOVE_ADS_SKU);
        pendingPurchaseCall = call;
        PurchasingService.purchase(sku);
    }

    @PluginMethod
    public void restore(PluginCall call) {
        pendingRestoreCall = call;
        PurchasingService.getPurchaseUpdates(true);
    }

    // ===================== Vungle Ads ======================================

    private void loadInterstitial() {
        if (!adsInitialized || adsRemoved) return;
        getActivity().runOnUiThread(() -> {
            try {
                interstitialAd = new InterstitialAd(getContext(), VUNGLE_PLACEMENT_ID, new com.vungle.ads.AdConfig());
                interstitialAd.setAdListener(new InterstitialAdListener() {
                    @Override
                    public void onAdLoaded(BaseAd baseAd) {
                        // Ready to show.
                    }

                    @Override
                    public void onAdFailedToLoad(BaseAd baseAd, VungleError error) {
                        Log.w(TAG, "Interstitial failed to load: " + error.getErrorMessage());
                    }

                    @Override
                    public void onAdStart(BaseAd baseAd) {}

                    @Override
                    public void onAdImpression(BaseAd baseAd) {}

                    @Override
                    public void onAdClicked(BaseAd baseAd) {}

                    @Override
                    public void onAdEnd(BaseAd baseAd) {
                        resolveInterstitial(true);
                        loadInterstitial(); // preload the next one
                    }

                    @Override
                    public void onAdFailedToPlay(BaseAd baseAd, VungleError error) {
                        Log.w(TAG, "Interstitial failed to play: " + error.getErrorMessage());
                        resolveInterstitial(false);
                        loadInterstitial();
                    }

                    @Override
                    public void onAdLeftApplication(BaseAd baseAd) {}
                });
                interstitialAd.load();
            } catch (Exception e) {
                Log.w(TAG, "loadInterstitial failed", e);
            }
        });
    }

    private void resolveInterstitial(boolean shown) {
        if (pendingInterstitialCall != null) {
            JSObject ret = new JSObject();
            ret.put("shown", shown);
            pendingInterstitialCall.resolve(ret);
            pendingInterstitialCall = null;
        }
    }

    // ===================== Amazon IAP listener =============================

    private final PurchasingListener purchasingListener = new PurchasingListener() {
        @Override
        public void onUserDataResponse(UserDataResponse response) {
            // Current Amazon user — useful for multi-user receipt validation.
        }

        @Override
        public void onProductDataResponse(ProductDataResponse response) {
            // Product metadata (price, title). Not required for entitlement gating.
        }

        @Override
        public void onPurchaseResponse(PurchaseResponse response) {
            PurchaseResponse.RequestStatus status = response.getRequestStatus();
            switch (status) {
                case SUCCESSFUL:
                    Receipt receipt = response.getReceipt();
                    grantEntitlement(receipt);
                    resolvePurchase(true);
                    break;
                case ALREADY_PURCHASED:
                    adsRemoved = true;
                    resolvePurchase(true);
                    break;
                case FAILED:
                case INVALID_SKU:
                case NOT_SUPPORTED:
                default:
                    resolvePurchase(false);
                    break;
            }
        }

        @Override
        public void onPurchaseUpdatesResponse(PurchaseUpdatesResponse response) {
            if (response.getRequestStatus() == PurchaseUpdatesResponse.RequestStatus.SUCCESSFUL) {
                for (Receipt receipt : response.getReceipts()) {
                    if (!receipt.isCanceled() && REMOVE_ADS_SKU.equals(receipt.getSku())) {
                        adsRemoved = true;
                        PurchasingService.notifyFulfillment(
                            receipt.getReceiptId(), FulfillmentResult.FULFILLED);
                    }
                }
                // Amazon paginates updates; fetch more if present.
                if (response.hasMore()) {
                    PurchasingService.getPurchaseUpdates(false);
                    return;
                }
            }
            resolveRestore();
        }
    };

    private void grantEntitlement(Receipt receipt) {
        if (receipt != null && REMOVE_ADS_SKU.equals(receipt.getSku())) {
            adsRemoved = true;
            PurchasingService.notifyFulfillment(
                receipt.getReceiptId(), FulfillmentResult.FULFILLED);
        }
    }

    private void resolvePurchase(boolean owned) {
        if (pendingPurchaseCall != null) {
            JSObject ret = new JSObject();
            ret.put("owned", owned);
            pendingPurchaseCall.resolve(ret);
            pendingPurchaseCall = null;
        }
    }

    private void resolveRestore() {
        if (pendingRestoreCall != null) {
            JSObject ret = new JSObject();
            ret.put("adsRemoved", adsRemoved);
            pendingRestoreCall.resolve(ret);
            pendingRestoreCall = null;
        }
    }
}
