import { EventType } from "./const";


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