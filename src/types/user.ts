export interface User {
    id: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
    createdAt?: string;
    updatedAt?: string;
}

/** A member of a home, joined with their user profile. */
export interface Member {
    userId: string;
    email: string;
    nickname?: string;
    avatarUrl?: string;
    joinedAt: string;
    isOwner: boolean;
}
