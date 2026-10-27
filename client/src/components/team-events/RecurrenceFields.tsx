import { Chip, Group, NumberInput, Paper, SegmentedControl, Select, Stack, Switch, Text } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconRepeat } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { RecurrenceFrequency, Weekdays } from '@/utils/const';
import { describeRecurrence } from '@/utils/helpers';
import { MAX_OCCURRENCES, defaultRecurrence, toRecurrenceRule, type RecurrenceFormValue } from '@/utils/recurrence';

const intervalUnit = (frequency: string) =>
    frequency === 'daily' ? 'den' : frequency === 'weekly' ? 'týden' : 'měsíc';

interface IRecurrenceFields {
    value: RecurrenceFormValue | null;
    onChange: (value: RecurrenceFormValue | null) => void;
    startDate: Date | null;
    readOnly?: boolean;
    // Turning the recurrence on/off is possible only for new events
    allowToggle?: boolean;
    error?: string | null;
}

const RecurrenceFields = ({ value, onChange, startDate, readOnly, allowToggle, error }: IRecurrenceFields) => {
    const update = (patch: Partial<RecurrenceFormValue>) => value && onChange({ ...value, ...patch });

    return (
        <Paper withBorder radius="md" p="sm">
            <Stack gap="sm">
                <Group justify="space-between">
                    <Group gap="xs">
                        <IconRepeat size={18} />
                        <Text fw={600} size="sm">Opakování</Text>
                    </Group>
                    {allowToggle && (
                        <Switch
                            label="Opakovat událost"
                            checked={Boolean(value)}
                            disabled={readOnly}
                            onChange={(e) => onChange(e.currentTarget.checked ? defaultRecurrence(startDate) : null)}
                        />
                    )}
                </Group>

                {value && (
                    <>
                        <Group grow align="flex-start">
                            <Select
                                label="Frekvence"
                                data={Object.values(RecurrenceFrequency)}
                                value={value.frequency}
                                readOnly={readOnly}
                                allowDeselect={false}
                                onChange={(frequency) => update({ frequency: frequency as RecurrenceFormValue['frequency'] })}
                            />
                            <NumberInput
                                label={`Každý N-tý ${intervalUnit(value.frequency)}`}
                                min={1}
                                max={52}
                                value={value.interval}
                                readOnly={readOnly}
                                onChange={(interval) => update({ interval: Number(interval) || 1 })}
                            />
                        </Group>

                        {value.frequency === 'weekly' && (
                            <Stack gap={4}>
                                <Text size="sm" fw={500}>Dny v týdnu</Text>
                                <Chip.Group
                                    multiple
                                    value={value.weekdays.map(String)}
                                    onChange={(days) => !readOnly && update({ weekdays: days.map(Number) })}
                                >
                                    <Group gap={6}>
                                        {Weekdays.map((day) => (
                                            <Chip key={day.value} value={String(day.value)} size="xs" aria-label={day.label}>
                                                {day.short}
                                            </Chip>
                                        ))}
                                    </Group>
                                </Chip.Group>
                            </Stack>
                        )}

                        <Stack gap={6}>
                            <Text size="sm" fw={500}>Konec opakování</Text>
                            <SegmentedControl
                                size="xs"
                                readOnly={readOnly}
                                value={value.endType}
                                onChange={(endType) => update({ endType: endType as RecurrenceFormValue['endType'] })}
                                data={[
                                    { value: 'until', label: 'K datu' },
                                    { value: 'count', label: 'Po počtu opakování' },
                                ]}
                            />
                            {value.endType === 'until' ? (
                                <DatePickerInput
                                    aria-label="Datum konce opakování"
                                    valueFormat="D. M. YYYY"
                                    value={value.until}
                                    minDate={startDate ?? undefined}
                                    readOnly={readOnly}
                                    onChange={(until) => update({ until: until ? dayjs(until).format('YYYY-MM-DD') : null })}
                                />
                            ) : (
                                <NumberInput
                                    aria-label="Počet opakování"
                                    min={1}
                                    max={MAX_OCCURRENCES}
                                    suffix="×"
                                    value={value.count}
                                    readOnly={readOnly}
                                    onChange={(count) => update({ count: Number(count) || 1 })}
                                />
                            )}
                        </Stack>

                        <Text size="sm" c={error ? 'red' : 'dimmed'}>
                            {error ?? describeRecurrence(toRecurrenceRule(value))}
                        </Text>
                    </>
                )}
            </Stack>
        </Paper>
    );
};

export default RecurrenceFields;
