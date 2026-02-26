import type { Squad } from '@/types/Squad';
import { getSquads } from '@/utils/api';
import { LeagueCategory } from '@/utils/const';
import { getCategoryLabel } from '@/utils/helpers';
import { Alert, Button, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

const Squads = () => {
    const navigate = useNavigate();
    const [squads, setSquads] = useState<Squad[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await getSquads();
            setSquads(data ?? []);
        } catch (err) {
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <Stack gap="md">

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {squads.map((squad) => (
                    <Paper key={squad._id} withBorder radius="md" p="md" bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))">
                        <Stack gap="xs">
                            <Group justify="space-between" mt="xs">

                                <Title order={4}>{squad.name || 'Bez názvu'}</Title>
                                <Button
                                    variant="light"
                                    rightSection={<IconArrowRight size={16} />}
                                    disabled={!squad._id}
                                    onClick={() => navigate(`/squad/${squad._id}`)}
                                >
                                    Detail
                                </Button>
                            </Group>
                            <Text c="dimmed">Kategorie: {getCategoryLabel(squad.league?.category)}</Text>
                            <Text c="dimmed">Liga: {squad.league?.name || 'N/A'}</Text>
                        </Stack>
                    </Paper>
                ))}
            </SimpleGrid>
        </Stack>
    )
}

export default Squads