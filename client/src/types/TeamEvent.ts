export interface TeamEvent {
    id?: string;
    title?: string;
    type?: TeamEventType;
    date?: Date;
    startTime?: string;
    endTime?: string;
    location?: string;
    description?: string;
    participants?: number;
    maxParticipants?: number;
    isRequired?: boolean;
    createdBy?: string;
}

export type TeamEventType = 'training' | 'match' | 'other';