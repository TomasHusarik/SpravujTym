import {
    IconCalendarEvent,
    IconLayoutDashboard,
    IconReceipt2,
    IconSpeakerphone,
    IconUsers,
    IconUsersGroup,
} from '@tabler/icons-react';

export type NavItem = {
    label: string;
    path: string;
    icon: typeof IconLayoutDashboard;
    adminOnly?: boolean;
    // Shown in the mobile bottom bar (the rest is in the "Více" drawer)
    primary?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
    { label: 'Přehled', path: '/overview', icon: IconLayoutDashboard, primary: true },
    { label: 'Kalendář', path: '/calendar', icon: IconCalendarEvent, primary: true },
    { label: 'Zeď', path: '/announcements', icon: IconSpeakerphone, primary: true },
    { label: 'Celky', path: '/squads', icon: IconUsersGroup, primary: true },
    { label: 'Uživatelé', path: '/users', icon: IconUsers },
    { label: 'Platby', path: '/payment', icon: IconReceipt2, adminOnly: true },
];

// Detail pages highlight their section (e.g. /squad/123 -> Celky)
const SECTION_ALIASES: Record<string, string> = {
    '/squad': '/squads',
    '/event-detail': '/overview',
    '/user': '/users',
};

export const isNavItemActive = (item: NavItem, pathname: string) => {
    const section = '/' + (pathname.split('/')[1] ?? '');
    return item.path === section || SECTION_ALIASES[section] === item.path;
};
