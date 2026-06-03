// ---------------------------------------------------------------------------
// Monetization: optional "Tip the Owl" support purchase (Amazon IAP)
// ---------------------------------------------------------------------------
// The game is free with no ads. Players can optionally make a one-time
// purchase to support the developer, which grants a permanent "supporter"
// entitlement (a small thank-you state in the UI).
//
// The native work happens in a custom Capacitor plugin named "Monetization"
// (see native/android/MonetizationPlugin.java and AMAZON_MONETIZATION_SETUP.md).
//
// On the web (and in any environment without the native plugin) every call
// degrades gracefully so the game stays fully playable in the browser.
// ---------------------------------------------------------------------------

import { Capacitor, registerPlugin } from '@capacitor/core';

export const SUPPORTER_SKU = 'com.midnightcartographer.game.supporter';

interface MonetizationPlugin {
  /** Initialise the IAP listener and sync entitlements. */
  initialize(): Promise<void>;
  /** Returns whether the user owns the supporter entitlement. */
  getEntitlements(): Promise<{ supporter: boolean }>;
  /** Start the Amazon purchase flow for the given SKU. */
  purchase(options: { sku: string }): Promise<{ owned: boolean }>;
  /** Re-query Amazon for previously purchased entitlements. */
  restore(): Promise<{ supporter: boolean }>;
}

const Monetization = registerPlugin<MonetizationPlugin>('Monetization');

const ENTITLEMENT_KEY = 'mc_supporter';
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
  if (value !== supporter) {
    supporter = value;
    listeners.forEach(fn => fn(supporter));
  } else {
    supporter = value;
  }
}

let supporter = readCache();

// ---- Subscription so React UI can react to entitlement changes ------------

type Listener = (supporter: boolean) => void;
const listeners = new Set<Listener>();

export function onEntitlementChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function isSupporter(): boolean {
  return supporter;
}

// ---- Public API -----------------------------------------------------------

export async function initMonetization(): Promise<void> {
  if (!isNative) return;
  try {
    await Monetization.initialize();
    const { supporter: owned } = await Monetization.getEntitlements();
    writeCache(owned);
  } catch (err) {
    console.warn('[monetization] init failed', err);
  }
}

/**
 * Start the supporter purchase. Returns true if the entitlement is owned
 * afterwards. On the web this simulates a successful purchase so the flow can
 * be exercised in the browser; the real receipt check happens on-device.
 */
export async function purchaseSupporter(): Promise<boolean> {
  if (!isNative) {
    writeCache(true); // dev/browser simulation only
    return true;
  }
  try {
    const { owned } = await Monetization.purchase({ sku: SUPPORTER_SKU });
    if (owned) writeCache(true);
    return owned;
  } catch (err) {
    console.warn('[monetization] purchase failed', err);
    return false;
  }
}

/** Restore a previously purchased entitlement (required by Amazon). */
export async function restorePurchases(): Promise<boolean> {
  if (!isNative) return supporter;
  try {
    const { supporter: owned } = await Monetization.restore();
    writeCache(owned);
    return owned;
  } catch (err) {
    console.warn('[monetization] restore failed', err);
    return false;
  }
}
