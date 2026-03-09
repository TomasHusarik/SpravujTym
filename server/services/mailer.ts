import { IEmail } from '@utils/specialTypes';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const mailer = async (emailData: IEmail) => {
    const { from, to, subject, context, attachments } = emailData;

    try {
    await resend.emails.send({
            from: from || 'SpravujTym <no-reply@spravujtym.cz>',
            to: to || 'info@spravujtym.cz',
            subject: subject || 'Registrace',
            html: context,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                contentId: att.cid,
                contentType: att.contentType,
            }))
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
