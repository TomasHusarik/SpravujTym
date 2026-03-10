import { IEmail } from "@utils/specialTypes";
import { mailer } from "../services/mailer";

type NominationEventData = {
    title: string;
    startDate: Date | string;
    endDate?: Date | string;
};

export const NominationMail = async (to: string, teamEvent: NominationEventData) => {
    const formatedDate = new Date(teamEvent.startDate).toLocaleDateString("cs-CZ");
    const formattedStart = new Date(teamEvent.startDate).toLocaleTimeString("cs-CZ", { hour: '2-digit', minute: '2-digit' });
    const formattedEnd = new Date(teamEvent.endDate || teamEvent.startDate).toLocaleTimeString("cs-CZ", { hour: '2-digit', minute: '2-digit' });


    const emailcontent: IEmail = {
        to,
        subject: `Nová nominace: ${teamEvent.title}`,
        context: `
                <tr>
                    <td style="padding:28px;">
                        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Dobrý den,</p>
                        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                            byli jste nominováni na událost <strong>${teamEvent.title}</strong>.
                        </p>
                        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                            Událost probíhá <strong>${formatedDate}</strong> od <strong>${formattedStart}</strong> do <strong>${formattedEnd}</strong>.
                        </p>
                        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                            Prosím, potvrďte svou účast co nejdříve.
                        </p>
                    </td>
                </tr>
                      `,
    };

    await mailer(emailcontent);
};
