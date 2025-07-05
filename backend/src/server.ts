import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes';
import { setCorsHeaders, logger } from './middleware/commonMiddleware';
import authRoutes from "./routes/authRoutes";
import session from 'express-session';
import passport from "passport";
import cookieParser from 'cookie-parser';
import uploadRoutes from './routes/uploadRoutes';
import path from "path";
import profileRoutes from "./routes/profileRoutes";
import noteRoutes from './routes/noteRoutes';
import newsRoutes from './routes/newsRoutes';
import weatherRoutes from "./routes/weatherRoutes";
import coordinatesRoutes from "./routes/coordinatesRoutes";
import calendarRoutes from "./routes/calendarRoutes";
import friendRoutes from "./routes/friendRoutes";
import http from 'http';
import { initializeSocket } from './services/socket';
import chatRoutes from "./routes/chatRoutes";

dotenv.config();

export const app = express();
const PORT: string | number = process.env.PORT || 8000;
const MONGO_URI: string = process.env.MONGO_URI || '';
const SESSION_SECRET: string = process.env.SESSION_SECRET || 'default_secret';

app.use(cookieParser());
app.use(
    session({
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            httpOnly: true,
        }
    })
);

const server = http.createServer(app);
const io = initializeSocket(server);

app.use((req, res, next) => {
    if (req.url.startsWith('/socket.io/')) return next();
    express.json()(req, res, next);
});

app.use(passport.initialize());
app.use(passport.session());

if (!MONGO_URI) {console.error('MongoDB URI is missing!'); process.exit(1);}

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

app.use(express.json());
app.use(setCorsHeaders);
app.use(logger);
app.set('io', io);

app.use('/', authRoutes);
app.use('/users', userRoutes);
app.use('/backgrounds', uploadRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/profile', profileRoutes);
app.use('/notes', noteRoutes);
app.use('/news', newsRoutes);
app.use('/weather', weatherRoutes);
app.use('/coordinates', coordinatesRoutes);
app.use('/calendar', calendarRoutes);
app.use('/friends', friendRoutes);
app.use('/chat', chatRoutes);
app.use('/uploads/chat', express.static(path.join(__dirname, 'uploads/chat')));

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO endpoint: ws://localhost:${PORT}/socket.io/`);
});