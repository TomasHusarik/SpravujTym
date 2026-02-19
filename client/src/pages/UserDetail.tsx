import type { User } from '@/types/User'
    import { authUser } from '@/utils/api'
import { getFullName } from '@/utils/helpers'
import { Grid, TextInput, Title } from '@mantine/core'
import { IconAt, IconPhone, IconUser } from '@tabler/icons-react'
import React from 'react'

const UserDetail = () => {
    const [user, setUser] = React.useState<User>(null);

    React.useEffect(() => {
        const getCurrentUser = async () => {
            try {
                const data = await authUser();
                if (data) {
                    setUser(data.user);
                } else {
                    console.error('Failed to fetch user data');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }   
        };

        getCurrentUser();
    }, []);

    return (
        <Grid>
            <Grid.Col span={{ base: 12, md: 12 }}>
                <Title order={1} c="var(--mantine-color-blue-light-color)" mb="md">Detail uživatele</Title>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="Full Name"
                    placeholder="fullName"
                    leftSection={<IconUser size={16} />}
                    radius="md"
                    size="md"
                    name="fullName"
                    value={getFullName(user) || ''}
                    readOnly
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="Email"
                    placeholder="email"
                    leftSection={<IconAt size={16} />}
                    radius="md"
                    size="md"
                    name="email"
                    value={user?.email || ''}
                    readOnly
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="Phone"
                    placeholder="phone"
                    leftSection={<IconPhone size={16} />}
                    radius="md"
                    size="md"
                    name="phone"
                    value={user?.mobile || ''}
                    readOnly
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="Role"
                    placeholder="role"
                    leftSection={<IconUser size={16} />}
                    radius="md"
                    size="md"
                    name="role"
                    value={user?.roles || ''}
                    readOnly
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="Status"
                    placeholder="status"
                    leftSection={<IconUser size={16} />}
                    radius="md"
                    size="md"
                    name="status"
                    value={user?.active ? 'Active' : 'Inactive'}
                    readOnly
                />
            </Grid.Col>
            
        </Grid>
    )
}

export default UserDetail