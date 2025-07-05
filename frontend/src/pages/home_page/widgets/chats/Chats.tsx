import React, {useState, useRef, useEffect, useCallback,} from "react";
import {Avatar, IconButton, Menu, MenuItem} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AddIcon from "@mui/icons-material/Add";
import RemoveWidgetButton from "../components/RemoveWidgetButton.tsx";
import {AttachFile, Close, Send} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import { friendService } from "./friendService";
import { Dialog, TextField, Badge, CircularProgress } from "@mui/material";
import {SearchResultUser} from "../../../../data/types/SearchResultUser.ts";
import {FriendRequest} from "../../../../data/types/FriendRequestType.ts";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {textFieldsStyle} from "../components/darkModalStyle.ts";
import {getUser} from "../../utils/getUser.ts";
import {User} from "../../../../data/types/UserType.ts";
import FriendRequestItem from "./FriendRequestItem.tsx";
import {isValidFriendRequest, isValidRequestUpdate} from "./validateRequest.ts";
import {motion} from "framer-motion";
import {Friend} from "../../../../data/types/FriendType.ts";
// @ts-expect-error
import {io, Socket, DisconnectReason} from "socket.io-client";
import SearchResultItem from "./SearchResultItem.tsx";
import Message from "../../../../data/types/MessageType.ts";
import {useChatSocket} from "./useChatSocket.ts";
import {chatService} from "./chatService.ts";
import MessageBubble from "./MessageBubble.tsx";
import {getFileType} from "./getFileType.ts";
import {CustomSnackbar, useSnackbar} from "../../../../components/CustomSnackbar.tsx";
import {getImageUrl} from "../../utils/getImgUrl.ts";
import { UserStatus } from "../../../../data/types/UserStatus.ts";
import { useMyContext} from "../../../../context/MyProvider.tsx";

