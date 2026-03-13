import { useApp } from '@/context/AppContext';
import type { League } from '@/types/League';
import type { Squad } from '@/types/Squad';
import { createSquad, getLeagues, updateSquad } from '@/utils/api';
import { showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { Button, Modal, Select, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import React, { useEffect } from 'react'

interface ISquadModal {
    opened: boolean;
    setOpened: React.Dispatch<React.SetStateAction<boolean>>;
    squad?: Squad
    loadSquads?: () => Promise<void>;
}

const SquadModal = (props: ISquadModal) => {
    const { opened, setOpened, squad, loadSquads } = props;
    const [leagues, setLeagues] = React.useState<League[]>([]);
    const { team } = useApp();


    const form = useForm({
        initialValues: {
            name: squad?.name || '',
            leagueId: squad?.league._id || '',
            teamId: team?._id || '',
        },
        validate: {
            name: (val) => (val.trim() === '' ? 'Název je povinný' : null),
            leagueId: (val) => (val.trim() === '' ? 'Liga je povinná' : null),
        },
    });

    const handleSubmit = form.onSubmit(async (values) => {
        try {
            console.log(values)
            if (squad) {
                await updateSquad(squad._id, values);
            } else {
                await createSquad(values);
            }
            showSuccessNotification(squad ? 'Celek byl úspěšně upraven' : 'Celek byl úspěšně vytvořen');
            setOpened(false);
        } catch (error) {
            showErrorNotification('Chyba při ukládání celku');
            console.error('Error saving squad:', error);
        } finally {
            if (loadData) {
                loadSquads();
            }
        }
    });

    const loadData = async () => {
        if (squad) {
            form.setValues({
                name: squad.name || '',
                leagueId: squad.league._id || '',
                teamId: team._id || '',
            });
        } else {
            form.setValues({
                name: '',
                leagueId: '',
                teamId: team._id || '',
            })
        }

        try {
            const leagues = await getLeagues();
            setLeagues(leagues);
        } catch (error) {
            console.error('Error loading leagues:', error);
        }
    };

    useEffect(() => {
        loadData();
    }, [opened]);

    return (
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
                    <TextInput
                        label="Název celku"
                        placeholder="Zadejte název celku"
                        radius="md"
                        required
                        value={form.values.name}
                        onChange={(event) => form.setFieldValue('name', event.currentTarget.value)}
                        error={form.errors.name}
                    />
                    <Select
                        label="Liga"
                        placeholder="Zadejte název ligy"
                        required
                        data={leagues.map((league) => ({ value: league._id, label: league.name }))}
                        value={form.values.leagueId}
                        onChange={(value) => form.setFieldValue('leagueId', value || '')}
                        error={form.errors.leagueId}
                    />
                    <Button type="submit" fullWidth mt="md" radius="md">
                        {squad ? 'Uložit změny' : 'Vytvořit celek'}
                    </Button>
                </Stack>
            </form>
        </Modal>
    )
}

export default SquadModal