import type { Request, Response } from "express";
import { IEmail } from "@utils/specialTypes"
import { mailer } from "../services/mailer";

export const guestEmail = async (req: Request, res: Response) => {
        const emailData = req.body;

        if (!emailData?.name || !emailData?.email || !emailData?.message) {
            return res.status(400).json({ error: 'Missing required email fields' });
        }

        try {
            const emailcontent: IEmail = {
                subject: `Zpráva od ${emailData.email}`,
                context: `
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
                              `,
            };

            await mailer(emailcontent);
            return res.status(200).json({ message: 'Email sent successfully' });
        } catch (error) {
            console.error('Error while preparing guest email:', error);
            return res.status(500).json({ error: 'Failed to send email' });
        }
};
