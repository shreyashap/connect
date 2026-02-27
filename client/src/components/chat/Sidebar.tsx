'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Chat } from '@/types';
import api from '@/services/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, LogOut, Settings, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SidebarProps {
    onSelectChat: (chat: Chat) => void;
    selectedChatId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSelectChat, selectedChatId }) => {
    const { user, logout } = useAuth();
    const [chats, setChats] = useState<Chat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        fetchChats();
    }, []);

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
        <div className="flex h-full w-80 flex-col border-r border-zinc-800 bg-zinc-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-4">
                <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback className="bg-zinc-800 text-zinc-100">
                            {user?.displayName[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user?.displayName}</span>
                        <span className="text-xs text-zinc-400">Online</span>
                    </div>
                </div>
                <div className="flex items-center space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                        placeholder="Search users..."
                        className="border-zinc-800 bg-zinc-950 pl-9 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-zinc-700"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List Area */}
            <ScrollArea className="flex-1">
                {searchQuery.length >= 2 ? (
                    <div className="px-2 py-2">
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Found Users
                        </p>
                        {searchResults.map((result) => (
                            <div
                                key={result._id}
                                className="flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-zinc-800"
                                onClick={() => startChat(result._id)}
                            >
                                <Avatar className="h-10 w-10 border border-zinc-700">
                                    <AvatarImage src={result.avatar} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-100">
                                        {result.displayName[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="flex-1 text-sm font-medium">{result.displayName}</span>
                                <MessageSquarePlus className="h-4 w-4 text-zinc-500" />
                            </div>
                        ))}
                        {!isSearching && searchResults.length === 0 && (
                            <p className="px-4 py-2 text-sm text-zinc-500">No users found</p>
                        )}
                    </div>
                ) : (
                    <div className="px-2 py-2">
                        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                            Recent Chats
                        </p>
                        {chats.map((chat) => {
                            const otherUser = chat.participants.find((p) => p._id !== user?._id);
                            return (
                                <div
                                    key={chat._id}
                                    className={`flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-colors ${selectedChatId === chat._id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'
                                        }`}
                                    onClick={() => onSelectChat(chat)}
                                >
                                    <div className="relative">
                                        <Avatar className="h-10 w-10 border border-zinc-700">
                                            <AvatarImage src={otherUser?.avatar} />
                                            <AvatarFallback className="bg-zinc-800 text-zinc-100">
                                                {otherUser?.displayName?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {otherUser?.isOnline && (
                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 bg-green-500"></span>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col overflow-hidden">
                                        <span className="text-sm font-medium">{otherUser?.displayName}</span>
                                        <span className="truncate text-xs text-zinc-400">
                                            {chat.lastMessage?.content || 'No messages yet'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                        {chats.length === 0 && (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-xs text-zinc-500">Search for users above to start a conversation</p>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
};
