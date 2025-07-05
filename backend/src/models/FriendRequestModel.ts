import mongoose from 'mongoose';

export interface IFriendRequest extends mongoose.Document {
    sender: mongoose.Types.ObjectId;
    receiver: mongoose.Types.ObjectId;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: Date;
}

const FriendRequestSchema = new mongoose.Schema<IFriendRequest>({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IFriendRequest>('FriendRequest', FriendRequestSchema);