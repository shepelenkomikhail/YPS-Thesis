import mongoose from 'mongoose';

const ChatFileSchema = new mongoose.Schema({
    url: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.model('ChatFile', ChatFileSchema);