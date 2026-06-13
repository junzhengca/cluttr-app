import type { Home } from '../types/home';

/**
 * Plan limits for the free tier vs Cluttr Pro.
 *
 * The values marked "mirrored in firestore.rules" are enforced server-side
 * too — keep both places in sync (IaC rule in AGENTS.md):
 * - HOME_MEMBER_CAP: members map size cap on the home doc
 * - PRO item caps: validated against `homes/{id}/meta/counters`, overridable
 *   per home via the console-only `limitOverrides` field on the home doc
 *
 * Free-tier caps are client-side only (rules cannot see RevenueCat
 * entitlements without a backend), so they gate UX, not abuse — the
 * server-side caps above are the abuse backstop for everyone.
 */
export interface PlanLimits {
  maxHomes: number;
  /** Total members per home, owner included. */
  maxMembersPerHome: number;
  maxInventoryItems: number;
  maxTodos: number;
  canInvite: boolean;
}

export const FREE_LIMITS: PlanLimits = {
  maxHomes: 2,
  maxMembersPerHome: 1,
  maxInventoryItems: 100,
  maxTodos: 100,
  canInvite: false,
};

export const PRO_LIMITS: PlanLimits = {
  maxHomes: Number.POSITIVE_INFINITY,
  maxMembersPerHome: 10, // mirrored in firestore.rules (maxMembers)
  maxInventoryItems: 5000, // mirrored in firestore.rules (itemCap default)
  maxTodos: 5000, // mirrored in firestore.rules (itemCap default)
  canInvite: true,
};

export const getPlanLimits = (isPro: boolean): PlanLimits =>
  isPro ? PRO_LIMITS : FREE_LIMITS;

/**
 * Effective per-home inventory cap: Pro users get the soft cap (or the
 * support-granted override stored on the home doc); free users get the free
 * cap regardless of overrides.
 */
export const effectiveInventoryCap = (
  isPro: boolean,
  home: Home | null | undefined
): number =>
  isPro
    ? (home?.limitOverrides?.inventoryMax ?? PRO_LIMITS.maxInventoryItems)
    : FREE_LIMITS.maxInventoryItems;

/** Effective per-home todo cap — see effectiveInventoryCap. */
export const effectiveTodoCap = (
  isPro: boolean,
  home: Home | null | undefined
): number =>
  isPro
    ? (home?.limitOverrides?.todoMax ?? PRO_LIMITS.maxTodos)
    : FREE_LIMITS.maxTodos;
