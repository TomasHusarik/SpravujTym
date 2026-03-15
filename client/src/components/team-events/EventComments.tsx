import React, { useEffect, useState } from 'react';

import {
    ActionIcon,
    Avatar,
    Button,
    Group,
    Paper,
    Stack,
    Text,
    Textarea,
    Title,
    Tooltip,
} from '@mantine/core';

import {
    IconCheck,
    IconDeviceFloppy,
    IconEdit,
    IconSend,
    IconTrash,
    IconX,
} from '@tabler/icons-react';

import { getFullName, showErrorNotification, showSuccessNotification, useAdminPermissions } from '@/utils/helpers';
import { createComment, deleteComment, getComments, updateComment } from '@/utils/api';
import type { Comment } from '@/types/Comment';
import { useAuth } from '@/context/AuthContext';

interface IEventComments {
    eventId: string;
}

const EventComments = (props: IEventComments) => {
    const { eventId } = props;

    const { user } = useAuth();
    const isAdmin = useAdminPermissions();

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        setIsSending(true);

        try {
            const payload: Comment = {
                content: newComment,
                event: eventId
            };

            await createComment(payload);
            loadData();
            showSuccessNotification('Komentář byl úspěšně přidán');
            setNewComment('');
        } catch {
            showErrorNotification('Nepodařilo se odeslat komentář');
        } finally {
            setIsSending(false);
        }
    };

    const handleEditStart = (comment: Comment) => {

        setEditingId(comment._id);
        setEditingText(comment.content);

    };

    const handleEditCancel = () => {

        setEditingId(null);
        setEditingText('');

    };

    const handleEditSave = async () => {

        if (!editingId) return;

        try {

            await updateComment(editingId, editingText);

            showSuccessNotification('Komentář byl upraven');

            setEditingId(null);
            setEditingText('');

            loadData();

        } catch {

            showErrorNotification('Nepodařilo se upravit komentář');

        }
    };


    const handleDelete = async (comment: Comment) => {
        try {
            await deleteComment(comment._id, comment.author._id);
            showSuccessNotification('Komentář byl úspěšně smazán');
            loadData();
        } catch {
            showErrorNotification('Nepodařilo se smazat komentář');
            console.error('Error deleting comment:', comment._id);
        }
    };

    const loadData = async () => {
        try {
            const com = await getComments(eventId);
            setComments(com);
        } catch {
            showErrorNotification('Chyba při načítání komentářů');
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // každých 5s

        return () => clearInterval(interval)
    }, [eventId]);

    return (
        <Paper withBorder radius="lg" p="lg">

            <Stack gap="md">

                <Title order={4}>Komentáře</Title>

                {/* ADD COMMENT */}
                <Textarea
                    placeholder="Napsat komentář..."
                    autosize
                    minRows={2}
                    maxRows={6}
                    value={newComment}
                    onChange={(e) => setNewComment(e.currentTarget.value)}
                    rightSection={
                        <Tooltip label="Odeslat" withArrow>
                            <ActionIcon
                                size={32}
                                radius="xl"
                                variant="subtle"
                                loading={isSending}
                                onClick={handleAddComment}
                            >
                                <IconSend size={18} />
                            </ActionIcon>
                        </Tooltip>
                    }
                />

                {/* COMMENTS */}

                {comments.length === 0 ? (

                    <Text c="dimmed" size="sm">
                        Zatím zde nejsou žádné komentáře.
                    </Text>

                ) : (

                    <Stack gap="sm">

                        {comments.map((comment) => (

                            <Paper
                                key={comment._id}
                                withBorder
                                radius="md"
                                p="sm"
                                bg="light-dark(var(--mantine-color-gray-1), var(--mantine-color-dark-6))"
                            >

                                <Stack gap={4}>

                                    {/* HEADER */}
                                    <Group justify="space-between" align="flex-start" wrap="nowrap">

                                        <Group gap="sm" align="flex-start">

                                            <Avatar
                                                radius="xl"
                                                size="sm"
                                                color="initials"
                                                name={getFullName(comment.author)}
                                                src={comment.author.imageUrl}
                                            />

                                            <Stack gap={0}>

                                                <Text fw={600} size="sm">
                                                    {getFullName(comment.author)}
                                                </Text>

                                                <Text size="xs" c="dimmed">
                                                    {new Date(comment.createdAt).toLocaleString('cs-CZ', {
                                                        day: 'numeric',
                                                        month: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </Text>
                                            </Stack>
                                        </Group>

                                        {editingId !== comment._id && (

                                            <Group gap="xs">

                                                {(user._id === comment.author._id) && (
                                                    <ActionIcon
                                                        variant="light"
                                                        color="blue"
                                                        onClick={() => handleEditStart(comment)}
                                                    >
                                                        <IconEdit size={16} />
                                                    </ActionIcon>
                                                )}

                                                {(isAdmin || user._id === comment.author._id) && (
                                                    <ActionIcon
                                                        variant="light"
                                                        color="red"
                                                        onClick={() => handleDelete(comment)}
                                                    >
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
                                        )}
                                    </Group>

                                    {/* CONTENT */}

                                    {editingId === comment._id ? (

                                        <Stack gap="xs" pl={34}>

                                            <Textarea
                                                autosize
                                                minRows={2}
                                                value={editingText}
                                                onChange={(e) => setEditingText(e.currentTarget.value)}
                                            />
                                            <Group gap="xs">
                                                <Button
                                                    size="xs"
                                                    leftSection={<IconCheck size={14} />}
                                                    onClick={handleEditSave}
                                                >
                                                    Uložit
                                                </Button>

                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    leftSection={<IconX size={14} />}
                                                    onClick={handleEditCancel}
                                                >
                                                    Zrušit
                                                </Button>
                                            </Group>

                                        </Stack>

                                    ) : (

                                        <Text size="sm" pl={34}>
                                            {comment.content}
                                        </Text>
                                    )}
                                </Stack>
                            </Paper>

                        ))}

                    </Stack>
                )}
            </Stack>
        </Paper>
    );
};

export default EventComments;