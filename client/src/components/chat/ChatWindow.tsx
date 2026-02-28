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
    const { sendMessage, subscribe } = useSocket();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [participants, setParticipants] = useState(chat.participants);
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const topRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const otherUser = participants.find((p) => (p._id || (p as any).id) !== (user?._id || user?.id));

    useEffect(() => {
        setMessages([]);
        setHasMore(true);
        setParticipants(chat.participants);
        fetchMessages(true);
        setOtherUserTyping(false);
    }, [chat._id]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
                    loadMoreMessages();
                }
            },
            { threshold: 0.1 }
        );

        if (topRef.current) observer.observe(topRef.current);
        return () => observer.disconnect();
    }, [hasMore, isLoading, isFetchingMore, messages]);

    useEffect(() => {
        const unsubscribe = subscribe(handleSocketMessage);
        return () => unsubscribe();
    }, [chat._id, otherUser?._id]); // Re-subscribe when chat or otherUser changes

    useEffect(() => {
        scrollToBottom();
    }, [messages, otherUserTyping]);

    const fetchMessages = async (isInitial = true) => {
        try {
            if (isInitial) setIsLoading(true);
            else setIsFetchingMore(true);

            const res = await api.get(`/chat/${chat._id}/messages`, {
                params: { limit: 30 }
            });

            const fetchedMessages = res.data.reverse(); // Standardize to [oldest, ..., newest]
            setMessages(fetchedMessages);
            if (fetchedMessages.length < 30) setHasMore(false);

            // Mark as read when opening
            const partnerId = otherUser?._id || (otherUser as any)?.id;
            if (partnerId) {
                sendMessage('read_messages', { chatId: chat._id, senderId: partnerId });
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
            if (isInitial) setTimeout(scrollToBottom, 100);
        }
    };

    const loadMoreMessages = async () => {
        if (!hasMore || isFetchingMore || messages.length === 0) return;

        try {
            setIsFetchingMore(true);
            const oldestMessageId = messages[0]._id;
            const res = await api.get(`/chat/${chat._id}/messages`, {
                params: { limit: 30, before: oldestMessageId }
            });

            const moreMessages = res.data.reverse();
            if (moreMessages.length < 30) setHasMore(false);

            setMessages((prev) => [...moreMessages, ...prev]);
        } catch (error) {
            console.error('Failed to fetch more messages', error);
        } finally {
            setIsFetchingMore(false);
        }
    };

    const handleSocketMessage = (msg: any) => {
        if (msg.type === 'new_message' && String(msg.payload.chatId) === String(chat._id)) {
            setMessages((prev) => [...prev, msg.payload]);
            // Mark received message as read
            const partnerId = otherUser?._id || (otherUser as any)?.id;
            sendMessage('read_messages', { chatId: chat._id, senderId: partnerId });
            setTimeout(scrollToBottom, 50);
        } else if (msg.type === 'message_sent' && msg.payload.chatId === chat._id) {
            setMessages((prev) => {
                // Avoid double messages if we ever add optimistic updates
                if (prev.some(m => m._id === msg.payload._id)) return prev;
                return [...prev, msg.payload];
            });
            setTimeout(scrollToBottom, 50);
        } else if (msg.type === 'typing_status' && String(msg.payload.chatId) === String(chat._id)) {
            const partnerId = otherUser?._id || otherUser?.id;
            if (String(msg.payload.userId) === String(partnerId)) {
                setOtherUserTyping(msg.payload.isTyping);
            }
        } else if (msg.type === 'messages_read' && String(msg.payload.chatId) === String(chat._id)) {
            const myId = user?._id || user?.id;
            setMessages((prev) =>
                prev.map(m => {
                    const senderId = typeof m.senderId === 'string'
                        ? m.senderId
                        : (m.senderId as any)._id || (m.senderId as any).id;
                    return String(senderId) === String(myId) ? { ...m, isRead: true } : m;
                })
            );
        } else if (msg.type === 'presence_update') {
            const { userId, isOnline, lastSeen } = msg.payload;
            setParticipants(prev => prev.map(p =>
                String(p._id) === String(userId) ? { ...p, isOnline, lastSeen } : p
            ));
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText;
        setInputText('');

        handleStopTyping();

        try {
            const partnerId = otherUser?._id || otherUser?.id;
            sendMessage('send_message', {
                chatId: chat._id,
                receiverId: partnerId,
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
            const partnerId = otherUser?._id || otherUser?.id;
            sendMessage('typing', { chatId: chat._id, receiverId: partnerId, isTyping: true });
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(handleStopTyping, 2000);
    };

    const handleStopTyping = () => {
        setIsTyping(false);
        const partnerId = otherUser?._id || otherUser?.id;
        sendMessage('typing', { chatId: chat._id, receiverId: partnerId, isTyping: false });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const scrollToBottom = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="flex h-full w-full flex-col bg-zinc-950">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-zinc-900/60 px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent transition-all group-hover:ring-zinc-700">
                            <AvatarImage src={otherUser?.avatar} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-100 font-medium">
                                {otherUser?.displayName?.[0] || '?'}
                            </AvatarFallback>
                        </Avatar>
                        {otherUser?.isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight text-zinc-100">{otherUser?.displayName}</span>
                        <span className="text-xs font-medium text-zinc-500">
                            {otherUserTyping ? (
                                <span className="text-emerald-500 animate-pulse">typing...</span>
                            ) : otherUser?.isOnline ? (
                                <span className="text-emerald-500/80">Online</span>
                            ) : (
                                'Last seen ' + (otherUser?.lastSeen ? format(new Date(otherUser.lastSeen), 'p') : 'recently')
                            )}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors">
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
                        <div ref={topRef} className="h-1 w-full" />
                        {isFetchingMore && (
                            <div className="flex justify-center py-2">
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                            </div>
                        )}
                        {messages.map((msg, index) => {
                            const senderId = typeof msg.senderId === 'string'
                                ? msg.senderId
                                : (msg.senderId as any)._id || (msg.senderId as any).id;

                            const myId = user?._id || user?.id;
                            const isMine = senderId === myId;

                            return (
                                <div
                                    key={msg._id || index}
                                    className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMine ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`group relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm transition-all ${isMine
                                            ? 'bg-zinc-100 text-zinc-900 rounded-tr-none hover:bg-white'
                                            : 'bg-zinc-800/80 text-zinc-100 rounded-tl-none border border-white/5 backdrop-blur-sm hover:bg-zinc-800'
                                            }`}
                                    >
                                        <p className="text-[14.5px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                                        <div className="mt-1 flex items-center justify-end space-x-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                            <span className={`text-[10px] font-medium ${isMine ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                {format(new Date(msg.createdAt), 'HH:mm')}
                                            </span>
                                            {isMine && (
                                                <span className={`text-[10px] ${msg.isRead ? 'text-sky-500' : 'text-zinc-400'}`}>
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

            <div className="border-t border-white/5 bg-zinc-900/40 p-4 backdrop-blur-xl">
                <form onSubmit={handleSend} className="mx-auto flex max-w-4xl items-center space-x-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 shrink-0 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                    >
                        <Smile className="h-5 w-5" />
                    </Button>
                    <div className="relative flex-1">
                        <Input
                            placeholder="Type a message..."
                            className="h-11 border-white/10 bg-zinc-950/50 px-4 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:ring-offset-0"
                            value={inputText}
                            onChange={handleTyping}
                        />
                    </div>
                    <Button
                        type="submit"
                        size="icon"
                        className={`h-11 w-11 shrink-0 rounded-full shadow-lg transition-all duration-300 ${inputText.trim()
                                ? 'bg-zinc-100 text-zinc-900 hover:bg-white hover:scale-105 active:scale-95'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                        disabled={!inputText.trim()}
                    >
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
};
