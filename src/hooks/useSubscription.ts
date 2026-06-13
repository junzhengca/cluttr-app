import { useCallback, useEffect, useState } from 'react';
import type { CustomerInfo } from 'react-native-purchases';
import {
  purchasesService,
  CLUTTR_PRO_ENTITLEMENT,
} from '../services/PurchasesService';

/**
 * Live subscription state (fed by the RevenueCat customer-info listener via
 * PurchasesService, same observer pattern as useHome) plus the purchase
 * actions screens need.
 *
 * Gate premium features with:
 *   const { isPro, presentPaywallIfNeeded } = useSubscription();
 *   const onPremiumFeature = async () => {
 *     if (await presentPaywallIfNeeded()) openFeature();
 *   };
 */
export const useSubscription = () => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(
    purchasesService.getCustomerInfo()
  );

  useEffect(() => {
    const unsubscribe = purchasesService.subscribe(() => {
      setCustomerInfo(purchasesService.getCustomerInfo());
    });
    // Initial sync in case info arrived before the subscription
    setCustomerInfo(purchasesService.getCustomerInfo());
    return unsubscribe;
  }, []);

  const presentPaywall = useCallback(
    () => purchasesService.presentPaywall(),
    []
  );
  const presentPaywallIfNeeded = useCallback(
    () => purchasesService.presentPaywallIfNeeded(),
    []
  );
  const presentCustomerCenter = useCallback(
    () => purchasesService.presentCustomerCenter(),
    []
  );
  const restorePurchases = useCallback(
    () => purchasesService.restorePurchases(),
    []
  );

  const proEntitlement =
    customerInfo?.entitlements.active[CLUTTR_PRO_ENTITLEMENT] ?? null;

  return {
    /** False when running a dev client built without the RevenueCat SDK. */
    isAvailable: purchasesService.isConfigured(),
    customerInfo,
    isPro: proEntitlement !== null,
    /** Active Cluttr Pro entitlement details (expiration, willRenew, …). */
    proEntitlement,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    restorePurchases,
  };
};
