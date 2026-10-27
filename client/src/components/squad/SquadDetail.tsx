import type { Squad } from '@/types/Squad';
import type { SquadMembership } from '@/types/SquadMembership';
import { deleteSquadMember, getSquad, getSquadMembers, updateSquadMemberRoles } from '@/utils/api';
import { PlayerPosition, SquadRole } from '@/utils/const';
import { getCategoryLabel, getFullName, showErrorNotification, showSuccessNotification, useSquadCoachPermissions } from '@/utils/helpers';
import { ActionIcon, Anchor, Avatar, Badge, Button, Card, Group, MultiSelect, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconArrowLeft, IconMail, IconPhone, IconTrash, IconUserPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import SquadDrawer from '../drawers/SquadDrawer';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useConfirm } from '@/hooks/useConfirm';
import PageHeader from '../ui/PageHeader';
import { CardGridSkeleton, EmptyState, ErrorState } from '../ui/StateViews';

interface ISquadDetail {
  squadId: string;
}

type RosterGroup = { key: string; title: string; members: SquadMembership[] };

const byNumberThenName = (a: SquadMembership, b: SquadMembership) =>
  (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) ||
  getFullName(a.user).localeCompare(getFullName(b.user), 'cs', { sensitivity: 'base' });

// Coaches first, then players by position
const groupRoster = (members: SquadMembership[]): RosterGroup[] => {
  const coaches = members.filter((m) => m.roles?.includes('coach'));
  const players = members.filter((m) => m.roles?.includes('player'));

  const groups: RosterGroup[] = [
    { key: 'coach', title: 'Trenéři', members: coaches },
    ...Object.values(PlayerPosition).map((position) => ({
      key: position.value,
      title: position.plural,
      members: players.filter((m) => m.position === position.value),
    })),
    { key: 'other', title: 'Hráči', members: players.filter((m) => !m.position) },
  ];

  return groups
    .map((group) => ({ ...group, members: [...group.members].sort(byNumberThenName) }))
    .filter((group) => group.members.length > 0);
};

const SquadDetail = ({ squadId }: ISquadDetail) => {
  const navigate = useNavigate();
  const { confirm, confirmDialog } = useConfirm();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data, loading, error, reload, setData } = useAsyncData(
    async () => {
      const [squad, members] = await Promise.all([getSquad(squadId), getSquadMembers(squadId)]);
      return { squad, members: members ?? [] };
    },
    [squadId]
  );

  const squad: Squad | undefined = data?.squad;
  const members = data?.members ?? [];
  const canManage = useSquadCoachPermissions(squad);

  const handleMemberRolesChange = async (membership: SquadMembership, roles: string[]) => {
    if (roles.length === 0) {
      showErrorNotification('Člen musí mít alespoň jednu roli');
      return;
    }

    try {
      await updateSquadMemberRoles(squadId, membership._id, roles);
      setData((current) => ({
        ...current,
        members: current.members.map((m) => (m._id === membership._id ? { ...m, roles: roles as SquadMembership['roles'] } : m)),
      }));
      showSuccessNotification('Role byly uloženy');
    } catch {
      showErrorNotification('Role se nepodařilo uložit');
    }
  };

  const handleDelete = async (membership: SquadMembership) => {
    const confirmed = await confirm({
      title: 'Odebrat ze soupisky?',
      message: `${getFullName(membership.user)} přestane být členem celku ${squad?.name ?? ''}. Uživatel zůstane v systému.`,
      confirmLabel: 'Odebrat',
      danger: true,
    });
    if (!confirmed) return;

    try {
      await deleteSquadMember(membership._id);
      showSuccessNotification('Člen byl odebrán ze soupisky');
      reload();
    } catch {
      showErrorNotification('Člena se nepodařilo odebrat');
    }
  };

  const handleDrawer = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) reload();
  };

  if (error) return <ErrorState message={error} onRetry={reload} />;

  const renderMember = (member: SquadMembership) => (
    <Card key={member._id} padding="sm">
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <Avatar radius="xl" color="initials" name={getFullName(member.user)} src={member.user?.imageUrl} />
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap={6} wrap="nowrap">
            {member.jerseyNumber !== undefined && member.jerseyNumber !== null && (
              <Badge variant="filled" color="brand" size="sm" circle={member.jerseyNumber < 100}>
                {member.jerseyNumber}
              </Badge>
            )}
            <Anchor size="sm" fw={600} c="inherit" truncate onClick={() => navigate(`/user/${member.user?._id}`)}>
              {getFullName(member.user)}
            </Anchor>
          </Group>

          {member.user?.email && (
            <Anchor href={`mailto:${member.user.email}`} size="xs" c="dimmed" truncate>
              <Group gap={4} wrap="nowrap"><IconMail size={12} />{member.user.email}</Group>
            </Anchor>
          )}
          {member.user?.mobile && (
            <Anchor href={`tel:${member.user.mobile.replace(/\s/g, '')}`} size="xs" c="dimmed">
              <Group gap={4} wrap="nowrap"><IconPhone size={12} />{member.user.mobile}</Group>
            </Anchor>
          )}

          {canManage && (
            <MultiSelect
              aria-label={`Role – ${getFullName(member.user)}`}
              data={Object.values(SquadRole)}
              value={member.roles || []}
              onChange={(value) => handleMemberRolesChange(member, value)}
              clearable={false}
              searchable={false}
              size="xs"
              mt={4}
            />
          )}
        </Stack>

        {canManage && (
          <Tooltip label="Odebrat ze soupisky">
            <ActionIcon variant="subtle" color="red" aria-label={`Odebrat ${getFullName(member.user)}`} onClick={() => handleDelete(member)}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    </Card>
  );

  return (
    <>
      <Button variant="subtle" size="compact-sm" leftSection={<IconArrowLeft size={14} />} mb="xs" onClick={() => navigate('/squads')}>
        Celky
      </Button>

      <PageHeader
        title={
          <Group gap="sm" component="span">
            {loading ? 'Načítání…' : squad?.name || 'Bez názvu'}
            {squad?.league?.category && <Badge variant="light" color="accent" size="lg">{getCategoryLabel(squad.league.category)}</Badge>}
          </Group>
        }
        description={squad?.league ? `${squad.league.name} · sezóna ${squad.league.season}` : undefined}
        actions={canManage && (
          <Button leftSection={<IconUserPlus size={16} />} onClick={() => setIsDrawerOpen(true)}>
            Přidat členy
          </Button>
        )}
      />

      {loading ? (
        <CardGridSkeleton cards={6} height={96} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={<IconUserPlus size={24} />}
          title="Soupiska je prázdná"
          description={canManage ? 'Přidejte hráče a trenéry tlačítkem „Přidat členy“.' : 'Celek zatím nemá žádné členy.'}
        />
      ) : (
        <Stack gap="xl">
          {groupRoster(members).map((group) => (
            <Stack key={group.key} gap="sm">
              <Group gap="xs">
                <Title order={2} size="h4">{group.title}</Title>
                <Badge variant="light" color="gray">{group.members.length}</Badge>
              </Group>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
                {group.members.map(renderMember)}
              </SimpleGrid>
            </Stack>
          ))}
        </Stack>
      )}

      {confirmDialog}
      <SquadDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={handleDrawer} squadId={squadId} members={members} />
    </>
  );
};

export default SquadDetail;
