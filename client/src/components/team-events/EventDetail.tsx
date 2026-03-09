import type { Venue } from '@/types/Venue';
import { createTeamEvent, deleteTeamEvent, getSquads, getTeamEvent, getVenues, updateTeamEvent } from '@/utils/api';
import { EventType, ParticipationStatus } from '@/utils/const';
import { combinateDateAndTime, formatDate, getFullName, getParticipationStatusColor, showErrorNotification, showSuccessNotification, useSquadCoachPermissions, validateFutureDate, validateString } from '@/utils/helpers';
import { ActionIcon, Badge, Button, Card, Divider, Drawer, Group, Indicator, MultiSelect, Paper, Select, SimpleGrid, Stack, Table, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar, IconClockHour1, IconDeviceFloppy, IconMapPin, IconPencil, IconPlus, IconTrash, IconUser, IconUserPlus } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import MembershipsDrawer from '../drawers/MembershipsDrawer';
import type { User } from '@/types/User';
import { useNavigate } from 'react-router';
import type { Squad } from '@/types/Squad';

interface IEventDetail {
    eventId?: string;
}

const EventDetail = (props: IEventDetail) => {
    const { eventId } = props;
    const navigate = useNavigate();

    const [isSaving, setIsSaving] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [squads, setSquads] = useState<Squad[]>([]);

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
            squads: [],
        },

        validate: {
            title: (val: string) => validateString(val),
            type: (val: string) => validateString(val),
            startTime: (val: string) => validateString(val),
            endTime: (val: string) => validateString(val),
        },
    });

    const handleDelete = (userId: string) => {
        const filtered = form.values.eventParticipations.filter(
            (p) => p.user._id !== userId
        );
        form.setFieldValue("eventParticipations", filtered);
    };

    const handleEventDelete = async () => {
        if (!eventId) return;

        const confirmed = window.confirm(
            'Opravdu chcete smazat tuto událost?\n\nTuto akci nelze vrátit zpět.'
        );

        if (!confirmed) return;

        try {
            await deleteTeamEvent(eventId);
            showSuccessNotification('Událost byla úspěšně smazána');
            navigate('/overview');
        } catch (error) {
            console.error('Error deleting event:', error);
            showErrorNotification('Chyba při mazání události');
        }
    };

    const handleParticipantsAdd = (newUsers: User[]) => {
        const existing = form.values.eventParticipations;

        const newParticipations = newUsers.map((user) => ({
            tempId: crypto.randomUUID(),   // temporary id for frontend management
            user,
            status: ParticipationStatus.PENDING.value,
        }));

        form.setFieldValue("eventParticipations", [
            ...existing,
            ...newParticipations,
        ]);
    };

    const handleSave = async (values: typeof form.values) => {
        setIsSaving(true);

        const startDate = combinateDateAndTime(values.date, values.startTime);
        const endDate = combinateDateAndTime(values.date, values.endTime);

        const payload = {
            title: values.title,
            type: values.type,
            startDate,
            endDate,
            venue: values.venue?._id ?? null,
            participations: values.eventParticipations.map((p) => ({
                userId: p.user._id,
                status: p.status,
            })),
            squads: values.squads.map((s) => s._id),
        };
        console.log('Payload for saving:', payload);

        try {
            if (values._id) {
                await updateTeamEvent(values._id, payload);
                showSuccessNotification('Událost úspěšně aktualizována');
            } else {
                const response = await createTeamEvent(payload);
                showSuccessNotification('Událost úspěšně vytvořena');
                navigate(`/event-detail/${response.eventId}`);
            }
        } catch (error) {
            console.error('Error saving event data:', error);
            showErrorNotification('Chyba při ukládání události');
        } finally {
            setIsSaving(false);
            setEditMode(false);
        }
    };

    const loadData = async () => {
        try {
            const event = await getTeamEvent(eventId);

            // Pre-fill form with existing event data
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);

            form.setValues({
                ...event,
                date: start,
                startTime: start.toTimeString().slice(0, 5),
                endTime: end.toTimeString().slice(0, 5),
                venue: event.venue ? { _id: event.venue._id, name: event.venue.name } : null,
                squads: event.squads || [],
                eventParticipations: event.eventParticipations || [],
            });
            loadVenuesAndSquads();
        } catch (error) {
            console.error('Error loading event data:', error);
        }
    };

    const loadVenuesAndSquads = async () => {
        try {
            const [venues, squads] = await Promise.all([getVenues(), getSquads()]);
            setVenues(venues);
            setSquads(squads);
        } catch (error) {
            console.error('Error loading venues:', error);
        }
    };

    useEffect(() => {
        if (eventId) {
            loadData();
        } else {
            loadVenuesAndSquads();
        }
    }, [eventId]);

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
                            {editMode && eventId && (
                                <Button
                                    variant="light"
                                    onClick={() => handleEventDelete()}
                                    leftSection={<IconTrash size={16} />}
                                    color="red"
                                    radius="md"
                                >
                                    Smazat
                                </Button>
                            )}
                        </Group>

                        <Divider />

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

                            { /* TODO: Opakovat každý týden, každé 2 týdny atd. (pokud se bude implementovat) */}
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
                            <MultiSelect
                                label="Celky"
                                placeholder="Celky"
                                radius="md"
                                required
                                data={squads.map((squad) => ({ value: squad._id, label: squad.name }))}
                                value={form.values.squads.map((s) => s._id || '')}
                                onChange={(values) => {
                                    const selectedSquads = squads.filter((squad) => values.includes(squad._id));
                                    form.setFieldValue('squads', selectedSquads);
                                }}
                                error={form.errors.squads}
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
                                    form.setFieldValue('venue', selectedVenue ? { _id: selectedVenue._id, name: selectedVenue.name } : null);
                                }}
                                error={form.errors.venue}
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
                                    <div style={{ width: '100%', overflowX: 'auto' }}>
                                        <Table striped highlightOnHover>
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th></Table.Th>
                                                    <Table.Th></Table.Th>
                                                    {/* <Table.Th>E-mail</Table.Th> */}
                                                    <Table.Th></Table.Th>
                                                    <Table.Th></Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {form.values.eventParticipations.map((part) => (
                                                    <Table.Tr key={part.user._id}>
                                                        <Table.Td>
                                                            <Indicator
                                                                color={getParticipationStatusColor(part.status)}
                                                                size={8}
                                                                style={{ zIndex: 1 }}
                                                            />
                                                        </Table.Td>
                                                        <Table.Td>{getFullName(part.user)}</Table.Td>
                                                        {/* <Table.Td>{part.user?.email}</Table.Td> */}
                                                        <Table.Td>
                                                            {part.status ? (
                                                                <>
                                                                    <Select
                                                                        data={Object.values(ParticipationStatus)}
                                                                        value={part.status || ''}
                                                                        onChange={(value) => {
                                                                            const updated = form.values.eventParticipations.map((p) =>
                                                                                p.user._id === part.user._id
                                                                                    ? { ...p, status: value || '' }
                                                                                    : p
                                                                            );

                                                                            form.setFieldValue('eventParticipations', updated);
                                                                        }}
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

                                                            {editMode ?
                                                                <Tooltip label="Odstranit" withArrow>
                                                                    <ActionIcon size={32} radius="xl" variant="subtle" onClick={(e) => { e.stopPropagation(); handleDelete(part.user._id); }}>
                                                                        <IconTrash size={20} />
                                                                    </ActionIcon>
                                                                </Tooltip> : formatDate(new Date(part.createdAt))
                                                            }
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>
                                    </div>
                                )}
                            </Stack>
                        </Card>

                        {useSquadCoachPermissions(form.values.squads) && (
                            <Group justify="space-between">
                                <Button
                                    variant="light"
                                    radius="md"
                                    onClick={() => setEditMode(!editMode)}
                                    leftSection={<IconPencil stroke={1.5} size={20} />}
                                >
                                    {editMode ? 'Zrušit' : 'Upravit'}
                                </Button>
                                {editMode && (
                                    <Button
                                        type="submit"
                                        variant="light"
                                        radius="md"
                                        loading={isSaving}
                                        leftSection={<IconDeviceFloppy stroke={1.5} size={20} />}
                                    >
                                        Save
                                    </Button>
                                )}
                            </Group>
                        )}
                    </Stack>
                </Paper >
            </form >
            <MembershipsDrawer isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} eventParticipations={form.values.eventParticipations} onSave={handleParticipantsAdd} />
        </>
    );
};

export default EventDetail;