import type { ReactNode } from 'react';
import { Button, Center, Group, Loader, Paper, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconAlertTriangle, IconInbox, IconRefresh } from '@tabler/icons-react';

interface IEmptyState {
    title: string;
    description?: ReactNode;
    icon?: ReactNode;
    action?: ReactNode;
}

// Shown when a list has no items
export const EmptyState = ({ title, description, icon, action }: IEmptyState) => (
    <Paper withBorder p="xl">
        <Stack align="center" gap="xs" ta="center">
            <ThemeIcon size={48} radius="xl" variant="light" color="gray">
                {icon ?? <IconInbox size={24} />}
            </ThemeIcon>
            <Text fw={600}>{title}</Text>
            {description && <Text size="sm" c="dimmed" maw={420}>{description}</Text>}
            {action && <Group mt="xs">{action}</Group>}
        </Stack>
    </Paper>
);

interface IErrorState {
    message?: string;
    onRetry?: () => void;
}

// Shown when data could not be loaded
export const ErrorState = ({ message, onRetry }: IErrorState) => (
    <Paper withBorder p="xl" role="alert">
        <Stack align="center" gap="xs" ta="center">
            <ThemeIcon size={48} radius="xl" variant="light" color="red">
                <IconAlertTriangle size={24} />
            </ThemeIcon>
            <Text fw={600}>Data se nepodařilo načíst</Text>
            <Text size="sm" c="dimmed">{message || 'Zkontrolujte připojení k internetu a zkuste to znovu.'}</Text>
            {onRetry && (
                <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={onRetry} mt="xs">
                    Zkusit znovu
                </Button>
            )}
        </Stack>
    </Paper>
);

// Placeholder rows while a list is loading
export const ListSkeleton = ({ rows = 4, height = 72 }: { rows?: number; height?: number }) => (
    <Stack gap="sm" aria-busy="true" aria-label="Načítání">
        {Array.from({ length: rows }, (_, index) => (
            <Skeleton key={index} height={height} radius="md" />
        ))}
    </Stack>
);

// Placeholder cards while a grid is loading
export const CardGridSkeleton = ({ cards = 6, height = 120 }: { cards?: number; height?: number }) => (
    <Group grow align="stretch" gap="md" wrap="wrap" aria-busy="true" aria-label="Načítání">
        {Array.from({ length: cards }, (_, index) => (
            <Skeleton key={index} height={height} radius="lg" miw={260} />
        ))}
    </Group>
);

// Full page loader (e.g. while lazy pages or the session are loading)
export const PageLoader = () => (
    <Center h="60vh" aria-busy="true" aria-label="Načítání">
        <Loader color="brand" />
    </Center>
);
