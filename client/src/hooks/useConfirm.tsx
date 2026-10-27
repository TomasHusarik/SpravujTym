import { useCallback, useRef, useState, type ReactNode } from 'react';
import { Button, Group, Modal, Stack, Text } from '@mantine/core';

type ConfirmOptions = {
    title: string;
    message?: ReactNode;
    confirmLabel?: string;
    // Red confirm button for destructive actions
    danger?: boolean;
};

/**
 * Confirmation dialog instead of window.confirm.
 *
 *   const { confirm, confirmDialog } = useConfirm();
 *   if (!(await confirm({ title: 'Smazat?', danger: true }))) return;
 *   ...
 *   return <>{content}{confirmDialog}</>;
 */
export const useConfirm = () => {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((confirmOptions: ConfirmOptions) => {
        setOptions(confirmOptions);
        return new Promise<boolean>((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const close = (result: boolean) => {
        resolver.current?.(result);
        resolver.current = null;
        setOptions(null);
    };

    const confirmDialog = (
        <Modal opened={options !== null} onClose={() => close(false)} title={options?.title} size="sm">
            <Stack gap="lg">
                {options?.message && <Text size="sm">{options.message}</Text>}
                <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={() => close(false)}>
                        Zpět
                    </Button>
                    <Button color={options?.danger ? 'red' : undefined} onClick={() => close(true)} data-autofocus>
                        {options?.confirmLabel ?? 'Potvrdit'}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );

    return { confirm, confirmDialog };
};
