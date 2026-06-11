import firestore from '@react-native-firebase/firestore';
import { Home, HomeLoadingState, HomeOperationType } from '../types/home';
import { generateItemId } from '../utils/idGenerator';
import { storageLogger } from '../utils/Logger';
import {
    homeRef,
    invitationRef,
    inventoryCol,
    inventoryCategoriesCol,
    locationsCol,
    todosCol,
    todoCategoriesCol,
    fireWrite,
    isoNow,
} from './firebase/firestoreRefs';

const DELETE_PAGE_SIZE = 450;

/**
 * HomeService
 *
 * Holds the live list of homes the user belongs to. The list is fed by the
 * Firestore homes snapshot (see authSaga) — writes go straight to Firestore
 * with an optimistic local update, and the next snapshot reconciles.
 */
class HomeService {
    private homes: Home[] = [];
    private currentHomeId: string | null = null;
    private listeners: Set<() => void> = new Set();

    private loadingState: HomeLoadingState = {
        isLoading: false,
        operation: null,
        error: null,
    };

    /**
     * Subscribe to home state changes
     * @returns Unsubscribe function
     */
    subscribe(callback: () => void): () => void {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }

    private notifyListeners(): void {
        this.listeners.forEach(cb => cb());
    }

    getLoadingState(): HomeLoadingState {
        return { ...this.loadingState };
    }

    private setLoading(operation: HomeOperationType | null, error: string | null = null): void {
        this.loadingState = {
            isLoading: operation !== null,
            operation,
            error,
        };
        this.notifyListeners();
    }

    /**
     * Replace the homes list from the Firestore snapshot (single source of
     * truth). Keeps the current home selection when still valid.
     */
    setHomesFromSnapshot(homes: Home[]): void {
        this.homes = homes;
        if (this.currentHomeId && !homes.find(h => h.id === this.currentHomeId)) {
            this.currentHomeId = homes[0]?.id ?? null;
        }
        this.notifyListeners();
    }

    /** Clear all local home state (on logout). */
    reset(): void {
        this.homes = [];
        this.currentHomeId = null;
        this.notifyListeners();
    }

    /**
     * Create a new home and switch to it. The write is latency-compensated:
     * the home is inserted locally right away and the snapshot confirms it.
     */
    createHome(uid: string, name: string, address?: string): Home {
        const id = generateItemId();
        const now = isoNow();
        const home: Home = {
            id,
            name,
            address,
            ownerId: uid,
            members: { [uid]: { role: 'owner', joinedAt: now } },
            role: 'owner',
            isOwner: true,
            settings: { canShareInventory: true, canShareTodos: true },
            memberCount: 1,
            createdAt: now,
            updatedAt: now,
        };

        fireWrite(
            homeRef(id).set({
                name,
                address: address ?? null,
                ownerId: uid,
                settings: home.settings,
                members: home.members,
                memberIds: [uid],
                createdAt: now,
                updatedAt: now,
            }),
            'Failed to create home',
        );

        this.homes = [...this.homes, home];
        this.currentHomeId = id;
        this.notifyListeners();
        return home;
    }

    /**
     * Update home name/address.
     */
    updateHome(id: string, updates: { name?: string; address?: string }): boolean {
        const index = this.homes.findIndex(h => h.id === id);
        if (index < 0) return false;

        const now = isoNow();
        fireWrite(homeRef(id).update({ ...updates, updatedAt: now }), 'Failed to update home');

        this.homes = this.homes.map(h =>
            h.id === id ? { ...h, ...updates, updatedAt: now } : h,
        );
        this.notifyListeners();
        return true;
    }

