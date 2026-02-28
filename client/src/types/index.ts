export interface User {
    _id: string;
    username: string;
    email: string;
    displayName: string;
    about: string;
    avatar: string;
    isOnline: boolean;
    lastSeen: string;
    id?: string;
}

export interface Chat {
    _id: string;
    participants: User[];
    lastMessage?: Message;
    unreadCount?: number;
    updatedAt: string;
    id?: string;
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    FILE = 'file',
}

export interface Message {
    _id: string;
    chatId: string;
    senderId: string | User;
    receiverId: string;
    content: string;
    type: MessageType;
    isRead: boolean;
    readAt?: string;
    createdAt: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}
