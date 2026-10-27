import { IEmail } from "@utils/specialTypes";
import { escapeHtml } from "@utils/helpers";
import env from "@utils/validateEnv";
import { mailer } from "../services/mailer";

export type NotificationMailContent = {
    title: string;
    message?: string;
    // Relative link in the client, e.g. /event-detail/<id>
    link?: string;
};

// Generic e-mail for in-app notifications (event canceled, changed, reminder...)
export const NotificationMail = async (to: string, content: NotificationMailContent) => {
    const button = content.link && env.APP_URL
        ? `<p style="margin:0 0 18px 0;">
               <a href="${escapeHtml(env.APP_URL.replace(/\/$/, '') + content.link)}"
                  style="display:inline-block;padding:10px 18px;border-radius:8px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;">
                   Otevřít v aplikaci
               </a>
           </p>`
        : '';

    const emailcontent: IEmail = {
        to,
        subject: content.title,
        context: `
                <tr>
                    <td style="padding:28px;">
                        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Dobrý den,</p>
                        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                            <strong>${escapeHtml(content.title)}</strong>
                        </p>
                        ${content.message ? `<p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">${escapeHtml(content.message).replace(/\n/g, '<br />')}</p>` : ''}
                        ${button}
                        <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                            E-mailová upozornění můžete vypnout v nastavení svého účtu.
                        </p>
                    </td>
                </tr>
                      `,
    };

    await mailer(emailcontent);
};