export default function Chats({ onRemove }: { onRemove: () => void }) {
    const mode = localStorage.getItem("mode");
    const { showSnackbar, snackbarOpen, snackbarMessage, snackbarSeverity, handleClose: handleSnackbarClose } = useSnackbar();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [componentWidth, setComponentWidth] = useState(0);
    const isSmallWidget = componentWidth <= 450;

    const { socket, setSocket } = useMyContext();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [showAddFriendDialog, setShowAddFriendDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [user, setUser] = useState<User | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

    const [attachments, setAttachments] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 60 * 1024 * 1024;

    const [search, setSearch] = useState("");

    // Resize observer
    useEffect(() => {
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) setComponentWidth(entries[0].contentRect.width);
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // Get user data
    useEffect(() => {
        const fetchUser = async () => {
            const result = await getUser();
            if (result) setUser(result.user);
        };

        fetchUser().then();
    }, []);

    // Socket connection
    useEffect(() => {
        if(!user) return;

        const newSocket = io('http://localhost:8000', {
            withCredentials: true,
            path: '/socket.io/',
            transports: ['websocket'],
            rejectUnauthorized: false,
            auth: {
                userId: user._id ,
            },
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            //console.log('WebSocket connected successfully!', newSocket.id);
            newSocket.emit('join_user_room', user._id);
        });

        newSocket.on('disconnect', (reason: DisconnectReason) => {
            console.error('WebSocket disconnected:', reason);
        });

        newSocket.on('connect_error', (error: Error) => {
            console.error('Connection Error:', error);
        });

        newSocket.on('message_read', (messageId: string ) => {
            setMessages(prevMessages => {
                return prevMessages.map(msg =>
                    msg._id === messageId ? { ...msg, status: 'read' } : msg
                );
            });
        });

        newSocket.on('friend_status', (status: UserStatus) => {
            setFriends(prev => prev.map(friend =>
                friend._id === status.userId ? { ...friend, status: status.status } : friend
            ));
        });

        newSocket.on('message', handleReceiveMessage);
        newSocket.on('private_message', handleReceiveMessage);
        newSocket.on('receive_message', handleReceiveMessage);
        newSocket.on('typing_update', handleTypingUpdate);

        newSocket.on('error', (error: Error) => {
            console.error('Socket error:', error);
            toast.error('Real-time connection error');
        });

        newSocket.on('friend_removed', ({ userId }: { userId: string }) => {
            setFriends(prev => prev.filter(friend => friend._id !== userId));
            if (selectedFriendId === userId) {
                setSelectedFriendId(null);
            }
            showSnackbar('Friend removed', 'info');
        });

        setSocket(newSocket);

    }, [user]);

    // Mark messages as read
    useEffect(() => {
        if (!socket || !selectedFriendId || !user) return;

        const unreadMessages = messages.filter(msg =>
            msg.senderId === selectedFriendId &&
            msg.status === 'sent'
        );

        if (unreadMessages.length === 0) return;

        const messageIds = unreadMessages.map(msg => msg._id);
        socket.emit('mark_as_read', messageIds, (response: any) => {
            if (!response.success) {
                console.error('Failed to mark messages as read');
            }
        });
    }, [messages, selectedFriendId, socket, user]);

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && attachments.length === 0) || !selectedFriendId || !user) return;

        setIsSending(true);
        try {
            const uploadedAttachments = await Promise.all(
                attachments.map(file => chatService.uploadFile(file))
            );
             await chatService.sendMessage(
                 socket,
                 user._id,
                 selectedFriendId,
                 newMessage,
                 uploadedAttachments
            );

            setNewMessage('');
            setAttachments([]);
        } catch (error) {
            toast.error('Failed to send message');
            setIsSending(false);
        } finally {
            setIsSending(false);
        }
    };

    const handleReceiveMessage = useCallback((message: Message) => {
        if (!message._id) {
            console.error('Received message without _id:', message);
            return;
        }

        setMessages(prev => {
            const existingMessage = prev.find(m => m._id === message._id);
            if (existingMessage) return prev;

            const status = selectedFriendId === message.senderId ? 'read' : message.status;
            return [...prev, { ...message, status }];
        });

        if (selectedFriendId === message.senderId && socket) {
            //console.log('Marking message as read:', message._id);
            socket.emit('mark_as_read', [message._id], (response: any) => {
                if (!response?.success) {
                    console.error('Failed to mark message as read');
                }
            });
        }
    }, [selectedFriendId, socket]);

    const handleTypingUpdate = useCallback(({ senderId, isTyping }: { senderId: string, isTyping: boolean }) => {
        setTypingUsers(prev => ({ ...prev, [senderId]: isTyping }));
    }, []);

    const handleTyping = useCallback((isTyping: boolean) => {
        if (!selectedFriendId || !socket) return;
        socket.emit('typing_indicator', {
            senderId: user?._id,
            receiverId: selectedFriendId,
            isTyping
        });
    }, [selectedFriendId, socket, user?._id]);

    useChatSocket(socket, user?._id, selectedFriendId, handleReceiveMessage);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Add search handler with debounce
    useEffect(() => {
        const search = async () => {
            if (searchQuery.trim()) {
                setIsLoading(true);
                try {
                    const results = await friendService.searchFriends(searchQuery.trim());
                    setSearchResults(results);
                } catch (error) {
                    console.error('Search error:', error);
                }
                setIsLoading(false);
            }
        };

        const debounceTimer = setTimeout(search, 500);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    // Load friends and requests
    useEffect(() => {
        const loadFriendsAndRequests = async () => {
            try {
                const [friendsData, requestsData] = await Promise.all([
                    friendService.getFriends(),
                    friendService.getFriendRequests()
                ]);

                const statuses = await friendService.fetchStatuses();
                setFriends(prev => prev.map(friend => {
                    const status = statuses.find((s: UserStatus) => s.userId === friend._id);
                    return status ? { ...friend, status: status.status } : friend;
                }));

                //console.log(friendsData);

                setFriends(friendsData || []);

                setRequests(requestsData || []);

            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadFriendsAndRequests().then();
    }, []);

    // Real-time friend requests and updates
    useEffect(() => {
        if (!socket || !user) return;

        const handleNewFriendRequest = async (data: { request: FriendRequest, sender: SearchResultUser }) => {
            if (!isValidFriendRequest(data)) {
                console.error('Invalid friend request data:', data);
                return;
            }

            try {
                const response = await friendService.searchFriends(data.sender.username);
                const completeUserData = response.find((user: SearchResultUser) => user._id === data.sender._id);

                setRequests(prev => {
                    if (prev.some(req => req._id === data.request._id)) {
                        return prev;
                    }
                    return [...prev, {
                        ...data.request,
                        sender: completeUserData || data.sender
                    }];
                });

                toast.info(`${data.sender.username} sent you a friend request!`, {
                    position: 'bottom-right',
                    autoClose: 2500,
                });
            } catch (error) {
                console.error('Error fetching complete user data:', error);
                setRequests(prev => {
                    if (prev.some(req => req._id === data.request._id)) {
                        return prev;
                    }
                    return [...prev, data.request];
                });
            }
        };

        const handleFriendRequestUpdate = (data: { request: FriendRequest, receiver: SearchResultUser, sender: SearchResultUser }) => {
            if (!isValidRequestUpdate(data)) {
                console.error('Invalid friend request update data:', data);
                return;
            }

            const status = data.request.status;
            setRequests(prev => prev.filter(r => r._id !== data.request._id));

            if (status === 'accepted') {
                const isReceiver = user?._id === data.request.receiver;
                const newFriend = isReceiver ? data.receiver : data.sender;
                
                setFriends(prev => {
                    if (prev.some(friend => friend._id === newFriend._id)) {
                        return prev;
                    }
                    return [...prev, {
                        _id: newFriend._id,
                        firstName: newFriend.firstName || '',
                        lastName: newFriend.lastName || '',
                        username: newFriend.username,
                        status: 'online',
                        images: newFriend.images
                    }];
                });

                const message = !isReceiver
                    ? `You accepted friend request from ${data.sender.username}`
                    : `${data.sender.username} accepted your friend request`;

                toast.success(message, {
                    position: 'bottom-right',
                    autoClose: 1500
                });
            } else {
                const isReceiver = user?._id === data.request.receiver;
                const message = !isReceiver
                    ? `You rejected friend request from ${data.sender.username}`
                    : `${data.receiver.username} rejected your friend request`;

                toast.error(message, {
                    position: 'bottom-right',
                    autoClose: 1500
                });
            }
        };

        socket.on('new_friend_request', handleNewFriendRequest);
        socket.on('friend_request_updated', handleFriendRequestUpdate);

        return () => {
            socket.off('new_friend_request', handleNewFriendRequest);
            socket.off('friend_request_updated', handleFriendRequestUpdate);
        };
    }, [socket, user]);

    // Load messages on friend select
    useEffect(() => {loadMessages().then();}, [selectedFriendId]);

    // Update user status on visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (socket && user) {
                const newStatus = document.visibilityState === 'visible' ? 'online' : 'away';
                socket.emit('update_status', newStatus);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [socket, user]);

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const newFiles = Array.from(files);
            for (const file of newFiles) {
                if (file.size > MAX_FILE_SIZE) {
                    showSnackbar(`File ${file.name} exceeds maximum size of 15MB`, "error");
                    return;
                }
            }

            const totalSize = [...attachments, ...newFiles].reduce(
                (sum, file) => sum + file.size, 0
            );
            if (totalSize > MAX_TOTAL_SIZE) {
                showSnackbar('Total attachments size exceeds 60MB limit', "error");
                return;
            }

            setAttachments(prev => [...prev, ...newFiles]);
        } catch (error) {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            console.error(error);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        stopPropagation(event);
        setMenuAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => setMenuAnchorEl(null);

    const handleFriendSelect = (friendId: string) => {
        setSelectedFriendId(friendId);
        handleMenuClose();
    };

    const generateFriendName = (friend: Friend) => {
        const maxChars: number = 20;
        return friend.username.substring(0, maxChars) +
            (friend.username.length > maxChars ? ".." : "");
    };

    const loadMessages = async () => {
        if (!selectedFriendId || !user) return;

        try {
            const messages = await chatService.getConversation(user._id, selectedFriendId);
            setMessages(messages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    // Update friend messages status
    useEffect(() => {
        const counts = messages.reduce((acc, msg) => {
            if (msg.status === 'sent' && msg.senderId !== user?._id) {
                const friendId = msg.senderId === user?._id ? msg.receiverId : msg.senderId;
                acc[friendId] = (acc[friendId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        setUnreadCounts(counts);
    }, [messages, user?._id]);

    // Reset unread count on friend
    useEffect(() => {
        if (selectedFriendId) {
            setUnreadCounts(prev => ({
                ...prev,
                [selectedFriendId]: 0
            }));
        }
    }, [selectedFriendId]);

    const handleRemoveFriend = async (friendId: string) => {
        try {
            await friendService.removeFriend(friendId);

            setFriends(prev => prev.filter(friend => friend._id !== friendId));

            if (selectedFriendId === friendId) {
                setSelectedFriendId(null);
                setMessages([]);
            }
            
            showSnackbar('Friend removed successfully', 'success');
        } catch (error) {
            console.error('Error removing friend:', error);
            showSnackbar('Failed to remove friend', 'error');
        }
    };

    const FriendListItem = ({ friend }: { friend: Friend}) => {
        return (
            <div
                role="button"
                tabIndex={0}
                className={`w-[95%] flex items-start justify-between p-2 mb-1 ml-1 text-sm rounded cursor-pointer overflow-hidden transition-colors ${
                    selectedFriendId === friend._id
                        ? mode === "dark"? "bg-[#1E3A8A]": "bg-[#BFDBFE]"
                        : "hover:" + (mode === "dark" ? "bg-[#374151]" : "bg-[#F3F4F6]")
                } ${mode == "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
                onClick={() => handleFriendSelect(friend._id)}
                onMouseDown={stopPropagation}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleFriendSelect(friend._id);
                    }
                }}
            >
                <div className="flex items-center gap-2 w-full">
                    <div className="relative">
                        <span
                            className={`absolute -right-1 -top-1 w-3 h-3 rounded-full border-2 ${
                                mode === 'dark'
                                    ? 'border-[#192734]'
                                    : 'border-white'
                            } ${
                                friend.status === 'online' ? 'bg-green-500' :
                                    friend.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                            }`}
                        />
                        {friend && (
                            <Avatar
                                sx={{
                                    width: 32,
                                    height: 32,
                                    bgcolor: mode === 'dark' ? '#374151' : '#e5e7eb',
                                    color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                                    fontSize: '0.875rem'
                                }}
                                src={getImageUrl(friend.images?.[0]?.url)}
                            >
                                {!friend.images?.[0]?.url && friend.username[0].toUpperCase()}
                            </Avatar>
                        )}
                    </div>
                    <div className="text-left flex-1">
                        <Badge
                            badgeContent={unreadCounts[friend._id] || 0}
                            color="primary"
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            sx={{
                                '& .MuiBadge-badge': {
                                    right: -14,
                                    bottom: 13,
                                    border: `2px solid ${mode === 'dark' ? '#192734' : 'white'}`,
                                    padding: '0 4px',
                                    backgroundColor: mode === 'dark' ? '#3b82f6' : '#2563eb',
                                }
                            }}
                        >
                            <p className="font-medium">
                                {generateFriendName(friend)}
                            </p>
                        </Badge>
                        <p className="text-xs text-gray-500">
                            {friend.status === 'online' && 'Online'}
                            {friend.status === 'away' && 'Away'}
                            {friend.status === 'offline' && 'Offline'}
                        </p>
                    </div>
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFriend(friend._id);
                            if (selectedFriendId === friend._id) {
                                setSelectedFriendId(null);
                                setMessages([]);
                            }
                        }}
                        sx={{
                            color: mode === 'dark' ? '#ef4444' : '#dc2626',
                            '&:hover': {
                                bgcolor: mode === 'dark' ? '#7f1d1d' : '#fee2e2'
                            }
                        }}
                    >
                        <CancelIcon fontSize="small" />
                    </IconButton>
                </div>
            </div>
        );
    };

    const filteredFriends = friends.filter(friend =>
        generateFriendName(friend).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={2500}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme={mode === 'dark' ? 'dark' : 'light'}
            />

            <div
                ref={containerRef}
                className={` w-full h-full rounded-lg py-2 ${
                    mode === "dark"
                        ? "bg-[#192734] text-gray-200"
                        : "bg-white text-black"
                }`}
            >
                <div className="flex h-full gap-4">
                    {/* Sidebar */}
                    {!isSmallWidget && (
                        <div className="flex flex-col w-5/12 border-r px-2 pt-1">
                            <div className="flex w-full justify-between pl-2 items-center">
                                <div className="flex items-center gap-2">
                                    <h2 className="mb-2 font-semibold">Friends</h2>
                                    <Badge
                                        badgeContent={requests.length}
                                        color="primary"
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                top: 5,
                                                right: -10,
                                                backgroundColor: mode === 'dark' ? '#3b82f6' : '#2563eb',
                                                color: 'white'
                                            }
                                        }}
                                    >
                                        <span></span>
                                    </Badge>
                                </div>
                                <IconButton
                                    size="small"
                                    onClick={() => setShowAddFriendDialog(true)}
                                    onMouseDown={stopPropagation}
                                    color="primary"
                                >
                                    <AddIcon fontSize="small"/>
                                </IconButton>
                            </div>

                            {/* Friends List */}
                            <div className="overflow-y-auto flex-1 mt-3">
                                <div className="border-t mt-2 mb-6 pt-2 w-full">
                                    <div className="px-4 text-xs text-gray-500 mb-2">
                                        Friend Requests ({requests.length})
                                    </div>
                                    {requests.length !== 0 && (
                                        requests.map(request => (
                                            <FriendRequestItem
                                                key={request._id}
                                                request={request}
                                                setRequests={setRequests}
                                            />
                                        ))
                                    )}
                                </div>
                                <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    placeholder="Search friends..."
                                    value={search}
                                    className={"!mb-4"}
                                    onChange={(e) => setSearch(e.target.value)}
                                    sx={ mode == "dark" ? textFieldsStyle : {}}
                                    onMouseDown={stopPropagation}
                                />
                                {
                                    filteredFriends.map((friend: Friend) => (
                                    <FriendListItem key={friend._id} friend={friend}/>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main Content */}
                    <div
                        className={`flex flex-col w-full p-1 ${isSmallWidget ? "h-[calc(100%-25px)] pt-8" : "h-full"} relative`}>
                        {/* Top Bar */}
                        <div className="flex justify-between items-center mr-8 z-20">
                            {isSmallWidget && (
                                <>
                                    <IconButton
                                        size="small"
                                        onClick={handleMenuOpen}
                                        onMouseDown={stopPropagation}
                                        color={mode === "dark" ? "primary" : "default"}
                                        className={"transform -translate-y-6"}
                                    >
                                        <MenuIcon fontSize="small"/>
                                    </IconButton>
                                    <Menu
                                        anchorEl={menuAnchorEl}
                                        open={Boolean(menuAnchorEl)}
                                        onClose={handleMenuClose}
                                        sx={{
                                            "& .MuiPaper-root": {
                                                backgroundColor: mode === "dark" ? "#1e293b" : "white",
                                                color: mode === "dark" ? "#e5e7eb" : "black",
                                                minWidth: '280px'
                                            },
                                        }}
                                    >
                                        <MenuItem
                                            className={`!text-sm  ${mode == 'dark' ? "hover:!bg-gray-700" : "hover:!bg-gray-100"} transition-colors`}
                                            onClick={() => setShowAddFriendDialog(true)}
                                            onMouseDown={stopPropagation}
                                        >
                                            <AddIcon fontSize="small" className="mr-2"/>
                                            Add Friend
                                        </MenuItem>

                                        <div className="border-t mt-2 pt-2">
                                            <div className="px-4 text-xs text-gray-500 mb-2">
                                                Friend Requests ({requests.length})
                                            </div>
                                            {requests.length === 0 ? (
                                                <p className="text-sm px-4 py-2 text-gray-500">
                                                    No pending requests
                                                </p>
                                            ) : (
                                                requests.map(request => (
                                                    <FriendRequestItem
                                                        key={request._id}
                                                        request={request}
                                                        setRequests={setRequests}
                                                    />
                                                ))
                                            )}
                                            {friends.map((friend: Friend) => (
                                                <FriendListItem key={friend._id} friend={friend}/>
                                            ))}
                                        </div>
                                    </Menu>
                                </>
                            )}
                        </div>

                        {/* Chat Area */}
                        {selectedFriendId ? (
                            <div className="flex-1 flex flex-col h-full">
                                <div className={`relativeMes h-full no-scrollbar`}>
                                    {/* Sticky Header */}
                                    <div className={`top-0 left-0 z-10 pb-4 flex items-center gap-4 ${
                                        mode === "dark" ? "bg-[#192734]" : "bg-white"
                                    } ${isSmallWidget ? "px-4 pt-3 pl-10 !pb-0 absolute w-full z-10" : "sticky p-3 pt-0"}`}>
                                        {(() => {
                                            const currentFriend = friends.find(f => f._id === selectedFriendId);
                                            if (!currentFriend) return null;

                                            const avatarUrl = currentFriend.images?.[0]?.url
                                                ? currentFriend.images[0].url.startsWith('http')
                                                    ? currentFriend.images[0].url
                                                    : `http://localhost:8000${currentFriend.images[0].url}`
                                                : undefined;

                                            return (
                                                <Avatar
                                                    sx={{
                                                        width: isSmallWidget ? 36 : 42,
                                                        height: isSmallWidget ? 36 : 42,
                                                        bgcolor: mode === 'dark' ? '#374151' : '#e5e7eb',
                                                        color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                                                        fontSize: isSmallWidget ? '1.25rem' : '1.75rem'
                                                    }}
                                                    src={avatarUrl}
                                                >
                                                    {!avatarUrl && currentFriend.username[0].toUpperCase()}
                                                </Avatar>
                                            );
                                        })()}

                                        <div>
                                            <h2 className={`${isSmallWidget ? "text-lg" : "text-xl"} font-semibold`}>
                                                {friends.find(f => f._id === selectedFriendId)?.username}
                                            </h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {friends.find(f => f._id === selectedFriendId)?.status}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Scrollable Messages Area */}
                                    <div className="flex-1 p-4 pb-10"
                                         style={{maxHeight: isSmallWidget ? 'calc(100% - 120px)' : 'calc(100% - 160px)'}}>
                                        <motion.div
                                            className="space-y-4"
                                            initial="hidden"
                                            animate="visible"
                                            variants={{visible: {transition: {staggerChildren: 0.4}}}}
                                        >
                                            {messages.length === 0 ? (
                                                <div className="text-center text-gray-500 mt-8">
                                                    Start a conversation
                                                    with {friends.find(f => f._id === selectedFriendId)?.username}...
                                                </div>
                                            ) : (
                                                messages.map(message => (
                                                    <MessageBubble
                                                        key={message._id}
                                                        message={message}
                                                        isOwn={message.senderId === user?._id}
                                                        mode={mode}
                                                        friendUsername={friends.find(f => f._id === selectedFriendId)?.username || ''}
                                                    />
                                                ))
                                            )}
                                            <div ref={messagesEndRef}/>
                                            {selectedFriendId && typingUsers[selectedFriendId] && (
                                                <motion.div
                                                    initial={{opacity: 0, y: 5}}
                                                    animate={{opacity: 1, y: 0}}
                                                    className={`text-sm italic ${
                                                        mode === 'dark' ? 'text -gray-400' : 'text-gray-600'
                                                    } pl-4 mb-1`}
                                                >
                                                    {friends.find(f => f._id === selectedFriendId)?.username} is
                                                    typing...
                                                </motion.div>
                                            )}
                                        </motion.div>

                                    </div>

                                </div>

                                {/* Input Area with Attachments */}
                                <div className="sticky bottom-0 pt-3 flex flex-col gap-2 bg-inherit"
                                     onMouseDown={stopPropagation}>
                                    {/* Attachment preview */}
                                    {attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2 ml-11">
                                            {attachments.map((file, index) => {
                                                const extension = file.name.split('.').pop();

                                                return (
                                                    <div key={index}
                                                         className={`flex items-center gap-1  ${mode == 'dark' ? "bg-gray-700" : "bg-gray-100"} p-1 rounded`}>
                                                        <span
                                                            className="text-sm dark:text-gray-200">{getFileType(extension)}</span>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => removeAttachment(index)}
                                                            sx={{color: mode === 'dark' ? '#e5e7eb' : '#1f2937'}}
                                                        >
                                                            <Close fontSize="small"/>
                                                        </IconButton>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Input field */}
                                    <div className="flex items-center gap-2 h-auto">
                                        <IconButton
                                            onClick={handleAttachClick}
                                            onMouseDown={stopPropagation}
                                            sx={{
                                                color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                                                '&:hover': {bgcolor: mode === 'dark' ? '#374151' : '#f3f4f6'},
                                                marginX: '-8px',
                                            }}
                                        >
                                            <AttachFile fontSize="medium"/>
                                        </IconButton>

                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{display: 'none'}}
                                            onChange={handleFileSelect}
                                            multiple
                                        />

                                        <TextField
                                            fullWidth
                                            multiline
                                            minRows={1}
                                            maxRows={6}
                                            value={newMessage}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            variant="outlined"
                                            size="small"
                                            onFocus={() => handleTyping(true)}
                                            onBlur={() => handleTyping(false)}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                handleTyping(!!e.target.value);
                                            }}
                                            sx={{
                                                '& .MuiInputBase-root': {
                                                    alignItems: 'flex-start',
                                                    overflowY: 'auto',
                                                    maxHeight: '150px',
                                                    paddingY: '4px',
                                                    paddingX: '8px',
                                                },
                                                '& textarea': {
                                                    lineHeight: 1.5,
                                                    paddingTop: '2 !important',
                                                    paddingBottom: '2 !important',
                                                    resize: 'none',
                                                },
                                                ...(mode === "dark" ? textFieldsStyle && {
                                                    '& .MuiInputBase-input': {
                                                        backgroundColor: '',
                                                    },
                                                } : {})
                                            }}
                                            slotProps={{
                                                input: {
                                                    sx: {
                                                        color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                                                        '& fieldset': {
                                                            borderColor: mode === 'dark' ? '#374151' : '#e5e7eb'
                                                        },
                                                        '&:hover fieldset': {
                                                            borderColor: mode === 'dark' ? '#d1d5db' : '#e5e7eb',
                                                        },
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word',
                                                    }
                                                }
                                            }}
                                        />

                                        <IconButton
                                            color="primary"
                                            onClick={handleSendMessage}
                                            onMouseDown={stopPropagation}
                                            disabled={!newMessage.trim() && attachments.length === 0 && !isSending}
                                            sx={{
                                                bgcolor: mode === 'dark' ? '#1e3a8a' : '#3b82f6',
                                                '&:hover': {
                                                    bgcolor: mode === 'dark' ? '#1e40af' : '#2563eb'
                                                },
                                                '&:disabled': {
                                                    bgcolor: mode === 'dark' ? '#374151' : '#e5e7eb'
                                                }
                                            }}
                                        >
                                            {isSending ? (
                                                <CircularProgress size={24} color="info"/>
                                            ) : (
                                                <Send sx={{color: 'white'}}/>
                                            )}
                                        </IconButton>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                                <div className="text-gray-500 text-lg mb-4">
                                    Select a friend to start chatting
                                </div>
                                <Avatar
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        bgcolor: mode === 'dark' ? '#374151' : '#e5e7eb',
                                        color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                                        fontSize: '2rem'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Friend Dialog */}
            <Dialog
                open={showAddFriendDialog}
                onClose={() => setShowAddFriendDialog(false)}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: mode === 'dark' ? '#1e293b' : 'white',
                        color: mode === 'dark' ? '#e5e7eb' : 'black',
                        minWidth: '400px'
                    },
                }}
            >
                <div className="p-4">
                    <TextField
                        fullWidth
                        label="Search users"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant="outlined"
                        size="small"
                        onMouseDown={stopPropagation}
                        slotProps={{
                            input: {
                                sx: {
                                    color: mode === 'dark' ? '#e5e7eb' : '#1f2937',
                                    '& fieldset': {
                                        borderColor: mode === 'dark' ? '#374151' : '#e5e7eb'
                                    }
                                }
                            }
                        }}
                        sx={mode === "dark" ? textFieldsStyle : {}}
                    />

                    {isLoading ? (
                        <div className="flex justify-center p-6">
                            <CircularProgress size={32}/>
                        </div>
                    ) : (
                        <div className="mt-4 max-h-96 overflow-y-auto">
                            {searchResults.map((user: SearchResultUser) => (
                                <SearchResultItem key={user._id} user={user} mode={mode}
                                                  setSearchResults={setSearchResults}/>
                            ))}
                        </div>
                    )}
                </div>
            </Dialog>

            <CustomSnackbar
                open={snackbarOpen}
                message={snackbarMessage}
                severity={snackbarSeverity}
                onClose={handleSnackbarClose}
                direction="right"
            />

            <div className={"z-20"}><RemoveWidgetButton onRemove={onRemove} darkMode={mode === "dark"}/></div>
        </>
    );
}