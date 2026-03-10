import { mailer } from "../services/mailer";
import { IEmail } from "@utils/specialTypes";


export const RegistrationMail = async (email: string, password: string) => {

    const emailcontent: IEmail = {
        from: 'BlueHorses <no-reply@spravujtym.cz>',
        to: email,
        subject: 'Vítejte ve SpravujTym!',
        context: `              
        <tr>
            <td style="padding:28px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Dobrý den,</p>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                    váš účet byl úspěšně vytvořen.
                </p>
                <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                    Pro přihlášení použijte následující údaje:
                </p>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe4ff;border-radius:10px;background:#f8faff;margin:0 0 20px 0;">
                    <tr>
                        <td style="padding:16px 18px;">
                            <p style="margin:0 0 8px 0;font-size:14px;"><strong>E-mail:</strong> ${email}</p>
                            <p style="margin:0;font-size:14px;"><strong>Heslo:</strong> ${password}</p>
                        </td>
                    </tr>
                </table>

                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#374151;">
                    Tyto údaje si prosím ponechte v bezpečí a s nikým je nesdílejte.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
                    Děkujeme, že jste se přidali ke SpravujTym.
                </p>
            </td>
        </tr>
        `,

    };

    await mailer(emailcontent);
};
