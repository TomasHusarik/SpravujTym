import type { Venue } from '@/types/Venue';
import { getTeamEvent, getUsers, getVenues } from '@/utils/api';
import { EventType } from '@/utils/const';
import { combinateDateAndTime, validateFutureDate, validateString } from '@/utils/helpers';
import { Button, Grid, Select, TextInput, Title } from '@mantine/core'
import { DatePickerInput, TimePicker } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconDeviceFloppy, IconMapPin, IconUser } from '@tabler/icons-react'
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
        },

        validate: {
            title: (val: string) => validateString(val),
            type: (val: string) => validateString(val),
            startTime: (val: string) => validateString(val),
            endTime: (val: string) => validateString(val),
            date: (val: Date) => validateFutureDate(val),
        },
    });

    const handleSave = async (values: typeof form.values) => {
        const { startTime, endTime, date, ...restValues } = values;

        const payload = {
            ...restValues,
            startDate: combinateDateAndTime(values.date, startTime),
            endDate: combinateDateAndTime(values.date, endTime),
        };

        console.log('Saving event with payload:', payload);

        setIsSaving(true);
    };

    const loadData = async () => {
        try {
            const event = await getTeamEvent(eventId);
            const venues = await getVenues();
            const users = await getUsers();
            console.log(users);

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
        </form>
    )
}

export default eventDetail