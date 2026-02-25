import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Squad } from '@/types/Squad';
import type { Team } from '@/types/Team';

type AppContextValue = {
    team: Team;
    setTeam: (teams: Team) => void;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [team, setTeam] = useState<Team>();

    return (
        <AppContext.Provider
            value={{
                team,
                setTeam,
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
