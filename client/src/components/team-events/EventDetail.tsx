import type { Venue } from '@/types/Venue';
import {
    cancelTeamEvent,
    createTeamEvent,
    deleteTeamEvent,
    getSquads,
    getTeamEvent,
    getVenues,
    remindTeamEvent,
    restoreTeamEvent,
    updateParticipationStatus,
    updateTeamEvent
} from '@/utils/api';

import {
    EventType,
    ParticipationStatus
} from '@/utils/const';

import {
    combinateDateAndTime,
    describeRecurrence,
    formatTeamEventDate,
    getEventColor,
    getFullName,
    getParticipationStatusColor,
    getParticipationStatusLabel,
    isEventFinished,
    showErrorNotification,
    showSuccessNotification,
    useSquadCoachPermissions,
    validateString
} from '@/utils/helpers';

import {
    ActionIcon,
    Alert,
    Avatar,
    Badge,
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
    ThemeIcon,
    Title,
    Tooltip
} from '@mantine/core';

import {
    DatePickerInput,
    TimePicker
} from '@mantine/dates';

import { useForm } from '@mantine/form';

import {
    IconBan,
    IconBellRinging,
    IconCalendar,
    IconClockHour1,
    IconDeviceFloppy,
    IconMapPin,
    IconPencil,
    IconRepeat,
    IconRestore,
    IconTag,
    IconUsersGroup,
    IconTrash,
    IconUser,
    IconUserPlus
} from '@tabler/icons-react';

import { useEffect, useMemo, useState } from 'react';
import MembershipsDrawer from '../drawers/MembershipsDrawer';
import EventScopeModal, { type EventScopeMode } from '../modals/EventScopeModal';
import RsvpButtons from './RsvpButtons';
import RecurrenceFields from './RecurrenceFields';
import { fromRecurrenceRule, toRecurrenceRule, validateRecurrence, type RecurrenceFormValue } from '@/utils/recurrence';
import type { User } from '@/types/User';
import { useNavigate } from 'react-router';
import type { Squad } from '@/types/Squad';
import type { EditScope, EventSeries } from '@/types/EventSeries';
import type { EventParticipation } from '@/types/EventParticipation';
import { useAuth } from '@/context/AuthContext';
import { ErrorState, ListSkeleton } from '../ui/StateViews';

