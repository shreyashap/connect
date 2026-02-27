import Chat, { IChat } from '../models/Chat';
import mongoose from 'mongoose';

class ChatRepository {
    async findOrCreateChat(participant1: string, participant2: string): Promise<IChat> {
        const participants = [participant1, participant2].sort();

        let chat = await Chat.findOne({
            participants: { $all: participants }
        });

        if (!chat) {
            chat = new Chat({
                participants
            });
            await chat.save();
        }

        return chat;
    }

    async getUserChats(userId: string): Promise<IChat[]> {
        return await Chat.find({
            participants: userId
        })
            .populate('participants', 'username displayName avatar isOnline lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });
    }

    async updateLastMessage(chatId: string, messageId: string): Promise<void> {
        await Chat.findByIdAndUpdate(chatId, {
            lastMessage: new mongoose.Types.ObjectId(messageId)
        });
    }

    async findById(chatId: string): Promise<IChat | null> {
        return await Chat.findById(chatId).populate('participants', 'username displayName avatar');
    }
}

export default new ChatRepository();
