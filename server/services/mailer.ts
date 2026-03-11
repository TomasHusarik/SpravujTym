import { IEmail } from '@utils/specialTypes';
import { Resend } from 'resend';
import fs from "node:fs";
import path from "node:path";

const resend = new Resend(process.env.RESEND_API_KEY);

export const mailer = async (emailData: IEmail) => {
    const { from, to, subject, context } = emailData;

    const logoFilePathCandidates = [
        path.join(__dirname, '..', 'assets', 'logo40x40.png'),
        path.join(__dirname, '..', '..', 'assets', 'logo40x40.png'),
    ];
    const logoFilePath = logoFilePathCandidates.find((candidate) => fs.existsSync(candidate));

    if (!logoFilePath) {
        throw new Error('Mailer logo asset was not found.');
    }

    const logoBase64 = fs.readFileSync(logoFilePath).toString('base64');

    try {
        await resend.emails.send({
            from: from || 'SpravujTym <no-reply@spravujtym.cz>',
            to: to || 'info@spravujtym.cz',
            subject: subject || 'Registrace',
            html: `
        <html>
            <body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f6fb;padding:24px 12px;">
                    <tr>
                        <td align="center">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
                                <tr>
                                    <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:24px 28px;color:#ffffff;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td style="vertical-align:middle;">
                                                    <h1 style="margin:0;font-size:24px;line-height:1.3;">BlueHorses</h1>
                                                    <p style="margin:8px 0 0 0;font-size:14px;opacity:0.92;">${subject}</p>
                                                </td>
                                                <td align="right" style="vertical-align:middle;">
                                                    <img alt="Logo BlueHorses" src="cid:logo-bluehorses" width="40" height="40" style="display:block;border-radius:4px;" />
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                ${context}
                                <tr>
                                    <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                                        Toto je automaticky generovaná zpráva ze systému SpravujTym.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
        </html>`,
            attachments: [
                {
                    content: logoBase64,
                    filename: 'logo40x40.png',
                    contentId: 'logo-bluehorses',
                    contentType: 'image/png',
                },
            ],
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
