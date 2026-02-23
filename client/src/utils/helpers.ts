import type { User } from "@/types/User";
import { EventType } from "./const";
import ErrorMessages from "./errorMessages";

// Get user full name
export const getFullName = (user: User): string => {
    return `${user?.firstName} ${user?.lastName}`;
}

export const validateString = (val: string) => {
    return val?.trim() ? null : ErrorMessages.mandatoryField;
}

export const validateFutureDate = (val: Date | null) => {
    if (!val) return ErrorMessages.mandatoryField;
    return val.getTime() > Date.now() ? null : ErrorMessages.futureDate;
};

export const validateObject = (val: object) => {
    return Object.keys(val).length > 0 ? null : ErrorMessages.mandatoryField;
}

// Give a date format as "po 9. 2. 2026 19:30 - 21:00"
export const formatTeamEventDate = (startDate: Date, endDate: Date): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric' };
    const formattedDate = startDate.toLocaleDateString('cs-CZ', options);
    const startTime = startDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
    return `${formattedDate} ${startTime} - ${endTime}`;
}

// Returns event color based on event type
export const getEventColor = (eventType: string): string => {
    switch (eventType) {
        case EventType.TRAINING.value:
            return "green";
        case EventType.MATCH.value:
            return "red";
        default:
            return "blue";
    }
}

// Returns participation status color
export const getParticipationStatusColor = (status?: string): string => {
    switch (status) {
        case 'confirmed':
            return "green";
        case 'declined':
            return "red";
        default:
            return "yellow";
    }
}

// Authorize user based on role
export const authorizeUser = (user: User | null, allowedRoles: string[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(role => allowedRoles.includes(role));
}



export const combinateDateAndTime = (date: Date | null, time: string | null) => {
  if (!date || !time) return null;

  const [hours, minutes] = time.split(':').map(Number);

  const result = new Date(date);
  result.setHours(hours);
  result.setMinutes(minutes);

  return result;
};