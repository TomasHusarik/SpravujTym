import type { Request, Response } from "express";
import { IEmail } from "@utils/specialTypes"
import fs from "node:fs";
import path from "node:path";
import { mailer } from "../services/mailer";

export const guestEmail = async (req: Request, res: Response) => {
        const emailData = req.body;

        if (!emailData?.name || !emailData?.email || !emailData?.subject || !emailData?.message) {
            return res.status(400).json({ error: 'Missing required email fields' });
        }

        try {
        const logoFilePath = path.join(__dirname, '..', 'assets', 'logo40x40.png');
        const logoBase64 = fs.readFileSync(logoFilePath).toString('base64');

            const emailcontent: IEmail = {
                subject: emailData.subject,
                context: `
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
                                                    <h1 style="margin:0;font-size:24px;line-height:1.3;">Vítejte ve SpravujTym</h1>
                                                    <p style="margin:8px 0 0 0;font-size:14px;opacity:0.92;">Váš účet BlueHorses je připraven.</p>
                                                </td>
                                                <td align="right" style="vertical-align:middle;">
                                                    <img alt="Logo BlueHorses" src="cid:logo-bluehorses" width="40" height="40" style="display:block;border-radius:4px;" />
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:28px;">
                                        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Dobrý den,</p>
                                        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                                            obdrželi jsme zprávu od ${emailData.name} (${emailData.email}) s následujícím obsahem:
                                        </p>
                                       
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe4ff;border-radius:10px;background:#f8faff;margin:0 0 20px 0;">
                                            <tr>
                                                <td style="padding:16px 18px;">
                                                    <p style="margin:0;font-size:14px;">${emailData.message}</p>
                                                </td>
                                            </tr>
                                        </table>

                                    </td>
                                </tr>
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
                cid: 'logo-bluehorses',
                contentType: 'image/png',
            },
        ],
            };

            await mailer(emailcontent);
            return res.status(200).json({ message: 'Email sent successfully' });
        } catch (error) {
            console.error('Error while preparing guest email:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }
};
