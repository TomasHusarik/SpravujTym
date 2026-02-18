// import { createContext, useContext, useState, type ReactNode } from 'react';
// import type { League } from '@/types/League';
// import type { Squad } from '@/types/Squad';
// import type { TeamEvent } from '@/types/TeamEvent';

// type AppContextValue = {
//     leagues: League[];
//     squads: Squad[];
//     events: TeamEvent[];
//     setLeagues: (leagues: League[]) => void;
//     setSquads: (squads: Squad[]) => void;
//     setEvents: (events: TeamEvent[]) => void;
//     selectedLeague: League | null;
//     selectedSquad: Squad | null;
//     selectLeague: (league: League | null) => void;
//     selectSquad: (squad: Squad | null) => void;
// };

// const AppContext = createContext<AppContextValue | undefined>(undefined);

// export const AppProvider = ({ children }: { children: ReactNode }) => {
//     const [leagues, setLeagues] = useState<League[]>([]);
//     const [squads, setSquads] = useState<Squad[]>([]);
//     const [events, setEvents] = useState<TeamEvent[]>([]);
//     const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
//     const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);

//     const selectLeague = (league: League | null) => {
//         setSelectedLeague(league);
//     };

//     const selectSquad = (squad: Squad | null) => {
//         setSelectedSquad(squad);
//     };

//     return (
//         <AppContext.Provider
//             value={{
//                 leagues,
//                 squads,
//                 events,
//                 setLeagues,
//                 setSquads,
//                 setEvents,
//                 selectedLeague,
//                 selectedSquad,
//                 selectLeague,
//                 selectSquad,
//             }}
//         >
//             {children}
//         </AppContext.Provider>
//     );
// };

// export const useApp = () => {
//     const context = useContext(AppContext);
//     if (!context) {
//         throw new Error('useApp must be used within an AppProvider');
//     }
//     return context;
// };
