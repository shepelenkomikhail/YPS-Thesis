import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IImage extends Document {
    _id: mongoose.Types.ObjectId;
    url: string;
    userId: mongoose.Types.ObjectId;
}

const ImageSchema: Schema = new Schema({
    url: { type: String, required: true },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collection: 'images' });

const ImageModel: Model<IImage> = mongoose.model<IImage>('Image', ImageSchema);
export default ImageModel;