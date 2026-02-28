import type { User } from "@/types/User";
import { EventType, LeagueCategory } from "./const";
import ErrorMessages from "./errorMessages";
import { notifications } from "@mantine/notifications";
import type { Squad } from "@/types/Squad";
import type { UserPermissions } from "@/types/Permissions";
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
        title: 'Success',
        message: message,
        color: 'green',
    });
}

// Show error notification
export const showErrorNotification = (message: string) => {
    notifications.show({
        title: 'Error',
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
export const adminPermissions = () => {
    const { permissions } = useAuth();
    if (!permissions) return false;
    return Boolean(permissions?.isAdmin);
}

export const extendedPemissions = () => {
    const { permissions } = useAuth();
    if (!permissions) return false;
    return Boolean(permissions?.isAdmin || permissions?.coachSquadIds?.length > 0);
}

export const squadCoachPermissions = (squad: Squad) => {
    const { permissions } = useAuth();
    if (!permissions) return false;
    return Boolean(permissions?.isAdmin || permissions?.coachSquadIds?.includes(squad._id));
}

export const playerPermissions = (usr: User) => {
    const { user } = useAuth();
    if (!usr || !user) return false;
    return Boolean(usr._id === user._id || adminPermissions());
}
