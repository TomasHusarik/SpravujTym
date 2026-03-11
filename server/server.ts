import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import env from '@utils/validateEnv';
import { connectDB } from '@db/connection';
import path from 'node:path';

// Routes
import authRoutes from '@routes/user.routes';
import teamEventsRoutes from '@routes/team-events.routes';
import venueRoutes from '@routes/venue.routes';
import teamRoutes from '@routes/team.routes';
import squadRoutes from '@routes/squad.routes';
import leagueRoutes from '@routes/league.routes';
import paymentRoutes from '@routes/paymnet.routes';
import announcementRoutes from '@routes/announcement.routes';
import emailRoutes from '@routes/email.routes';

const PORT = env.PORT;
const app = express();

app.set('trust proxy', 1);

// CORS
app.use(cors({
    origin: true,
    credentials: true
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/user', authRoutes);
app.use('/api/team-event', teamEventsRoutes);
app.use('/api/venue', venueRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/squad', squadRoutes);
app.use('/api/league', leagueRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/email', emailRoutes);

// React client
const clientBuildPathCandidates = [
    path.join(__dirname, '..', 'client', 'dist'),
    path.join(__dirname, '..', '..', 'client', 'dist'),
];

const clientBuildPath = clientBuildPathCandidates.find((candidate) => fs.existsSync(candidate));

if (!clientBuildPath) {
    throw new Error('Client build output was not found.');
}

app.use(express.static(clientBuildPath));

app.get(/^\/.*/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});