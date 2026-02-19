import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import env from '@utils/validateEnv';
import { connectDB } from '@db/connection';
import authRoutes from '@routes/user.routes';

// import vehicleRoutes from '@routes/vehicles.routes';

const PORT = env.PORT;
const app = express();

app.use(cors({ 
  origin: ['http://localhost:5173', 'http://10.0.0.54:5173', /^http:\/\/.*:\d+$/], 
  credentials: true 
}));

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.text());

// Routes
app.use('/api/user', authRoutes);

app.listen(PORT, '10.0.0.54', () => {
    connectDB();
    console.log(`Server is running on http://10.0.0.54:${PORT}`);
});