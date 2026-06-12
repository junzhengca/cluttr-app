import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { userRef, userFromDoc, isoNow } from './firebase/firestoreRefs';
import { User, Member } from '../types/user';
import { HomeMemberEntry } from '../types/home';
import { authLogger } from '../utils/Logger';

/**
 * UserService
 *
 * Manages the `users/{uid}` Firestore profile documents that back nicknames,
 * avatars, member lists, and invitation previews.
 */
class UserService {
  /**
   * Ensure a profile document exists for the signed-in Firebase user,
   * creating it on first sign-in. Returns the profile.
   */
  async ensureUserDoc(firebaseUser: FirebaseAuthTypes.User): Promise<User> {
    const ref = userRef(firebaseUser.uid);
    const snapshot = await ref.get();

    if (!snapshot.exists()) {
      authLogger.info('Creating user profile document', firebaseUser.uid);
      const now = isoNow();
      await ref.set({
        email: firebaseUser.email ?? '',
        nickname: firebaseUser.displayName ?? null,
        avatarUrl: null,
        createdAt: now,
        updatedAt: now,
      });
      const created = await ref.get();
      return userFromDoc(created);
    }

    return userFromDoc(snapshot);
  }

  async getProfile(uid: string): Promise<User | null> {
    const snapshot = await userRef(uid).get();
    return snapshot.exists() ? userFromDoc(snapshot) : null;
  }

  /**
   * Update the signed-in user's profile. Awaited (not fire-and-forget) so
   * callers can show success/failure in their own UI.
   */
  async updateProfile(
    uid: string,
    updates: { nickname?: string; avatarUrl?: string }
  ): Promise<User> {
    const ref = userRef(uid);
    await ref.update({ ...updates, updatedAt: isoNow() });
    const snapshot = await ref.get();
    return userFromDoc(snapshot);
  }

  /**
   * Join a home's members map with user profiles for the member-list UI.
   */
  async listMembers(
    members: Record<string, HomeMemberEntry>,
    ownerId: string
  ): Promise<Member[]> {
    const uids = Object.keys(members);
    const profiles = await Promise.all(uids.map((uid) => this.getProfile(uid)));

    return uids.map((uid, index) => ({
      userId: uid,
      email: profiles[index]?.email ?? '',
      nickname: profiles[index]?.nickname,
      avatarUrl: profiles[index]?.avatarUrl,
      joinedAt: members[uid].joinedAt,
      isOwner: uid === ownerId,
    }));
  }
}

export const userService = new UserService();
export type { UserService };
