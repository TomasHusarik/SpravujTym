import type { EventParticipation } from "./EventParticipation";
import type { User } from "./User";
import type { Venue } from "./Venue";

export interface TeamEvent {
    _id?: string;
    title: string;
    type: TeamEventType;
    startDate: Date;
    endDate: Date;
    participants: User[];
    venue?: Venue;
    createdBy?: User;
    eventParticipations?: EventParticipation[];
    createdAt?: Date;
    updatedAt?: Date;
}

export type TeamEventType = 'training' | 'match' | 'other';