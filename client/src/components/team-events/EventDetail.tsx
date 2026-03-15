import type { Venue } from '@/types/Venue';
import {
    createTeamEvent,
    deleteTeamEvent,
    getSquads,
    getTeamEvent,
    getVenues,
    updateTeamEvent
} from '@/utils/api';

import {
    EventType,
    ParticipationStatus
} from '@/utils/const';

import {
    combinateDateAndTime,
    formatDate,
    getFullName,
    getParticipationStatusColor,
    showErrorNotification,
    showSuccessNotification,
    useSquadCoachPermissions,
    validateString
} from '@/utils/helpers';

import {
    ActionIcon,
    Avatar,
    Button,
    Card,
    Divider,
    Group,
    Indicator,
    MultiSelect,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    Tooltip
} from '@mantine/core';

import {
    DatePickerInput,
    TimePicker
} from '@mantine/dates';

import { useForm } from '@mantine/form';

import {
    IconCalendar,
    IconClockHour1,
    IconDeviceFloppy,
    IconMapPin,
    IconPencil,
    IconTrash,
    IconUser,
    IconUserPlus
} from '@tabler/icons-react';

import { useEffect, useState } from 'react';
import MembershipsDrawer from '../drawers/MembershipsDrawer';
import type { User } from '@/types/User';
import { useNavigate } from 'react-router';
import type { Squad } from '@/types/Squad';

interface IEventDetail {
    eventId?: string;
}

