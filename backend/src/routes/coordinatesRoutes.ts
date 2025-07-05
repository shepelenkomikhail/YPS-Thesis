import express, {Request, Response, RequestHandler, Router} from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import cors from "cors";

const router: Router = express.Router();
cors ({ origin: 'http://localhost:5173', credentials: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });

// Get coordinates from city name
router.get('/', verifyToken, (async (req: Request, res: Response) => {
    const queryData = {city: String(req.query.city),};
    try {
        const response = await getCoords(queryData.city);
        res.send(response);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).send('Error fetching weather data');
    }
}) as RequestHandler);

// Get apikey
router.get('/apikey', verifyToken, (async (req: Request, res: Response) => {
    const apiKey: string|undefined = process.env.OPENCAGE_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key is missing' });
    }
    res.json({ apiKey });
}) as RequestHandler);

const getCoords = async (city: string) => {
    const API_KEY: string|undefined = process.env.OPENCAGE_API_KEY;
    try {
        const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${city}&key=${API_KEY}`);
        if (!response.ok) {
            console.error('API response was not ok');
        }
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry;
            return { latitude: lat, longitude: lng };
        } else {
            console.error('No results found for the given city');
        }
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
};

export default router;