import { useEffect, useState, useCallback } from "react";
import { Capacitor } from "@capacitor/core";
import {
  Purchases,
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
} from "@revenuecat/purchases-capacitor";
import {
  RevenueCatUI,
  PAYWALL_RESULT,
} from "@revenuecat/purchases-capacitor-ui";

const REVENUECAT_IOS_API_KEY = import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string;

/**
 * Interface for the result of a course purchase.
 */
export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  appUserId?: string;
  error?: string;
}

/**
 * Hook to manage RevenueCat purchases — iOS only.
 *
 * Provides:
 *  - `isConfigured` – whether the SDK finished initialising
 *  - `customerInfo` – latest customer info from RevenueCat
 *  - `isProUser` – quick boolean check (has *any* active entitlement)
 *  - `hasEntitlement(id)` – check a specific entitlement by ID
 *  - `presentPaywall()` – show the RevenueCat paywall UI
 *  - `getOfferings()` – fetch available offerings
 *  - `restorePurchases()` – restore previous purchases
 *  - `loading` – true while the SDK is being configured
 *  - `error` – any error that occurred during configuration
 */
export function useRevenueCat() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Initialise the SDK (iOS only) ──────────────────────────
  useEffect(() => {
    async function configurePurchases() {
      const platform = Capacitor.getPlatform();

      // Only configure RevenueCat on iOS
      if (platform !== "ios") {
        console.log("[RevenueCat] Skipping — not iOS platform");
        setLoading(false);
        return;
      }

      try {
        // Enable debug logs in development
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

        // Configure with iOS API key
        await Purchases.configure({
          apiKey: REVENUECAT_IOS_API_KEY,
        });

        console.log("[RevenueCat] SDK configured successfully for iOS");

        // Fetch initial customer info
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info.customerInfo);
        setIsConfigured(true);
      } catch (err: any) {
        console.error("[RevenueCat] Configuration error:", err);
        setError(err?.message || "Failed to configure RevenueCat");
      } finally {
        setLoading(false);
      }
    }

    configurePurchases();
  }, []);

  // ─── Check whether user has any active entitlement ──────────
  const isProUser =
    customerInfo != null &&
    Object.keys(customerInfo.entitlements.active).length > 0;

  // ─── Check a specific entitlement by its ID ─────────────────
  const hasEntitlement = useCallback(
    (entitlementId: string): boolean => {
      if (!customerInfo) return false;
      return entitlementId in customerInfo.entitlements.active;
    },
    [customerInfo]
  );

  // ─── Present the RevenueCat paywall UI ──────────────────────
  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (Capacitor.getPlatform() !== "ios") {
      console.warn("[RevenueCat] Paywall only available on iOS");
      return false;
    }

    try {
      const { result } = await RevenueCatUI.presentPaywall();

      switch (result) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED: {
          // Refresh customer info after successful purchase / restore
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info.customerInfo);
          return true;
        }
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
        case PAYWALL_RESULT.CANCELLED:
        default:
          return false;
      }
    } catch (err: any) {
      console.error("[RevenueCat] Paywall error:", err);
      return false;
    }
  }, []);

  // ─── Present paywall for a specific offering ────────────────
  const presentPaywallIfNeeded = useCallback(
    async (entitlementId: string): Promise<boolean> => {
      if (Capacitor.getPlatform() !== "ios") return false;

      try {
        const { result } =
          await RevenueCatUI.presentPaywallIfNeeded({
            requiredEntitlementIdentifier: entitlementId,
          });

        switch (result) {
          case PAYWALL_RESULT.PURCHASED:
          case PAYWALL_RESULT.RESTORED: {
            const info = await Purchases.getCustomerInfo();
            setCustomerInfo(info.customerInfo);
            return true;
          }
          default:
            return false;
        }
      } catch (err: any) {
        console.error("[RevenueCat] PaywallIfNeeded error:", err);
        return false;
      }
    },
    []
  );

  // ─── Get available offerings ────────────────────────────────
  const getOfferings =
    useCallback(async (): Promise<PurchasesOfferings | null> => {
      if (Capacitor.getPlatform() !== "ios") return null;

      try {
        const offerings = await Purchases.getOfferings();
        return offerings;
      } catch (err: any) {
        console.error("[RevenueCat] Offerings error:", err);
        return null;
      }
    }, []);

  // ─── Restore purchases ─────────────────────────────────────
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (Capacitor.getPlatform() !== "ios") return false;

    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info.customerInfo);
      return true;
    } catch (err: any) {
      console.error("[RevenueCat] Restore error:", err);
      return false;
    }
  }, []);

  // ─── Refresh customer info on demand ────────────────────────
  const refreshCustomerInfo = useCallback(async () => {
    if (Capacitor.getPlatform() !== "ios") return;

    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info.customerInfo);
    } catch (err: any) {
      console.error("[RevenueCat] Refresh error:", err);
    }
  }, []);

  // ─── Purchase a specific package directly ────────────────────
  const purchaseCourse = useCallback(async (productId?: string): Promise<PurchaseResult> => {
    if (Capacitor.getPlatform() !== "ios") return { success: false, error: "Not iOS platform" };

    try {
      const offerings = await Purchases.getOfferings();
      const pkgToFind = productId || "com.shadangakriya.course_full"; // fallback
      const pkg = offerings.current?.availablePackages.find(
        (p) => p.product.identifier === pkgToFind
      );

      if (!pkg) {
        console.error("[RevenueCat] Package not found");
        return { success: false, error: "Package not found" };
      }

      const { customerInfo, transaction } = await Purchases.purchasePackage({
        aPackage: pkg,
      });

      setCustomerInfo(customerInfo);
      const { appUserID } = await Purchases.getAppUserID();

      if ("course_access" in customerInfo.entitlements.active || customerInfo.entitlements.active[productId || ""]) {
        return {
          success: true,
          transactionId: transaction.transactionIdentifier,
          appUserId: appUserID,
        };
      }
      return { success: false, error: "Entitlement not granted after purchase" };
    } catch (err: any) {
      if (!err?.userCancelled) {
        console.error("[RevenueCat] Purchase error:", err);
      }
      return { success: false, error: err?.message || "Purchase failed or cancelled" };
    }
  }, []);

  return {
    isConfigured,
    customerInfo,
    isProUser,
    hasEntitlement,
    presentPaywall,
    presentPaywallIfNeeded,
    purchaseCourse,
    getOfferings,
    restorePurchases,
    refreshCustomerInfo,
    loading,
    error,
  };
}
