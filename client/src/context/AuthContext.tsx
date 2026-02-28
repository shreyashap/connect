'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import api from '@/services/api';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    setUser: (user: User | null) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            const parsedUser = JSON.parse(storedUser);
            // Ensure _id is set if only id exists (backward compatibility)
            if (parsedUser && !parsedUser._id && parsedUser.id) {
                parsedUser._id = parsedUser.id;
            }
            setUser(parsedUser);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            setLoading(true);
            const res = await api.post('/auth/login', { email, password });
            const { user, token } = res.data;

            setToken(token);
            // Standardize on _id
            const standardizedUser = { ...user, _id: user._id || user.id };
            setUser(standardizedUser);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(standardizedUser));

            router.push('/dashboard');
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const register = async (data: any) => {
        try {
            setLoading(true);
            const res = await api.post('/auth/register', data);
            const { user, token } = res.data;

            setToken(token);
            // Standardize on _id
            const standardizedUser = { ...user, _id: user._id || user.id };
            setUser(standardizedUser);
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(standardizedUser));

            router.push('/dashboard');
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                logout,
                setUser,
                isAuthenticated: !!token,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
