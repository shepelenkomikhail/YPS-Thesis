import {MessageModel} from "../models/MessageModel";

export const saveMessageToDatabase =  async (message: any) => {
    console.log("Saving message to database with content:", message.content);
    const newMessage = new MessageModel({
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        attachments: message?.attachments,
        status: 'sent'
    });

    await newMessage.save();
    return newMessage;
}