import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
    user: mongoose.Schema.Types.ObjectId;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
}

const EventSchema: Schema = new Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true,},
    title: {type: String, required: true,},
    description: {type: String, optional: true,},
    startDate: {type: Date, required: true,},
    endDate: {type: Date, required: true,},
    location: {type: String, optional: true,},
}, {
    timestamps: true,
});

const EventModel = mongoose.model<IEvent>('Event', EventSchema);
export default EventModel;