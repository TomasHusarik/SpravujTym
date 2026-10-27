const TIME_ZONE = 'Europe/Prague';

// "út 27. 10. 2026" - always in the club's timezone (the server may run in UTC)
export const formatDate = (value: Date | string) =>
    new Date(value).toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric', timeZone: TIME_ZONE });

// "19:00"
export const formatTime = (value: Date | string) =>
    new Date(value).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE });

// "út 27. 10. 2026 19:00–20:30"
export const formatEventDateTime = (start: Date | string, end?: Date | string) =>
    `${formatDate(start)} ${formatTime(start)}${end ? `–${formatTime(end)}` : ''}`;
