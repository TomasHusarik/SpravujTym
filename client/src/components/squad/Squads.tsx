import type { Squad } from '@/types/Squad';
import { deleteSquad, getSquads } from '@/utils/api';
import { getCategoryLabel, getFullName, showErrorNotification, showSuccessNotification, useAdminPermissions } from '@/utils/helpers';
import { ActionIcon, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconEdit, IconPlus, IconTrash, IconUsersGroup, IconUserStar } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import SquadModal from '../modals/SquadModal';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useConfirm } from '@/hooks/useConfirm';
import PageHeader from '../ui/PageHeader';
import { CardGridSkeleton, EmptyState, ErrorState } from '../ui/StateViews';

const Squads = () => {
    const navigate = useNavigate();
    const isAdmin = useAdminPermissions();
    const { confirm, confirmDialog } = useConfirm();

    const { data: squads = [], loading, error, reload } = useAsyncData<Squad[]>(getSquads);
    const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
    const [selectedSquad, setSelectedSquad] = useState<Squad>(null);

    const handleDelete = async (squad: Squad) => {
        const confirmed = await confirm({
            title: `Smazat celek ${squad.name}?`,
            message: 'Smaže se celek i jeho soupiska. Hráči zůstanou v systému. Tuto akci nelze vrátit.',
            confirmLabel: 'Smazat celek',
            danger: true,
        });
        if (!confirmed) return;

        try {
            await deleteSquad(squad._id);
            showSuccessNotification('Celek byl smazán');
            reload();
        } catch {
            showErrorNotification('Celek se nepodařilo smazat');
        }
    };

    const openModal = (squad: Squad | null) => {
        setSelectedSquad(squad);
        setIsSquadModalOpen(true);
    };

    const renderContent = () => {
        if (loading) return <CardGridSkeleton cards={6} height={140} />;
        if (error) return <ErrorState message={error} onRetry={reload} />;
        if (squads.length === 0) {
            return (
                <EmptyState
                    icon={<IconUsersGroup size={24} />}
                    title="Zatím žádné celky"
                    description={isAdmin ? 'Vytvořte první celek, například „Muži A“ nebo „Junioři“.' : 'Klub zatím nemá žádné celky.'}
                    action={isAdmin && <Button leftSection={<IconPlus size={16} />} onClick={() => openModal(null)}>Vytvořit celek</Button>}
                />
            );
        }

        return (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {squads.map((squad) => {
                    const members = (squad.memberships ?? []).filter((m) => m.active !== false);
                    const players = members.filter((m) => m.roles?.includes('player'));
                    const coaches = members.filter((m) => m.roles?.includes('coach'));

                    return (
                        <Card
                            key={squad._id}
                            padding="lg"
                            component="button"
                            type="button"
                            onClick={() => navigate(`/squad/${squad._id}`)}
                            style={{ textAlign: 'left', cursor: 'pointer' }}
                            aria-label={`Otevřít celek ${squad.name}`}
                        >
                            <Stack gap="sm">
                                <Group justify="space-between" align="flex-start" wrap="nowrap">
                                    <Stack gap={4} style={{ minWidth: 0 }}>
                                        <Title order={3} size="h4" lineClamp={1}>{squad.name || 'Bez názvu'}</Title>
                                        <Badge variant="light" color="accent">{getCategoryLabel(squad.league?.category)}</Badge>
                                    </Stack>
                                    {isAdmin && (
                                        <Group gap={4} wrap="nowrap">
                                            <Tooltip label="Upravit">
                                                <ActionIcon
                                                    component="span"
                                                    variant="subtle"
                                                    aria-label="Upravit celek"
                                                    onClick={(e) => { e.stopPropagation(); openModal(squad); }}
                                                >
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Smazat">
                                                <ActionIcon
                                                    component="span"
                                                    variant="subtle"
                                                    color="red"
                                                    aria-label="Smazat celek"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(squad); }}
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    )}
                                </Group>

                                <Text size="sm" c="dimmed">{squad.league?.name || 'Bez soutěže'}</Text>

                                <Group gap="lg">
                                    <Group gap={6}>
                                        <IconUsersGroup size={16} />
                                        <Text size="sm">{players.length} hráčů</Text>
                                    </Group>
                                    {coaches.length > 0 && (
                                        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
                                            <IconUserStar size={16} />
                                            <Text size="sm" truncate>{coaches.map((c) => getFullName(c.user)).join(', ')}</Text>
                                        </Group>
                                    )}
                                </Group>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        );
    };

    return (
        <>
            <PageHeader
                title="Celky"
                description="Týmy klubu a jejich soupisky."
                actions={isAdmin && (
                    <Button leftSection={<IconPlus size={16} />} onClick={() => openModal(null)}>
                        Nový celek
                    </Button>
                )}
            />
            {renderContent()}
            {confirmDialog}
            <SquadModal opened={isSquadModalOpen} setOpened={setIsSquadModalOpen} squad={selectedSquad} loadSquads={reload} />
        </>
    )
}

export default Squads
