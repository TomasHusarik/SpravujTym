import type { User } from "@/types/User";
import { EventType } from "./const";

// Get user full name
export const getFullName = (user: User): string => {
        return `${user?.firstName} ${user?.lastName}`;
}

// Give a date format as "po 9. 2. 2026 19:30 - 21:00"
export const formatTeamEventDate = (date: Date, startTime: string, endTime: string): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' };
    const formattedDate = date.toLocaleDateString('cs-CZ', options);
    return `${formattedDate} ${startTime} - ${endTime}`;
}

// Returns event color based on event type
export const getEventColor = (eventType: string): string => {
    switch (eventType) {
        case EventType.TRAINING:
            return "green";
        case EventType.MATCH:
            return "red";
        default:
            return "blue";
    }
}

// Authorize user based on role
export const authorizeUser = (user: User | null, allowedRoles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => allowedRoles.includes(role));
}

