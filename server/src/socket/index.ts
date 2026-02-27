import { WebSocket, WebSocketServer } from 'ws';
import authService from '../services/auth.service';
import userService from '../services/user.service';
import chatService from '../services/chat.service';
import { MessageType } from '../models/Message';

interface ExtendedWebSocket extends WebSocket {
    userId?: string;
    isAlive?: boolean;
}

const clients: Map<string, ExtendedWebSocket> = new Map();

const broadcastPresence = (wss: WebSocketServer, userId: string, isOnline: boolean) => {
    const presenceUpdate = JSON.stringify({
        type: 'presence_update',
        payload: { userId, isOnline, lastSeen: new Date() }
    });

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(presenceUpdate);
        }
    });
};

const handleAuth = async (ws: ExtendedWebSocket, wss: WebSocketServer, token: string) => {
    const decoded = authService.verifyToken(token);
    if (!decoded) {
        ws.send(JSON.stringify({ type: 'error', payload: { message: 'Authentication failed' } }));
        return;
    }

    ws.userId = decoded.id;
    clients.set(decoded.id, ws);

    await userService.updatePresence(decoded.id, true);
    broadcastPresence(wss, decoded.id, true);

    ws.send(JSON.stringify({ type: 'authenticated', payload: { userId: decoded.id } }));
};

const handleSendMessage = async (senderId: string, payload: any) => {
    const { chatId, receiverId, content, type } = payload;

    const message = await chatService.sendMessage(
        chatId,
        senderId,
        receiverId,
        content,
        type || MessageType.TEXT
    );

    const recipientWs = clients.get(receiverId);
    if (recipientWs) {
        recipientWs.send(JSON.stringify({
            type: 'new_message',
            payload: message
        }));
    }

    const senderWs = clients.get(senderId);
    if (senderWs) {
        senderWs.send(JSON.stringify({
            type: 'message_sent',
            payload: message
        }));
    }
};

const handleTyping = (userId: string, payload: any) => {
    const { receiverId, isTyping, chatId } = payload;
    const recipientWs = clients.get(receiverId);

    if (recipientWs) {
        recipientWs.send(JSON.stringify({
            type: 'typing_status',
            payload: { userId, isTyping, chatId }
        }));
    }
};

const handleReadMessages = async (userId: string, payload: any) => {
    const { chatId, senderId } = payload;

    await chatService.markMessagesAsRead(chatId, userId);

    const senderWs = clients.get(senderId);
    if (senderWs) {
        senderWs.send(JSON.stringify({
            type: 'messages_read',
            payload: { chatId, readerId: userId }
        }));
    }
};

const handleIncomingMessage = async (ws: ExtendedWebSocket, wss: WebSocketServer, data: any) => {
    try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        switch (type) {
            case 'auth':
                await handleAuth(ws, wss, payload.token);
                break;

            case 'send_message':
                if (ws.userId) {
                    await handleSendMessage(ws.userId, payload);
                }
                break;

            case 'typing':
                if (ws.userId) {
                    handleTyping(ws.userId, payload);
                }
                break;

            case 'read_messages':
                if (ws.userId) {
                    await handleReadMessages(ws.userId, payload);
                }
                break;

            default:
                console.log('Unknown message type:', type);
        }
    } catch (error) {
        console.error('Error handling websocket message:', error);
    }
};

export const initSocket = (wss: WebSocketServer) => {
    wss.on('connection', (ws: ExtendedWebSocket) => {
        console.log('New WebSocket connection');
        ws.isAlive = true;

        ws.on('pong', () => {
            ws.isAlive = true;
        });

        ws.on('message', (data) => handleIncomingMessage(ws, wss, data));

        ws.on('close', async () => {
            if (ws.userId) {
                clients.delete(ws.userId);
                await userService.updatePresence(ws.userId, false);
                broadcastPresence(wss, ws.userId, false);
            }
            console.log('WebSocket connection closed');
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    const interval = setInterval(() => {
        wss.clients.forEach((ws: any) => {
            if (ws.isAlive === false) return ws.terminate();
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    wss.on('close', () => {
        clearInterval(interval);
    });
};
