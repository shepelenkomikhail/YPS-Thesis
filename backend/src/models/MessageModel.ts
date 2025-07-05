import mongoose, { Document, Model } from 'mongoose';

interface IMessage extends Document {
    senderId: string;
    receiverId: string;
    content: string;
    attachments: string[];
    timestamp: Date;
    status: 'sent' | 'read';
}

const MessageSchema = new mongoose.Schema({
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    content: { type: String, required: false },
    attachments: { type: [String], default: [] },
    timestamp: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['sent', 'read'],
        default: 'sent'
    }
});

export const MessageModel: Model<IMessage> = mongoose.model<IMessage>('Message', MessageSchema);