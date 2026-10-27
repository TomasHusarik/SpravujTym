import { useCallback, useEffect, useState } from 'react';
import { ActionIcon, Button, Divider, Group, Indicator, Popover, ScrollArea, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { useWindowEvent } from '@mantine/hooks';
import {
    IconBan,
    IconBell,
    IconBellRinging,
    IconCalendarCheck,
    IconCalendarPlus,
    IconCalendarTime,
    IconReceipt2,
    IconSpeakerphone,
    IconTrash,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/cs';
import type { AppNotification, NotificationType } from '@/types/Notification';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/utils/api';

dayjs.extend(relativeTime);

const POLL_INTERVAL_MS = 60 * 1000;

const TYPE_STYLES: Record<NotificationType, { icon: typeof IconBell; color: string }> = {
    event_invited: { icon: IconCalendarPlus, color: 'blue' },
    event_changed: { icon: IconCalendarTime, color: 'orange' },
    event_canceled: { icon: IconBan, color: 'red' },
    event_restored: { icon: IconCalendarCheck, color: 'green' },
    event_deleted: { icon: IconTrash, color: 'red' },
    rsvp_reminder: { icon: IconBellRinging, color: 'yellow' },
    payment_created: { icon: IconReceipt2, color: 'accent' },
    announcement: { icon: IconSpeakerphone, color: 'grape' },
};

// Bell with unread notifications in the header; refreshes every minute and when the window gets focus
const NotificationBell = () => {
    const navigate = useNavigate();
    const [opened, setOpened] = useState(false);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const loadNotifications = useCallback(async () => {
        try {
            const data = await getNotifications();
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch {
            // The bell is not critical - errors are ignored and the next poll tries again
        }
    }, []);

    useEffect(() => {
        const initialLoad = setTimeout(loadNotifications, 0);
        const interval = setInterval(loadNotifications, POLL_INTERVAL_MS);
        return () => {
            clearTimeout(initialLoad);
            clearInterval(interval);
        };
    }, [loadNotifications]);

    useWindowEvent('focus', loadNotifications);

    const handleOpen = (notification: AppNotification) => {
        setOpened(false);

        if (!notification.readAt) {
            setNotifications((items) => items.map((item) =>
                item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item
            ));
            setUnreadCount((count) => Math.max(0, count - 1));
            markNotificationRead(notification._id).catch(() => loadNotifications());
        }

        if (notification.link) navigate(notification.link);
    };

    const handleMarkAll = async () => {
        setNotifications((items) => items.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })));
        setUnreadCount(0);
        try {
            await markAllNotificationsRead();
        } catch {
            loadNotifications();
        }
    };

    return (
        <Indicator
            label={unreadCount > 9 ? '9+' : unreadCount}
            size={16}
            color="red"
            offset={4}
            disabled={unreadCount === 0}
        >
        <Popover
            opened={opened}
            onChange={setOpened}
            width={360}
            position="bottom-end"
            shadow="lg"
            radius="md"
            withArrow
        >
            <Popover.Target>
                <ActionIcon
                    variant="subtle"
                    size="lg"
                    radius="xl"
                    color="gray"
                    c="white"
                    aria-label={unreadCount > 0 ? `Upozornění (${unreadCount} nepřečtených)` : 'Upozornění'}
                    onClick={() => setOpened((value) => !value)}
                >
                    <IconBell size={20} stroke={1.6} />
                </ActionIcon>
            </Popover.Target>

            <Popover.Dropdown p={0}>
                <Group justify="space-between" px="md" py="sm">
                    <Text fw={700}>Upozornění</Text>
                    {unreadCount > 0 && (
                        <Button variant="subtle" size="compact-xs" onClick={handleMarkAll}>
                            Označit vše jako přečtené
                        </Button>
                    )}
                </Group>
                <Divider />

                {notifications.length === 0 ? (
                    <Stack align="center" gap={4} p="xl">
                        <IconBell size={28} stroke={1.4} color="var(--mantine-color-dimmed)" />
                        <Text size="sm" c="dimmed">Zatím žádná upozornění</Text>
                    </Stack>
                ) : (
                    <ScrollArea.Autosize mah={420}>
                        <Stack gap={0}>
                            {notifications.map((notification) => {
                                const style = TYPE_STYLES[notification.type] ?? TYPE_STYLES.announcement;
                                const Icon = style.icon;
                                const isUnread = !notification.readAt;

                                return (
                                    <UnstyledButton
                                        key={notification._id}
                                        onClick={() => handleOpen(notification)}
                                        px="md"
                                        py="sm"
                                        style={{
                                            borderBottom: '1px solid var(--mantine-color-default-border)',
                                            background: isUnread ? 'var(--mantine-color-default-hover)' : undefined,
                                        }}
                                    >
                                        <Group align="flex-start" wrap="nowrap" gap="sm">
                                            <ThemeIcon variant="light" color={style.color} radius="xl" size="md">
                                                <Icon size={16} />
                                            </ThemeIcon>
                                            <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                                                <Text size="sm" fw={isUnread ? 700 : 500} lineClamp={2}>
                                                    {notification.title}
                                                </Text>
                                                {notification.message && (
                                                    <Text size="xs" c="dimmed" lineClamp={2} style={{ whiteSpace: 'pre-line' }}>
                                                        {notification.message}
                                                    </Text>
                                                )}
                                                <Text size="xs" c="dimmed">
                                                    {dayjs(notification.createdAt).locale('cs').fromNow()}
                                                </Text>
                                            </Stack>
                                            {isUnread && (
                                                <Indicator color="blue" size={8} mt={6} aria-label="Nepřečteno" processing={false}>
                                                    <span />
                                                </Indicator>
                                            )}
                                        </Group>
                                    </UnstyledButton>
                                );
                            })}
                        </Stack>
                    </ScrollArea.Autosize>
                )}
            </Popover.Dropdown>
        </Popover>
        </Indicator>
    );
};

export default NotificationBell;
