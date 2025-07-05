import {User} from './UserType';
import {SearchResultUser} from "./SearchResultUser.ts";

export interface FriendRequest {
    _id: string;
    sender: User | SearchResultUser;
    receiver: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}