// Label + value row of the read-only event summary
const InfoRow = ({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) => (
    <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon variant="light" radius="xl" size="lg">{icon}</ThemeIcon>
        <Stack gap={0} style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm" fw={500} component="div">{children}</Text>
        </Stack>
    </Group>
);

interface IEventDetail {
    eventId?: string;
}

type FormParticipation = EventParticipation & { tempId?: string };

// Active players of a squad (memberships are populated by getSquads)
const getSquadPlayers = (squad?: Squad): User[] =>
    (squad?.memberships ?? [])
        .filter((member) => member.active !== false && member.roles?.includes('player') && member.user?._id)
        .map((member) => member.user as User);

const formatTimestamp = (value?: Date | string) =>
    value
        ? new Date(value).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '';

const EventDetail = ({ eventId }: IEventDetail) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isSaving, setIsSaving] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);
    const [squads, setSquads] = useState<Squad[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [series, setSeries] = useState<EventSeries | null>(null);
    const [status, setStatus] = useState<string>('scheduled');
    const [cancelReason, setCancelReason] = useState<string>('');
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [recurrence, setRecurrence] = useState<RecurrenceFormValue | null>(null);
    const [recurrenceError, setRecurrenceError] = useState<string | null>(null);
    const [scopeModal, setScopeModal] = useState<EventScopeMode | null>(null);
    const [isReminding, setIsReminding] = useState(false);
    const [isLoading, setIsLoading] = useState(Boolean(eventId));
    const [loadError, setLoadError] = useState<string | null>(null);

    const form = useForm({
        initialValues: {
            _id: undefined,
            title: '',
            type: 'training',
            date: null,
            startTime: '',
            endTime: '',
            venue: null,
            eventParticipations: [] as FormParticipation[],
            squads: [] as Squad[]
        },

        validate: {
            title: validateString,
            type: validateString,
            date: (value) => (value ? null : 'Vyberte datum'),
            startTime: validateString,
            endTime: (value, values) => {
                if (!value?.trim()) return 'Toto pole je povinné';
                return value.slice(0, 5) <= values.startTime.slice(0, 5) ? 'Konec musí být po začátku' : null;
            }
        }
    });

    const isNew = !eventId;
    const isSeries = Boolean(series?._id);
    const isCanceled = status === 'canceled';
    const canManage = useSquadCoachPermissions(form.values.squads) || isNew;
    const originalRule = useMemo(() => (series?.recurrence ? fromRecurrenceRule(series.recurrence) : null), [series]);
    const recurrenceChanged = isSeries && JSON.stringify(recurrence) !== JSON.stringify(originalRule);

    const myParticipation = form.values.eventParticipations.find((p) => p.user?._id === user?._id);

    const attendance = useMemo(() => {
        const counts: Record<string, number> = { confirmed: 0, maybe: 0, declined: 0, pending: 0 };
        for (const participation of form.values.eventParticipations) {
            counts[participation.status ?? 'pending'] = (counts[participation.status ?? 'pending'] ?? 0) + 1;
        }
        return counts;
    }, [form.values.eventParticipations]);

    const canRemind = !isNew && canManage && !editMode && !isCanceled && attendance.pending > 0
        && !(endDate && isEventFinished({ endDate }));

    const handleDelete = (userId: string) => {
        form.setFieldValue(
            'eventParticipations',
            form.values.eventParticipations.filter(
                (p) => p.user._id !== userId
            )
        );
    };

    const addParticipants = (users: User[]) => {
        const existingIds = new Set(form.values.eventParticipations.map((p) => p.user?._id));
        const newParticipations = users
            .filter((u) => !existingIds.has(u._id))
            .map((u) => ({
                tempId: crypto.randomUUID(),
                user: u,
                status: ParticipationStatus.PENDING.value
            } as FormParticipation));

        form.setFieldValue('eventParticipations', [
            ...form.values.eventParticipations,
            ...newParticipations
        ]);
    };

    // Selecting a squad invites all its players; removing a squad removes its players who have not answered yet
    const handleSquadsChange = (squadIds: string[]) => {
        const selected = squads.filter((s) => squadIds.includes(s._id));
        const previousIds = form.values.squads.map((s) => s._id);
        const added = selected.filter((s) => !previousIds.includes(s._id));
        const removed = form.values.squads.filter((s) => !squadIds.includes(s._id));

        const remainingPlayerIds = new Set(selected.flatMap((s) => getSquadPlayers(squads.find((x) => x._id === s._id)).map((u) => u._id)));
        const removedPlayerIds = new Set(removed.flatMap((s) => getSquadPlayers(squads.find((x) => x._id === s._id)).map((u) => u._id)));

        const kept = form.values.eventParticipations.filter((p) =>
            !(removedPlayerIds.has(p.user?._id) && !remainingPlayerIds.has(p.user?._id) && (p.status ?? 'pending') === 'pending')
        );

        const keptIds = new Set(kept.map((p) => p.user?._id));
        const newParticipations = added
            .flatMap((s) => getSquadPlayers(s))
            .filter((u, index, all) => !keptIds.has(u._id) && all.findIndex((x) => x._id === u._id) === index)
            .map((u) => ({ tempId: crypto.randomUUID(), user: u, status: ParticipationStatus.PENDING.value } as FormParticipation));

        form.setValues({ squads: selected, eventParticipations: [...kept, ...newParticipations] });
    };

    const buildPayload = (values: typeof form.values) => {
        const startDate = combinateDateAndTime(values.date, values.startTime);
        const endDateValue = combinateDateAndTime(values.date, values.endTime);

        return {
            title: values.title,
            type: values.type,
            startDate,
            endDate: endDateValue,
            venue: values.venue?._id ?? null,
            squads: values.squads.map((s) => s._id),
            participations: values.eventParticipations.map((p) => ({
                userId: p.user._id,
                status: p.status
            }))
        };
    };

    const saveEvent = async (values: typeof form.values, scope: EditScope = 'this') => {
        setIsSaving(true);

        try {
            if (values._id) {
                await updateTeamEvent(values._id, {
                    ...buildPayload(values),
                    scope,
                    // The rule is sent only when it was changed (count is then counted from this occurrence)
                    recurrence: scope !== 'this' && recurrenceChanged && recurrence ? toRecurrenceRule(recurrence) : undefined
                });
                showSuccessNotification('Událost byla uložena');
                setEditMode(false);
                setScopeModal(null);
                await loadData();
            } else {
                const response = await createTeamEvent({
                    ...buildPayload(values),
                    recurrence: recurrence ? toRecurrenceRule(recurrence) : undefined
                });
                showSuccessNotification(response.occurrences ? `Vytvořeno ${response.occurrences} událostí` : 'Událost byla vytvořena');
                setEditMode(false);
                navigate(`/event-detail/${response.eventId}`);
            }
        } catch (error) {
            showErrorNotification((error as Error)?.message || 'Chyba při ukládání události');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = (values: typeof form.values) => {
        const error = validateRecurrence(recurrence, values.date);
        setRecurrenceError(error);
        if (error) return;

        if (isSeries) {
            setScopeModal('edit');
            return;
        }

        saveEvent(values);
    };

    const handleScopeConfirm = async (scope: EditScope, reason?: string) => {
        if (scopeModal === 'edit') {
            await saveEvent(form.values, scope);
            return;
        }

        setIsSaving(true);
        try {
            if (scopeModal === 'cancel') {
                await cancelTeamEvent(eventId, scope, reason);
                showSuccessNotification('Událost byla zrušena');
                setScopeModal(null);
                await loadData();
            }

            if (scopeModal === 'delete') {
                await deleteTeamEvent(eventId, scope);
                showSuccessNotification('Událost byla smazána');
                setScopeModal(null);
                navigate('/overview');
            }
        } catch (error) {
            showErrorNotification((error as Error)?.message || 'Akci se nepodařilo provést');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestore = async () => {
        setIsSaving(true);
        try {
            await restoreTeamEvent(eventId);
            showSuccessNotification('Událost byla obnovena');
            await loadData();
        } catch (error) {
            showErrorNotification((error as Error)?.message || 'Událost se nepodařilo obnovit');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemind = async () => {
        setIsReminding(true);
        try {
            const { remindedCount } = await remindTeamEvent(eventId);
            showSuccessNotification(`Připomínka odeslána (${remindedCount})`);
        } catch (error) {
            showErrorNotification((error as Error)?.message === 'A reminder was sent less than an hour ago'
                ? 'Připomínku lze poslat nejvýše jednou za hodinu'
                : 'Připomínku se nepodařilo odeslat');
        } finally {
            setIsReminding(false);
        }
    };

    const handleMyRsvp = async (newStatus: string, note?: string) => {
        await updateParticipationStatus(eventId, newStatus, note);
        form.setFieldValue(
            'eventParticipations',
            form.values.eventParticipations.map((p) =>
                p.user?._id === user?._id ? { ...p, status: newStatus as EventParticipation['status'], note, updatedAt: new Date() } : p
            )
        );
        showSuccessNotification('Odpověď byla uložena');
    };

    const loadData = async () => {
        try {
            const event = await getTeamEvent(eventId);

            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            const eventSeries = event.series && typeof event.series === 'object' ? event.series as EventSeries : null;

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

            setSeries(eventSeries);
            setRecurrence(eventSeries?.recurrence ? fromRecurrenceRule(eventSeries.recurrence) : null);
            setRecurrenceError(null);
            setStatus(event.status ?? 'scheduled');
            setCancelReason(event.cancelReason ?? '');
            setEndDate(end);
        } catch (error) {
            setLoadError((error as Error)?.message || 'Událost se nepodařilo načíst');
        } finally {
            setIsLoading(false);
        }
    };

    const loadVenuesAndSquads = async () => {
        try {
            const [venuesData, squadsData] = await Promise.all([
                getVenues(),
                getSquads()
            ]);

            setVenues(venuesData);
            setSquads(squadsData);
        } catch {
            showErrorNotification('Nepodařilo se načíst haly a celky');
        }
    };

    useEffect(() => {
        loadVenuesAndSquads();

        if (eventId) {
            setEditMode(false);
            loadData();
        } else {
            setEditMode(true);
        }
    }, [eventId]);

    const statusSelect = (part: FormParticipation, size: 'xs' | 'sm') => !editMode ? (
        <Badge variant="light" color={getParticipationStatusColor(part.status)} size={size === 'sm' ? 'md' : 'sm'}>
            {getParticipationStatusLabel(part.status)}
        </Badge>
    ) : (
        <Select
            data={Object.values(ParticipationStatus)}
            value={part.status || 'pending'}
            onChange={(value) => {
                const updated = form.values.eventParticipations.map((p) =>
                    p.user._id === part.user._id
                        ? { ...p, status: (value || 'pending') as EventParticipation['status'] }
                        : p
                );

                form.setFieldValue('eventParticipations', updated);
            }}
            allowDeselect={false}
            searchable={false}
            size={size}
            w={size === 'sm' ? 170 : undefined}
            disabled={!editMode}
            aria-label={`Účast – ${getFullName(part.user)}`}
        />
    );

    if (loadError) return <ErrorState message={loadError} onRetry={() => { setLoadError(null); loadData(); }} />;
    if (isLoading) return <ListSkeleton rows={3} height={120} />;

    return (
        <>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Paper withBorder radius="lg" p="lg">
                    <Stack gap="md">

                        <Group justify="space-between" wrap="wrap">
                            <Stack gap={4}>
                                <Group gap="xs">
                                    <Title order={3} td={isCanceled ? 'line-through' : undefined}>
                                        {isNew ? 'Nová událost' : form.values.title || 'Detail události'}
                                    </Title>
                                    {isCanceled && <Badge color="red" variant="filled">Zrušeno</Badge>}
                                </Group>
                                {isSeries && (
                                    <Group gap={6}>
                                        <IconRepeat size={14} />
                                        <Text size="xs" c="dimmed">
                                            Opakovaná událost: {describeRecurrence(series.recurrence)}
                                        </Text>
                                    </Group>
                                )}
                            </Stack>

                            {!isNew && canManage && !editMode && (
                                <Group gap="xs">
                                    {isCanceled ? (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="green"
                                            leftSection={<IconRestore size={16} />}
                                            loading={isSaving}
                                            onClick={handleRestore}
                                        >
                                            Obnovit
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            color="orange"
                                            leftSection={<IconBan size={16} />}
                                            onClick={() => setScopeModal('cancel')}
                                        >
                                            Zrušit událost
                                        </Button>
                                    )}
                                </Group>
                            )}

                            {editMode && eventId && (
                                <Button
                                    size="sm"
                                    variant="light"
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={() => setScopeModal('delete')}
                                >
                                    Smazat
                                </Button>
                            )}
                        </Group>

                        {isCanceled && (
                            <Alert color="red" variant="light" icon={<IconBan size={18} />} title="Událost je zrušená">
                                {cancelReason ? `Důvod: ${cancelReason}` : 'Důvod nebyl uveden.'}
                            </Alert>
                        )}

                        {!editMode && myParticipation && (
                            <Card withBorder radius="md" p="sm">
                                <Group justify="space-between" wrap="wrap" gap="sm">
                                    <Stack gap={0}>
                                        <Text fw={600} size="sm">Moje účast</Text>
                                        {myParticipation.note && (
                                            <Text size="xs" c="dimmed">Důvod: {myParticipation.note}</Text>
                                        )}
                                    </Stack>
                                    <RsvpButtons
                                        status={myParticipation.status}
                                        note={myParticipation.note}
                                        disabled={isCanceled || (endDate ? isEventFinished({ endDate }) : false)}
                                        onChange={handleMyRsvp}
                                    />
                                </Group>
                            </Card>
                        )}

                        <Divider />

                        {editMode ? (
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">

                            <TextInput
                                label="Název"
                                leftSection={<IconUser size={16} />}
                                {...form.getInputProps('title')}
                                readOnly={!editMode}
                            />

                            <Select
                                label="Typ"
                                data={Object.values(EventType)}
                                value={form.values.type}
                                onChange={(v) =>
                                    form.setFieldValue('type', v || '')
                                }
                                allowDeselect={false}
                                readOnly={!editMode}
                            />

                            <DatePickerInput
                                label="Datum"
                                valueFormat="D. M. YYYY"
                                leftSection={<IconCalendar size={16} />}
                                value={form.values.date}
                                error={form.errors.date}
                                onChange={(date) => {
                                    const newDate = date ? new Date(date) : null;
                                    form.setFieldValue('date', newDate);
                                    // New weekly series: follow the chosen date until the user picks more days
                                    if (isNew && newDate && recurrence?.frequency === 'weekly' && recurrence.weekdays.length <= 1) {
                                        setRecurrence({ ...recurrence, weekdays: [newDate.getDay()] });
                                    }
                                }}
                                readOnly={!editMode || (isSeries && editMode && recurrenceChanged)}
                            />

                            <TimePicker
                                label="Začátek"
                                leftSection={<IconClockHour1 size={16} />}
                                value={form.values.startTime}
                                error={form.errors.startTime}
                                onChange={(time) =>
                                    form.setFieldValue('startTime', time)
                                }
                                readOnly={!editMode}
                            />

                            <TimePicker
                                label="Konec"
                                leftSection={<IconClockHour1 size={16} />}
                                value={form.values.endTime}
                                error={form.errors.endTime}
                                onChange={(time) =>
                                    form.setFieldValue('endTime', time)
                                }
                                readOnly={!editMode}
                            />

                            <MultiSelect
                                label="Celky"
                                description={editMode ? 'Výběrem celku se pozvou všichni jeho hráči' : undefined}
                                searchable
                                data={squads.map((s) => ({
                                    value: s._id,
                                    label: s.name
                                }))}
                                value={form.values.squads.map((s) => s._id)}
                                onChange={handleSquadsChange}
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
                        ) : (
                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" verticalSpacing="sm">
                                <InfoRow icon={<IconCalendar size={18} />} label="Termín">
                                    {form.values.date && form.values.startTime && form.values.endTime
                                        ? formatTeamEventDate(
                                            combinateDateAndTime(form.values.date, form.values.startTime),
                                            combinateDateAndTime(form.values.date, form.values.endTime)
                                        )
                                        : '–'}
                                </InfoRow>
                                <InfoRow icon={<IconMapPin size={18} />} label="Místo">
                                    {form.values.venue?.name || '–'}
                                </InfoRow>
                                <InfoRow icon={<IconUsersGroup size={18} />} label="Celky">
                                    {form.values.squads.length > 0 ? (
                                        <Group gap={4}>
                                            {form.values.squads.map((squad) => (
                                                <Badge key={squad._id} variant="light">{squad.name}</Badge>
                                            ))}
                                        </Group>
                                    ) : '–'}
                                </InfoRow>
                                <InfoRow icon={<IconTag size={18} />} label="Typ">
                                    <Badge variant="light" color={getEventColor(form.values.type)}>
                                        {Object.values(EventType).find((type) => type.value === form.values.type)?.label}
                                    </Badge>
                                </InfoRow>
                            </SimpleGrid>
                        )}

                        {(isNew || (isSeries && editMode)) && (
                            <RecurrenceFields
                                value={recurrence}
                                onChange={(value) => { setRecurrence(value); setRecurrenceError(null); }}
                                startDate={form.values.date}
                                allowToggle={isNew}
                                readOnly={!editMode}
                                error={recurrenceError}
                            />
                        )}

                        <Card withBorder radius="md" p="sm">
                            <Group justify="space-between" wrap="wrap" gap="xs">
                                <Group gap="xs">
                                    <Title order={5}>Účast</Title>
                                    {Object.values(ParticipationStatus).map((option) => (
                                        <Badge
                                            key={option.value}
                                            variant="light"
                                            color={getParticipationStatusColor(option.value)}
                                        >
                                            {option.label}: {attendance[option.value] ?? 0}
                                        </Badge>
                                    ))}
                                </Group>

                                {canRemind && (
                                    <Button
                                        size="xs"
                                        variant="light"
                                        color="yellow"
                                        leftSection={<IconBellRinging size={14} />}
                                        loading={isReminding}
                                        onClick={handleRemind}
                                    >
                                        Připomenout neodpovězeným ({attendance.pending})
                                    </Button>
                                )}

                                {editMode && (
                                    <Tooltip label="Přidat účastníka" withArrow>
                                        <ActionIcon
                                            variant="light"
                                            radius="xl"
                                            aria-label="Přidat účastníka"
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
                                        Zatím nejsou přiřazeni žádní členové. Vyberte celek nebo přidejte hráče ručně.
                                    </Text>
                                ) : (
                                    <>
                                        {/* DESKTOP TABLE */}
                                        <Table striped highlightOnHover visibleFrom="sm">
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th w={48} />
                                                    <Table.Th>Člen</Table.Th>
                                                    <Table.Th>Účast</Table.Th>
                                                    <Table.Th>{editMode ? '' : 'Změněno'}</Table.Th>
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
                                                            <Text size="sm" truncate>
                                                                {getFullName(part.user)}
                                                            </Text>
                                                            {part.note && (
                                                                <Text size="xs" c="dimmed">{part.note}</Text>
                                                            )}
                                                        </Table.Td>

                                                        <Table.Td>
                                                            {statusSelect(part, 'sm')}
                                                        </Table.Td>

                                                        <Table.Td>
                                                            {editMode ? (
                                                                <ActionIcon
                                                                    size={32}
                                                                    radius="xl"
                                                                    variant="subtle"
                                                                    color="red"
                                                                    aria-label={`Odebrat ${getFullName(part.user)}`}
                                                                    onClick={() => handleDelete(part.user._id)}
                                                                >
                                                                    <IconTrash size={18} />
                                                                </ActionIcon>
                                                            ) : (
                                                                <Text size="xs" c="dimmed">
                                                                    {formatTimestamp(part.updatedAt || part.createdAt)}
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
                                                                    zIndex={1}
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

                                                                <Text fw={600} size="sm" truncate style={{ flex: 1, minWidth: 0 }}>
                                                                    {getFullName(part.user)}
                                                                </Text>
                                                            </Group>

                                                            {part.note && (
                                                                <Text size="xs" c="dimmed">{part.note}</Text>
                                                            )}

                                                            {statusSelect(part, 'xs')}
                                                        </Stack>

                                                        {editMode && (
                                                            <ActionIcon
                                                                color="red"
                                                                variant="subtle"
                                                                radius="xl"
                                                                aria-label={`Odebrat ${getFullName(part.user)}`}
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

                        {canManage && (
                            <Group justify="space-between">
                                {!isNew ? (
                                    <Button
                                        size="sm"
                                        variant="light"
                                        leftSection={<IconPencil size={16} />}
                                        onClick={() => { setEditMode(!editMode); if (editMode) loadData(); }}
                                    >
                                        {editMode ? 'Zrušit úpravy' : 'Upravit'}
                                    </Button>
                                ) : <span />}

                                {editMode && (
                                    <Button
                                        size="sm"
                                        loading={isSaving}
                                        type="submit"
                                        leftSection={<IconDeviceFloppy size={16} />}
                                    >
                                        {isNew ? 'Vytvořit' : 'Uložit'}
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
                onSave={addParticipants}
            />

            <EventScopeModal
                opened={scopeModal !== null}
                mode={scopeModal ?? 'edit'}
                isSeries={isSeries}
                loading={isSaving}
                disableThisScope={scopeModal === 'edit' && recurrenceChanged}
                onClose={() => setScopeModal(null)}
                onConfirm={handleScopeConfirm}
            />
        </>
    );
};

export default EventDetail;
