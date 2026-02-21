import type { User } from "./User";

export interface TeamEvent {
    _id?: string;
    title?: string;
    type?: TeamEventType;
    startDate?: Date;
    endDate?: Date;
    participants?: User[];
    location?: string;
    createdBy?: string;
}

export type TeamEventType = 'training' | 'match' | 'other';