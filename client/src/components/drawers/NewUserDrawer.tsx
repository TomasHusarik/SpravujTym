import { signUpUser } from '@/utils/api';
import { showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { Alert, Button, Drawer, Group, Paper, Stack, Text, TextInput, Title } from '@mantine/core'
import React, { useEffect } from 'react'

interface INewUserDrawer {
    isDrawerOpen: boolean;
    setIsDrawerOpen: (open: boolean) => void;
}

const NewUserDrawer = (props: INewUserDrawer) => {
    const { isDrawerOpen, setIsDrawerOpen } = props;
    const [email, setEmail] = React.useState<string>('');
    const [isSaving, setIsSaving] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string>(null);
    const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());


    const addUser = async () => {

        if (!email.trim() || !isValidEmail(email)) {
            setError('Zadejte platný e-mail');
            return;
        }

        try {
            setIsSaving(true);
            await signUpUser(email);
            showSuccessNotification('Uživatel úspěšně vytvořen');
            setEmail('');
            setIsDrawerOpen(false);
        } catch (error) {
            showErrorNotification('Chyba při vytváření uživatele');
            console.error('Error creating user:', error);
        } finally {
            setIsSaving(false);
        }
    }

    useEffect(() => {
        if (!isDrawerOpen) {
            setEmail('');
        }
    }, [isDrawerOpen]);

    return (
        <Drawer
            opened={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            position="right"
            padding="lg"
            size="md"
        >
            <Stack gap="md">
                <Title order={2}>Pozvat nového uživatele</Title>
                <Text c="dimmed" size="sm">
                    Uživatel se vytvoří pouze s e-mailem. Po prvním přihlášení bude muset doplnit svůj profil.
                </Text>

                <Paper withBorder radius="md" p="md">
                    <Stack gap="sm">
                        <TextInput
                            label="E-mail"
                            placeholder="napr. uzivatel@email.cz"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            required
                            radius="md"
                            size="md"
                            error={error && !isValidEmail(email) ? error : null}
                        />

                        <Alert variant="light" color="blue" radius="md">
                            Pozvánka vygeneruje přístup pro nový účet.
                        </Alert>

                        <Group justify="flex-end" mt="xs">
                            <Button onClick={addUser} loading={isSaving} disabled={!email.trim()}>
                                Vytvořit uživatele
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            </Stack>
        </Drawer>
    )
}

export default NewUserDrawer