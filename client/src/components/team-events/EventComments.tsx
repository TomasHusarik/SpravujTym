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
    IconSend,
    IconTrash,
} from '@tabler/icons-react';

import { getFullName, formatDate, showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { createComment, deleteComment, getComments } from '@/utils/api';
import type { Comment } from '@/types/Comment';

interface IEventComments {
    eventId: string;
}

const EventComments = (props: IEventComments) => {
    const { eventId } = props;

    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

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

    const handleDelete = async (commentId: string) => {
        try {
            await deleteComment(commentId);
            showSuccessNotification('Komentář byl úspěšně smazán');
            loadData();
        } catch {
            showErrorNotification('Nepodařilo se smazat komentář');
            console.error('Error deleting comment:', commentId);
        }
    };

    const loadData = async () => {
        try {
            const com = await getComments(eventId);
            console.log('Fetched comments:', com);
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
                    style={{ flex: 1 }}
                    value={newComment}
                    onChange={(e) =>
                        setNewComment(e.currentTarget.value)
                    }
                    rightSection={
                        <Tooltip label="Odeslat" withArrow>
                            <ActionIcon size={32} radius="xl" variant="subtle" loading={isSending} onClick={handleAddComment} >
                                <IconSend size={18} />

                            </ActionIcon>
                        </Tooltip>
                    }
                />

                {/* COMMENTS LIST */}

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

                                <Group align="flex-start" justify="space-between">

                                    <Group align="flex-start">

                                        {/* <Avatar radius="xl" size="sm">
                                            {comment.author.firstName[0]}
                                        </Avatar> */}

                                        <Stack gap={2} >

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

                                            <Text size="sm">
                                                {comment.content}
                                            </Text>

                                        </Stack>

                                    </Group>

                                    <ActionIcon
                                        variant="subtle"
                                        color="red"
                                        radius="xl"
                                        onClick={() =>
                                            handleDelete(comment._id)
                                        }
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>

                                </Group>

                            </Paper>

                        ))}

                    </Stack>
                )}

            </Stack>

        </Paper>
    );
};

export default EventComments;