const EventDetail = ({ eventId }: IEventDetail) => {
    const navigate = useNavigate();

    const [isSaving, setIsSaving] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [squads, setSquads] = useState<Squad[]>([]);
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
            squads: []
        },

        validate: {
            title: validateString,
            type: validateString,
            startTime: validateString,
            endTime: validateString
        }
    });

    const handleDelete = (userId: string) => {
        form.setFieldValue(
            'eventParticipations',
            form.values.eventParticipations.filter(
                (p) => p.user._id !== userId
            )
        );
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
        } catch {
            showErrorNotification('Chyba při mazání události');
        }
    };

    const handleParticipantsAdd = (newUsers: User[]) => {
        const newParticipations = newUsers.map((user) => ({
            tempId: crypto.randomUUID(),
            user,
            status: ParticipationStatus.PENDING.value
        }));

        form.setFieldValue('eventParticipations', [
            ...form.values.eventParticipations,
            ...newParticipations
        ]);
    };

    const handleSave = async (values: typeof form.values) => {
        setIsSaving(true);

        const startDate = combinateDateAndTime(
            values.date,
            values.startTime
        );

        const endDate = combinateDateAndTime(
            values.date,
            values.endTime
        );

        const payload = {
            title: values.title,
            type: values.type,
            startDate,
            endDate,
            venue: values.venue?._id ?? null,
            squads: values.squads.map((s) => s._id),
            participations: values.eventParticipations.map((p) => ({
                userId: p.user._id,
                status: p.status
            }))
        };

        try {
            if (values._id) {
                await updateTeamEvent(values._id, payload);
                showSuccessNotification('Událost úspěšně aktualizována');
            } else {
                const response = await createTeamEvent(payload);
                showSuccessNotification('Událost vytvořena');
                navigate(`/event-detail/${response.eventId}`);
            }
        } catch {
            showErrorNotification('Chyba při ukládání události');
        } finally {
            setIsSaving(false);
            setEditMode(false);
        }
    };

    const loadData = async () => {
        const event = await getTeamEvent(eventId);

        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        form.setValues({
            ...event,
            date: start,
            startTime: start.toTimeString().slice(0, 5),
            endTime: end.toTimeString().slice(0, 5),
            venue: event.venue
                ? { _id: event.venue._id, name: event.venue.name }
                : null,
            squads: event.squads || [],
            eventParticipations: event.eventParticipations || []
        });

        loadVenuesAndSquads();
    };

    const loadVenuesAndSquads = async () => {
        const [venues, squads] = await Promise.all([
            getVenues(),
            getSquads()
        ]);

        setVenues(venues);
        setSquads(squads);
    };

    useEffect(() => {
        if (eventId) {
            loadData();
        } else {
            loadVenuesAndSquads();
            setEditMode(true);
        }
    }, [eventId]);

    return (
        <>
            <form onSubmit={form.onSubmit(handleSave)}>
                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="md">

                        <Group justify="space-between" wrap="wrap">
                            <Stack gap={0}>
                                <Title order={3}>Detail události</Title>
                                <Text size="xs" c="dimmed">
                                    Informace o události a účasti
                                </Text>
                            </Stack>

                            {editMode && eventId && (
                                <Button
                                    size="sm"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={handleEventDelete}
                                >
                                    Smazat
                                </Button>
                            )}
                        </Group>

                        <Divider />

                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">

                            <TextInput
                                label="Název"
                                leftSection={<IconUser size={16} />}
                                value={form.values.title}
                                onChange={(e) =>
                                    form.setFieldValue(
                                        'title',
                                        e.currentTarget.value
                                    )
                                }
                                readOnly={!editMode}
                            />

                            <Select
                                label="Typ"
                                data={Object.values(EventType)}
                                value={form.values.type}
                                onChange={(v) =>
                                    form.setFieldValue('type', v || '')
                                }
                                readOnly={!editMode}
                            />

                            <DatePickerInput
                                label="Datum"
                                leftSection={<IconCalendar size={16} />}
                                value={form.values.date}
                                onChange={(date) =>
                                    form.setFieldValue('date', new Date(date))
                                }
                                readOnly={!editMode}
                            />

                            <TimePicker
                                label="Začátek"
                                leftSection={<IconClockHour1 size={16} />}
                                value={form.values.startTime}
                                onChange={(time) =>
                                    form.setFieldValue('startTime', time)
                                }
                                readOnly={!editMode}
                            />

                            <TimePicker
                                label="Konec"
                                leftSection={<IconClockHour1 size={16} />}
                                value={form.values.endTime}
                                onChange={(time) =>
                                    form.setFieldValue('endTime', time)
                                }
                                readOnly={!editMode}
                            />

                            <MultiSelect
                                label="Celky"
                                searchable
                                data={squads.map((s) => ({
                                    value: s._id,
                                    label: s.name
                                }))}
                                value={form.values.squads.map((s) => s._id)}
                                onChange={(values) => {
                                    form.setFieldValue(
                                        'squads',
                                        squads.filter((s) =>
                                            values.includes(s._id)
                                        )
                                    );
                                }}
                                readOnly={!editMode}
                            />

                            <Select
                                label="Hala"
                                leftSection={<IconMapPin size={16} />}
                                searchable
                                data={venues.map((v) => ({
                                    value: v._id,
                                    label: v.name
                                }))}
                                value={form.values.venue?._id || null}
                                onChange={(value) => {
                                    const venue = venues.find(
                                        (v) => v._id === value
                                    );

                                    form.setFieldValue(
                                        'venue',
                                        venue
                                            ? { _id: venue._id, name: venue.name }
                                            : null
                                    );
                                }}
                                readOnly={!editMode}
                            />

                        </SimpleGrid>

                        <Card withBorder radius="md" p="sm">
                            <Group justify="space-between">
                                <Title order={5}>Účast</Title>

                                {editMode && (
                                    <Tooltip label="Přidat účastníka" withArrow>
                                        <ActionIcon
                                            variant="light"
                                            radius="xl"
                                            onClick={() => setIsDrawerOpen(true)}
                                        >
                                            <IconUserPlus size={18} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Group>

                            <Stack gap="xs" mt="xs">
                                {form.values.eventParticipations.length === 0 ? (
                                    <Text c="dimmed" size="sm">
                                        Zatím nejsou přiřazeni žádní členové.
                                    </Text>
                                ) : (
                                    <>
                                        {/* DESKTOP TABLE */}
                                        <Table striped highlightOnHover visibleFrom="sm">
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Uživatel</Table.Th>
                                                    <Table.Th>Status</Table.Th>
                                                    <Table.Th>Datum</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>

                                            <Table.Tbody>
                                                {form.values.eventParticipations.map((part) => (
                                                    <Table.Tr key={part.user._id}>
                                                        <Table.Td>
                                                            <Indicator
                                                                color={getParticipationStatusColor(part.status)}
                                                                size={8}
                                                                offset={4}
                                                                zIndex={1}
                                                                position='bottom-start'
                                                            >
                                                                <Avatar
                                                                    radius="xl"
                                                                    size="sm"
                                                                    color="initials"
                                                                    name={getFullName(part.user)}
                                                                    src={part.user.imageUrl}
                                                                />
                                                            </Indicator>
                                                        </Table.Td>

                                                        <Table.Td>
                                                            <Text
                                                                style={{
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap',
                                                                }}
                                                            >
                                                                {getFullName(part.user)}
                                                            </Text>
                                                        </Table.Td>

                                                        <Table.Td>
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
                                                                size="sm"
                                                                w={200}
                                                                disabled={!editMode}
                                                            />
                                                        </Table.Td>

                                                        <Table.Td>
                                                            {editMode ? (
                                                                <ActionIcon
                                                                    size={32}
                                                                    radius="xl"
                                                                    variant="subtle"
                                                                    onClick={() => handleDelete(part.user._id)}
                                                                >
                                                                    <IconTrash size={18} />
                                                                </ActionIcon>
                                                            ) : (
                                                                <Text size="xs" c="dimmed">
                                                                    {(new Date(part.updatedAt || part.createdAt).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }))}
                                                                </Text>
                                                            )}
                                                        </Table.Td>
                                                    </Table.Tr>
                                                ))}
                                            </Table.Tbody>
                                        </Table>

                                        {/* MOBILE LIST */}
                                        <Stack hiddenFrom="sm" gap={6}>
                                            {form.values.eventParticipations.map((part) => (
                                                <Paper
                                                    key={part.user._id}
                                                    p="xs"
                                                    withBorder
                                                    radius="md"
                                                    bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"

                                                >
                                                    <Group justify="space-between" align="flex-start" wrap="nowrap">
                                                        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                                            <Group gap="sm" wrap="nowrap" align="center">

                                                                <Indicator
                                                                    color={getParticipationStatusColor(part.status)}
                                                                    size={8}
                                                                    offset={4}
                                                                    position="bottom-start"
                                                                >
                                                                    <Avatar
                                                                        radius="xl"
                                                                        size="sm"
                                                                        color="initials"
                                                                        name={getFullName(part.user)}
                                                                        src={part.user.imageUrl}
                                                                    />
                                                                </Indicator>

                                                                <Text
                                                                    fw={600}
                                                                    size="sm"
                                                                    style={{
                                                                        flex: 1,
                                                                        minWidth: 0,
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                >
                                                                    {getFullName(part.user)}
                                                                </Text>

                                                            </Group>

                                                            {!editMode && (
                                                                <Text size="xs" c="dimmed">
                                                                    {formatDate(new Date(part.createdAt))}
                                                                </Text>
                                                            )}

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
                                                                size="xs"
                                                                disabled={!editMode}
                                                            />
                                                        </Stack>

                                                        {editMode && (
                                                            <ActionIcon
                                                                color="red"
                                                                variant="subtle"
                                                                radius="xl"
                                                                onClick={() => handleDelete(part.user._id)}
                                                            >
                                                                <IconTrash size={16} />
                                                            </ActionIcon>
                                                        )}
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </Card>

                        {useSquadCoachPermissions(form.values.squads) && (
                            <Group justify="space-between">

                                <Button
                                    size="sm"
                                    variant="light"
                                    leftSection={<IconPencil size={16} />}
                                    onClick={() => { setEditMode(!editMode); if (editMode) loadData(); }}
                                >
                                    {editMode ? 'Zrušit' : 'Upravit'}
                                </Button>

                                {editMode && (
                                    <Button
                                        size="sm"
                                        loading={isSaving}
                                        type="submit"
                                        leftSection={<IconDeviceFloppy size={16} />}
                                    >
                                        Uložit
                                    </Button>
                                )}

                            </Group>
                        )}

                    </Stack>
                </Paper>
            </form>

            <MembershipsDrawer
                isDrawerOpen={isDrawerOpen}
                setIsDrawerOpen={setIsDrawerOpen}
                eventParticipations={form.values.eventParticipations}
                onSave={handleParticipantsAdd}
            />
        </>
    );
};

export default EventDetail;