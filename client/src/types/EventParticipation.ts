import type { User } from "./User";

export interface EventParticipation {
    _id?: string;
    eventId?: Event;
    user?: User;
    status?: ParticipationStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

export type ParticipationStatus = 'confirmed' | 'declined' | 'pending';
