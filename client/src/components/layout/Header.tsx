import {
  Burger,
  Container,
  Divider,
  Drawer,
  Group,
  Image,
  Stack,
  Tabs,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import UserMenu from './UserMenu';
import { MenuItems } from './MenuItems';
import { useNavigate } from 'react-router';
import { useAuth } from '@context/AuthContext';
import type { User } from '@/types/User';

const tabs = [
  {label: 'Přehled', value: 'overview'},
  {label: 'Zeď', value: 'wall'},
  {label: 'Platby', value: 'payments'},
  {label: 'Kalendář', value: 'calendar'},
];

const Header = () => {
  const [opened, { toggle }] = useDisclosure(false);

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const items = tabs.map((tab) => (
    <Tabs.Tab value={tab.value} key={tab.value} onClick={() => navigate(`/${tab.value}`)}>
      {tab.label}
    </Tabs.Tab>
  ));

  return (
    <div className={classes.header}>
      <Container className={classes.mainSection} size="">
        <Group justify="space-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Image src="/logo40x40.svg" alt="Bluehorses Logo" w={40} h={40} />
            <Text fw={700} fz="xl" className={classes.logoText}>
              Blue Horses Stochov
            </Text>
          </div>


          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label="Toggle navigation"
          />

          <Group visibleFrom="sm">
            <UserMenu user={user} />
          </Group>

        </Group>
      </Container>
      <Container size="">
        <Tabs
          defaultValue="Home"
          variant="outline"
          visibleFrom="sm"
          classNames={{
            root: classes.tabs,
            list: classes.tabsList,
            tab: classes.tab,
          }}
        >
          <Tabs.List>{items}</Tabs.List>
          {items.map((item) => (
            <Tabs.Panel value={item.key!} key={item.key}>
              {' '}
            </Tabs.Panel>
          ))}
        </Tabs>
      </Container>

      <Drawer
        opened={opened}
        onClose={toggle}
        title="Menu"
        hiddenFrom="sm"
        size="100%"
      >
        <Stack gap="md" pt="xl">
          {tabs.map((tab) => (
            <Text
              key={tab.value}
              fw={500}
              className={classes.drawerMenuItem}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                navigate(`/${tab.value}`);
                toggle();
              }}
            >
              {tab.label}
            </Text>
          ))}
          
          {isAuthenticated && (
            <>
              <Divider my="xs" />
              <MenuItems variant="mobile" onNavigate={toggle} />
            </>
          )}
        </Stack>
      </Drawer>
    </div>
  );
}

export default Header