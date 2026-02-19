import react, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, logoutUser, authUser } from '@utils/api';
import type { User } from '@/types/User';

type AuthContextValue = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'user';

export const AuthProvider = ({ children }: { children: react.ReactNode }) => {

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verify token with backend on mount
    const verifyToken = async () => {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
           if (storedUser) {
    try {
        const data = await authUser();
        if (data?.user) {
            setUser(data.user);
        } else {
            // ❗ NE hned mazat
            setUser(JSON.parse(storedUser));
        }
    } catch {
        // fallback
        setUser(JSON.parse(storedUser));
    }
}
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        verifyToken();
    }, []);

    const login = async (email: string, password: string) => {
        const data = await loginUser(email, password);
        if (data?.user) {
            setUser(data.user);
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        } else {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    };

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            isLoading,
            login,
            logout,
        }),
        [user, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
