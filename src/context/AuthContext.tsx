'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, AppUser } from '@/lib/api';

interface AuthContextType {
    user: AppUser | null;
    token: string | null;
    isLoading: boolean;
    loginWithGoogle: (idToken: string) => Promise<void>;
    logout: () => void;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Restore session dari localStorage saat app pertama load
    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            try {
                setUser(JSON.parse(storedUser));
                // Refresh data background
                refetchUser();
            } catch {
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    async function refetchUser() {
        try {
            const { user: freshUser } = await api.auth.me();
            setUser(freshUser);
            localStorage.setItem('auth_user', JSON.stringify(freshUser));
        } catch (err) {
            console.error('Failed to refetch user:', err);
        }
    }

    /**
     * Dipanggil setelah Google Sign-In berhasil di frontend.
     * idToken = credential yang dikembalikan Google One Tap / GSI
     */
    async function loginWithGoogle(idToken: string) {
        setIsLoading(true);
        try {
            const { token: newToken, user: newUser } = await api.auth.login(idToken);
            setToken(newToken);
            setUser(newUser);
            localStorage.setItem('auth_token', newToken);
            localStorage.setItem('auth_user', JSON.stringify(newUser));
        } finally {
            setIsLoading(false);
        }
    }

    function logout() {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, loginWithGoogle, logout, refetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
    return ctx;
}
