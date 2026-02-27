import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import { initSocket } from './socket';
import authMiddleware from './middleware/auth.middleware';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);

// Protected test route
app.get('/api/protected', authMiddleware.protect, (req, res) => {
    res.json({ message: 'You have access to this protected route', user: req.user });
});

// Initialize Socket logic
initSocket(wss);

// Basic route
app.get('/', (req, res) => {
    res.send('Connect API is running...');
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
