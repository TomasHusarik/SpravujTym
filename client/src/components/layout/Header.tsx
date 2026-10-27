import { Container, Group, Image, Text, UnstyledButton } from '@mantine/core';
import { NavLink, useLocation, useNavigate } from 'react-router';
import classes from './Header.module.css';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import { useAuth } from '@context/AuthContext';
import { useAdminPermissions } from '@/utils/helpers';
import logo from '@assets/logo40x40.svg';
import { config } from '@/config/config';
import { NAV_ITEMS, isNavItemActive } from './navigation';

const Header = () => {
  const isAdmin = useAdminPermissions();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className={classes.header}>
      <Container size="lg" className={classes.topBar}>
        <UnstyledButton className={classes.brand} onClick={() => navigate('/overview')} aria-label="Přejít na přehled">
          <Image src={logo} alt="" w={36} h={36} />
          <Text fw={800} fz={{ base: 'md', sm: 'lg' }} className={classes.brandText} truncate>
            {config.teamName}
          </Text>
        </UnstyledButton>

        <Group gap="xs" wrap="nowrap">
          <NotificationBell />
          <Group visibleFrom="sm">
            <UserMenu user={user} />
          </Group>
        </Group>
      </Container>

      {/* Desktop navigation; on mobile the bottom bar is used */}
      <Container size="lg" visibleFrom="sm">
        <nav aria-label="Hlavní navigace" className={classes.nav}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(item, pathname);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={classes.navLink}
                data-active={isActive || undefined}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={18} stroke={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}

export default Header
