import { useState } from 'react';
import { Button, Group, Popover, Stack, Text, Textarea } from '@mantine/core';
import { IconCheck, IconQuestionMark, IconX } from '@tabler/icons-react';
import { ParticipationStatus } from '@/utils/const';
import { getParticipationStatusColor, showErrorNotification } from '@/utils/helpers';

const NOTE_MAX_LENGTH = 200;

const OPTIONS = [
    { status: ParticipationStatus.CONFIRMED.value, label: 'Jdu', icon: IconCheck, askReason: false },
    { status: ParticipationStatus.MAYBE.value, label: 'Možná', icon: IconQuestionMark, askReason: true },
    { status: ParticipationStatus.DECLINED.value, label: 'Nejdu', icon: IconX, askReason: true },
];

interface IRsvpButtons {
    status?: string;
    note?: string;
    disabled?: boolean;
    size?: 'xs' | 'sm';
    fullWidth?: boolean;
    onChange: (status: string, note?: string) => Promise<void>;
}

// One-tap answer (Jdu / Možná / Nejdu); "Možná" and "Nejdu" let the player add an optional reason
const RsvpButtons = ({ status, note, disabled, size = 'sm', fullWidth, onChange }: IRsvpButtons) => {
    const [savingStatus, setSavingStatus] = useState<string | null>(null);
    const [reasonFor, setReasonFor] = useState<string | null>(null);
    const [reason, setReason] = useState('');

    const save = async (newStatus: string, newNote?: string) => {
        setSavingStatus(newStatus);
        try {
            await onChange(newStatus, newNote);
            setReasonFor(null);
        } catch (error) {
            showErrorNotification((error as Error)?.message || 'Odpověď se nepodařilo uložit');
        } finally {
            setSavingStatus(null);
        }
    };

    const handleClick = (option: typeof OPTIONS[number]) => {
        if (option.askReason) {
            setReason(option.status === status ? note ?? '' : '');
            setReasonFor(option.status);
            return;
        }
        save(option.status, '');
    };

    return (
        <Group gap={6} wrap="nowrap" grow={fullWidth} role="group" aria-label="Moje účast">
            {OPTIONS.map((option) => {
                const isActive = status === option.status;
                const Icon = option.icon;

                const button = (
                    <Button
                        size={size}
                        // Narrow cards on phones: less padding so the labels fit
                        px={fullWidth ? 6 : undefined}
                        fullWidth={fullWidth}
                        radius="xl"
                        variant={isActive ? 'filled' : 'default'}
                        color={getParticipationStatusColor(option.status)}
                        leftSection={<Icon size={size === 'xs' ? 14 : 16} />}
                        loading={savingStatus === option.status}
                        disabled={disabled}
                        aria-pressed={isActive}
                        onClick={() => handleClick(option)}
                    >
                        {option.label}
                    </Button>
                );

                if (!option.askReason) {
                    return <div key={option.status}>{button}</div>;
                }

                return (
                    <Popover
                        key={option.status}
                        opened={reasonFor === option.status}
                        onChange={(opened) => !opened && setReasonFor(null)}
                        width={280}
                        position="bottom"
                        withArrow
                        trapFocus
                        shadow="md"
                    >
                        <Popover.Target>{button}</Popover.Target>
                        <Popover.Dropdown>
                            <Stack gap="xs">
                                <Text size="sm" fw={600}>{option.label}</Text>
                                <Textarea
                                    label="Důvod (nepovinné)"
                                    placeholder="Např. nemoc, práce…"
                                    autosize
                                    minRows={2}
                                    maxLength={NOTE_MAX_LENGTH}
                                    value={reason}
                                    onChange={(e) => setReason(e.currentTarget.value)}
                                />
                                <Group justify="flex-end" gap="xs">
                                    <Button size="xs" variant="subtle" color="gray" onClick={() => setReasonFor(null)}>
                                        Zpět
                                    </Button>
                                    <Button
                                        size="xs"
                                        color={getParticipationStatusColor(option.status)}
                                        loading={savingStatus === option.status}
                                        onClick={() => save(option.status, reason.trim())}
                                    >
                                        Uložit
                                    </Button>
                                </Group>
                            </Stack>
                        </Popover.Dropdown>
                    </Popover>
                );
            })}
        </Group>
    );
};

export default RsvpButtons;
