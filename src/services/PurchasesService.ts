import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { purchasesLogger } from '../utils/Logger';

/** The RevenueCat entitlement that gates all premium features. */
export const CLUTTR_PRO_ENTITLEMENT = 'Cluttr Pro';

export interface PurchaseOutcome {
  /** True when the entitlement is active after the operation. */
  unlocked: boolean;
  /** True when the user dismissed the store sheet without buying. */
  cancelled: boolean;
  customerInfo: CustomerInfo | null;
  error: string | null;
}

const isPurchasesError = (e: unknown): e is PurchasesError =>
  typeof e === 'object' && e !== null && 'code' in e && 'message' in e;

const isCancellation = (e: unknown): boolean =>
  isPurchasesError(e) &&
  e.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;

const errorMessage = (e: unknown): string =>
  isPurchasesError(e) ? e.message : e instanceof Error ? e.message : String(e);

/**
 * RevenueCat wrapper (observer pattern, like HomeService). Configured once at
 * app launch; identity is kept in sync with Firebase auth by authSaga
 * (logIn/logOut). Components consume it via the useSubscription hook.
 *
 * All methods are safe to call when the SDK is unavailable (e.g. a dev client
 * built before react-native-purchases was added): configure() fails soft and
 * everything else no-ops, so the rest of the app is unaffected.
 */
class PurchasesService {
  private listeners = new Set<() => void>();
  private customerInfo: CustomerInfo | null = null;
  private configured = false;

