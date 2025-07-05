export interface User  {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    googleId?: string;
    githubId?: string;
    avatar?: string;
    status?: 'online' | 'away' | 'offline';
}