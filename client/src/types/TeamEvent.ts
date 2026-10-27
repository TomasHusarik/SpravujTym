import type { EventParticipation } from "./EventParticipation";
import type { EventSeries } from "./EventSeries";
import type { Squad } from "./Squad";
import type { User } from "./User";
import type { Venue } from "./Venue";

export interface TeamEvent {
    _id?: string;
    title: string;
    type: TeamEventType;
    status?: TeamEventStatus;
    startDate: Date;
    endDate: Date;
    participants: User[];
    venue?: Venue;
    squads?: Squad[];
    createdBy?: User;
    eventParticipations?: EventParticipation[];
    // Recurring events
    series?: EventSeries | string;
    isException?: boolean;
    cancelReason?: string;
    canceledAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export type TeamEventType = 'training' | 'match' | 'other';

export type TeamEventStatus = 'scheduled' | 'canceled';
