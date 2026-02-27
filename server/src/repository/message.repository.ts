import Message, { IMessage } from '../models/Message';
import mongoose from 'mongoose';

class MessageRepository {
    async createMessage(messageData: Partial<IMessage>): Promise<IMessage> {
        const message = new Message(messageData);
        return await message.save();
    }

    async getMessagesByChatId(
        chatId: string,
        limit: number = 50,
        before?: string
    ): Promise<IMessage[]> {
        const query: any = { chatId: new mongoose.Types.ObjectId(chatId) };
        if (before) {
            query._id = { $lt: new mongoose.Types.ObjectId(before) };
        }

        return await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('senderId', 'username displayName avatar');
    }

    async markAsRead(messageId: string): Promise<void> {
        await Message.findByIdAndUpdate(messageId, {
            isRead: true,
            readAt: new Date(),
        });
    }

    async markAllAsRead(chatId: string, receiverId: string): Promise<void> {
        await Message.updateMany(
            { chatId: new mongoose.Types.ObjectId(chatId), receiverId: new mongoose.Types.ObjectId(receiverId), isRead: false },
            { isRead: true, readAt: new Date() }
        );
    }
}

export default new MessageRepository();
