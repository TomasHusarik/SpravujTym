import { useState } from 'react';
import { Alert, Button, Group, Modal, Radio, Stack, Text, Textarea } from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import type { EditScope } from '@/types/EventSeries';
import { EditScopeOptions } from '@/utils/const';

export type EventScopeMode = 'edit' | 'cancel' | 'delete';

const REASON_MAX_LENGTH = 200;

const TEXTS: Record<EventScopeMode, { title: string; confirm: string; color: string }> = {
    edit: { title: 'Uložit změny opakované události', confirm: 'Uložit', color: 'blue' },
    cancel: { title: 'Zrušit událost', confirm: 'Zrušit událost', color: 'red' },
    delete: { title: 'Smazat událost', confirm: 'Smazat', color: 'red' },
};

interface IEventScopeModal {
    opened: boolean;
    mode: EventScopeMode;
    isSeries: boolean;
    loading?: boolean;
    // e.g. when the recurrence rule was changed, "only this event" makes no sense
    disableThisScope?: boolean;
    onClose: () => void;
    onConfirm: (scope: EditScope, reason?: string) => void;
}

// Confirmation dialog for edit / cancel / delete, with the Google Calendar style scope choice for series
const EventScopeModal = ({ opened, mode, isSeries, loading, disableThisScope, onClose, onConfirm }: IEventScopeModal) => {
    const [scope, setScope] = useState<EditScope>('this');
    const [reason, setReason] = useState('');
    const [wasOpened, setWasOpened] = useState(opened);
    const texts = TEXTS[mode];

    // Reset the form every time the modal opens
    if (opened !== wasOpened) {
        setWasOpened(opened);
        if (opened) {
            setScope(disableThisScope ? 'following' : 'this');
            setReason('');
        }
    }

    return (
        <Modal opened={opened} onClose={onClose} title={texts.title} centered radius="lg">
            <Stack gap="md">
                {isSeries && (
                    <Radio.Group
                        label="Na které události se to má vztahovat?"
                        value={scope}
                        onChange={(value) => setScope(value as EditScope)}
                    >
                        <Stack gap="xs" mt="xs">
                            {Object.values(EditScopeOptions).map((option) => (
                                <Radio
                                    key={option.value}
                                    value={option.value}
                                    label={option.label}
                                    disabled={option.value === 'this' && disableThisScope}
                                />
                            ))}
                        </Stack>
                    </Radio.Group>
                )}

                {isSeries && scope === 'all' && (
                    <Text size="xs" c="dimmed">
                        Události, které už proběhly, zůstanou beze změny.
                    </Text>
                )}

                {mode === 'edit' && isSeries && scope !== 'this' && (
                    <Text size="xs" c="dimmed">
                        U existujících událostí zůstanou odpovědi hráčů zachované.
                    </Text>
                )}

                {mode === 'cancel' && (
                    <>
                        <Textarea
                            label="Důvod zrušení (nepovinné)"
                            placeholder="Např. hala je zavřená"
                            autosize
                            minRows={2}
                            maxLength={REASON_MAX_LENGTH}
                            value={reason}
                            onChange={(e) => setReason(e.currentTarget.value)}
                        />
                        <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />}>
                            Událost zůstane v kalendáři označená jako zrušená a pozvaní členové dostanou upozornění.
                        </Alert>
                    </>
                )}

                {mode === 'delete' && (
                    <Alert variant="light" color="red" icon={<IconAlertTriangle size={18} />}>
                        Smazání nelze vrátit – zmizí i odpovědi a komentáře. Pokud se akce jen nekoná, použijte raději „Zrušit událost“.
                    </Alert>
                )}

                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={onClose} disabled={loading}>
                        Zpět
                    </Button>
                    <Button color={texts.color} loading={loading} onClick={() => onConfirm(isSeries ? scope : 'this', reason.trim() || undefined)}>
                        {texts.confirm}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default EventScopeModal;
