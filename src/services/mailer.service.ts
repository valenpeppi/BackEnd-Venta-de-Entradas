import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

interface MailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export const sendMail = async ({ to, subject, text, html }: MailOptions) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {

        throw error;
    }
};
