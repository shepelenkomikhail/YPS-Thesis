import express, { Request, Response, Router, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import UserModel, { IUser } from '../models/UserModel';
import { verifyToken, generateToken } from '../middleware/authMiddleware';
import ImageModel, {IImage} from "../models/ImageSchema";
import upload from "../middleware/multerConfig";
import multer from "multer";
import mongoose from "mongoose";
import nodemailer from 'nodemailer';

const router: Router = express.Router();

const SECRET_KEY: string = process.env.SECRET_KEY || '';
if (!SECRET_KEY) throw new Error('SECRET_KEY is not defined in the environment variables.');

// Register user
router.post('/', (async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, username, email, password } = req.body;
        if (!firstName || !lastName || !username || !email || !password) {
            return res.status(400).send({message: 'All fields are required.'});
        }

        const existingUser = await UserModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) return res.status(400).json({ message: 'Username or Email already exists.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const sendVerificationEmail = async (
            to: string,
            code: string,
            expiresAt: string
        ) => {
            await transporter.sendMail({
                from: `"No Reply" <${process.env.EMAIL_USER}>`,
                to,
                subject: 'Your Verification Code',
                html: `  <p>Your verification code is:</p>
                          <h2>${code}</h2>
                          <p>It will expire at: <strong>${expiresAt}</strong></p>
                        `,
            });
        };

        try {
            console.log(`Sending verification email to ${email}`);
            await sendVerificationEmail(email, verificationCode, verificationCodeExpires.toLocaleString());
        } catch (e) {
            console.log(e);
        }


        const newUser: IUser = new UserModel({ firstName, lastName, username, email, password: hashedPassword,verificationCode, verificationCodeExpires });

        //console.log(newUser);
        await newUser.save();
        //@ts-ignore
        const token: unknown = generateToken(newUser._id.toString() , newUser.username);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        res.json({ message: "Registration is successful" });
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
}) as RequestHandler);

// Send OTP
router.post('/verification', (async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        // console.log(`${email} - ${code} - ${email}`);

        const user = await UserModel.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid request' });
        // console.log(`Verifying code for ${email}: ${code}`);
        // console.log('Verif code', user.verificationCode)

        if (user.verificationCodeExpires! < new Date()) {
            await UserModel.deleteOne({ email });
            return res.status(400).json({ message: 'Verification code has expired' });
        }

        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        //@ts-ignore
        const token = generateToken(user._id.toString(), user.username);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        res.json({ message: 'Account verified successfully' });
    } catch (error) {
        console.error(error);
        await UserModel.deleteOne({ email: req.body.email });
        res.status(500).json({ message: 'Error during verification' });
    }
}) as RequestHandler);

// Password Reset Step 1: Validate email and send reset code
router.post('/verifypassword', (async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });

        const passwordPattern = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,20}$";
        if (!new RegExp(passwordPattern).test(password)) {
            return res.status(400).json({ message: 'Invalid password format' });
        }

        const salt = await bcrypt.genSalt(10);
        user.tempPassword = await bcrypt.hash(password, salt);

        // Generate reset code
        user.resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetCodeExpires = new Date(Date.now() + 900000);

        await user.save();

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

        await transporter.sendMail({
            from: `"Password Reset" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Your Password Reset Code',
            html: `<h3>Reset Code: ${user.resetCode}</h3>
                   <p>Expires at: ${user.resetCodeExpires.toLocaleString()}</p>`
        });

        res.json({ message: 'Reset code sent to email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

// Password Reset Step 2: Verify code and update password
router.post('/verifypasswordreset', (async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) return res.status(400).json({ message: 'User not found' });
        if (!user.resetCode || !user.resetCodeExpires) {
            return res.status(400).json({ message: 'No pending password reset' });
        }

        if (user.resetCode !== code || new Date() > user.resetCodeExpires) {
            return res.status(400).json({ message: 'Invalid or expired code' });
        }

        user.password = user.tempPassword!;
        user.tempPassword = undefined;
        user.resetCode = undefined;
        user.resetCodeExpires = undefined;
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);


// Update user
router.put('/:id', upload.single('avatar'), (async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, username, email, password } = req.body;

        const user = await UserModel.findById(id);
        if (!user) return res.status(404).send('User not found.');

        if (req.file) {
            const imageUrl = `/uploads/${req.file.filename}`;
            const newImage = new ImageModel({
                url: imageUrl,
                userId: id
            }) as mongoose.HydratedDocument<IImage>;
            await newImage.save();

            user.images.unshift(newImage._id);
        }

        if (username && username !== user.username) {
            const usernameExists = await UserModel.findOne({ username });
            if (usernameExists) return res.status(400).send('Username already in use.');
        }

        if (email && email !== user.email) {
            const emailExists = await UserModel.findOne({ email });
            if (emailExists) return res.status(400).send('Email already in use.');
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        user.firstName = firstName || user.firstName;
        user.lastName = lastName || user.lastName;
        user.username = username || user.username;
        user.email = email || user.email;

        await user.save();
        res.send({
            message: 'User updated successfully',
            user: await UserModel.findById(id).populate('images')
        });
    } catch (error) {
        console.error(error);
        if (error instanceof multer.MulterError) {
            return res.status(400).send('File upload error: ' + error.message);
        }
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Delete user
router.delete('/:id', (async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndDelete(id);
        if (!user) return res.status(404).send('User not found.');

        res.send('User deleted successfully.');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Get all users
router.get('/', verifyToken, (async (req: Request, res: Response) => {
    try {
        const users = await UserModel.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}) as RequestHandler);

// Change password route
router.post('/change-password', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore - Get user ID from verified token
        const userId = req.user.id;
        const { newPassword } = req.body;
        const oldPassword: string|null = await UserModel.findByIdAndUpdate(userId, { password: newPassword });

        if (!oldPassword || !newPassword) {
            return res.status(400).send({message: 'Both old and new passwords are required.'});
        }

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).send({message: 'User not found.'});

        const patternPassword = "^(?=.*[A-Z])(?=.*[a-z])(?=.*\\d)(?=.*[!@#$%^&*])[A-Za-z\\d!@#$%^&*]{8,20}$";
        const passwordRegex = new RegExp(patternPassword);
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).send({message: 'Password must contain: 8-20 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character'});
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.send({message: 'Password changed successfully'});
    } catch (error) {
        console.error(error);
        res.status(500).send({message: 'Internal Server Error'});
    }
}) as RequestHandler);

// Login user
router.post('/login', (async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await UserModel.findOne({ username });
        if (!user)
            return res.status(400).send({message: 'Invalid credentials.'});
        if ((user && user.password) && !(await bcrypt.compare(password, user.password)))
            return res.status(400).send({message: 'Invalid credentials.'});

        const token = generateToken(user.id, user.username);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        res.json({ message: 'Login successful.' });
    } catch (error) {
        res.status(500).send({message: 'Internal Server Error'});
    }
}) as RequestHandler);

// Logout use
router.post('/logout', (req: Request, res: Response) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        });

        //console.log('User logged out successfully');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


export default router;