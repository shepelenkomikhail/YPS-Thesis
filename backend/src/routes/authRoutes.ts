import cors from 'cors';
import passport from 'passport';
import '../middleware/passportConfig';
import express, { Request, Response, Router } from 'express';
import { generateToken } from '../middleware/authMiddleware';
import { verifyToken } from '../middleware/authMiddleware';

const router: Router = express.Router();

router.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Google Authentication
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback',
    passport.authenticate('google', {failureRedirect: '/login', session: false}),
    (req: Request, res: Response) => {
        try {
            if (req.authInfo && (req.authInfo as { message?: string }).message === 'NO_VERIFIED_EMAIL') {
                console.log("Google login failed: No verified email");
                return res.redirect('http://localhost:5173/login?error=NO_VERIFIED_EMAIL');
            }
            const user = req.user as { _id: string; username: string };
            //console.log(user);
            const token = generateToken(user._id, user.username);
            //console.log(token);

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
                //secure: process.env.NODE_ENV === 'production',
                //sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
            });

            console.log("Google login successful");
            res.redirect('http://localhost:5173/callback');
        } catch (error) {
            console.log("Google login error: ", error);
            res.redirect('http://localhost:5173/login');
        }
    }
);


// GitHub Authentication
router.get('/auth/github', (req, res, next) => {
    console.log('Initiating GitHub OAuth flow');
    passport.authenticate('github',{scope: ['user:email', 'read:user']}, (err:any, user:any, info:any) => {
        if (err) {
            console.error("GitHub Authentication Error:", err);
            return res.redirect('http://localhost:5173/login?error=AUTH_ERROR');
        }
        if (!user) {
            console.error("GitHub Login Failed:", info);
            return res.redirect('http://localhost:5173/login?error=' + (info?.message || 'UNKNOWN_ERROR'));
        }
        req.logIn(user, (err) => {
            if (err) {
                console.error("Login Error:", err);
                return res.redirect('http://localhost:5173/login?error=LOGIN_FAILED');
            }
            const token = generateToken(user._id, user.username);
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });
            console.log("GitHub login successful");
            res.redirect('http://localhost:5173/callback');
        });
    })(req, res, next);

});

router.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login', session: false }),
    (req: Request, res: Response) => {
        try {
            if (req.authInfo && (req.authInfo as { message?: string }).message === 'EMAIL_ALREADY_USED_WITH_GOOGLE')
                return res.redirect('http://localhost:5173/login?error=EMAIL_ALREADY_USED_WITH_GOOGLE');

            const user = req.user as { _id: string; username: string };
            const token = generateToken(user._id, user.username);

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });

            console.log("GitHub login successful");
            res.redirect('http://localhost:5173/callback');
        } catch (error) {
            console.log("GitHub login error: ", error);
            res.redirect('http://localhost:5173/login');
        }
    }
);

// Common Authentication
router.get('/auth/me', verifyToken, (req: Request, res: Response) => {
    //console.log("User data:", req.user);
    //console.log("Token:", req.cookies.token);
    res.json(req.user);
});

export default router;
