export interface HomeMemberEntry {
  role: 'owner' | 'member';
  joinedAt: string;
  /** The invitation code the member joined with (absent for the owner). */
  inviteCode?: string;
}

export interface Home {
  id: string;
  name: string;
  address?: string; // Detailed address
  ownerId: string;
  members: Record<string, HomeMemberEntry>;
  role?: 'owner' | 'member';
  settings?: {
    canShareInventory: boolean;
    canShareTodos: boolean;
  };
  invitationCode?: string;
  /**
   * Per-home raises of the Pro item soft caps, granted by support. Editable
   * only from the Firebase console — security rules deny client writes.
   */
  limitOverrides?: {
    inventoryMax?: number;
    todoMax?: number;
  };
  memberCount?: number;
  isOwner?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Loading state for home operations
 */
export type HomeOperationType =
  | 'list'
  | 'create'
  | 'update'
  | 'delete'
  | 'leave';

export interface HomeLoadingState {
  isLoading: boolean;
  operation: HomeOperationType | null;
  error: string | null;
}
