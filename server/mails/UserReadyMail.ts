import { IUser } from "@models/User";
import { mailer } from "../services/mailer";
import { IEmail } from "@utils/specialTypes";


export const UserReadyMail = async (user: IUser) => {

    const emailcontent: IEmail = {
        from: 'BlueHorses <no-reply@spravujtym.cz>',
        subject: 'Uživatel připraven!',
        context: `              
        <tr>
            <td style="padding:28px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Dobrý den,</p>


                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #dbe4ff;border-radius:10px;background:#f8faff;margin:0 0 20px 0;">
                    <tr>
                        <td style="padding:16px 18px;">
                            <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                                uživatel ${user.firstName + " " + user.lastName} (${user.email}) je nyní připraven k použití.
                            </p>
                        </td>
                    </tr>
                </table>

                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.6;color:#374151;">
                    Pokud jste tento uživatel neregistrovali, prosím kontaktujte podporu.
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#374151;">
                    Děkujeme, že používáte SpravujTym.
                </p>
            </td>
        </tr>
        `,

    };

    await mailer(emailcontent);
};
