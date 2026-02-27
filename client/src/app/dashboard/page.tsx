'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { Chat } from '@/types';
import { MessageCircle } from 'lucide-react';

export default function DashboardPage() {
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

    return (
        <div className="flex h-full w-full">
            <Sidebar
                onSelectChat={(chat) => setSelectedChat(chat)}
                selectedChatId={selectedChat?._id}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
                {selectedChat ? (
                    <div className="flex h-full w-full items-center justify-center text-zinc-500">
                        {/* ChatWindow component will go here in the next chunk */}
                        <p>Chat with {selectedChat.participants[0].displayName} coming soon...</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full w-full items-center justify-center text-zinc-500">
                        <div className="bg-zinc-900 p-6 rounded-full mb-4">
                            <MessageCircle className="h-12 w-12 text-zinc-400" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-100 mb-2">Your Messages</h2>
                        <p className="max-w-xs text-center">
                            Select a conversation from the sidebar or search for users to start a new chat.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
