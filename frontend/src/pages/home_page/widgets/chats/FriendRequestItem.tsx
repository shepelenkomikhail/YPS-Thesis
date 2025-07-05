import {FriendRequest} from "../../../../data/types/FriendRequestType.ts";
import {Avatar, IconButton, MenuItem} from "@mui/material";
import {friendService} from "./friendService.ts";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import React from "react";
import {getImageUrl} from "../../utils/getImgUrl.ts";

interface FriendRequestItemProps {
    request: FriendRequest;
    setRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>;
}

export default function FriendRequestItem({ request, setRequests }: FriendRequestItemProps) {
    const avatarUrl = 'images' in request.sender 
        ? getImageUrl(request.sender.images?.[0]?.url)
        : getImageUrl(request.sender.avatar);

    return (
        <MenuItem className="!text-sm !py-2 !px-4">
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    <Avatar sx={{ width: 32, height: 32 }} src={avatarUrl}>
                        {!avatarUrl && request.sender.username?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <div>
                        <p className="font-medium">{request.sender.username || 'Unknown user'}</p>
                        <p className="text-xs text-gray-500">Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex">
                    <IconButton
                        color="success"
                        className={"!-mr-2 !ml-2"}
                        onClick={async () => {
                            await friendService.respondToRequest(request._id, 'accepted');
                            setRequests((prev: FriendRequest[]) => prev.filter(r => r._id !== request._id));
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <CheckCircleIcon />
                    </IconButton>
                    <IconButton
                        color="error"
                        className={"!-mr-2"}
                        onClick={async () => {
                            await friendService.respondToRequest(request._id, 'rejected');
                            setRequests((prev: FriendRequest[]) => prev.filter(r => r._id !== request._id));
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <CancelIcon />
                    </IconButton>
                </div>
            </div>
        </MenuItem>
    );
}