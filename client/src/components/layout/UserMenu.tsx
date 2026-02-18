import { Avatar, Group, Menu, UnstyledButton, Text, useMantineColorScheme, useComputedColorScheme } from '@mantine/core'
import { IconChevronDown, IconLogout, IconMoon, IconSettings, IconSun } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './Header.module.css';
import { useState } from 'react'
import { useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import type { User } from '@/types/User';
import { getFullName } from '@/utils/helpers';

interface IUserMenu {
    user: User;
}

const UserMenu = (props: IUserMenu) => {
    const { user } = props;

    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const [userMenuOpened, setUserMenuOpened] = useState(false);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            navigate('/login');
        }
    };

    return (
        <Menu
            width={260}
            zIndex={1001}
            position="bottom-end"
            transitionProps={{ transition: 'pop-top-right' }}
            onClose={() => setUserMenuOpened(false)}
            onOpen={() => setUserMenuOpened(true)}
            withinPortal
        >
            <Menu.Target>
                <UnstyledButton
                    className={cx(classes.user, { [classes.userActive]: userMenuOpened })}
                >
                    <Group gap={7}>
                        <Avatar key={user._id} name={getFullName(user)} src={null} color="initials" alt="" radius="xl" size={20} />
                        <Text fw={500} size="sm" lh={1} mr={3}>
                            {getFullName(user)}
                        </Text>
                        <IconChevronDown size={12} stroke={1.5} />
                    </Group>
                </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>

                <Menu.Label>Nastavení</Menu.Label>
                <Menu.Item leftSection={<IconSettings size={16} stroke={1.5} />}>
                    Nastavení účtu
                </Menu.Item>
                <Menu.Item leftSection={<IconLogout size={16} stroke={1.5} />} onClick={handleLogout}>
                    Odhlasit
                </Menu.Item>

                <Menu.Divider />

                <Menu.Label>Zobrazení</Menu.Label>
                <Menu.Item
                    leftSection={computedColorScheme === 'dark' ?
                        <IconSun size={16} stroke={1.5} /> :
                        <IconMoon size={16} stroke={1.5} />
                    }
                    onClick={() => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')}
                >
                    {computedColorScheme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}
                </Menu.Item>
            </Menu.Dropdown>
        </Menu>
    )
}

export default UserMenu