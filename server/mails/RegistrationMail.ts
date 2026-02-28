import { email } from "envalid";
import { mailer } from "../services/mailer";
import { IEmail } from "@utils/specialTypes";

export const RegistrationMail = async (email: string, password: string) => {

    const emailcontent: IEmail = {
        from: 'BlueHorses <no-reply@spravujtym.cz>',
        to: email,
        subject: 'Welcome to SpravujTym!',
        context: `<html>
            <body>
                <h1>Welcome to SpravujTym, BlueHorses!</h1>
                <p>Your account has been successfully created. Here are your login details:</p>
                <ul>
                    <li><strong>Email:</strong> ${email}</li>
                    <li><strong>Password:</strong> ${password}</li>
                </ul>
                <p>Please keep this information secure and do not share it with anyone.</p>
                <p>Thank you for joining SpravujTym!</p>
            </body>
        </html>`
    };

    await mailer(emailcontent);
};
