export interface Friend {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    status: string;
    images?: { url: string }[];
}