import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../store/hooks';
import {
  getPlanLimits,
  effectiveInventoryCap,
  effectiveTodoCap,
} from '../data/planLimits';
import { useSubscription } from './useSubscription';
import { useHome } from './useHome';
import { useToast } from './useToast';

/**
 * Plan-limit gates for the create flows. Each `gate*` returns true when the
 * action may proceed; otherwise it explains why (toast) and, for free-tier
 * limits, presents the Cluttr Pro paywall. Returns true if the user upgrades
 * from that paywall, so callers can simply continue on a true result.
 */
export const usePlanLimits = () => {
  const { t } = useTranslation();
  const toast = useToast();
  const { isPro, presentPaywallIfNeeded } = useSubscription();
  const { homes, currentHome } = useHome();
  const inventoryCount = useAppSelector(
    (state) => state.inventory.items.length
  );
  const todoCount = useAppSelector((state) => state.todo.todos.length);

  const limits = getPlanLimits(isPro);
  const inventoryCap = effectiveInventoryCap(isPro, currentHome);
  const todoCap = effectiveTodoCap(isPro, currentHome);

  /** Free limit hit: explain, then offer the paywall. */
  const upsell = useCallback(
    async (message: string): Promise<boolean> => {
      toast.showToast(message, 'info');
      return presentPaywallIfNeeded();
    },
    [toast, presentPaywallIfNeeded]
  );

  const gateCreateHome = useCallback(async (): Promise<boolean> => {
    if (homes.length < limits.maxHomes) return true;
    return upsell(
      t('limits.homesFree', {
        max: limits.maxHomes,
        defaultValue:
          'The free plan supports up to {{max}} homes — upgrade to Cluttr Pro for more',
      })
    );
  }, [homes.length, limits.maxHomes, upsell, t]);

  const gateInvite = useCallback(async (): Promise<boolean> => {
    if (!limits.canInvite) {
      return upsell(
        t('limits.inviteFree', {
          defaultValue: 'Sharing your home requires Cluttr Pro',
        })
      );
    }
    if ((currentHome?.memberCount ?? 1) >= limits.maxMembersPerHome) {
      toast.showToast(
        t('limits.homeFull', {
          max: limits.maxMembersPerHome,
          defaultValue: 'This home already has the maximum of {{max}} members',
        }),
        'info'
      );
      return false;
    }
    return true;
  }, [limits, currentHome?.memberCount, upsell, toast, t]);

  const gateAddInventoryItem = useCallback(async (): Promise<boolean> => {
    if (inventoryCount < inventoryCap) return true;
    if (!isPro) {
      return upsell(
        t('limits.inventoryFree', {
          max: inventoryCap,
          defaultValue:
            'The free plan is limited to {{max}} items per home — upgrade to Cluttr Pro for more',
        })
      );
    }
    toast.showToast(
      t('limits.inventorySoftCap', {
        max: inventoryCap,
        defaultValue:
          'This home reached the {{max}}-item limit. Contact support to raise it.',
      }),
      'info'
    );
    return false;
  }, [inventoryCount, inventoryCap, isPro, upsell, toast, t]);

  const gateAddTodo = useCallback(async (): Promise<boolean> => {
    if (todoCount < todoCap) return true;
    if (!isPro) {
      return upsell(
        t('limits.todoFree', {
          max: todoCap,
          defaultValue:
            'The free plan is limited to {{max}} to-dos per home — upgrade to Cluttr Pro for more',
        })
      );
    }
    toast.showToast(
      t('limits.todoSoftCap', {
        max: todoCap,
        defaultValue:
          'This home reached the {{max}} to-do limit. Contact support to raise it.',
      }),
      'info'
    );
    return false;
  }, [todoCount, todoCap, isPro, upsell, toast, t]);

  return {
    isPro,
    limits,
    inventoryCap,
    todoCap,
    gateCreateHome,
    gateInvite,
    gateAddInventoryItem,
    gateAddTodo,
  };
};
