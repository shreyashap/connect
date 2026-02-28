'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

type SocketCallback = (message: any) => void;

interface SocketContextType {
    isConnected: boolean;
    sendMessage: (type: string, payload: any) => void;
    subscribe: (callback: SocketCallback) => () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { token, isAuthenticated } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const subscribersRef = useRef<Set<SocketCallback>>(new Set());

    const connect = useCallback(() => {
        if (!isAuthenticated || !token) return;
        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        console.log('Connecting to WebSocket...');
        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Synchronously notify all subscribers
                subscribersRef.current.forEach(callback => callback(message));
            } catch (error) {
                console.error('Error parsing WebSocket message', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
            // Attempt reconnect after 5 seconds
            setTimeout(connect, 5000);
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [token, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            connect();
        } else if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
            setIsConnected(false);
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, connect]);

    const sendMessage = useCallback((type: string, payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, payload }));
        } else {
            console.error('WebSocket is not connected');
        }
    }, []);

    const subscribe = useCallback((callback: SocketCallback) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    return (
        <SocketContext.Provider value={{ isConnected, sendMessage, subscribe }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (context === undefined) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};
