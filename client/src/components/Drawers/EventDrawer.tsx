import { Button, Drawer, Grid, Select, Textarea, TextInput, Title } from '@mantine/core'
import { IconAt, IconUser, IconPhone, IconMapPin, IconDeviceFloppy } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { useForm } from '@mantine/form';
import type { TeamEvent } from '@/types/TeamEvent';
import ErrorMessages from '@/utils/errorMessages';
import { validateFutureDate, validateString } from '@/utils/helpers';

interface ICustomerDrawer {
    userDrawer: boolean;
    setUserDrawer: (value: boolean) => void;
}

const EventDrawer = (props: ICustomerDrawer) => {
    const { userDrawer, setUserDrawer } = props;
    const [isSaving, setIsSaving] = useState(false);
    const [teamEvent, setTeamEvent] = useState<TeamEvent>();

    const form = useForm({
        initialValues: {
            _id: teamEvent?._id,
            title: teamEvent?.title || '',
            type: teamEvent?.type || '',
            startDate: teamEvent?.startDate || null,
            endDate: teamEvent?.endDate || null,
            location: teamEvent?.location || '',
            squad: (teamEvent?.squad || '') as string,
        },

        validate: {
            title: (val: string) => validateString(val),
            type: (val: string) => validateString(val),
            startDate: (val: Date) => validateFutureDate(val),
            endDate: (val: Date) => validateFutureDate(val),
            location: (val: string) => validateString(val),
        },
    });

    // useEffect(() => {
    //     form.setValues({
    //         _id: customer?._id,
    //         firstName: customer?.firstName,
    //         lastName: customer?.lastName,
    //         email: customer?.email,
    //         phoneNumber: customer?.phoneNumber,
    //         address: customer?.address,
    //         note: customer?.note,
    //     });
    // }, []);

    const handleSave = async (values: typeof form.values) => {
        setIsSaving(true);
        try {
            // Save customer logic here
        } catch (error) {
            console.error('Error saving customer:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Drawer
                opened={userDrawer}
                onClose={() => { setUserDrawer(false); }}
                position='right'
                size={"lg"}
            >

                <form onSubmit={form.onSubmit((values) => handleSave(values))}>
                    <Grid px={20}>
                        <Grid.Col span={12}>
                            <Title order={1} c="var(--mantine-color-blue-light-color)"> Create event </Title>
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
                                data={[
                                    { value: 'training', label: 'Training' },
                                    { value: 'match', label: 'Match' },
                                    { value: 'other', label: 'Other' },
                                ]}
                                value={form.values.type}
                                onChange={(value) => form.setFieldValue('type', value || '')}
                                error={form.errors.type}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <TextInput
                                label="Location"
                                placeholder="Location"
                                leftSection={<IconMapPin size={16} />}
                                radius="md"
                                size="md"
                                required
                                value={form.values.location}
                                onChange={(e) => form.setFieldValue('location', e.currentTarget.value)}
                                error={form.errors.location}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Select
                                label="Squad"
                                placeholder="Squad"
                                leftSection={<IconUser size={16} />}
                                radius="md"
                                size="md"
                                required
                                data={[
                                    { value: 'A', label: 'A' },
                                    { value: 'B', label: 'B' },
                                    { value: 'C', label: 'C' },
                                ]}
                                value={form.values.squad}
                                onChange={(value) => form.setFieldValue('squad', value || '')}
                                error={form.errors.squad}
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
            </Drawer>
        </>
    )
}

export default EventDrawer