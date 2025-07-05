import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import {saveMessageToDatabase} from "./saveMessage";
import {markMessagesAsReadInDatabase} from "./setRead";
import {MessageModel} from "../models/MessageModel";
import {UserStatus} from "../models/UserStatus";
import UserModel from "../models/UserModel";
import mongoose from "mongoose";

const userSockets = new Map<string, Set<string>>();
export const userStatuses = new Map<string, UserStatus>();


export const initializeSocket = (server: HttpServer): Server => {
    const io = new Server(server, {
        cors: {
            origin: 'http://localhost:5173',
            allowedHeaders: ['Content-Type', 'Authorization'],
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true,
        },
        allowRequest: (req, callback) => {
            callback(null, true);
        },
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        const userId = socket.handshake.auth.userId;
        if (!userId) {
            console.error('No userId provided, disconnecting socket');
            socket.disconnect();
            return;
        }

        if (!userStatuses.has(userId)) {
            userStatuses.set(userId, {
                userId,
                status: 'online',
                lastSeen: new Date()
            });
        }

        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId)!.add(socket.id);
        updateAndNotifyStatus(userId, 'online').then();

        socket.join(userId);
        console.log(`User ${userId} joined their room`);

        socket.on('join_user_room', (userId) => {
            socket.join(userId);
        });

        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected`);
            const sockets = userSockets.get(userId);
            if (sockets) {
                sockets.delete(socket.id);

                if (sockets.size === 0) {
                    UserModel.findByIdAndUpdate(userId, {
                        status: 'offline',
                    });

                    userStatuses.delete(userId);
                    updateAndNotifyStatus(userId, 'offline').then();
                }
            }
        });

        socket.on('update_status', (newStatus: 'online' | 'away') => {
            const currentStatus = userStatuses.get(userId);
            if (currentStatus) {
                currentStatus.status = newStatus;
                currentStatus.lastSeen = new Date();
                updateAndNotifyStatus(userId, newStatus).then();
            }
        });

        socket.on('join_chat', ({ userId, friendId }) => {
            const roomId = [userId, friendId].sort().join('_');
            socket.join(roomId);
            console.log(`User ${userId} joined chat room ${roomId}`);
        });

        socket.on('leave_chat', ({ userId, friendId }) => {
            const roomId = [userId, friendId].sort().join('_');
            socket.leave(roomId);
        });

        socket.on('join_personal_room', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined personal notifications room`);
        });

        socket.on('typing_indicator', ({ senderId, receiverId, isTyping }) => {
            const roomId = [senderId, receiverId].sort().join('_');
            io.to(roomId).emit('typing_update', { senderId, isTyping });
        });

        socket.on('send_message', async (message, callback) => {
            try {
                const savedMessage = await saveMessageToDatabase({
                    ...message,
                    attachments: message.attachments || []
                });
                const roomId = [message.senderId, message.receiverId].sort().join('_');

                console.log(savedMessage);

                io.to(roomId).emit('receive_message', savedMessage);
                io.to(message.receiverId).emit('private_message', savedMessage);

                callback({ message: message });
            } catch (error) {
                console.error('Error handling message:', error);
            }
        });

        socket.on('mark_as_read', async (messageIds: string[], callback = () => {}) => {
            try {
                await markMessagesAsReadInDatabase(messageIds);

                const messages = await MessageModel.find({ _id: { $in: messageIds } });

                messages.forEach(message => {
                    const participants = [message.senderId, message.receiverId].sort();
                    const roomId = participants.join('_');
                    io.to(roomId).emit('message_read', message._id);
                });

                callback({ success: true });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
    });

    // Update user status and notify friends
    async function updateAndNotifyStatus(userId: string, status: 'online' | 'away' | 'offline') {
        try {
            const user = await UserModel.findByIdAndUpdate(
                userId, {status: status,}, { new: true }
            ).select('friends _id status');

            if (!user) return;

            const userIdStr = (user as unknown as { _id: mongoose.Types.ObjectId })._id.toString();

            const newStatus = {
                userId: userIdStr,
                status: user.status,
            };

            userStatuses.set(userIdStr, newStatus);

            user.friends.forEach(friendId => {
                io.to(friendId.toString()).emit('friend_status', newStatus);
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }
    return io;
};


