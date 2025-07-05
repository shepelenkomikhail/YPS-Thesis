import { Request, Response, Router, RequestHandler } from 'express';
import UserModel from '../models/UserModel';
import FriendRequest from '../models/FriendRequestModel';
import { verifyToken } from '../middleware/authMiddleware';
import {userStatuses} from "../services/socket";

const router: Router = Router();

// Get friends
router.get('/', verifyToken, (async (req: Request, res: Response, next) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const user = await UserModel.findById(userId).populate({
            path: 'friends', select: 'username firstName lastName images status',
            populate: {path: 'images', select: 'url', model: 'Image', options: {limit: 1, sort: { createdAt: -1 }}}
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        //console.log("Frieds", user.friends);
        res.json(Array.isArray(user.friends) ? user.friends : []);
    } catch (error) {
        next(error);
    }
}) as RequestHandler);

// Search users by username
router.get('/search', verifyToken, (async (req: Request, res: Response) => {
    try {
        const { username } = req.query;
        // @ts-ignore
        const currentUserId = req.user.id;

        if (!username) return res.status(400).json({ message: 'Username is required' });

        const users = await UserModel.find({
            username: { $regex: username as string, $options: 'i' },
            _id: { $ne: currentUserId },
        })
            .select('-password')
            .populate({
                path: 'images',
                select: 'url',
                options: { limit: 1, sort: { createdAt: -1 } }
            });

        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

// Send friend request
router.post('/requests', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const senderId = req.user.id;
        const { receiverId } = req.body;
        // console.log("SenderID", senderId);
        // console.log("ReceiverID", receiverId);
        // console.log("Request Body", req.body);

        if (senderId === receiverId) return res.status(400).json({ message: 'Cannot send request to yourself' });

        const receiver = await UserModel.findById(receiverId);
        if (!receiver) {
            console.error('User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
            status: { $in: ['pending', 'accepted'] },
        });

        if (existingRequest) return res.status(400).json({ message: 'Request already exists' });

        const newRequest = new FriendRequest({
            sender: senderId,
            receiver: receiverId,
            status: 'pending',
        });

        await newRequest.save();

        const io = req.app.get('io');
        io.to(receiverId).emit('new_friend_request', {
            request: newRequest,
            sender: await UserModel.findById(senderId).select('username firstName lastName'),
        });

        res.status(201).json(newRequest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

// Get pending requests
router.get('/requests', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        console.log("UserId", userId);

        const requests = await FriendRequest.find({
            receiver: userId,
            status: 'pending',
        }).populate({
            path: 'sender',
            select: 'username firstName lastName images',
            populate: {
                path: 'images',
                select: 'url',
                model: 'Image',
                options: { limit: 1, sort: { createdAt: -1 } }
            }
        }).lean();


        res.json(requests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

// Accept/reject request
router.put('/requests/:requestId', verifyToken, (async (req: Request, res: Response) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        // @ts-ignore
        const userId = req.user.id;

        if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

        const request = await FriendRequest.findById(requestId)
            .populate('sender', 'username firstName lastName images status')
            .populate('receiver', 'username firstName lastName images status');
            
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.receiver._id.toString() !== userId) return res.status(403).json({ message: 'Unauthorized' });
        if (request.status !== 'pending') return res.status(400).json({ message: 'Request already processed' });

        request.status = status;
        await request.save();

        if (status === 'accepted') {
            await UserModel.findByIdAndUpdate(request.sender._id, { $addToSet: { friends: request.receiver._id } });
            await UserModel.findByIdAndUpdate(request.receiver._id, { $addToSet: { friends: request.sender._id } });
            const senderUser = await UserModel.findById(request.sender._id)
                .select('username firstName lastName images status')
                .populate({
                    path: 'images',
                    select: 'url',
                    model: 'Image',
                    options: { limit: 1, sort: { createdAt: -1 } }
                });

            const receiverUser = await UserModel.findById(request.receiver._id)
                .select('username firstName lastName images status')
                .populate({
                    path: 'images',
                    select: 'url',
                    model: 'Image',
                    options: { limit: 1, sort: { createdAt: -1 } }
                });

            const io = req.app.get('io');
            
            io.to(request.sender._id.toString()).emit('friend_request_updated', {
                request: {
                    ...request.toObject(),
                    sender: senderUser,
                    receiver: receiverUser
                },
                sender: receiverUser, 
                receiver: senderUser  
            });

            io.to(request.receiver._id.toString()).emit('friend_request_updated', {
                request: {
                    ...request.toObject(),
                    sender: senderUser,
                    receiver: receiverUser
                },
                sender: senderUser,   
                receiver: receiverUser  
            });
        } else {
            const io = req.app.get('io');
            io.to(request.sender._id.toString()).emit('friend_request_updated', {
                request,
                sender: request.sender,
                receiver: request.receiver
            });
        }

        res.json(request);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

// Get friend statuses
router.get('/statuses', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const user = await UserModel.findById(userId).select('friends');

        if (!user) return res.status(404).json({ message: 'User not found' });

        const statuses = await Promise.all(
            user.friends.map(async (friendId) => {
                const friendIdStr = friendId.toString();
                const storedStatus = userStatuses.get(friendIdStr);

                if (storedStatus) return storedStatus;

                const friend = await UserModel.findById(friendId)
                    .select('status lastSeen')
                    .lean();

                return {
                    userId: friendIdStr,
                    status: friend?.status || 'offline',
                };
            })
        );

        res.json(statuses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

// Remove friend
router.delete('/:friendId', verifyToken, (async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const userId = req.user.id;
        const { friendId } = req.params;

        await UserModel.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
        await UserModel.findByIdAndUpdate(friendId, { $pull: { friends: userId } });

        await FriendRequest.deleteMany({
            $or: [
                { sender: userId, receiver: friendId },
                { sender: friendId, receiver: userId }
            ]
        });

        const io = req.app.get('io');
        io.to(friendId).emit('friend_removed', { userId });
        io.to(userId).emit('friend_removed', { userId: friendId });

        res.json({ message: 'Friend removed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}) as RequestHandler);

export default router;