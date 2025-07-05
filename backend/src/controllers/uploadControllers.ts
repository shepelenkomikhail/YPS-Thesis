import { Request, Response } from 'express';
import ImageModel from '../models/ImageSchema';
import ChatFile from '../models/ChatFileModel';
import path from "path";
import * as fs from "node:fs";

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
    try {
        //console.log("User DATA", req.user);

        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        //@ts-ignore
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const imageUrl = `/uploads/${file.filename}`;
        const newImage = new ImageModel({ url: imageUrl, userId });
        await newImage.save();

        res.status(201).json({ imageUrl });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getImages = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        //@ts-ignore
        const userId = req.user.id;

        const images = await ImageModel.find({ userId });
        res.status(200).json(images.map((img) => img.url));
    } catch (error) {
        console.error('Error fetching images:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        //@ts-ignore
        const userId = req.user.id;
        const imageUrl = req.body.imageUrl;

        if (!imageUrl) {
            res.status(400).json({ message: 'Image URL is required' });
            return;
        }

        const image = await ImageModel.findOne({ url: imageUrl, userId });

        if (!image) {
            res.status(404).json({ message: 'Image not found' });
            return;
        }

        const filePath = path.join(__dirname, '..', imageUrl);
        fs.unlink(filePath, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
                res.status(500).json({ message: 'Failed to delete image file' });
                return;
            }

            ImageModel.deleteOne({ _id: image._id })
                .then(() => {
                    res.status(200).json({ message: 'Image deleted successfully' });
                })
                .catch((error) => {
                    console.error('Error deleting image from database:', error);
                    res.status(500).json({ message: 'Failed to delete image record' });
                });
        });
    } catch (error) {
        console.error('Error deleting image:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const uploadChatFile = async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        //@ts-ignore
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const fileUrl = `/uploads/chat/${file.filename}`;
        const newFile = new ChatFile({
            url: fileUrl,
            originalName: file.originalname,
            mimeType: file.mimetype,
            userId
        });

        await newFile.save();

        console.log(newFile);

        res.status(201).json({
            fileUrl: fileUrl,
            originalName: file.originalname,
            mimeType: file.mimetype,
            uploadedAt: newFile.uploadedAt
        });
    } catch (error) {
        console.error('Error uploading chat file:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};