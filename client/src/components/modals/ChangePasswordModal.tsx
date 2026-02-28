import { updatePassword } from '@/utils/api';
import { showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import React, { useState } from 'react'

const ChangePasswordModal = () => {

    const [opened, setOpened] = useState(false);
    const [loading, setLoading] = useState(false);

    const passwordform = useForm({
        initialValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
        validate: {
            currentPassword: (v) => (v.trim().length < 1 ? "Zadej aktuální heslo" : null),
            newPassword: (v) =>
                v.trim().length < 8 ? "Nové heslo musí mít alespoň 8 znaků" : null,
            confirmPassword: (v, values) =>
                v !== values.newPassword ? "Hesla se neshodují" : null,
        },
    });

    const handleSubmit = passwordform.onSubmit(async (values) => {
        try {
            setLoading(true);
            await updatePassword(values);
            showSuccessNotification("Heslo bylo úspěšně změněno");
            setOpened(false);
            passwordform.reset();
        } catch {
            showErrorNotification("Změna hesla se nepodařila");
        } finally {
            setLoading(false);
        }
    });


    return (
        <>
            <Button variant="light" color="blue" onClick={() => setOpened(true)}>
                Změnit heslo
            </Button>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title="Změna hesla"
                centered
                radius="md"
            >
                <form onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSubmit(e);
                }}>
                    <Stack gap="sm">
                        <Text size="sm" c="dimmed">
                            Pro potvrzení zadej aktuální heslo a nové heslo.
                        </Text>

                        <PasswordInput
                            label="Aktuální heslo"
                            placeholder="••••••••"
                            {...passwordform.getInputProps("currentPassword")}
                        />
                        <PasswordInput
                            label="Nové heslo"
                            placeholder="Napište nové heslo"
                            {...passwordform.getInputProps("newPassword")}
                        />
                        <PasswordInput
                            label="Potvrzení nového hesla"
                            placeholder="Zopakuj nové heslo"
                            {...passwordform.getInputProps("confirmPassword")}
                        />

                        <Group justify="flex-end" mt="sm">
                            <Button variant="default" onClick={() => setOpened(false)}>
                                Zrušit
                            </Button>
                            <Button type="submit" loading={loading}>
                                Uložit změnu
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </>
    );
}

export default ChangePasswordModal