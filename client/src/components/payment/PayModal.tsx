import { ActionIcon, Alert, Badge, CopyButton, Divider, Group, Modal, Stack, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy, IconInfoCircle } from '@tabler/icons-react';
import type { Payment } from '@/types/Payment';
import { useApp } from '@/context/AppContext';
import { formatDate } from '@/utils/helpers';
import { buildSpayd, formatAmount, formatIban, getPaymentTitle, getVariableSymbol, isPaymentOverdue } from '@/utils/payments';
import PaymentQr from './PaymentQr';

interface IPayModal {
    payment: Payment | null;
    onClose: () => void;
}

const DetailRow = ({ label, value, copyValue }: { label: string; value: string; copyValue?: string }) => (
    <Group justify="space-between" wrap="nowrap" gap="xs">
        <Text size="sm" c="dimmed">{label}</Text>
        <Group gap={4} wrap="nowrap">
            <Text size="sm" fw={600} ta="right">{value}</Text>
            {copyValue && (
                <CopyButton value={copyValue} timeout={1500}>
                    {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Zkopírováno' : 'Kopírovat'}>
                            <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} size="sm" onClick={copy} aria-label={`Kopírovat ${label.toLowerCase()}`}>
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                        </Tooltip>
                    )}
                </CopyButton>
            )}
        </Group>
    </Group>
);

// Payment instructions for a member: QR code for the banking app + details to copy
const PayModal = ({ payment, onClose }: IPayModal) => {
    const { team } = useApp();
    const spayd = payment ? buildSpayd(payment, team) : null;
    const currency = team?.currency || 'CZK';

    return (
        <Modal opened={payment !== null} onClose={onClose} title="Zaplatit" size="md">
            {payment && (
                <Stack gap="md">
                    <Stack gap={2} align="center">
                        <Text fw={800} fz={28}>{formatAmount(payment.amount, currency)}</Text>
                        <Text size="sm" c="dimmed">{getPaymentTitle(payment)}</Text>
                        {isPaymentOverdue(payment) && <Badge color="red">Po splatnosti</Badge>}
                    </Stack>

                    {spayd ? (
                        <Stack gap={4} align="center">
                            <PaymentQr value={spayd} alt={`QR platba ${formatAmount(payment.amount, currency)}`} />
                            <Text size="xs" c="dimmed" ta="center">
                                Naskenujte QR kód v aplikaci své banky – údaje se vyplní samy.
                            </Text>
                        </Stack>
                    ) : (
                        <Alert color="yellow" variant="light" icon={<IconInfoCircle size={18} />}>
                            Klub nemá nastavený bankovní účet, QR platbu proto nelze vytvořit. Obraťte se prosím na pokladníka.
                        </Alert>
                    )}

                    {team?.iban && (
                        <>
                            <Divider label="Nebo zadejte ručně" labelPosition="center" />
                            <Stack gap={6}>
                                <DetailRow label="Číslo účtu (IBAN)" value={formatIban(team.iban)} copyValue={team.iban.replace(/\s/g, '')} />
                                <DetailRow label="Částka" value={formatAmount(payment.amount, currency)} copyValue={String(payment.amount ?? 0)} />
                                <DetailRow label="Variabilní symbol" value={getVariableSymbol(payment._id)} copyValue={getVariableSymbol(payment._id)} />
                                <DetailRow label="Splatnost" value={payment.dueDate ? formatDate(payment.dueDate) : '–'} />
                            </Stack>
                        </>
                    )}

                    <Text size="xs" c="dimmed">
                        Po připsání platby ji pokladník označí jako zaplacenou.
                    </Text>
                </Stack>
            )}
        </Modal>
    );
};

export default PayModal;
