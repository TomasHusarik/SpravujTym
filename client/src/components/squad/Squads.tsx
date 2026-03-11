import type { Squad } from '@/types/Squad';
import { deleteSquad, getSquads } from '@/utils/api';
import { LeagueCategory } from '@/utils/const';
import { getCategoryLabel } from '@/utils/helpers';
import { ActionIcon, Alert, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import SquadModal from '../modals/SquadModal';

const Squads = () => {
    const navigate = useNavigate();
    const [squads, setSquads] = useState<Squad[]>();
    const [isLoading, setIsLoading] = useState(true);
    const [isSquadModalOpen, setIsSquadModalOpen] = useState(false);
    const [selectedSquad, setSelectedSquad] = useState<Squad>(null);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await getSquads();
            setSquads(data);
        } catch (err) {
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (squadId: string) => {
        await deleteSquad(squadId);
        await loadData();
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <>
            <Stack gap="md">
                <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                    {squads?.length === 0 ? (
                        <Alert icon={<IconInfoCircle />} title="Žádné celky" color="blue">
                            Zatím nemáte žádné celky. Klikněte na tlačítko níže pro vytvoření prvního celku.
                        </Alert>
                    ) : (
                        squads?.map((squad) => (
                            <Paper key={squad._id} style={{cursor:"pointer"}} onClick={(e) => {e.preventDefault(); e.stopPropagation(); navigate(`/squad/${squad._id}`)}}  withBorder radius="md" p="md" bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))" >
                                <Stack gap="xs">
                                    <Group justify="space-between" mt="xs">
                                        <Title order={4}>{squad.name || 'Bez názvu'}</Title>
                                        <Group gap="xs">
                                            <ActionIcon variant="light" color="blue" onClick={(e) => {e.stopPropagation(); setIsSquadModalOpen(true); setSelectedSquad(squad);}}>
                                                <IconEdit size={16} />
                                            </ActionIcon>
                                            <ActionIcon variant="light" color="red" onClick={(e) => {e.stopPropagation(); handleDelete(squad._id)}}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                    <Text c="dimmed">Kategorie: {getCategoryLabel(squad.league?.category)}</Text>
                                    <Text c="dimmed">Liga: {squad.league?.name || 'N/A'}</Text>
                                </Stack>
                            </Paper>
                        ))
                    )}
                </SimpleGrid>
                <Button variant="light" color="blue" onClick={() => {setIsSquadModalOpen(true); setSelectedSquad(null);}}>
                    Vytvořit nový celek
                </Button>
            </Stack>
            <SquadModal opened={isSquadModalOpen} setOpened={setIsSquadModalOpen} squad={selectedSquad} loadSquads={loadData}/>
        </>
    )
}

export default Squads