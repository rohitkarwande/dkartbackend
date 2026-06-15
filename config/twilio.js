const twilio = require('twilio');
require('dotenv').config();

let client = null;

try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('Twilio client initialized.');
    } else {
        console.warn('Twilio credentials not found. SMS sending will be mocked.');
    }
} catch (error) {
    console.error('Failed to initialize Twilio:', error.message);
}

const sendOTP = async (to, otp) => {
    if (!client) {
        console.log(`[MOCK SMS] Sending OTP ${otp} to ${to}`);
        return true;
    }

    try {
        const message = await client.messages.create({
            body: `Your Dkart Auth verification code is: ${otp}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log(`OTP sent successfully: ${message.sid}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};

module.exports = { sendOTP };
