import express, { Request, Response, RequestHandler, Router } from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import cors from "cors";

const router: Router = express.Router();

cors ({ origin: 'http://localhost:5173', credentials: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });

// Get news from API
router.post('/get-news', verifyToken, (async (req: Request, res: Response) => {
    try {
        const { location } = req.body;
        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }

        const apiKey = process.env.NEWSDATA_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key is missing' });
        }

        const response = await fetch(`https://newsdata.io/api/1/news?country=${location}&apiKey=${apiKey}&image=1&language=en`);
        if (!response.ok) {
            console.error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        //console.log(data);
        res.json(data);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

export default router;