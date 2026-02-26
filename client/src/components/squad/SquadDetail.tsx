import type { Squad } from '@/types/Squad';
import type { SquadMembership } from '@/types/SquadMembership';
import { deleteSquadMember, getSquad, getSquadMembers, updateSquadMemberRoles } from '@/utils/api';
import { SquadRole } from '@/utils/const';
import { getCategoryLabel, getFullName, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { ActionIcon, Badge, Box, Button, Divider, Group, MultiSelect, Stack, Table, Text, Title } from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import SquadDrawer from '../drawers/SquadDrawer';

interface ISquadDetail {
  squadId: string;
}

const SquadDetail = ({ squadId }: ISquadDetail) => {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<SquadMembership[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleMemberRolesChange = async (membershipId: string, roles: string[]) => {
    const castedRoles = roles;

    if (castedRoles.length === 0) {
      showErrorNotification('Uživatel musí mít alespoň jednu roli');
      return;
    }

    try {
      await updateSquadMemberRoles(membershipId, castedRoles);
      loadData();
    } catch (error) {
      console.error('Error updating squad member roles:', error);
      showErrorNotification('Chyba při ukládání rolí');
    }
  };

  const handleDelete = async (membershipId: string) => {
    try {
      await deleteSquadMember(membershipId);
      showSuccessNotification('Člen byl odebrán ze soupisky');
      loadData();
    } catch (error) {
      console.error('Error deleting squad member:', error);
      showErrorNotification('Chyba při odstraňování člena');
    }
  };

  const loadData = async () => {
    try {
      const [squadData, membersData] = await Promise.all([
        getSquad(squadId),
        getSquadMembers(squadId),
      ]);
      setSquad(squadData);
      setMembers(membersData ?? []);
    } catch (error) {
      console.error('Error loading squad:', error);
      showErrorNotification('Chyba při načítání soupisky');
    }
  };

  useEffect(() => {
    loadData();
  }, [squadId, isDrawerOpen]);

  const sortedMembers = [...members].sort((a, b) => {
    const aHasCoachRole = a.roles?.some(role => role === SquadRole.COACH.value) ? 1 : 0;
    const bHasCoachRole = b.roles?.some(role => role === SquadRole.COACH.value) ? 1 : 0;

    if (aHasCoachRole !== bHasCoachRole) {
      return bHasCoachRole - aHasCoachRole;
    }

    return getFullName(a.user).localeCompare(getFullName(b.user), 'cs', { sensitivity: 'base' });
  });

  return (
    <>
      <Box
        p="lg"
        style={{
          border: '1px solid var(--mantine-color-default-border)',
          borderRadius: 'var(--mantine-radius-md)',
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Text size="sm" c="dimmed">
              Soupiska
            </Text>
            <Title order={3}>{squad?.name || 'Bez názvu'}</Title>
            <Badge variant="light" size="lg">
              {getCategoryLabel(squad?.league?.category)}
            </Badge>
          </Group>

          <Divider />

          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Stack gap={2}>
              <Text size="sm" c="dimmed">
                Liga
              </Text>
              <Text fw={500}>{squad?.league?.name || 'N/A'}</Text>
            </Stack>

            <Stack gap={2} align="flex-end">
              <Text size="sm" c="dimmed">
                Soutěžní období
              </Text>
              <Text fw={500}>{squad?.league?.season || 'N/A'}</Text>
            </Stack>
          </Group>

          <Divider />

          <Group justify="space-between" align="center">
            <Title order={5}>Členové soupisky</Title>
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={() => setIsDrawerOpen(true)}>
              Přidat člena
            </Button>
          </Group>

          <Stack gap="xs">
            {members.length === 0 ? (
              <Text c="dimmed">Zatím nejsou přiřazeni žádní členové.</Text>
            ) : (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Uživatel</Table.Th>
                    <Table.Th>E-mail</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Delete</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sortedMembers.map((member) => {
                    return (
                      <Table.Tr key={member._id}>
                        <Table.Td>{getFullName(member.user)}</Table.Td>
                        <Table.Td>{member.user?.email}</Table.Td>
                        <Table.Td>
                          {member._id ? (
                            <MultiSelect
                              data={Object.values(SquadRole)}
                              value={member.roles || []}
                              onChange={(value) => handleMemberRolesChange(member._id, value)}
                              clearable={false}
                              searchable={false}
                              w={200}
                            />
                          ) : (
                            <Text c="dimmed">N/A</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon size={32} radius="xl" variant="subtle" onClick={(e) => { e.stopPropagation(); handleDelete(member._id); }}>
                            <IconTrash stroke={1.5} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Stack>
      </Box>

      <SquadDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} squadId={squadId} members={members} />
    </>
  );
};

export default SquadDetail;
