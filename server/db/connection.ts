import moongoose from "mongoose";
import env from '@utils/validateEnv';

export const connectDB = async () => {
    try {
        await moongoose.connect(env.MONGO_URI);
        console.log(`MongoDB connected successfully`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error}`);
        process.exit(1);
    }
};
