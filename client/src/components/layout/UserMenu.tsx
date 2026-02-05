import { Avatar, Group, Menu, UnstyledButton, Text, useMantineColorScheme, useComputedColorScheme } from '@mantine/core'
import { IconChevronDown, IconLogout, IconMoon, IconPlayerPause, IconSettings, IconSun } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './Header.module.css';
import React, { useState } from 'react'

interface IUserMenu {
    user: {
        name: string;
        email: string;
        image: string;
    }
}

const UserMenu = (props: IUserMenu) => {
    const { user } = props;

    const { setColorScheme } = useMantineColorScheme();
    const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

    const [userMenuOpened, setUserMenuOpened] = useState(false);

    return (
        <Menu
            width={260}
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
                        <Avatar key={user.name} name={user.name} color="initials" alt="" radius="xl" size={20} />
                        <Text fw={500} size="sm" lh={1} mr={3}>
                            {user.name}
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
                <Menu.Item leftSection={<IconLogout size={16} stroke={1.5} />}>Odhlásit</Menu.Item>

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