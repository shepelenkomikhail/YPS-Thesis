import {FriendRequest} from "../../../../data/types/FriendRequestType.ts";
import {SearchResultUser} from "../../../../data/types/SearchResultUser.ts";

export const isValidFriendRequest = (data: any): data is { request: FriendRequest, sender: SearchResultUser } => {
    return data &&
        data.request &&
        data.sender &&
        typeof data.request._id === 'string' &&
        typeof data.sender.username === 'string';
};

export const isValidRequestUpdate = (data: any): data is { request: FriendRequest, receiver: SearchResultUser } => {
    return data &&
        data.request &&
        data.receiver &&
        typeof data.request._id === 'string' &&
        typeof data.receiver.username === 'string';
};