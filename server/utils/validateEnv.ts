import { cleanEnv, port, str } from "envalid";
import dotenv from 'dotenv';
dotenv.config();

export default cleanEnv(process.env, {
    MONGO_URI: str(),
    JWT_SECRET: str(),
    PORT: port(),
});