import express, {Request, Response, Router} from 'express';
import { verifyToken } from '../middleware/authMiddleware';
import {MessageModel}  from '../models/MessageModel';
import {chatUpload} from "../middleware/multerConfig";
import {checkFileType} from "../middleware/fileTypeFilter";
import {uploadChatFile} from "../controllers/uploadControllers";

const router: Router = express.Router();

// Get conversation between two users
router.get('/conversation/:userId/:friendId', verifyToken, async (req: Request, res: Response) => {
    try {
        const { userId, friendId } = req.params;
        const messages = await MessageModel.find({
            $or: [
                { senderId: userId, receiverId: friendId },
                { senderId: friendId, receiverId: userId }
            ]
        }).sort('timestamp');
        res.json(messages);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

router.post('/upload', verifyToken, chatUpload.single('file'), checkFileType, uploadChatFile);

export default router;