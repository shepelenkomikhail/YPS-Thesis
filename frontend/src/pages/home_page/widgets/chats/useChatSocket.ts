import { useEffect, useRef } from 'react';
import Message from "../../../../data/types/MessageType.ts";

export const useChatSocket = (
    socket: any,
    userId: string | undefined,
    friendId: string | null,
    onMessageReceived: (message: Message) => void
) => {
    const callbackRef = useRef(onMessageReceived);
    const handlerRef = useRef<((message: Message) => void) | null>(null);

    callbackRef.current = onMessageReceived;

    useEffect(() => {
        if (!socket || !userId || !friendId) return;

        const currentSocket = socket;

        handlerRef.current = (message: Message) => {
            if (message.senderId === friendId || message.senderId === userId) {
                callbackRef.current(message);
                console.log('Message received:', message);
            }
        };

        currentSocket.on('receive_message', handlerRef.current);
        currentSocket.emit('join_chat', { userId, friendId });

        return () => {
            if (handlerRef.current) {
                currentSocket.off('receive_message', handlerRef.current);
            }
            currentSocket.emit('leave_chat', { userId, friendId });
        };
    }, [socket, userId, friendId]);
};