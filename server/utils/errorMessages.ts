const ErrorMessages = {
    // Authentication errors
    emailRequired: 'Email is required',
    emailPasswordRequired: 'Email and password are required',
    invalidCredentials: 'Invalid email or password',
    emailAlreadyInUse: 'Email already in use',
    phoneAlreadyInUse: 'Phone number already in use',
    invalidEmailFormat: 'Invalid email format',
    weakPassword: 'Password is too weak.',
    forbidden: 'Forbidden',
    passwordSameAsCurrent: 'The new password must be different from the current password.',
    passwordConfirmationMismatch: 'New password and confirmation do not match',
    notAuthenticated: 'Not authenticated',
    currentPasswordIncorrect: 'Current password is incorrect',
    tooManyRequests: 'Too many requests. Please try again later.',

    
    // General errors
    internalServerError: 'Internal server error',
    unauthorized: 'Unauthorized access',
    notFound: 'Resource not found',
    validationError: 'Validation error',
    mandatoryField: 'This field is mandatory',
    eventsArrayRequired: 'Events must be a non-empty array',
    teamEventFieldsRequired: 'Title, type, startDate and endDate are required',
    serverError: 'A server error occurred. Please try again later.',
    InvalidDateRange: 'Invalid date range: endDate must be after startDate',
    invalidDate: 'Invalid date format',
    invalidParticipationStatus: 'Invalid participation status',
    squadNotCoached: 'You can only assign events to squads you coach',
    participationNoteTooLong: 'Note is too long',
    cancelReasonTooLong: 'Cancel reason is too long',
    eventCanceled: 'The event is canceled',
    eventFinished: 'The event has already finished',
    reminderTooSoon: 'A reminder was sent less than an hour ago',
};

export default ErrorMessages;