'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { User, Chat } from '@/types';
import api from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, LogOut, Settings, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileDialog } from './ProfileDialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SidebarProps {
    onSelectChat: (chat: Chat) => void;
    selectedChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
    const { user, logout } = useAuth();
    const { subscribe } = useSocket();
    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    useEffect(() => {
        fetchChats();
    }, []);

    useEffect(() => {
        const unsubscribe = subscribe((msg) => {
            if (msg.type === 'new_message') {
                setChats(prev => {
                    const chatIndex = prev.findIndex(c => String(c._id) === String(msg.payload.chatId));
                    if (chatIndex === -1) return prev;

                    const isChatOpen = String(msg.payload.chatId) === String(selectedChatId);
                    const updatedChat = {
                        ...prev[chatIndex],
                        lastMessage: msg.payload,
                        unreadCount: isChatOpen ? 0 : (prev[chatIndex].unreadCount || 0) + 1
                    };

                    const otherChats = prev.filter(c => String(c._id) !== String(msg.payload.chatId));
                    return [updatedChat, ...otherChats];
                });
            } else if (msg.type === 'message_sent') {
                setChats(prev => {
                    const chatIndex = prev.findIndex(c => String(c._id) === String(msg.payload.chatId));
                    if (chatIndex === -1) return prev;

                    const updatedChat = {
                        ...prev[chatIndex],
                        lastMessage: msg.payload
                    };

                    const otherChats = prev.filter(c => String(c._id) !== String(msg.payload.chatId));
                    return [updatedChat, ...otherChats];
                });
            } else if (msg.type === 'messages_read') {
                setChats(prev => prev.map(chat =>
                    String(chat._id) === String(msg.payload.chatId)
                        ? { ...chat, unreadCount: 0 }
                        : chat
                ));
            } else if (msg.type === 'presence_update') {
                const { userId, isOnline, lastSeen } = msg.payload;

                // Update chats list
                setChats(prev => prev.map(chat => ({
                    ...chat,
                    participants: chat.participants.map(p =>
                        String(p._id) === String(userId) ? { ...p, isOnline, lastSeen } : p
                    )
                })));

                // Update search results if any
                setSearchResults(prev => prev.map(u =>
                    String(u._id) === String(userId) ? { ...u, isOnline, lastSeen } : u
                ));
            }
        });
        return () => unsubscribe();
    }, [subscribe, selectedChatId, user?._id]);

    useEffect(() => {
        if (selectedChatId) {
            setChats(prev => prev.map(chat =>
                chat._id === selectedChatId ? { ...chat, unreadCount: 0 } : chat
            ));
        }
    }, [selectedChatId]);

    const fetchChats = async () => {
        try {
            const res = await api.get('/chat');
            setChats(res.data);
        } catch (error) {
            console.error('Failed to fetch chats', error);
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        try {
            setIsSearching(true);
            const res = await api.get(`/user/search?q=${query}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearching(false);
        }
    };

    const startChat = async (participantId: string) => {
        try {
            const res = await api.post('/chat', { participantId });
            const newChat = res.data;
            onSelectChat(newChat);
            setSearchQuery('');
            setSearchResults([]);
            setIsSearching(false);
            fetchChats(); // Refresh list
        } catch (error) {
            toast.error('Failed to start chat');
        }
    };

    return (
        <div className="flex h-full w-80 flex-col border-r border-white/5 bg-zinc-900/40 backdrop-blur-3xl">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-zinc-900/60 p-4 backdrop-blur-xl">
                <div className="flex items-center space-x-3">
                    <div className="relative group">
                        <Avatar className="h-10 w-10 border border-white/10 ring-2 ring-transparent transition-all hover:ring-zinc-700">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-100 font-medium">
                                {user?.displayName?.[0] || '?'}
                            </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight text-zinc-100">{user?.displayName}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Online</span>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
                        onClick={() => setIsProfileOpen(true)}
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                    <ProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-400 hover:bg-white/5 hover:text-zinc-100 transition-colors"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-zinc-300" />
                    <Input
                        placeholder="Search for friends..."
                        className="h-10 border-white/5 bg-zinc-950/50 pl-9 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:ring-offset-0"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List Area */}
            <ScrollArea className="flex-1">
                {searchQuery.length >= 2 ? (
                    <div className="px-2 py-2">
                        <p className="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                            Search Results
                        </p>
                        {searchResults.map((result) => (
                            <div
                                key={result._id}
                                className="group flex cursor-pointer items-center space-x-3 rounded-xl p-3 mx-2 my-1 transition-all hover:bg-white/5 active:scale-[0.98]"
                                onClick={() => startChat(result._id)}
                            >
                                <div className="relative">
                                    <Avatar className="h-11 w-11 border border-white/10 group-hover:border-white/20 transition-colors">
                                        <AvatarImage src={result.avatar} className="object-cover" />
                                        <AvatarFallback className="bg-zinc-800 text-sm font-bold text-zinc-400">
                                            {result.displayName[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    {result.isOnline && (
                                        <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-500"></span>
                                    )}
                                </div>
                                <span className="flex-1 text-sm font-semibold tracking-tight text-zinc-200">{result.displayName}</span>
                                <MessageSquarePlus className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                            </div>
                        ))}
                        {!isSearching && searchResults.length === 0 && (
                            <div className="px-6 py-8 text-center">
                                <p className="text-sm text-zinc-600">Soul not found. Try another name?</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="px-2 py-2">
                        <p className="mb-2 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                            Recent Stories
                        </p>
                        {chats.map((chat) => {
                            const otherUser = chat.participants.find((p) =>
                                (p._id || (p as any).id) !== (user?._id || user?.id)
                            );
                            const isActive = selectedChatId === chat._id;

                            return (
                                <div
                                    key={chat._id}
                                    className={`group flex cursor-pointer items-center space-x-3 rounded-2xl p-3 mx-2 my-1 transition-all duration-300 ${isActive
                                            ? 'bg-zinc-100 text-zinc-900 shadow-[0_10px_20px_rgba(0,0,0,0.2)] scale-[1.02]'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
                                        }`}
                                    onClick={() => onSelectChat(chat)}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className={`h-12 w-12 border transition-colors duration-300 ${isActive ? 'border-zinc-200' : 'border-white/5 group-hover:border-white/10'
                                            }`}>
                                            <AvatarImage src={otherUser?.avatar} className="object-cover" />
                                            <AvatarFallback className={`${isActive ? 'bg-zinc-200 text-zinc-600' : 'bg-zinc-800 text-zinc-500'} text-base font-bold`}>
                                                {otherUser?.displayName?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {otherUser?.isOnline && (
                                            <span className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 transition-colors duration-300 ${isActive ? 'border-zinc-100' : 'border-zinc-900'
                                                } bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]`}></span>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col overflow-hidden">
                                        <div className="flex items-center justify-between pb-0.5">
                                            <span className={`truncate text-sm font-bold tracking-tight ${isActive ? 'text-zinc-900' : 'text-zinc-200'}`}>
                                                {otherUser?.displayName}
                                            </span>
                                            {chat.unreadCount ? (
                                                <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-black shadow-sm ${isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-900'
                                                    }`}>
                                                    {chat.unreadCount}
                                                </span>
                                            ) : (
                                                <span className={`text-[10px] font-medium opacity-60`}>
                                                    {chat.lastMessage ? format(new Date(chat.updatedAt), 'HH:mm') : ''}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`truncate text-xs leading-relaxed ${isActive ? 'text-zinc-600' : 'text-zinc-500'
                                            }`}>
                                            {chat.lastMessage?.content || 'Unfold your story...'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {chats.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <div className="h-12 w-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-4">
                                    <MessageSquarePlus className="h-6 w-6 text-zinc-600" />
                                </div>
                                <p className="text-xs font-medium text-zinc-600 max-w-[160px] leading-relaxed">
                                    Silence is golden, but whispers are better. Find a friend?
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
