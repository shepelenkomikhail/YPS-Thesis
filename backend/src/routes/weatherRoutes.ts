import express, {Request, Response, RequestHandler, Router} from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import cors from "cors";

const router: Router = express.Router();
cors ({ origin: 'http://localhost:5173', credentials: true, methods: 'GET,HEAD,PUT,PATCH,POST,DELETE' });

// Weather
router.get('/', verifyToken, (async (req: Request, res: Response) => {
    const queryData = {
        lat: Number(req.query.lat),
        lon: Number(req.query.lon),
        startDate: String(req.query.startDate),
        endDate: String(req.query.endDate)
    };
    try {
        const response = await getWeather(queryData.lat, queryData.lon, queryData.startDate, queryData.endDate);
        res.send(response);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).send('Error fetching weather data');
    }
}) as RequestHandler);

async function getWeather(lat: number, lon: number, startDate:string, endDate:string) {
    const WEATHER_API_KEY: string|undefined = process.env.WEATHER_API_KEY;
    //console.log('lat:', lat, 'lon:', lon, 'startDate:', startDate, 'endDate:', endDate);
    try {
        const response =
            await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${startDate}/${endDate}?key=${WEATHER_API_KEY}&unitGroup=metric&elements=datetime,temp,feelslike,conditions&lang=id`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Response status:', response.status);
            console.error('Response body:', errorText);
            console.error('Api response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export default router;