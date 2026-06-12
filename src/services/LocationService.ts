import { generateLocationId } from '../utils/idGenerator';
import { Location } from '../types/inventory';
import { locationsCol } from './firebase/firestoreRefs';
import { createCrudService } from './createCrudService';

type CreateLocationInput = { name: string; icon?: string };
type UpdateLocationInput = { name?: string; icon?: string };

const crud = createCrudService<
  Location,
  CreateLocationInput,
  UpdateLocationInput
>({
  collection: locationsCol,
  generateId: generateLocationId,
  entityLabel: 'location',
  buildCreate: (input, { id, homeId, now }) => ({
    docData: {
      name: input.name.trim(),
      icon: input.icon,
    },
    entity: {
      id,
      homeId,
      name: input.name.trim(),
      icon: input.icon as Location['icon'],
      createdAt: now,
      updatedAt: now,
    },
  }),
});

/**
 * LocationService
 *
 * Slim Firestore write helpers for `homes/{homeId}/locations`. Reads are
 * live snapshots managed by locationSaga.
 */
class LocationService {
  createLocation(homeId: string, input: CreateLocationInput): Location {
    return crud.create(homeId, input);
  }

  updateLocation(
    homeId: string,
    locationId: string,
    updates: UpdateLocationInput
  ): void {
    crud.update(homeId, locationId, updates);
  }

  deleteLocation(homeId: string, locationId: string): void {
    crud.remove(homeId, locationId);
  }
}

export const locationService = new LocationService();
export type { LocationService };
