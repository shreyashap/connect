import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';

export const useSocket = () => {
    const { token, isAuthenticated } = useAuth();
    const socketRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<any>(null);

    const connect = useCallback(() => {
        if (!isAuthenticated || !token) return;

        if (socketRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket connected');
            setIsConnected(true);
            // Authenticate socket
            ws.send(JSON.stringify({ type: 'auth', payload: { token } }));
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setLastMessage(message);
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
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [connect]);

    const sendMessage = useCallback((type: string, payload: any) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({ type, payload }));
        } else {
            console.error('WebSocket is not connected');
        }
    }, []);

    return { isConnected, lastMessage, sendMessage };
};
