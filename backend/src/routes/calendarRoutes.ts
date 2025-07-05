import express, { Request, Response, RequestHandler, Router } from 'express';
import EventModel  from '../models/EventModel';
import { verifyToken } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Get all events for user
router.get('/', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const events = await EventModel.find({ user: userId }).sort('-startDate');
        res.send(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Create new event
router.post('/', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { title, description, startDate, endDate, location } = req.body;
        //console.log('Request body:', req.body);

        if (!title || !startDate || !endDate) {
            return res.status(400).send('Title, startDate, and endDate are required');
        }

        const newEvent = new EventModel({
            user: userId,
            title,
            description,
            startDate,
            endDate,
            location
        });

        const savedEvent = await newEvent.save();
        res.status(201).send(savedEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Update event
router.put('/:id', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { title, description, startDate, endDate, location } = req.body;
        //console.log('Update request received:', req.params.id, req.body);

        if (!title || !startDate || !endDate) {
            return res.status(400).send('Title, startDate, and endDate are required');
        }

        const event = await EventModel.findOneAndUpdate(
            { _id: req.params.id, user: userId },
            { title, description, startDate, endDate, location },
            { new: true }
        );

        if (!event) {
            return res.status(404).send('Event not found');
        }

        res.send(event);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Delete event
router.delete('/:id', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const event = await EventModel.findOneAndDelete({
            _id: req.params.id,
            user: userId
        });

        if (!event) {
            return res.status(404).send('Event not found');
        }

        res.send({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

export default router;