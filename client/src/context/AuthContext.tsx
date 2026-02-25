import react, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, logoutUser, authUser, getTeam } from '@utils/api';
import type { User } from '@/types/User';
import { useApp } from './AppContext';

type AuthContextValue = {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = 'user';
const DEFAULT_TEAM_ID = import.meta.env.VITE_TEAM_ID;

export const AuthProvider = ({ children }: { children: react.ReactNode }) => {

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setTeam } = useApp();

    const syncTeamContext = async () => {
        const teamId = DEFAULT_TEAM_ID;

        if (!teamId) {
            setTeam(null);
            return;
        }

        try {
            const teamData = await getTeam(teamId);
            setTeam(teamData);
        } catch {
            setTeam(null);
        }
    };

    // Verify token with backend on mount
    const verifyToken = async () => {
        try {
            const storedUser = localStorage.getItem(USER_STORAGE_KEY);
            if (storedUser) {
                try {
                    const data = await authUser();
                    if (data?.user) {
                        setUser(data.user);
                        await syncTeamContext();
                    } else {
                        setUser(JSON.parse(storedUser));
                        await syncTeamContext();
                    }
                } catch {
                    // fallback
                    setUser(JSON.parse(storedUser));
                    await syncTeamContext();
                }
            } else {
                setTeam(null);
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
            await syncTeamContext();
        } else {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            setTeam(null);
        }
    };

    const logout = async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
            localStorage.removeItem(USER_STORAGE_KEY);
            setTeam(null);
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
