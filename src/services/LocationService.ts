import { generateLocationId } from '../utils/idGenerator';
import { Location } from '../types/inventory';
import { locationsCol, fireWrite, isoNow } from './firebase/firestoreRefs';

/**
 * LocationService
 *
 * Slim Firestore write helpers for `homes/{homeId}/locations`. Reads are
 * live snapshots managed by locationSaga.
 */
class LocationService {
    createLocation(homeId: string, input: { name: string; icon?: string }): Location {
        const id = generateLocationId();
        const now = isoNow();

        fireWrite(
            locationsCol(homeId).doc(id).set({
                name: input.name.trim(),
                icon: input.icon,
                createdAt: now,
                updatedAt: now,
            }),
            'Failed to create location',
        );

        return {
            id,
            homeId,
            name: input.name.trim(),
            icon: input.icon as Location['icon'],
            createdAt: now,
            updatedAt: now,
        };
    }

    updateLocation(
        homeId: string,
        locationId: string,
        updates: { name?: string; icon?: string },
    ): void {
        fireWrite(
            locationsCol(homeId).doc(locationId).update({ ...updates, updatedAt: isoNow() }),
            'Failed to update location',
        );
    }

    deleteLocation(homeId: string, locationId: string): void {
        fireWrite(locationsCol(homeId).doc(locationId).delete(), 'Failed to delete location');
    }
}

export const locationService = new LocationService();
export type { LocationService };
