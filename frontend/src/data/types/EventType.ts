export interface Event {
    _id: string;
    user: string;
    title: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    createdAt?: Date;
    updatedAt?: Date;
}