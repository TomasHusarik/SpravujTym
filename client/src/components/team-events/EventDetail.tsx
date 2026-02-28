import type { Venue } from '@/types/Venue';
import { getTeamEvent, getUsers, getVenues } from '@/utils/api';
import { EventType } from '@/utils/const';
import { combinateDateAndTime, getFullName, validateFutureDate, validateString } from '@/utils/helpers';
import { Button, Grid, Select, Stack, Table, TextInput, Title, Text, ActionIcon } from '@mantine/core'
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconMapPin, IconTrash, IconUser } from '@tabler/icons-react'
import React, { useEffect, useState } from 'react'

interface IEventDetail {
    eventId: string;
}

const eventDetail = (props: IEventDetail) => {
    const { eventId } = props;

    const [isSaving, setIsSaving] = useState(false);
    const [venues, setVenues] = useState<Venue[]>([]);


    const form = useForm({
        initialValues: {
            _id: undefined,
            title: '',
            type: '',
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
            console.log('Loaded event data:', event);
            const venues = await getVenues();

            // Pre-fill form with existing event data
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);

            form.setValues({
                ...event,
                date: start,
                startTime: start.toTimeString().slice(0, 5),
                endTime: end.toTimeString().slice(0, 5),
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
        <form onSubmit={form.onSubmit((values) => handleSave(values))}>
            <Grid px={20}>
                <Grid.Col span={12}>
                    <Title order={1} c="var(--mantine-color-blue-light-color)"> Event Detail </Title>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <TextInput
                        label="Title"
                        placeholder="Title"
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        required
                        value={form.values.title}
                        onChange={(e) => form.setFieldValue('title', e.currentTarget.value)}
                        error={form.errors.title}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        label="Type"
                        placeholder="Type"
                        leftSection={<IconUser size={16} />}
                        radius="md"
                        size="md"
                        required
                        data={Object.values(EventType)}
                        value={form.values.type}
                        onChange={(value) => form.setFieldValue('type', value || '')}
                        error={form.errors.type}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <DatePickerInput
                        label="Date"
                        placeholder="Select date"
                        radius="md"
                        size="md"
                        required
                        value={form.values.date}
                        onChange={(date) => form.setFieldValue('date', date)}
                        error={form.errors.startDate}
                    />
                </Grid.Col>

                <Grid.Col span={{ base: 6, md: 3 }}>
                    <TimePicker
                        label="Start Time"
                        radius="md"
                        size="md"
                        required
                        value={form.values.startTime}
                        onChange={(time) => form.setFieldValue('startTime', time)}
                        error={form.errors.startDate}
                    />
                </Grid.Col>
                <Grid.Col span={{ base: 6, md: 3 }}>
                    <TimePicker
                        label="End Time"
                        radius="md"
                        size="md"
                        required
                        value={form.values.endTime}
                        onChange={(time) => form.setFieldValue('endTime', time)}
                        error={form.errors.endDate}
                    />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Select
                        label="Venue"
                        placeholder="Venue"
                        leftSection={<IconMapPin size={16} />}
                        radius="md"
                        size="md"
                        required
                        searchable
                        data={venues.map((venue) => ({ value: venue._id, label: venue.name }))}
                        value={form.values.venue?._id || null}
                        onChange={(value) => form.setFieldValue('venue', value ? { _id: value } : null)}
                        error={form.errors.venue}
                    />
                </Grid.Col>

                <Stack gap="xs">
                    {form.values.eventParticipations.length === 0 ? (
                        <Text c="dimmed">Zatím nejsou přiřazeni žádní členové.</Text>
                    ) : (
                        <Table striped highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Uživatel</Table.Th>
                                    <Table.Th>E-mail</Table.Th>
                                    <Table.Th>Delete</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {form.values.eventParticipations.map((part) => {
                                    return (
                                        <Table.Tr key={part._id}>
                                            <Table.Td>{getFullName(part.user)}</Table.Td>
                                            <Table.Td>{part.user?.email}</Table.Td>
                                            <Table.Td>
                                                <ActionIcon size={32} radius="xl" variant="subtle" onClick={(e) => { e.stopPropagation(); handleDelete(part._id); }}>
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

            <Grid.Col span={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    type="submit"
                    variant="light"
                    radius="md"
                    loading={isSaving}
                    leftSection={
                        <IconDeviceFloppy stroke={1.5} size={20} />
                    }
                >
                    Save
                </Button>
            </Grid.Col>
        </Grid>
        </form >
    )
}

export default eventDetail