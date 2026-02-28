import chatRepository from '../repository/chat.repository';
import messageRepository from '../repository/message.repository';
import { IChat } from '../models/Chat';
import { IMessage, MessageType } from '../models/Message';

class ChatService {
    async getOrCreateChat(participant1: string, participant2: string): Promise<IChat> {
        return await chatRepository.findOrCreateChat(participant1, participant2);
    }

    async getUserChats(userId: string): Promise<any[]> {
        const chats = await chatRepository.getUserChats(userId);
        const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
            const unreadCount = await messageRepository.countUnreadMessages(chat._id.toString(), userId);
            return {
                ...chat.toObject(),
                unreadCount
            };
        }));
        return chatsWithUnread;
    }

    async sendMessage(chatId: string, senderId: string, receiverId: string, content: string, type: MessageType = MessageType.TEXT): Promise<IMessage> {
        const message = await messageRepository.createMessage({
            chatId: chatId as any,
            senderId: senderId as any,
            receiverId: receiverId as any,
            content,
            type
        });

        await chatRepository.updateLastMessage(chatId, (message._id as any).toString());
        return message;
    }

    async getChatMessages(chatId: string, limit: number = 50, before?: string): Promise<IMessage[]> {
        return await messageRepository.getMessagesByChatId(chatId, limit, before);
    }

    async markMessagesAsRead(chatId: string, userId: string): Promise<void> {
        await messageRepository.markAllAsRead(chatId, userId);
    }
}

export default new ChatService();
