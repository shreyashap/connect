'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { Chat, Message, MessageType } from '@/types';
import api from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MoreVertical, Phone, Video, Paperclip, Smile, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ChatWindowProps {
    chat: Chat;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
    const { user } = useAuth();
    const { sendMessage, lastMessage } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const otherUser = chat.participants.find((p) => p._id !== user?._id);

    useEffect(() => {
        fetchMessages();
        setOtherUserTyping(false);
    }, [chat._id]);

    useEffect(() => {
        if (lastMessage) {
            handleSocketMessage(lastMessage);
        }
    }, [lastMessage]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, otherUserTyping]);

    const fetchMessages = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(`/chat/${chat._id}/messages`);
            setMessages(res.data);
            // Mark as read when opening
            if (otherUser) {
                sendMessage('read_messages', { chatId: chat._id, senderId: otherUser._id });
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocketMessage = (msg: any) => {
        if (msg.type === 'new_message' && msg.payload.chatId === chat._id) {
            setMessages((prev) => [...prev, msg.payload]);
            // Mark received message as read
            sendMessage('read_messages', { chatId: chat._id, senderId: otherUser?._id });
        } else if (msg.type === 'typing_status' && msg.payload.chatId === chat._id) {
            if (msg.payload.userId === otherUser?._id) {
                setOtherUserTyping(msg.payload.isTyping);
            }
        } else if (msg.type === 'messages_read' && msg.payload.chatId === chat._id) {
            setMessages((prev) =>
                prev.map(m => m.senderId === user?._id ? { ...m, isRead: true } : m)
            );
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');

        handleStopTyping();

        try {
            sendMessage('send_message', {
                chatId: chat._id,
                receiverId: otherUser?._id,
                content: text,
                type: MessageType.TEXT
            });

        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);

        if (!isTyping) {
            setIsTyping(true);
            sendMessage('typing', { chatId: chat._id, receiverId: otherUser?._id, isTyping: true });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
    };

    const handleStopTyping = () => {
        setIsTyping(false);
        sendMessage('typing', { chatId: chat._id, receiverId: otherUser?._id, isTyping: false });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage src={otherUser?.avatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-100">
                            {otherUser?.displayName?.[0] || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-100">{otherUser?.displayName}</span>
                        <span className="text-xs text-zinc-400">
                            {otherUserTyping ? (
                                <span className="text-green-500 animate-pulse">typing...</span>
                            ) : otherUser?.isOnline ? (
                                'Online'
                            ) : (
                                'Last seen ' + (otherUser?.lastSeen ? format(new Date(otherUser.lastSeen), 'p') : 'recently')
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
                        <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
                        <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:text-zinc-100">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                ) : (
                    <div className="flex flex-col space-y-4">
                        {messages.map((msg, index) => {
                            const isMine = typeof msg.senderId === 'string'
                                ? msg.senderId === user?._id
                                : (msg.senderId as any)._id === user?._id;

                            return (
                                <div
                                    key={msg._id || index}
                                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMine
                                            ? 'bg-zinc-100 text-zinc-900 rounded-tr-none'
                                            : 'bg-zinc-800 text-zinc-100 rounded-tl-none'
                                            }`}
                                    >
                                        <p className="text-sm">{msg.content}</p>
                                        <div className="mt-1 flex items-center justify-end space-x-1">
                                            <span className={`text-[10px] ${isMine ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </span>
                                            {isMine && (
                                                <span className={`text-[10px] ${msg.isRead ? 'text-blue-500' : 'text-zinc-500'}`}>
                                                    {msg.isRead ? '✓✓' : '✓'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={scrollRef} />
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-zinc-800 bg-zinc-900 p-4">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-zinc-100">
                        <Smile className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-zinc-400 hover:text-zinc-100">
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <div className="relative flex-1">
                        <Input
                            placeholder="Type a message..."
                            className="h-10 border-zinc-800 bg-zinc-950 pr-4 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                            value={inputText}
                            onChange={handleTyping}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className="h-10 w-10 bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                        disabled={!inputText.trim()}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
