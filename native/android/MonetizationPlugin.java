package com.midnightcartographer.game;

// ---------------------------------------------------------------------------
// MonetizationPlugin — optional "Tip the Owl" supporter IAP (Amazon Appstore)
// ---------------------------------------------------------------------------
// The game is free with no ads. This plugin exposes a single one-time
// "supporter" entitlement so players can optionally tip the developer.
//
// Copy this file into your generated Android project after `npx cap add android`:
//   android/app/src/main/java/com/midnightcartographer/game/MonetizationPlugin.java
// and register it in MainActivity (see AMAZON_MONETIZATION_SETUP.md).
//
// Requires the Amazon Appstore SDK (in-app-purchasing) on the classpath.
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

@CapacitorPlugin(name = "Monetization")
public class MonetizationPlugin extends Plugin {

    private static final String TAG = "Monetization";

    // The SKU you create in the Amazon Developer Console (must match the JS side).
    private static final String SUPPORTER_SKU = "com.midnightcartographer.game.supporter";

    private boolean supporter = false;

    // Outstanding calls awaiting an async Amazon callback.
    private PluginCall pendingPurchaseCall;
    private PluginCall pendingRestoreCall;

    @Override
    public void load() {
        super.load();
        // Register the IAP listener.
        PurchasingService.registerListener(getContext(), purchasingListener);
    }

    // ===================== Capacitor bridge methods =========================

    @PluginMethod
    public void initialize(PluginCall call) {
        // Sync user + entitlements.
        PurchasingService.getUserData();
        PurchasingService.getPurchaseUpdates(true);
        call.resolve();
    }

    @PluginMethod
    public void getEntitlements(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("supporter", supporter);
        call.resolve(ret);
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String sku = call.getString("sku", SUPPORTER_SKU);
        pendingPurchaseCall = call;
        PurchasingService.purchase(sku);
    }

    @PluginMethod
    public void restore(PluginCall call) {
        pendingRestoreCall = call;
        PurchasingService.getPurchaseUpdates(true);
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
                    supporter = true;
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
                    if (!receipt.isCanceled() && SUPPORTER_SKU.equals(receipt.getSku())) {
                        supporter = true;
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
        if (receipt != null && SUPPORTER_SKU.equals(receipt.getSku())) {
            supporter = true;
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
            ret.put("supporter", supporter);
            pendingRestoreCall.resolve(ret);
            pendingRestoreCall = null;
        }
    }
}
