import { email } from "envalid";

const ErrorMessages = {
    // Authentication errors
    emailRequired: 'Email is required',
    emailPasswordRequired: 'Email and password are required',
    invalidCredentials: 'Invalid email or password',
    emailAlreadyInUse: 'Email already in use',
    phoneAlreadyInUse: 'Phone number already in use',
    invalidEmailFormat: 'Invalid email format',
    weakPassword: 'Password is too weak.',
    
    // General errors
    internalServerError: 'Internal server error',
    unauthorized: 'Unauthorized access',
    notFound: 'Resource not found',
    validationError: 'Validation error',
    mandatoryField: 'This field is mandatory',
    serverError: 'A server error occurred. Please try again later.',
};

export default ErrorMessages;