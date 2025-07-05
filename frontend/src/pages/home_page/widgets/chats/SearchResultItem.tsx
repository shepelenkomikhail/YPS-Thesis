import {Avatar, Button} from "@mui/material";
import {friendService} from "./friendService.ts";
import {toast} from "react-toastify";
import React from "react";
import {SearchResultUser} from "../../../../data/types/SearchResultUser.ts";
import {getImageUrl} from "../../utils/getImgUrl.ts";

interface FriendRequestItemProps {
    mode: string | null;
    user: SearchResultUser;
    setSearchResults: React.Dispatch<React.SetStateAction<SearchResultUser[]>>;
}

export default function SearchResultItem({mode, user, setSearchResults}: FriendRequestItemProps) {
    return (
        <div className={`flex items-center justify-between p-3 ${mode == 'dark' ? "hover:bg-gray-700" : "hover:bg-gray-100"}  transition-colors`}>
            <div className="flex items-center gap-3">
                <Avatar sx={{ width: 32, height: 32 }} src={getImageUrl(user.images?.[0]?.url)}>
                    {!user.images?.[0]?.url && user.username[0].toUpperCase()}
                </Avatar>
                <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.firstName} {user.lastName}</p>
                </div>
            </div>
            <Button
                size="small"
                variant="contained"
                sx={{ textTransform: 'none' }}
                onClick={async () => {
                    await friendService.sendFriendRequest(user._id);
                    toast.success(`Request sent to ${user.username}!`);
                    setSearchResults(prev => prev.filter(u => u._id !== user._id));
                }}
            >
                Add Friend
            </Button>
        </div>
    );
}

