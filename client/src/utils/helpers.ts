import type { User } from "@/types/User";
import { EventType, LeagueCategory, ParticipationStatus, Weekdays } from "./const";
import type { RecurrenceRule } from "@/types/EventSeries";
import ErrorMessages from "./errorMessages";
import { notifications } from "@mantine/notifications";
import type { Squad } from "@/types/Squad";
import { useAuth } from "@/context/AuthContext";


// Format date to "dd. mm. yyyy" string
export const formatDate = (value: Date | string | number | null | undefined): string => {
    if (value === null || value === undefined || value === '') return 'N/A';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';

    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    };

    return date.toLocaleDateString('cs-CZ', options);
};

// Get user full name
export const getFullName = (user: User): string => {
    if (!user?.firstName && !user?.lastName) return 'New User';
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
}

// Get user initials
export const validateString = (val: string) => {
    return val?.trim() ? null : ErrorMessages.mandatoryField;
}

// Validate if date is in the future
export const validateFutureDate = (val: Date | null) => {
    if (!val) return ErrorMessages.mandatoryField;
    return val.getTime() > Date.now() ? null : ErrorMessages.futureDate;
};

// Validate if object has at least one key
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

// Returns Mantine color of an event type (training = club blue, match = club orange)
export const getEventColor = (eventType: string): string => {
    switch (eventType) {
        case EventType.TRAINING.value:
            return "brand";
        case EventType.MATCH.value:
            return "accent";
        default:
            return "teal";
    }
}

// CSS color of an event type for components outside Mantine (e.g. FullCalendar)
export const getEventCssColor = (eventType: string): string =>
    `var(--mantine-color-${getEventColor(eventType)}-6)`;

// Returns participation status color
export const getParticipationStatusColor = (status?: string): string => {
    switch (status) {
        case 'confirmed':
            return "green";
        case 'declined':
            return "red";
        case 'maybe':
            return "yellow";
        default:
            return "gray";
    }
}

// Returns participation status label
export const getParticipationStatusLabel = (status?: string): string =>
    Object.values(ParticipationStatus).find((item) => item.value === status)?.label ?? ParticipationStatus.PENDING.label;

// Human readable description of a recurrence rule, e.g. "Každý týden v út, čt · do 21. 1. 2027"
export const describeRecurrence = (rule?: RecurrenceRule | null): string => {
    if (!rule) return '';

    const interval = rule.interval ?? 1;
    let text = '';

    if (rule.frequency === 'daily') {
        text = interval === 1 ? 'Každý den' : `Každých ${interval} dní`;
    }

    if (rule.frequency === 'weekly') {
        const days = Weekdays
            .filter((day) => (rule.weekdays ?? []).includes(day.value))
            .map((day) => day.short.toLowerCase())
            .join(', ');
        text = interval === 1 ? 'Každý týden' : `Každý ${interval}. týden`;
        if (days) text += ` v ${days}`;
    }

    if (rule.frequency === 'monthly') {
        text = interval === 1 ? 'Každý měsíc' : `Každý ${interval}. měsíc`;
    }

    if (rule.until) text += ` · do ${formatDate(rule.until)}`;
    if (rule.count) text += ` · ${rule.count}× celkem`;

    return text;
}

// Search ignoring case and diacritics; every word of the query must be found ("dvorak muzi" finds "Dvořák, Muži A")
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export const matchesSearch = (text: string, query: string) => {
    const words = normalizeSearch(query).split(/\s+/).filter(Boolean);
    const haystack = normalizeSearch(text);
    return words.every((word) => haystack.includes(word));
};

// Event has already ended
export const isEventFinished = (event: { endDate?: Date | string }) =>
    Boolean(event?.endDate) && new Date(event.endDate).getTime() < Date.now();

// Combines date and time into a single Date object
export const combinateDateAndTime = (date: Date | null, time: string | null) => {
    if (!date || !time) return null;

    const [hours, minutes] = time.split(':').map(Number);

    const result = new Date(date);
    result.setHours(hours);
    result.setMinutes(minutes);

    return result;
};

// Show success notification
export const showSuccessNotification = (message: string) => {
    notifications.show({
        title: 'Hotovo',
        message: message,
        color: 'green',
    });
}

// Show error notification
export const showErrorNotification = (message: string) => {
    notifications.show({
        title: 'Chyba',
        message: message,
        color: 'red',
    });
}

// Get category label from value
export const getCategoryLabel = (category?: string) => {
    return (
        Object.values(LeagueCategory).find((item) => item.value === category)?.label || 'N/A'
    );
};

// #region Permissions
export const useAdminPermissions = () => {
    const { permissions } = useAuth();
    if (!permissions) return false;
    return Boolean(permissions?.isAdmin);
}

export const useExtendedPermissions = () => {
    const { permissions } = useAuth();
    if (!permissions) return false;
    return Boolean(permissions?.isAdmin || permissions?.coachSquadIds?.length > 0);
}

export const useSquadCoachPermissions = (squadOrSquads?: Squad | Squad[] | null) => {
  const { permissions } = useAuth();

  if (!permissions) return false;
  if (permissions.isAdmin) return true;

  const coachSquads = permissions.coachSquadIds ?? [];

  if (!squadOrSquads) return false;

  const squads = Array.isArray(squadOrSquads)
    ? squadOrSquads
    : [squadOrSquads];

  return squads.some(squad => squad && coachSquads.includes(squad._id));
};

export const usePlayerPermissions = (usr: User) => {
    const { user } = useAuth();
    if (!usr || !user) return false;
    return Boolean(usr._id === user._id || user?.isAdmin);
}
