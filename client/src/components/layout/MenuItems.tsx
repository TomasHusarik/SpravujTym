import { Group, Text, useMantineColorScheme, useComputedColorScheme, Menu } from '@mantine/core';
import { IconLogout, IconMoon, IconSettings, IconSun } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@context/AuthContext';
import classes from './Header.module.css';

interface MenuItemsProps {
  variant: 'desktop' | 'mobile';
  onNavigate?: () => void;
}

export const MenuItems = ({ variant, onNavigate }: MenuItemsProps) => {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
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

  const handleSettingsClick = () => {
    navigate("/userdetail");
    onNavigate?.();
  };

  const handleThemeToggle = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  const handleLogoutClick = async () => {
    await handleLogout();
  };

  if (variant === 'desktop') {
    return (
      <>
        <Menu.Label>Nastavení</Menu.Label>
        <Menu.Item leftSection={<IconSettings size={16} stroke={1.5} />} onClick={handleSettingsClick}>
          Nastavení účtu
        </Menu.Item>
        <Menu.Item leftSection={<IconLogout size={16} stroke={1.5} />} onClick={handleLogoutClick}>
          Odhlasit
        </Menu.Item>

        <Menu.Divider />

        <Menu.Label>Zobrazení</Menu.Label>
        <Menu.Item
          leftSection={computedColorScheme === 'dark' ?
            <IconSun size={16} stroke={1.5} /> :
            <IconMoon size={16} stroke={1.5} />
          }
          onClick={handleThemeToggle}
        >
          {computedColorScheme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}
        </Menu.Item>
      </>
    );
  }

  return (
    <>
      <Group justify="flex-start" gap="xs">
        <IconSettings size={18} stroke={1.5} />
        <Text
          fw={500}
          className={classes.drawerMenuItem}
          style={{ cursor: 'pointer', flex: 1 }}
          onClick={handleSettingsClick}
        >
          Nastavení účtu
        </Text>
      </Group>

      <Group justify="flex-start" gap="xs">
        {computedColorScheme === 'dark' ?
          <IconSun size={18} stroke={1.5} /> :
          <IconMoon size={18} stroke={1.5} />
        }
        <Text
          fw={500}
          className={classes.drawerMenuItem}
          style={{ cursor: 'pointer', flex: 1 }}
          onClick={handleThemeToggle}
        >
          {computedColorScheme === 'dark' ? 'Světlý režim' : 'Tmavý režim'}
        </Text>
      </Group>

      <Group justify="flex-start" gap="xs">
        <IconLogout size={18} stroke={1.5} />
        <Text
          fw={500}
          className={classes.drawerMenuItem}
          style={{ cursor: 'pointer', flex: 1 }}
          onClick={handleLogoutClick}
        >
          Odhlásit
        </Text>
      </Group>
    </>
  );
};
