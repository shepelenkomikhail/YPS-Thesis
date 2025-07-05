import passport from 'passport';
import UserModel from '../models/UserModel';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import ImageModel from '../models/ImageSchema';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

// Google Authentication
passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await UserModel.findOne({ googleId: profile.id });
            if (user) return done(null, user);

            const email = profile.emails?.[0]?.value;
            const isEmailVerified = profile.emails?.[0]?.verified || false;

            if (!email || !isEmailVerified) {
                return done(null, false, { message: 'EMAIL_NOT_VERIFIED' });
            }

            user = await UserModel.findOne({ email });
            if (user) {
                user.googleId = profile.id;
                await user.save();
                return done(null, user);
            }

            const username = email.split('@')[0];
            const displayName = profile.displayName || '';
            const [firstName, lastName] = displayName.split(' ') || [];

            user = new UserModel({
                googleId: profile.id,
                username: username,
                email: email,
                firstName: firstName || username || 'Google',
                lastName: lastName || 'User',
                images: [],
                friends: [],
                status: 'offline',
                isVerified: true
            });

            await user.save();

            if (profile.photos?.[0]?.value) {
                const imageDoc = await ImageModel.create({
                    url: profile.photos[0].value,
                    userId: user._id
                });
                user.images.push(imageDoc._id);
                await user.save();
            }

            done(null, user);
        } catch (error) {
            done(error as any, false);
        }
    }));

// GitHub Authenticaction
passport.use(new GitHubStrategy({
        clientID: GITHUB_CLIENT_ID,
        clientSecret: GITHUB_CLIENT_SECRET,
        callbackURL: "http://localhost:8000/auth/github/callback",
        scope: ['user:email', 'read:user']
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
        try {
            console.log("GitHub Profile:", profile);

            let user = await UserModel.findOne({ githubId: profile.id });
            if (user) return done(null, user);

            const emails = profile.emails || [];
            const verifiedEmails = emails.filter((e: any) => e.verified);
            const primaryEmail = verifiedEmails.find((e: any) => e.primary) || verifiedEmails[0] || emails[0];

            if (!primaryEmail) {
                return done(null, false, { message: 'NO_VERIFIED_EMAIL' });
            }
            const email = primaryEmail.value;

            user = await UserModel.findOne({ email });
            if (user) {
                user.githubId = profile.id;
                await user.save();
                return done(null, user);
            }
            const username = profile.username || email.split('@')[0];

            const displayName = profile.displayName || '';
            const [firstName, lastName] = displayName.split(' ') || [];

            user = new UserModel({
                githubId: profile.id,
                username: username,
                email: email,
                firstName: firstName || username || 'GitHub',
                lastName: lastName || 'User',
                images: [],
                friends: [],
                status: 'offline',
                isVerified: true
            });

            await user.save();

            if (profile.photos?.[0]?.value) {
                const imageDoc = await ImageModel.create({
                    url: profile.photos[0].value,
                    userId: user._id
                });
                user.images.push(imageDoc._id);
                await user.save();
            }

            done(null, user);
        } catch (error) {
            done(error, false);
        }
    }));

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await UserModel.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});