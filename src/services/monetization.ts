// ---------------------------------------------------------------------------
// Monetization: interstitial ads (Amazon Mobile Ads) + "Remove Ads" IAP
// ---------------------------------------------------------------------------
// The native work happens in a custom Capacitor plugin named "Monetization"
// (see native/android/MonetizationPlugin.java and AMAZON_MONETIZATION_SETUP.md).
//
// On the web (and in any environment without the native plugin) every call
// degrades gracefully so the game stays fully playable in the browser.
// ---------------------------------------------------------------------------

import { Capacitor, registerPlugin } from '@capacitor/core';

export const REMOVE_ADS_SKU = 'com.midnightcartographer.game.remove_ads';

interface MonetizationPlugin {
  /** Initialise the ad SDK + IAP listener and preload the first interstitial. */
  initialize(): Promise<void>;
  /** Returns whether the user owns the remove-ads entitlement. */
  getEntitlements(): Promise<{ adsRemoved: boolean }>;
  /** Show a preloaded interstitial (resolves once it is dismissed). */
  showInterstitial(): Promise<{ shown: boolean }>;
  /** Start the Amazon purchase flow for the given SKU. */
  purchase(options: { sku: string }): Promise<{ owned: boolean }>;
  /** Re-query Amazon for previously purchased entitlements. */
  restore(): Promise<{ adsRemoved: boolean }>;
}

const Monetization = registerPlugin<MonetizationPlugin>('Monetization');

const ENTITLEMENT_KEY = 'mc_ads_removed';
const isNative = Capacitor.isNativePlatform();

// ---- Local entitlement cache (source of truth for the UI) -----------------

function readCache(): boolean {
  try {
    return localStorage.getItem(ENTITLEMENT_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCache(value: boolean): void {
  try {
    localStorage.setItem(ENTITLEMENT_KEY, value ? '1' : '0');
  } catch {
    /* ignore */
  }
  if (value !== adsRemoved) {
    adsRemoved = value;
    listeners.forEach(fn => fn(adsRemoved));
  } else {
    adsRemoved = value;
  }
}

let adsRemoved = readCache();

// ---- Subscription so React UI can react to entitlement changes ------------

type Listener = (adsRemoved: boolean) => void;
const listeners = new Set<Listener>();

export function onEntitlementChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isAdsRemoved(): boolean {
  return adsRemoved;
}

// ---- Public API -----------------------------------------------------------

export async function initMonetization(): Promise<void> {
  if (!isNative) return;
  try {
    await Monetization.initialize();
    const { adsRemoved: owned } = await Monetization.getEntitlements();
    writeCache(owned);
  } catch (err) {
    console.warn('[monetization] init failed', err);
  }
}

/**
 * Show an interstitial at a natural break, but only if the player has not
 * purchased "Remove Ads". Fire-and-forget friendly — never throws.
 */
export async function showInterstitialIfNeeded(): Promise<void> {
  if (adsRemoved || !isNative) return;
  try {
    await Monetization.showInterstitial();
  } catch (err) {
    console.warn('[monetization] interstitial failed', err);
  }
}

/**
 * Start the Remove Ads purchase. Returns true if the entitlement is owned
 * afterwards. On the web this simulates a successful purchase so the flow can
 * be exercised in the browser; the real receipt check happens on-device.
 */
export async function purchaseRemoveAds(): Promise<boolean> {
  if (!isNative) {
    writeCache(true); // dev/browser simulation only
    return true;
  }
  try {
    const { owned } = await Monetization.purchase({ sku: REMOVE_ADS_SKU });
    if (owned) writeCache(true);
    return owned;
  } catch (err) {
    console.warn('[monetization] purchase failed', err);
    return false;
  }
}

/** Restore a previously purchased entitlement (required by Amazon). */
export async function restorePurchases(): Promise<boolean> {
  if (!isNative) return adsRemoved;
  try {
    const { adsRemoved: owned } = await Monetization.restore();
    writeCache(owned);
    return owned;
  } catch (err) {
    console.warn('[monetization] restore failed', err);
    return false;
  }
}
