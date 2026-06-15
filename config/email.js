const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter = null;

if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
    console.log('Nodemailer initialized.');
} else {
    console.warn('SMTP credentials not found. Email sending will be mocked.');
}

const sendEmailOTP = async (to, otp) => {
    if (!transporter) {
        console.log(`[MOCK EMAIL] Sending OTP ${otp} to ${to}`);
        return true;
    }

    try {
        await transporter.sendMail({
            from: `"Dkart Auth" <${process.env.SMTP_USER}>`,
            to: to,
            subject: "Your Login Verification Code",
            text: `Your Dkart Auth verification code is: ${otp}. It will expire in 5 minutes.`,
            html: `<p>Your Dkart Auth verification code is: <b>${otp}</b></p><p>It will expire in 5 minutes.</p>`
        });
        console.log(`Email OTP sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('Error sending Email OTP:', error);
        throw error;
    }
};

module.exports = { sendEmailOTP };
