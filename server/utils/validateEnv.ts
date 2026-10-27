import { cleanEnv, port, str } from "envalid";
import dotenv from 'dotenv';
dotenv.config();

export default cleanEnv(process.env, {
    MONGO_URI: str(),
    JWT_SECRET: str(),
    PORT: port(),
    // Public URL of the client, used for links in e-mails (e.g. https://spravujtym.cz)
    APP_URL: str({ default: '' }),
});