import { ActionIcon, Button, Modal } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import React, { use, useEffect } from 'react'
import Payment from '../payment/Payment';

interface IPaymentModal {
    paymentId: string;
    loadData: () => void;
}

const PaymentModal = (props: IPaymentModal) => {
    const { paymentId, loadData } = props;
    const [opened, setOpened] = React.useState(false);

    useEffect(() => {
        loadData();
    }, [opened, paymentId]);

    return (
        <>

            <ActionIcon variant="light" color="blue" onClick={() => setOpened(true)}>
                <IconEdit size={16} />
            </ActionIcon>

            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title=""
                centered
                radius="md"
                size="xl"
            >
                <Payment paymentId={paymentId} modalOpen={setOpened} />

            </Modal>
        </>
    )
}

export default PaymentModal