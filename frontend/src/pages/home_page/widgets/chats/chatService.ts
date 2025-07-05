import Message from "../../../../data/types/MessageType.ts";

export const chatService = {
    sendMessage: async ( socket: any, senderId: string, receiverId: string, content: string, attachments: string[]): Promise<Message> => {
        if (!socket) throw new Error('Socket not connected');

        return new Promise((resolve, reject) => {
            socket.emit('send_message', {
                senderId,
                receiverId,
                content,
                timestamp: new Date().toISOString(),
                status: 'sent',
                attachments
            }, (response: { error?: string; message?: Message }) => {
                response.error ? reject(response.error) : resolve(response.message!);
            });
        });
    },

    getConversation: async (userId: string, friendId: string): Promise<Message[]> => {
        const response = await fetch(`http://localhost:8000/chat/conversation/${userId}/${friendId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }

        return response.json();
    },

    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://localhost:8000/chat/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('File upload failed');
        }

        const data = await response.json();
        return data.fileUrl;
    }
};