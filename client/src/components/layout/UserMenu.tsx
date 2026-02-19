import { Avatar, Group, Menu, UnstyledButton, Text } from '@mantine/core'
import { IconChevronDown } from '@tabler/icons-react';
import cx from 'clsx';
import classes from './Header.module.css';
import { useState } from 'react'
import { useNavigate } from 'react-router';
import type { User } from '@/types/User';
import { getFullName } from '@/utils/helpers';
import { MenuItems } from './MenuItems';

interface IUserMenu {
    user: User;
}

const UserMenu = (props: IUserMenu) => {
    const { user } = props;

    const [userMenuOpened, setUserMenuOpened] = useState(false);

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
                        <Avatar key={user._id} name={getFullName(user)} src={user.imageUrl} color="initials" alt="" radius="xl" size={20} />
                        <Text fw={500} size="sm" lh={1} mr={3}>
                            {getFullName(user)}
                        </Text>
                        <IconChevronDown size={12} stroke={1.5} />
                    </Group>
                </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
                <MenuItems variant="desktop" />
            </Menu.Dropdown>
        </Menu>
    )
}

export default UserMenu