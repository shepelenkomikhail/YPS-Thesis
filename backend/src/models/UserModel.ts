import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    googleId?: string;
    githubId?: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    images: mongoose.Types.ObjectId[];
    friends: mongoose.Types.ObjectId[];
    status: 'online' | 'away' | 'offline';
    isVerified: boolean;
    verificationCode?: string;
    verificationCodeExpires?: Date;
    tempPassword?: string;
    resetCode?: string;
    resetCodeExpires?: Date;
}

const UserSchema: Schema = new Schema({
    googleId: { type: String, required: false },
    githubId: { type: String, required: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: false },
    images: [{ type: mongoose.Types.ObjectId, ref: 'Image', default: [] }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' , default: [] }],
    status: {type: String, enum: ['online', 'away', 'offline'], default: 'offline'},
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    tempPassword: { type: String },
    resetCode: { type: String },
    resetCodeExpires: { type: Date },
}, { timestamps: true, collection: 'users' });

const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default UserModel;