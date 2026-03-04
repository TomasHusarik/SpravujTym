import { ActionIcon, Button, Checkbox, Collapse, Divider, Drawer, Group, Loader, Paper, Stack, Text, TextInput } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { getSquads } from '@/utils/api';
import { getFullName, showErrorNotification } from '@/utils/helpers';
import type { Squad } from '@/types/Squad';
import type { User } from '@/types/User';
import { useEffect, useMemo, useState } from 'react';

interface IPaymentUsersDrawer {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  selectedUsers?: User[];
  onSave?: (users: User[]) => void;
}

const PaymentUsersDrawer = (props: IPaymentUsersDrawer) => {
  const { isDrawerOpen, setIsDrawerOpen, selectedUsers = [], onSave } = props;

  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSquads, setOpenSquads] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [localSelectedUsers, setLocalSelectedUsers] = useState<User[]>([]);

  const selectedUserIds = useMemo(
    () => localSelectedUsers.map((user) => user._id),
    [localSelectedUsers]
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSquads();
      setSquads(data);
    } catch {
      showErrorNotification('Chyba při načítání soupisek');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    loadData();
    setLocalSelectedUsers(selectedUsers);
  }, [isDrawerOpen, selectedUsers]);

  const filteredSquads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return squads
      .map((squad) => {
        const filteredMembers = (squad.memberships ?? []).filter((member) => {
          const isPlayer = member.roles?.includes('player');
          const fullName = getFullName(member.user).toLowerCase();
          return isPlayer && fullName.includes(normalizedSearch);
        });

        return { ...squad, memberships: filteredMembers };
      })
      .filter((squad) => squad.memberships.length > 0);
  }, [squads, search]);

  const handleSquadCollapse = (squadId: string) => {
    setOpenSquads((prev) =>
      prev.includes(squadId) ? prev.filter((id) => id !== squadId) : [...prev, squadId]
    );
  };

  const handleMemberToggle = (user: User) => {
    setLocalSelectedUsers((prev) =>
      prev.some((selected) => selected._id === user._id)
        ? prev.filter((selected) => selected._id !== user._id)
        : [...prev, user]
    );
  };

  const handleSquadToggle = (users: User[]) => {
    if (users.length === 0) {
      return;
    }

    setLocalSelectedUsers((prev) => {
      const allSelected = users.every((user) => prev.some((selected) => selected._id === user._id));

      if (allSelected) {
        const userIds = new Set(users.map((user) => user._id));
        return prev.filter((user) => !userIds.has(user._id));
      }

      const mergedUsers = [...prev, ...users];
      return Object.values(
        mergedUsers.reduce<Record<string, User>>((acc, user) => {
          acc[user._id] = user;
          return acc;
        }, {})
      );
    });
  };

  const handleSave = () => {
    onSave?.(localSelectedUsers);
    setIsDrawerOpen(false);
  };

  return (
    <Drawer
      opened={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      position="right"
      padding="lg"
      size="md"
      title="Výběr uživatelů"
    >
      <Stack gap="md">
        <TextInput
          placeholder="Vyhledat uživatele..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />

        {loading ? (
          <Group justify="center">
            <Loader size="sm" />
          </Group>
        ) : filteredSquads.length === 0 ? (
          <Text c="dimmed">Žádní uživatelé nenalezeni.</Text>
        ) : (
          filteredSquads.map((squad) => {
            const isOpen = openSquads.includes(squad._id);
            const squadUsers = (squad.memberships ?? [])
              .map((member) => member.user as User)
              .filter((user): user is User => Boolean(user?._id));

            const selectedInSquadCount = squadUsers.filter((user) =>
              selectedUserIds.includes(user._id)
            ).length;

            const allSelected = squadUsers.length > 0 && selectedInSquadCount === squadUsers.length;
            const someSelected = selectedInSquadCount > 0 && !allSelected;

            return (
              <Paper key={squad._id} withBorder radius="md" p="xs">
                <Group justify="space-between">
                  <Group>
                    <ActionIcon variant="subtle" onClick={() => handleSquadCollapse(squad._id)}>
                      {isOpen ? <IconChevronDown size={18} /> : <IconChevronRight size={18} />}
                    </ActionIcon>
                    <Text fw={500}>{squad.name}</Text>
                  </Group>

                  <Checkbox
                    size="xs"
                    label="Vše"
                    checked={allSelected}
                    indeterminate={someSelected}
                    disabled={squadUsers.length === 0}
                    onChange={() => handleSquadToggle(squadUsers)}
                  />
                </Group>

                <Collapse in={isOpen}>
                  <Divider my={4} />
                  <Stack gap={4} pl={24}>
                    {squadUsers.map((user) => (
                      <Checkbox
                        key={user._id}
                        checked={selectedUserIds.includes(user._id)}
                        label={<Text>{getFullName(user)}</Text>}
                        onChange={() => handleMemberToggle(user)}
                      />
                    ))}
                  </Stack>
                </Collapse>
              </Paper>
            );
          })
        )}

        <Button fullWidth onClick={handleSave} disabled={localSelectedUsers.length === 0}>
          Přidat vybrané uživatele
        </Button>
      </Stack>
    </Drawer>
  );
};

export default PaymentUsersDrawer;