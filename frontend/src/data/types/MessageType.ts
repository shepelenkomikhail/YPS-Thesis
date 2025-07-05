export default interface Message {
    _id: string;
    senderId: string;
    receiverId: string;
    content: string;
    attachments: string[];
    timestamp: Date;
    status: 'sent' | 'read';
}