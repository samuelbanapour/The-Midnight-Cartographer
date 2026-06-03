package com.midnightcartographer.game;

// ---------------------------------------------------------------------------
// MonetizationPlugin — Amazon Mobile Ads (interstitial) + Amazon IAP (remove ads)
// ---------------------------------------------------------------------------
// Copy this file into your generated Android project after `npx cap add android`:
//   android/app/src/main/java/com/midnightcartographer/game/MonetizationPlugin.java
// and register it in MainActivity (see AMAZON_MONETIZATION_SETUP.md).
//
// Requires the Amazon Appstore SDK (in-app-purchasing) and the Amazon Mobile
// Ads SDK on the classpath. Setup steps are in AMAZON_MONETIZATION_SETUP.md.
// ---------------------------------------------------------------------------

import android.util.Log;

import androidx.annotation.NonNull;

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

// --- Amazon Mobile Ads --------------------------------------------------------
import com.amazon.device.ads.AdError;
import com.amazon.device.ads.AdRegistration;
import com.amazon.device.ads.InterstitialAd;
import com.amazon.device.ads.DefaultAdListener;

import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "Monetization")
public class MonetizationPlugin extends Plugin {

    private static final String TAG = "Monetization";

    // The SKU you create in the Amazon Developer Console (must match the JS side).
    private static final String REMOVE_ADS_SKU = "com.midnightcartographer.game.remove_ads";

    // Get your Application Key from the Amazon Mobile Ads dashboard.
    private static final String AMAZON_ADS_APP_KEY = "YOUR_AMAZON_ADS_APP_KEY";

    private boolean adsRemoved = false;
    private InterstitialAd interstitialAd;

    // Outstanding calls awaiting an async Amazon callback.
    private PluginCall pendingPurchaseCall;
    private PluginCall pendingRestoreCall;
    private PluginCall pendingInterstitialCall;

    @Override
    public void load() {
        super.load();

        // --- Initialise Amazon Mobile Ads ---
        try {
            AdRegistration.getInstance(AMAZON_ADS_APP_KEY, getContext());
            AdRegistration.enableLogging(true);
            // AdRegistration.enableTesting(true); // uncomment while developing
        } catch (Exception e) {
            Log.w(TAG, "Amazon Ads init failed", e);
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
        loadInterstitial();
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
            if (interstitialAd != null) {
                boolean showing = interstitialAd.showAd();
                if (!showing) {
                    resolveInterstitial(false);
                    loadInterstitial();
                }
            } else {
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

    // ===================== Amazon Mobile Ads ===============================

    private void loadInterstitial() {
        getActivity().runOnUiThread(() -> {
            try {
                interstitialAd = new InterstitialAd(getActivity());
                interstitialAd.setListener(new DefaultAdListener() {
                    @Override
                    public void onAdDismissed(com.amazon.device.ads.Ad ad) {
                        resolveInterstitial(true);
                        loadInterstitial(); // preload the next one
                    }

                    @Override
                    public void onAdFailedToLoad(com.amazon.device.ads.Ad ad, AdError error) {
                        Log.w(TAG, "Interstitial failed: " + error.getMessage());
                    }
                });
                interstitialAd.loadAd();
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
