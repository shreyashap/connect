import { Request, Response } from 'express';
import chatService from '../services/chat.service';

class ChatController {
    async getOrCreateChat(req: Request, res: Response) {
        try {
            const { participantId } = req.body;
            if (!participantId) {
                return res.status(400).json({ message: 'Participant ID is required' });
            }

            const chat = await chatService.getOrCreateChat(req.user._id.toString(), participantId);
            return res.status(200).json(chat);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getUserChats(req: Request, res: Response) {
        try {
            const chats = await chatService.getUserChats(req.user._id.toString());
            return res.status(200).json(chats);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async getChatMessages(req: Request, res: Response) {
        try {
            const { chatId } = req.params;
            const { limit, before } = req.query;

            const messages = await chatService.getChatMessages(
                chatId as string,
                limit ? parseInt(limit as string) : 50,
                before ? (before as string) : undefined
            );
            return res.status(200).json(messages);
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }

    async markAsRead(req: Request, res: Response) {
        try {
            const { chatId } = req.params;
            await chatService.markMessagesAsRead(chatId as string, req.user._id.toString());
            return res.status(200).json({ message: 'Messages marked as read' });
        } catch (error: any) {
            return res.status(500).json({ message: error.message });
        }
    }
}

export default new ChatController();