    /**
     * Update the sharing toggles (owner only — enforced by security rules).
     */
    updateSettings(
        id: string,
        updates: Partial<{ canShareInventory: boolean; canShareTodos: boolean }>,
    ): boolean {
        const home = this.homes.find(h => h.id === id);
        if (!home || !home.settings) return false;

        const settings = { ...home.settings, ...updates };
        const now = isoNow();
        fireWrite(
            homeRef(id).update({ settings, updatedAt: now }),
            'Failed to update home settings',
        );

        this.homes = this.homes.map(h =>
            h.id === id ? { ...h, settings, updatedAt: now } : h,
        );
        this.notifyListeners();
        return true;
    }

    /**
     * Delete a home (owner) or leave it (member).
     */
    async deleteHome(id: string, uid: string): Promise<boolean> {
        this.setLoading('delete');
        try {
            const home = this.homes.find(h => h.id === id);
            if (!home) {
                this.setLoading(null, 'Home not found');
                return false;
            }

            if (home.ownerId === uid) {
                await this.cascadeDelete(home);
            } else {
                await this.leaveHome(id, uid);
            }

            // Optimistic removal; the homes snapshot confirms it
            this.homes = this.homes.filter(h => h.id !== id);
            if (this.currentHomeId === id) {
                this.currentHomeId = this.homes[0]?.id ?? null;
            }

            this.setLoading(null);
            this.notifyListeners();
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete home';
            storageLogger.error('Failed to delete home:', error);
            this.setLoading(null, errorMessage);
            return false;
        }
    }

    /**
     * Cascade delete: subcollections first (owner access requires the parent
     * home doc to exist), then the invitation doc (its delete rule resolves
     * ownership through the home doc), then the home doc itself.
     */
    private async cascadeDelete(home: Home): Promise<void> {
        const subcollections = [
            inventoryCol,
            inventoryCategoriesCol,
            locationsCol,
            todosCol,
            todoCategoriesCol,
        ];

        for (const col of subcollections) {
            // Page through and batch-delete (500 writes max per batch)
            for (;;) {
                const page = await col(home.id).limit(DELETE_PAGE_SIZE).get();
                if (page.empty) break;

                const batch = firestore().batch();
                page.docs.forEach(doc => batch.delete(doc.ref));
                await batch.commit();

                if (page.size < DELETE_PAGE_SIZE) break;
            }
        }

        if (home.invitationCode) {
            try {
                await invitationRef(home.invitationCode).delete();
            } catch (error) {
                storageLogger.warn('Failed to delete invitation doc during home delete', error);
            }
        }

        await homeRef(home.id).delete();
    }

    /**
     * Leave a home as a member (removes own membership entry).
     */
    async leaveHome(homeId: string, uid: string): Promise<void> {
        await homeRef(homeId).update({
            [`members.${uid}`]: firestore.FieldValue.delete(),
            memberIds: firestore.FieldValue.arrayRemove(uid),
            updatedAt: isoNow(),
        });
    }

    /**
     * Remove a member from a home (owner only — enforced by security rules).
     */
    async removeMember(homeId: string, memberUid: string): Promise<boolean> {
        try {
            await homeRef(homeId).update({
                [`members.${memberUid}`]: firestore.FieldValue.delete(),
                memberIds: firestore.FieldValue.arrayRemove(memberUid),
                updatedAt: isoNow(),
            });
            return true;
        } catch (error) {
            storageLogger.error('Failed to remove member:', error);
            return false;
        }
    }

    /**
     * Switch the active home
     */
    switchHome(id: string): void {
        const home = this.homes.find((h) => h.id === id);
        if (home) {
            this.currentHomeId = id;
            this.notifyListeners();
        } else {
            storageLogger.warn(`Attempted to switch to non-existent homeId: ${id}`);
        }
    }

    /**
     * Get the current home object synchronously
     */
    getCurrentHome(): Home | null {
        if (!this.currentHomeId) return null;
        return this.homes.find((h) => h.id === this.currentHomeId) ?? null;
    }

    /**
     * Get all homes synchronously
     */
    getHomes(): Home[] {
        return [...this.homes];
    }
}

export const homeService = new HomeService();
