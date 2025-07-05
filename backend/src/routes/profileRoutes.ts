import express, { Request, Response, Router, RequestHandler } from 'express';
import UserModel from '../models/UserModel';
import { verifyToken } from '../middleware/authMiddleware';

const router: Router = express.Router();
const SECRET_KEY: string = process.env.SECRET_KEY || '';
if (!SECRET_KEY) throw new Error('SECRET_KEY is not defined in the environment variables.');

// Get user by ID
router.get('/', verifyToken, (async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        if (!userId) return res.status(400).json({ message: 'User ID not found in token' });

        const user = await UserModel.findById(userId)
            .select('-password')
            .populate('images', 'url -_id');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const userWithUrls = {
            ...user.toObject(),
            images: user.images.map((img: any) => img.url)
        };

        res.json(userWithUrls);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);


export default router;