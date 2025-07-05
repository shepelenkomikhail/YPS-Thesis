import { RequestHandler } from 'express';
import * as fs from "node:fs";

const dangerousTypes = [
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/bat',
    'application/x-bat',
    'application/x-msdos-program',
    'application/javascript',
    'application/x-javascript'
];

export const checkFileType: RequestHandler = (req, res, next) => {
    const file = req.file;
    if (!file) return next();


    if (dangerousTypes.includes(file.mimetype || '')) {
        fs.unlinkSync(file.path);
        res.status(403).json({ message: 'File type not allowed' });
        return;
    }

    next();
};