import {MessageModel} from "../models/MessageModel";

export const markMessagesAsReadInDatabase =  async (messageIds: string[]) => {
    const messages = await MessageModel.find({ _id: { $in: messageIds } });

    const updatedMessages = messages.map(message => {
        if (message.status !== 'read') {
            message.status = 'read';
            return message.save();
        }
    });

    await Promise.all(updatedMessages);
}