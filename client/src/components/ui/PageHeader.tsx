import type { ReactNode } from 'react';
import { Group, Stack, Text, Title } from '@mantine/core';

interface IPageHeader {
    title: ReactNode;
    description?: ReactNode;
    // Buttons on the right (they wrap below the title on small screens)
    actions?: ReactNode;
}

// Consistent title row at the top of every page
const PageHeader = ({ title, description, actions }: IPageHeader) => (
    <Group justify="space-between" align="flex-end" gap="sm" mb="lg" wrap="wrap">
        <Stack gap={2} style={{ minWidth: 0 }}>
            <Title order={1} size="h2">{title}</Title>
            {description && <Text c="dimmed" size="sm">{description}</Text>}
        </Stack>
        {actions && <Group gap="xs" wrap="wrap">{actions}</Group>}
    </Group>
);

export default PageHeader;
