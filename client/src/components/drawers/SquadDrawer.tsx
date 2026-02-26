import type { SquadMembership } from '@/types/SquadMembership';
import type { User } from '@/types/User';
import { addSquadMembers, getUsers } from '@/utils/api';
import { SquadRole } from '@/utils/const';
import { getFullName, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { Button, Checkbox, Drawer, MultiSelect, Stack, Table, Text, TextInput } from '@mantine/core';
import { use, useEffect, useMemo, useState } from 'react'

interface ISquadDrawer {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  squadId: string;
  members?: SquadMembership[];
}

const SquadDrawer = (props: ISquadDrawer) => {
  const { isDrawerOpen, setIsDrawerOpen, squadId, members = [] } = props;

  const [users, setUsers] = useState<User[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["player"]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [filterValue, setFilterValue] = useState<string>('');
  const [error, setError] = useState<Boolean>(null);

  const existingMemberIds = useMemo(
    () => new Set(members.map((member) => member.user?._id).filter(Boolean) as string[]),
    [members]
  );

  const filterData = () => {
    const lowerFilter = filterValue.toLowerCase();
    const filtered = users.filter((user) => {
      const fullName = getFullName(user)?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      return fullName.includes(lowerFilter) || email.includes(lowerFilter);
    });
    setFilteredUsers(filtered);
  };


  const handleToggleUser = (userId: string, checked: boolean) => {
    if (existingMemberIds.has(userId)) {
      return;
    }

    if (checked) {
      setSelectedUsers((prev) => Array.from(new Set([...prev, userId])));
    } else {
      setSelectedUsers((prev) => prev.filter(id => id !== userId));
    }
  };

  const handleAddMembers = async () => {
    if (!squadId || selectedUsers.length === 0 || selectedRoles.length === 0) {
      setError(true);
      showErrorNotification('Vyberte alespoň jednoho uživatele a jednu roli');
      return;
    }

    try {
      setIsSaving(true);
      await addSquadMembers(squadId, selectedUsers, selectedRoles);
      showSuccessNotification(`Do soupisky bylo přidáno ${selectedUsers.length} uživatelů`);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error('Error adding squad members:', error);
      showErrorNotification('Chyba při přidávání členů');
    } finally {
      setIsSaving(false);
    }
  };

  const loadData = async () => {
    const users = await getUsers();
    setUsers(users);
  };

  useEffect(() => {
    filterData();
  }, [filterValue, users]);

  useEffect(() => {
    setSelectedUsers([]);

    if (isDrawerOpen) {
      loadData();
    }
  }, [isDrawerOpen]);

  return (
    <Drawer
      opened={isDrawerOpen}
      onClose={() => setIsDrawerOpen(false)}
      position="right"
    >
      <Stack gap="md">
        <TextInput
          label="Hledat uživatele"
          placeholder="Zadejte jméno nebo e-mail"
          value={filterValue}
          onChange={(value) => setFilterValue(value.currentTarget.value)}
        />

        <MultiSelect
          label="Role"
          placeholder="Vyber role"
          data={Object.values(SquadRole)}
          value={selectedRoles}
          onChange={(value) => setSelectedRoles(value)}
          error={error && selectedRoles.length === 0 ? 'Vyberte alespoň jednu roli' : null}
        />

        {filteredUsers.length === 0 ? (
          <Text c="dimmed">Nenalezeni žádní uživatelé.</Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                </Table.Th>
                <Table.Th>Uživatel</Table.Th>
                <Table.Th>E-mail</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredUsers.map((user) => {
                const userId = user._id;
                const isExistingMember = Boolean(userId && existingMemberIds.has(userId));
                const isChecked = Boolean(userId && (selectedUsers.includes(userId) || isExistingMember));
                return (
                  <Table.Tr key={user._id || user.email}>
                    <Table.Td>
                      <Checkbox
                        checked={isChecked}
                        disabled={isExistingMember}
                        onChange={(event) => userId && handleToggleUser(userId, event.currentTarget.checked)}
                        aria-label={`Vybrat ${getFullName(user) || user.email || 'uživatele'}`}
                      />
                    </Table.Td>
                    <Table.Td>{getFullName(user)}</Table.Td>
                    <Table.Td>
                      {user.email}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}

        <Button onClick={handleAddMembers} loading={isSaving} disabled={selectedUsers.length === 0}>
          Přidat vybrané ({selectedUsers.length})
        </Button>
      </Stack>
    </Drawer>
  )
}

export default SquadDrawer;
