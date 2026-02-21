import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from '@utils/validateEnv';
import { connectDB } from '@db/connection';
import authRoutes from '@routes/user.routes';
import teamEventsRoutes from '@routes/team-events.routes';
import venueRoutes from '@routes/venue.routes';

// import vehicleRoutes from '@routes/vehicles.routes';

const PORT = env.PORT;
const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.text());

// Routes
app.use('/api/user', authRoutes);
app.use('/api/team-event', teamEventsRoutes);
app.use('/api/venue', venueRoutes);

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on http://localhost:${PORT}`);
});