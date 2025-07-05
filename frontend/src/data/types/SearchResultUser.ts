export interface SearchResultUser {
    _id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    images?: { url: string }[];
}