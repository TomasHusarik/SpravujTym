import type { Venue } from '@/types/Venue';
import { getTeamEvent, getVenues } from '@/utils/api';
import { EventType, ParticipationStatus } from '@/utils/const';
import { combinateDateAndTime, getFullName, getParticipationStatusColor, validateFutureDate, validateString } from '@/utils/helpers';
import { ActionIcon, Badge, Button, Card, Group, Indicator, Paper, Select, SimpleGrid, Stack, Table, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar, IconClockHour1, IconDeviceFloppy, IconMapPin, IconPencil, IconPlus, IconTrash, IconUser, IconUserPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import MembershipsDrawer from '../drawers/MembershipsDrawer';

interface IEventDetail {
    eventId: string;
}

const EventDetail = (props: IEventDetail) => {
    const { eventId } = props;

    const [isSaving, setIsSaving] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);

    const form = useForm({
        initialValues: {
            _id: undefined,
            title: '',
            type: 'training',
            date: null,
            startTime: '',
            endTime: '',
            venue: null,
            eventParticipations: [],
        },

        validate: {
            title: (val: string) => validateString(val),
            type: (val: string) => validateString(val),
            startTime: (val: string) => validateString(val),
            endTime: (val: string) => validateString(val),
            date: (val: Date) => validateFutureDate(val),
        },
    });

    const handleDelete = async (participationId: string) => {
        // Implementace mazání účastníka z události
        // Po úspěšném smazání načíst znovu data události, aby se aktualizoval seznam účastníků
    };

    const handleSave = async (values: typeof form.values) => {
        const { startTime, endTime, date, ...restValues } = values;

        const payload = {
            ...restValues,
            startDate: combinateDateAndTime(values.date, startTime),
            endDate: combinateDateAndTime(values.date, endTime),
        };

        setIsSaving(true);
    };

    const loadData = async () => {
        try {
            const event = await getTeamEvent(eventId);
            const venues = await getVenues();

            // Pre-fill form with existing event data
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);

            form.setValues({
                ...event,
                date: start,
                startTime: start.toTimeString().slice(0, 5),
                endTime: end.toTimeString().slice(0, 5),
                venue: event.venue ? { _id: event.venue._id, name: event.venue.name } : null,
                eventParticipations: event.eventParticipations || [],
            });
            setVenues(venues);
        } catch (error) {
            console.error('Error loading event data:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <>
            <form onSubmit={form.onSubmit((values) => handleSave(values))}>
                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="lg">
                        <Group justify="space-between" align="flex-end">
                            <div>
                                <Title order={2}>Detail události</Title>
                                <Text size="sm" c="dimmed">Informace o události a účásti</Text>
                            </div>
                        </Group>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <TextInput
                                label="Název"
                                placeholder="Title"
                                leftSection={<IconUser size={16} />}
                                radius="md"
                                required
                                value={form.values.title}
                                onChange={(e) => form.setFieldValue('title', e.currentTarget.value)}
                                error={form.errors.title}
                                readOnly={!editMode}
                            />

                            <Select
                                label="Typ"
                                placeholder="Type"
                                leftSection={<IconUser size={16} />}
                                radius="md"
                                required
                                data={Object.values(EventType)}
                                value={form.values.type}
                                onChange={(value) => form.setFieldValue('type', value || '')}
                                error={form.errors.type}
                                readOnly={!editMode}
                            />

                            <DatePickerInput
                                label="Datum"
                                placeholder="Select date"
                                leftSection={<IconCalendar size={16} />}
                                radius="md"
                                required
                                value={form.values.date}
                                onChange={(date) => form.setFieldValue('date', new Date(date))}
                                error={form.errors.date}
                                readOnly={!editMode}
                            />

                            <Select
                                label="Hala"
                                placeholder="Venue"
                                leftSection={<IconMapPin size={16} />}
                                radius="md"
                                required
                                searchable
                                data={venues.map((venue) => ({ value: venue._id, label: venue.name }))}
                                value={form.values.venue?._id || null}
                                onChange={(value) => {
                                    const selectedVenue = venues.find((venue) => venue._id === value);
                                    form.setFieldValue(
                                        'venue',
                                        selectedVenue ? { _id: selectedVenue._id, name: selectedVenue.name } : null
                                    );
                                }}
                                error={form.errors.venue}
                                readOnly={!editMode}
                            />
                        </SimpleGrid>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <TimePicker
                                label="Začátek"
                                radius="md"
                                required
                                leftSection={<IconClockHour1 size={16} />}
                                value={form.values.startTime}
                                onChange={(time) => form.setFieldValue('startTime', time)}
                                error={form.errors.startTime}
                                readOnly={!editMode}
                            />
                            <TimePicker
                                label="Konec"
                                radius="md"
                                required
                                leftSection={<IconClockHour1 size={16} />}
                                value={form.values.endTime}
                                onChange={(time) => form.setFieldValue('endTime', time)}
                                error={form.errors.endTime}
                                readOnly={!editMode}
                            />
                        </SimpleGrid>

                        <Card radius="md" p="md" withBorder>
                            <Group gap={2} justify="space-between">
                                <Title order={4}>Účast</Title>
                                {editMode &&
                                    <Tooltip label="Přidat účastníka" withArrow>
                                        <ActionIcon variant="light" radius="xl" onClick={() => setIsDrawerOpen(true)}>
                                            <IconUserPlus size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                }
                            </Group>
                            <Stack gap="sm">
                                {form.values.eventParticipations.length === 0 ? (
                                    <Text c="dimmed" size="sm">Zatím nejsou přiřazeni žádní členové.</Text>
                                ) : (
                                    <Table striped highlightOnHover>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th></Table.Th>
                                                <Table.Th>Uživatel</Table.Th>
                                                <Table.Th>E-mail</Table.Th>
                                                <Table.Th>Status</Table.Th>
                                                <Table.Th></Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {form.values.eventParticipations.map((part) => (
                                                <Table.Tr key={part._id}>
                                                    <Table.Td>
                                                        <Indicator
                                                            color={getParticipationStatusColor(part.status)}
                                                            size={8}
                                                        />
                                                    </Table.Td>
                                                    <Table.Td>{getFullName(part.user)}</Table.Td>
                                                    <Table.Td>{part.user?.email}</Table.Td>
                                                    <Table.Td>
                                                        {part.status ? (
                                                            <>
                                                                <Select
                                                                    data={Object.values(ParticipationStatus)}
                                                                    value={part.status || ''}

                                                                    clearable={false}
                                                                    searchable={false}
                                                                    w={200}
                                                                    disabled={!editMode}
                                                                />
                                                            </>
                                                        ) : (
                                                            <Text c="dimmed">N/A</Text>
                                                        )}
                                                    </Table.Td>
                                                    <Table.Td>
                                                        {editMode &&

                                                            <Tooltip label="Odstranit" withArrow>
                                                                <ActionIcon size={32} radius="xl" variant="subtle" onClick={(e) => { e.stopPropagation(); handleDelete(part._id); }}>
                                                                    <IconTrash size={20} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        }
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                )}
                            </Stack>
                        </Card>

                        <Group justify="space-between">
                             <Button
                                variant="light"
                                radius="md"
                                onClick={() => setEditMode(!editMode)}
                                leftSection={<IconPencil stroke={1.5} size={20} />}
                            >
                                {editMode ? 'Zrušit' : 'Upravit'}
                            </Button>
                            <Button
                                type="submit"
                                variant="light"
                                radius="md"
                                loading={isSaving}
                                leftSection={<IconDeviceFloppy stroke={1.5} size={20} />}
                            >
                                Save
                            </Button>
                        </Group>
                    </Stack>
                </Paper >
            </form >
            <MembershipsDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} eventParticipations={form.values.eventParticipations}/>
        </>
    );
};

export default EventDetail;