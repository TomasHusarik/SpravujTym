import { useState } from 'react';
import {
  Burger,
  Container,
  Group,
  Image,
  Tabs,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';
import UserMenu from './UserMenu';
import { useNavigate } from 'react-router';

const user = {
  name: 'Tomáš Husarik',
  email: 'malejhusa@gmail.com',
  image: 'https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-5.png',
};

const tabs = [
  {label: 'Přehled', value: 'overview'},
  {label: 'Zeď', value: 'wall'},
  {label: 'Události', value: 'events'},
  {label: 'Kalendář', value: 'calendar'},
];

const Header = () => {
  const [opened, { toggle }] = useDisclosure(false);

  const navigate = useNavigate();

  const items = tabs.map((tab) => (
    <Tabs.Tab value={tab.value} key={tab.value} onClick={() => navigate(`/${tab.value}`)}>
      {tab.label}
    </Tabs.Tab>
  ));

  return (
    <div className={classes.header}>
      <Container className={classes.mainSection} size="xl">
        <Group justify="space-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Image src="/logo40x40.svg" alt="Bluehorses Logo" w={40} h={40} />
            <Text fw={700} fz="xl" className={classes.logoText}>
              Blue Horses
            </Text>
          </div>


          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="xs"
            size="sm"
            aria-label="Toggle navigation"
          />

          <UserMenu user={user} />

        </Group>
      </Container>
      <Container size="xl">
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
    </div>
  );
}

export default Header