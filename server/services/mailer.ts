import { Email } from '../types/Email';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const mailer = async (emailData: Email) => {
    const { from, to, subject, context } = emailData;

    try {
    await resend.emails.send({
        from: from || 'SpravujTym <no-reply@spravujtym.cz>',
        to: to || 'info@spravujtym.com',
        subject: subject || 'New message from OpravAuto contact form',
        html: context,
    });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
};
