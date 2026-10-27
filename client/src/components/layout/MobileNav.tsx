import { Divider, Drawer, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDots } from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router';
import { useAdminPermissions } from '@/utils/helpers';
import { MenuItems } from './MenuItems';
import { NAV_ITEMS, isNavItemActive } from './navigation';
import classes from './MobileNav.module.css';
import headerClasses from './Header.module.css';

// Bottom tab bar on phones: main sections + "Více" with the rest and account settings
const MobileNav = () => {
    const [opened, { open, close }] = useDisclosure(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const isAdmin = useAdminPermissions();

    const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
    const primaryItems = items.filter((item) => item.primary);
    const moreItems = items.filter((item) => !item.primary);
    const isMoreActive = moreItems.some((item) => isNavItemActive(item, pathname));

    const go = (path: string) => {
        close();
        navigate(path);
    };

    return (
        <>
            <nav aria-label="Hlavní navigace" className={classes.bar}>
                {primaryItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = isNavItemActive(item, pathname);
                    return (
                        <UnstyledButton
                            key={item.path}
                            className={classes.item}
                            data-active={isActive || undefined}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => go(item.path)}
                        >
                            <Icon size={22} stroke={1.8} />
                            <span>{item.label}</span>
                        </UnstyledButton>
                    );
                })}
                <UnstyledButton
                    className={classes.item}
                    data-active={isMoreActive || opened || undefined}
                    aria-haspopup="dialog"
                    aria-expanded={opened}
                    onClick={open}
                >
                    <IconDots size={22} stroke={1.8} />
                    <span>Více</span>
                </UnstyledButton>
            </nav>

            <Drawer opened={opened} onClose={close} position="bottom" size={360} title="Více" radius="lg">
                <Stack gap={4} pb="md">
                    {moreItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <UnstyledButton key={item.path} className={headerClasses.drawerMenuItem} onClick={() => go(item.path)}>
                                <Text fw={500} component="span" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Icon size={18} stroke={1.6} />
                                    {item.label}
                                </Text>
                            </UnstyledButton>
                        );
                    })}
                    <Divider my="xs" />
                    <MenuItems variant="mobile" onNavigate={close} />
                </Stack>
            </Drawer>
        </>
    );
};

export default MobileNav;
