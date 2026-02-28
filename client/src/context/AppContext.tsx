import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Squad } from '@/types/Squad';
import type { Team } from '@/types/Team';
import type { UserPermissions } from '@/types/Permissions';

type AppContextValue = {
    team: Team;
    setTeam: (teams: Team) => void;
    permissions: UserPermissions | null;
    setPermissions: (permissions: UserPermissions | null) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [team, setTeam] = useState<Team>();
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);

    return (
        <AppContext.Provider
            value={{
                team,
                setTeam,
                permissions,
                setPermissions,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};
