import express, {Request, Response, RequestHandler, Router} from 'express';
import { NoteModel } from '../types/Note';
import { verifyToken } from '../middleware/authMiddleware';

const router: Router = express.Router();

// Get all notes for user
router.get('/', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const notes = await NoteModel.find({ user: userId }).sort('-updatedAt');
        res.send(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Create new note
router.post('/', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { content, type } = req.body;
        //console.log('Request body:', req.body);

        if (!content || !type) {
            return res.status(400).send('Content and type are required');
        }

        const newNote = new NoteModel({
            user: userId,
            content,
            type
        });

        const savedNote = await newNote.save();
        res.status(201).send(savedNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Update note
router.put('/:id', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { content, type } = req.body;
        //console.log('Update request received:', req.params.id, req.body);

        if (!type) {
            return res.status(400).send('Content and type are required');
        }

        const note = await NoteModel.findOneAndUpdate(
            { _id: req.params.id, user: userId },
            { content, type },
            { new: true }
        );

        if (!note) {
            return res.status(404).send('Note not found');
        }

        res.send(note);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Delete note
router.delete('/:id', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const note = await NoteModel.findOneAndDelete({
            _id: req.params.id,
            user: userId
        });

        if (!note) {
            return res.status(404).send('Note not found');
        }

        res.send({ message: 'Note deleted successfully' });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

export default router;