import { IEmail } from "@utils/specialTypes";
import { mailer } from "../services/mailer";
import { formatDate, formatTime } from "@utils/dates";
import { escapeHtml } from "@utils/helpers";

type NominationEventData = {
    title: string;
    startDate: Date | string;
    endDate?: Date | string;
};

export const NominationMail = async (to: string, teamEvent: NominationEventData) => {
    // Formatted in the club's timezone - the server itself may run in UTC
    const formatedDate = formatDate(teamEvent.startDate);
    const formattedStart = formatTime(teamEvent.startDate);
    const formattedEnd = formatTime(teamEvent.endDate || teamEvent.startDate);


    const emailcontent: IEmail = {
        to,
        subject: `Nová nominace: ${teamEvent.title}`,
        context: `
                <tr>
                    <td style="padding:28px;">
                        <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;">Dobrý den,</p>
                        <p style="margin:0 0 18px 0;font-size:15px;line-height:1.6;">
                            byli jste nominováni na událost <strong>${escapeHtml(teamEvent.title)}</strong>.
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
