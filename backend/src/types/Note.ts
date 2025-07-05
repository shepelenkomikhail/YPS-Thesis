import mongoose, { Document, Schema } from 'mongoose';

export type NoteType = 'orderedList' | 'checklist' | 'text';

export interface INote extends Document {
    content: string;
    type: NoteType;
    user: mongoose.Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const NoteSchema = new Schema<INote>({
    content: { type: String, required: true },
    type: { type: String, enum: ['orderedList', 'checklist', 'text'], required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export const NoteModel = mongoose.model<INote>('Note', NoteSchema);