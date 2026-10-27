import { useEffect, useState } from 'react';
import { Image, Skeleton } from '@mantine/core';
import QRCode from 'qrcode';

interface IPaymentQr {
    // SPAYD string of the payment
    value: string;
    size?: number;
    alt: string;
}

// Renders a QR code. The effect depends only on the string, so it cannot loop.
const PaymentQr = ({ value, size = 220, alt }: IPaymentQr) => {
    const [qr, setQr] = useState<{ value: string; url: string } | null>(null);

    useEffect(() => {
        let cancelled = false;

        QRCode.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })
            .then((url) => {
                if (!cancelled) setQr({ value, url });
            })
            .catch(() => {
                if (!cancelled) setQr(null);
            });

        return () => {
            cancelled = true;
        };
    }, [value, size]);

    if (!qr || qr.value !== value) return <Skeleton w={size} h={size} radius="md" />;

    return <Image src={qr.url} alt={alt} w={size} h={size} radius="md" />;
};

export default PaymentQr;
