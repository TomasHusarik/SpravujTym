import type { Announcement } from '@/types/Announcement';
import { deleteAnnouncement, getAnnouncements } from '@/utils/api';
import { getFullName, showErrorNotification, showSuccessNotification, useAdminPermissions } from '@/utils/helpers';
import {
    ActionIcon,
    Badge,
    Button,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import AnnouncementModal from '../modals/AnnouncementModal';

const Announcements = () => {
    const isAdmin = useAdminPermissions();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const form = useForm({
        initialValues: {
            title: '',
            context: '',
            visibility: 'private',
            pinned: false,
        },

        validate: {
            title: (val: string) => (val.trim() === '' ? 'Nadpis je povinný' : null),
            context: (val: string) => (val.trim() === '' ? 'Obsah je povinný' : null),
            visibility: (val: string) => (val.trim() === '' ? 'Viditelnost je povinná' : null),
        },
    });

    const openCreate = () => {
        setEditingAnnouncement(null);
        form.reset();
        form.clearErrors();
        setIsFormOpen(true);
    };

    const openEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        form.setValues({
            title: announcement.title || '',
            context: announcement.content || '',
            visibility: announcement.visibility || 'private',
            pinned: announcement.pinned || false,
        });
        form.clearErrors();
        setIsFormOpen(true);
    };

    const handleDelete = async (announcementId: string) => {
        const confirmed = window.confirm('Opravdu chcete toto oznámení smazat?');
        if (!confirmed) return;

        try {
            await deleteAnnouncement(announcementId);
            showSuccessNotification('Oznámení bylo smazáno');
            await loadAnnouncements();
        } catch (error) {
            showErrorNotification('Chyba při mazání oznámení');
            console.error('Error deleting announcement:', error);
        }
    };

    const loadAnnouncements = async () => {
        try {
            setIsLoading(true);
            const response = await getAnnouncements();
            setAnnouncements(response?.announcements || response || []);
        } catch (error) {
            showErrorNotification('Nepodařilo se načíst oznámení');
            console.error('Error loading announcements:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    return (
        <Stack gap="lg">
            {isAdmin && (
                <Paper withBorder radius="lg" p="lg">
                    <Group justify="space-between" align="center">
                        <div>
                            <Title order={3}>Oznámení</Title>
                            <Text size="sm" c="dimmed">Přehled a správa týmových oznámení.</Text>
                        </div>
                        <Button leftSection={<IconPlus size={16} />} radius="md" onClick={openCreate}>
                            Nové oznámení
                        </Button>
                    </Group>
                </Paper>
            )}

            <Stack gap="md">
                {isLoading && <Text c="dimmed">Načítám oznámení...</Text>}

                {!isLoading && announcements.length === 0 && (
                    <Paper withBorder radius="lg" p="lg">
                        <Text c="dimmed">Zatím nejsou vytvořená žádná oznámení.</Text>
                    </Paper>
                )}

                {!isLoading && announcements.map((announcement) => (
                    <Paper
                        withBorder
                        radius="lg"
                        p="lg"
                        key={announcement._id}
                        style={{
                            height: "100%",
                            borderColor: announcement.pinned ? "var(--mantine-color-yellow-4)" : undefined
                        }}
                    >
                        <Stack gap="sm">
                            <Group justify="space-between" align="flex-start">
                                <Stack gap={4}>
                                    <Title order={4}>{announcement.title}</Title>
                                    <Group gap="xs">
                                        {isAdmin && (
                                            <Badge color={announcement.visibility === 'public' ? 'blue' : 'gray'} variant="light">
                                                {announcement.visibility === 'public' ? 'Veřejnost' : 'Tým'}
                                            </Badge>
                                        )
                                        }
                                        {announcement.pinned && (
                                            <Badge color="yellow" variant="light">Připnuté</Badge>
                                        )}
                                    </Group>
                                </Stack>

                                {isAdmin && (
                                    <Group gap="xs">
                                        <ActionIcon variant="light" color="blue" onClick={() => openEdit(announcement)}>
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                        <ActionIcon variant="light" color="red" onClick={() => handleDelete(announcement._id)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                )}

                            </Group>

                            <div dangerouslySetInnerHTML={{ __html: announcement.content }} />

                            <Divider />

                            <Group justify="space-between" align="center">
                                <Badge color="blue" variant="light">
                                    {getFullName(announcement.author)}
                                </Badge>
                                <Text size="xs" c="dimmed">
                                    {announcement.updatedAt ?
                                        <Badge color="blue" variant="light">
                                            {new Date(announcement.updatedAt).toLocaleString('cs-CZ', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </Badge>
                                        :
                                        "N/A"
                                    }
                                </Text>
                            </Group>
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            <AnnouncementModal isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} form={form} editingAnnouncement={editingAnnouncement} loadAnnouncements={loadAnnouncements} />

        </Stack>
    );
};

export default Announcements;