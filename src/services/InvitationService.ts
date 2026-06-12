import firestore from '@react-native-firebase/firestore';
import * as Crypto from 'expo-crypto';
import { invitationRef, homeRef, isoNow } from './firebase/firestoreRefs';
import { Home } from '../types/home';
import { User } from '../types/user';
import { storageLogger } from '../utils/Logger';

/** What a prospective member sees before accepting an invitation. */
export interface InvitationPreview {
  valid: boolean;
  home?: {
    homeId: string;
    name: string;
    address?: string;
    owner: {
      email: string;
      nickname: string;
    };
  };
  permissions?: {
    canShareInventory: boolean;
    canShareTodos: boolean;
  };
  message?: string;
}

/**
 * InvitationService
 *
 * Invitation codes are Firestore doc IDs under `invitations/{code}`. The doc
 * carries a denormalized preview (home name, owner profile, sharing settings)
 * so non-members can validate a code without reading the home itself.
 * Accepting is a single rules-validated update on the home document.
 */
class InvitationService {
  private generateCode(): string {
    return Crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  }

  /**
   * Return the home's invitation code, creating the invitation doc if it
   * doesn't exist yet. Owner only.
   */
  async ensureInvitation(home: Home, ownerProfile: User): Promise<string> {
    if (home.invitationCode) {
      const snapshot = await invitationRef(home.invitationCode).get();
      if (snapshot.exists()) return home.invitationCode;
    }
    return this.createInvitation(home, ownerProfile);
  }

  /**
   * Invalidate the current code and issue a new one. Owner only.
   */
  async regenerate(home: Home, ownerProfile: User): Promise<string> {
    if (home.invitationCode) {
      try {
        await invitationRef(home.invitationCode).delete();
      } catch (error) {
        storageLogger.warn('Failed to delete old invitation code', error);
      }
    }
    return this.createInvitation(home, ownerProfile);
  }

  private async createInvitation(
    home: Home,
    ownerProfile: User
  ): Promise<string> {
    const code = this.generateCode();
    await invitationRef(code).set({
      homeId: home.id,
      homeName: home.name,
      address: home.address ?? null,
      ownerId: home.ownerId,
      ownerEmail: ownerProfile.email ?? null,
      ownerNickname: ownerProfile.nickname ?? null,
      ownerAvatarUrl: ownerProfile.avatarUrl ?? null,
      // Must exactly match the home doc's settings (enforced by rules)
      settings: home.settings,
      createdBy: home.ownerId,
      createdAt: isoNow(),
    });
    await homeRef(home.id).update({
      invitationCode: code,
      updatedAt: isoNow(),
    });
    return code;
  }

  /**
   * Validate a code without joining — powers the invitation preview sheet.
   */
  async validate(code: string): Promise<InvitationPreview> {
    try {
      const snapshot = await invitationRef(code.trim()).get();
      if (!snapshot.exists()) {
        return { valid: false, message: 'Invalid invitation code' };
      }
      const data = snapshot.data()!;
      return {
        valid: true,
        home: {
          homeId: data.homeId as string,
          name: (data.homeName as string) || '',
          address: (data.address as string) || undefined,
          owner: {
            email: (data.ownerEmail as string) || '',
            nickname: (data.ownerNickname as string) || '',
          },
        },
        permissions: data.settings as InvitationPreview['permissions'],
      };
    } catch (error) {
      storageLogger.error('Failed to validate invitation code', error);
      return { valid: false, message: 'Failed to validate invitation code' };
    }
  }

  /**
   * Accept an invitation: adds the caller as a member of the home. The
   * security rules verify the code points at the home being joined.
   */
  async accept(
    code: string,
    uid: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const snapshot = await invitationRef(code.trim()).get();
      if (!snapshot.exists()) {
        return { success: false, message: 'Invalid invitation code' };
      }
      const homeId = snapshot.data()!.homeId as string;

      await homeRef(homeId).update({
        [`members.${uid}`]: {
          role: 'member',
          joinedAt: isoNow(),
          inviteCode: code.trim(),
        },
        memberIds: firestore.FieldValue.arrayUnion(uid),
        updatedAt: isoNow(),
      });
      return { success: true };
    } catch (error) {
      storageLogger.error('Failed to accept invitation', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to accept invitation',
      };
    }
  }
}

export const invitationService = new InvitationService();
