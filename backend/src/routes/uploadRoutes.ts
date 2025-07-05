import express, {Router} from 'express';
import upload from '../middleware/multerConfig';
import {uploadImage, getImages, deleteImage} from '../controllers/uploadControllers';
import {verifyToken} from "../middleware/authMiddleware";
import cors from "cors";

const router: Router = express.Router();

router.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE'
}));

router.delete('/delete', verifyToken, deleteImage);
router.post('/upload', verifyToken, upload.single('image'), uploadImage);
router.get('/images', verifyToken, getImages);

export default router;