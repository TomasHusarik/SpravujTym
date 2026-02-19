import { useAuth } from '@/context/AuthContext'
import type { User } from '@/types/User'
import { authUser } from '@/utils/api'
import { getFullName } from '@/utils/helpers'
import { Grid, TextInput, Title } from '@mantine/core'
import { IconAt, IconPhone, IconUser } from '@tabler/icons-react'
import React from 'react'

const UserDetail = () => {
    const { user } = useAuth();
    const [tmpUser, setTmpUser] = React.useState<User>(user);

    const handleUserChange = (updatedValues: any) => {
        setTmpUser(prevUsr => ({ ...prevUsr, ...updatedValues }));
    }


    return (
        <Grid>
            <Grid.Col span={{ base: 12, md: 12 }}>
                <Title order={1} c="var(--mantine-color-blue-light-color)" mb="md">Detail uživatele</Title>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="First Name"
                    placeholder="First Name"
                    leftSection={<IconUser size={16} />}
                    radius="md"
                    size="md"
                    value={tmpUser?.firstName || ''}
                    onChange={(value) => handleUserChange({ firstName: value.currentTarget.value })}
                />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                    label="Last Name"
                    placeholder="Last Name"
                    leftSection={<IconUser size={16} />}
                    radius="md"
                    size="md"
                    value={tmpUser?.lastName || ''}
                    onChange={(value) => handleUserChange({ lastName: value.currentTarget.value })}
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
                    value={tmpUser?.email || ''}
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
                    value={tmpUser?.mobile || ''}
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
                    value={tmpUser?.roles || ''}
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
                    value={tmpUser?.active ? 'Active' : 'Inactive'}
                    readOnly
                />
            </Grid.Col>

        </Grid>
    )
}

export default UserDetail