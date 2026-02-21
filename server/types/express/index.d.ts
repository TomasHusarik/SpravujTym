export {};

declare global {
    namespace Express {
        interface Request {
            loggedUser?: {
                id: string;
            };
        }
    }
}