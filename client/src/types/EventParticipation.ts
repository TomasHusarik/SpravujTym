import type { User } from "./User";

export interface EventParticipation {
    _id?: string;
    event?: string;
    user?: User;
    status?: ParticipationStatus;
    // Optional reason, e.g. why the player declined
    note?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ParticipationStatus = 'confirmed' | 'declined' | 'maybe' | 'pending';
