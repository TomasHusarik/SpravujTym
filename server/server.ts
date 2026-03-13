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
import commentRoutes from '@routes/comment.routes';

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
app.use('/api/comment', commentRoutes);

// React client
if (process.env.NODE_ENV === "production") {

  const clientPath = path.join(process.cwd(), "client", "dist");

  console.log("Serving React build from:", clientPath);

  app.use(express.static(clientPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(clientPath, "index.html"));
  });

}

// Start server
app.listen(PORT, () => {
    connectDB();
    console.log(`Server running on port ${PORT}`);
});