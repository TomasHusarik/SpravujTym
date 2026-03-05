import { Select, Stack, TextInput, Modal, Text, Group, Button, Switch } from '@mantine/core'
import React from 'react'
import RichTextEditorComponent from '../RichTextEditorComponent'
import { showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import type { UseFormReturnType } from '@mantine/form';
import { createAnnouncement, updateAnnouncement } from '@/utils/api';
import type { Announcement } from '@/types/Announcement';

interface IAnnouncementModal {
    isFormOpen: boolean;
    setIsFormOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editingAnnouncement?: Announcement
    loadAnnouncements: () => Promise<void>;
    form: UseFormReturnType<{
        title: string;
        context: string;
        visibility: string;
        pinned: boolean;
    }>;

}

const AnnouncementModal = (props: IAnnouncementModal) => {
    const { isFormOpen, setIsFormOpen, form, editingAnnouncement, loadAnnouncements } = props;
    const [isSaving, setIsSaving] = React.useState(false);

    const handleSave = form.onSubmit(async (values) => {
        try {
            setIsSaving(true);

            if (editingAnnouncement?._id) {
                await updateAnnouncement(editingAnnouncement._id, values);
                showSuccessNotification('Oznámení bylo úspěšně upraveno');
            } else {
                await createAnnouncement(values);
                showSuccessNotification('Oznámení bylo úspěšně vytvořeno');
            }

            await loadAnnouncements();
        } catch (error) {
            showErrorNotification('Chyba při ukládání oznámení');
            console.error('Error saving announcement:', error);
        } finally {
            setIsSaving(false);
            setIsFormOpen(false);
        }
    });

    return (
        <Modal
            opened={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            title={editingAnnouncement ? 'Upravit oznámení' : 'Nové oznámení'}
            size="xl"
            radius="lg"
        >
            <form onSubmit={handleSave}>
                <Stack gap="md">
                    <TextInput
                        label="Nadpis oznámení"
                        placeholder="Důležité oznámení pro všechny členy"
                        radius="md"
                        required
                        value={form.values.title}
                        onChange={(event) => form.setFieldValue('title', event.currentTarget.value)}
                        error={form.errors.title}
                    />

                    <Select
                        label="Viditelnost"
                        placeholder="Vyberte viditelnost oznámení"
                        radius="md"
                        required
                        data={[
                            { value: 'public', label: 'Veřejnost' },
                            { value: 'private', label: 'Tým' },
                        ]}
                        value={form.values.visibility}
                        onChange={(value) => form.setFieldValue('visibility', value || '')}
                        error={form.errors.visibility}
                    />

                    <Switch
                        label="Připnout oznámení"
                        description="Připnuté oznámení se zobrazí nahoře"
                        checked={form.values.pinned}
                        onChange={(event) => form.setFieldValue('pinned', event.currentTarget.checked)}
                    />

                    <Stack gap="xs">
                        <Text fw={500} size="sm">Obsah oznámení</Text>
                        <RichTextEditorComponent
                            minHeight={240}
                            value={form.values.context}
                            onChange={(value) => form.setFieldValue('context', value)}
                        />
                        {form.errors.context && <Text size="sm" c="red">{form.errors.context}</Text>}
                    </Stack>

                    <Group justify="flex-end" mt="sm">
                        <Button variant="default" onClick={() => setIsFormOpen(false)}>Zrušit</Button>
                        <Button type="submit" radius="md" loading={isSaving}>
                            {editingAnnouncement ? 'Uložit změny' : 'Vytvořit oznámení'}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    )
}

export default AnnouncementModal