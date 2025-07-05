import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY: string = process.env.SECRET_KEY || '';

export const generateToken = (userId: string, username: string) => {
    return jwt.sign({ id: userId, username: username }, SECRET_KEY, { expiresIn: '12h' });
};

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(403).send('Access denied. No token provided.');
        return;
    }

    try {
        req.user = jwt.verify(token, SECRET_KEY) as { id: string; username: string };
        next();
    } catch (error) {
        res.status(401).send('Invalid token.');
    }
};