  /** Configure the SDK. Call once, as early as possible at app launch. */
  configure(): void {
    if (this.configured) return;

    const apiKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY,
    });

    if (!apiKey) {
      purchasesLogger.warn(
        'RevenueCat API key missing for this platform – purchases disabled'
      );
      return;
    }

    try {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
      Purchases.configure({ apiKey });
      // Fires immediately with cached info, then on every change (purchase,
      // renewal, billing issue, restore, logIn/logOut).
      Purchases.addCustomerInfoUpdateListener((info) => {
        this.customerInfo = info;
        this.notify();
      });
      this.configured = true;
      purchasesLogger.info('RevenueCat configured');
    } catch (error) {
      purchasesLogger.error(
        'Failed to configure RevenueCat (native module unavailable? rebuild the dev client)',
        error
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  // ─── Identity (kept in sync with Firebase auth by authSaga) ───────────────

  /** Alias the RevenueCat customer to the Firebase UID after sign-in. */
  async logIn(uid: string): Promise<void> {
    if (!this.configured) return;
    try {
      const { customerInfo } = await Purchases.logIn(uid);
      this.customerInfo = customerInfo;
      this.notify();
      purchasesLogger.info('RevenueCat logIn complete');
    } catch (error) {
      // Non-fatal: entitlements simply stay on the anonymous user until the
      // next launch retries. Never block auth on this.
      purchasesLogger.warn('RevenueCat logIn failed', error);
    }
  }

  /** Reset to an anonymous RevenueCat customer on sign-out. */
  async logOut(): Promise<void> {
    if (!this.configured) return;
    try {
      if (await Purchases.isAnonymous()) return; // logOut throws for anonymous users
      this.customerInfo = await Purchases.logOut();
      this.notify();
      purchasesLogger.info('RevenueCat logOut complete');
    } catch (error) {
      purchasesLogger.warn('RevenueCat logOut failed', error);
    }
  }

  // ─── Customer info & entitlements ──────────────────────────────────────────

  /** Last known customer info (kept fresh by the update listener). */
  getCustomerInfo(): CustomerInfo | null {
    return this.customerInfo;
  }

  /** Fetch customer info (served from the SDK cache when fresh). */
  async refreshCustomerInfo(): Promise<CustomerInfo | null> {
    if (!this.configured) return null;
    try {
      this.customerInfo = await Purchases.getCustomerInfo();
      this.notify();
      return this.customerInfo;
    } catch (error) {
      purchasesLogger.warn('Failed to fetch customer info', error);
      return this.customerInfo;
    }
  }

  /** Whether the Cluttr Pro entitlement is currently active. */
  isProActive(info: CustomerInfo | null = this.customerInfo): boolean {
    return Boolean(info?.entitlements.active[CLUTTR_PRO_ENTITLEMENT]);
  }

  // ─── Offerings & purchases ─────────────────────────────────────────────────

  /**
   * The current offering (the packages to display: monthly, yearly, lifetime).
   * Returns null when offline or not configured.
   */
  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    if (!this.configured) return null;
    try {
      const offerings = await Purchases.getOfferings();
      if (!offerings.current) {
        purchasesLogger.warn('No current offering configured in RevenueCat');
      }
      return offerings.current;
    } catch (error) {
      purchasesLogger.error('Failed to fetch offerings', error);
      return null;
    }
  }

  /** Purchase a package from an offering. */
  async purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
    if (!this.configured) {
      return {
        unlocked: false,
        cancelled: false,
        customerInfo: null,
        error: 'Purchases unavailable',
      };
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      this.customerInfo = customerInfo;
      this.notify();
      return {
        unlocked: this.isProActive(customerInfo),
        cancelled: false,
        customerInfo,
        error: null,
      };
    } catch (error) {
      if (isCancellation(error)) {
        purchasesLogger.info('Purchase cancelled by user');
        return {
          unlocked: false,
          cancelled: true,
          customerInfo: this.customerInfo,
          error: null,
        };
      }
      purchasesLogger.error('Purchase failed', error);
      return {
        unlocked: false,
        cancelled: false,
        customerInfo: this.customerInfo,
        error: errorMessage(error),
      };
    }
  }

  /** Restore previous purchases (required by App Store guidelines). */
  async restorePurchases(): Promise<PurchaseOutcome> {
    if (!this.configured) {
      return {
        unlocked: false,
        cancelled: false,
        customerInfo: null,
        error: 'Purchases unavailable',
      };
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      this.customerInfo = customerInfo;
      this.notify();
      return {
        unlocked: this.isProActive(customerInfo),
        cancelled: false,
        customerInfo,
        error: null,
      };
    } catch (error) {
      purchasesLogger.error('Restore failed', error);
      return {
        unlocked: false,
        cancelled: false,
        customerInfo: this.customerInfo,
        error: errorMessage(error),
      };
    }
  }

  // ─── RevenueCat UI (Paywall + Customer Center) ─────────────────────────────

  /**
   * Present the paywall for the current offering. Resolves true when the user
   * ends up entitled (purchased or restored from the paywall).
   */
  async presentPaywall(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      const result = await RevenueCatUI.presentPaywall();
      return this.handlePaywallResult(result);
    } catch (error) {
      purchasesLogger.error('Failed to present paywall', error);
      return false;
    }
  }

  /**
   * Present the paywall only when Cluttr Pro is not already active — the
   * standard gate to call before opening a premium feature. Resolves true
   * when the user is entitled afterwards (already had it, bought, or restored).
   */
  async presentPaywallIfNeeded(): Promise<boolean> {
    if (!this.configured) return false;
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: CLUTTR_PRO_ENTITLEMENT,
      });
      if (result === PAYWALL_RESULT.NOT_PRESENTED) return true; // already Pro
      return this.handlePaywallResult(result);
    } catch (error) {
      purchasesLogger.error('Failed to present paywall', error);
      return false;
    }
  }

  /** Present the Customer Center (manage/cancel subscription, refunds, restore). */
  async presentCustomerCenter(): Promise<void> {
    if (!this.configured) return;
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onManagementOptionSelected: ({ option }) => {
            purchasesLogger.info('Customer Center option selected', option);
          },
        },
      });
      // Plan changes/cancellations made inside the Customer Center may not
      // emit a listener event until the next app open — refresh explicitly.
      await this.refreshCustomerInfo();
    } catch (error) {
      purchasesLogger.error('Failed to present Customer Center', error);
    }
  }

  private handlePaywallResult(result: PAYWALL_RESULT): boolean {
    purchasesLogger.info('Paywall result', result);
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        return true;
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.CANCELLED:
      case PAYWALL_RESULT.ERROR:
      default:
        return false;
    }
  }

  // ─── Observer (same pattern as HomeService) ────────────────────────────────

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export const purchasesService = new PurchasesService();
