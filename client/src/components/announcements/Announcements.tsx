import type { Announcement } from '@/types/Announcement';
import { deleteAnnouncement, getAnnouncements } from '@/utils/api';
import { getFullName, showErrorNotification, showSuccessNotification, useAdminPermissions } from '@/utils/helpers';
import {
    ActionIcon,
    Avatar,
    Badge,
    TypographyStylesProvider,
    Button,
    Divider,
    Group,
    Paper,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconPin, IconPlus, IconSpeakerphone, IconTrash } from '@tabler/icons-react';
import { useConfirm } from '@/hooks/useConfirm';
import PageHeader from '../ui/PageHeader';
import { EmptyState, ErrorState, ListSkeleton } from '../ui/StateViews';
import { useEffect, useState } from 'react';
import AnnouncementModal from '../modals/AnnouncementModal';

const Announcements = () => {
    const isAdmin = useAdminPermissions();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const { confirm, confirmDialog } = useConfirm();
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
        const confirmed = await confirm({
            title: 'Smazat oznámení?',
            message: 'Oznámení zmizí ze Zdi i z veřejné stránky. Tuto akci nelze vrátit.',
            confirmLabel: 'Smazat',
            danger: true,
        });
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
            const response = await getAnnouncements();
            setAnnouncements(response?.announcements || response || []);
            setLoadError(null);
        } catch (error) {
            setLoadError((error as Error)?.message || 'Nepodařilo se načíst oznámení');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAnnouncements();
    }, []);

    return (
        <Stack gap={0}>
            <PageHeader
                title="Zeď"
                description="Novinky a oznámení klubu."
                actions={isAdmin && (
                    <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
                        Nové oznámení
                    </Button>
                )}
            />

            <Stack gap="md">
                {isLoading && <ListSkeleton rows={3} height={160} />}

                {!isLoading && loadError && <ErrorState message={loadError} onRetry={loadAnnouncements} />}

                {!isLoading && !loadError && announcements.length === 0 && (
                    <EmptyState
                        icon={<IconSpeakerphone size={24} />}
                        title="Zatím žádná oznámení"
                        description={isAdmin ? 'Vytvořte první oznámení tlačítkem „Nové oznámení“.' : 'Jakmile klub něco oznámí, uvidíte to tady.'}
                    />
                )}

                {!isLoading && !loadError && announcements.map((announcement) => (
                    <Paper
                        withBorder
                        radius="lg"
                        p="lg"
                        key={announcement._id}
                        style={{
                            height: "100%",
                            borderLeft: announcement.pinned ? "4px solid var(--mantine-color-accent-5)" : undefined
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
                                            <Badge color="accent" variant="light" leftSection={<IconPin size={12} />}>Připnuté</Badge>
                                        )}
                                    </Group>
                                </Stack>

                                {isAdmin && (
                                    <Group gap="xs">
                                        <ActionIcon variant="light" aria-label="Upravit oznámení" onClick={() => openEdit(announcement)}>
                                            <IconEdit size={16} />
                                        </ActionIcon>
                                        <ActionIcon variant="light" color="red" aria-label="Smazat oznámení" onClick={() => handleDelete(announcement._id)}>
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Group>
                                )}

                            </Group>

                            <TypographyStylesProvider p={0}>
                                <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                            </TypographyStylesProvider>

                            <Divider />

                            <Group justify="space-between" align="center">
                                <Group gap="xs">
                                    <Avatar size="sm" radius="xl" color="initials" name={getFullName(announcement.author)} />
                                    <Text size="sm" fw={500}>{getFullName(announcement.author)}</Text>
                                </Group>
                                {announcement.updatedAt && (
                                    <Text size="xs" c="dimmed">
                                        {new Date(announcement.updatedAt).toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                )}
                            </Group>
                        </Stack>
                    </Paper>
                ))}
            </Stack>

            {confirmDialog}

            <AnnouncementModal isFormOpen={isFormOpen} setIsFormOpen={setIsFormOpen} form={form} editingAnnouncement={editingAnnouncement} loadAnnouncements={loadAnnouncements} />

        </Stack>
    );
};

export default Announcements;