/**
 * OTP Service
 * Supports mock mode for development and Twilio for production
 */

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, otp) => {
  // Mock mode - log OTP to console
  if (process.env.MOCK_OTP === 'true') {
    const code = process.env.MOCK_OTP_CODE || otp;
    console.log(`\n📱 [MOCK OTP] Phone: ${phone} | Code: ${code}\n`);
    return { success: true, mock: true };
  }

  // Production: Twilio
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    await client.messages.create({
      body: `Your LocalLink verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone
    });

    return { success: true, mock: false };
  } catch (error) {
    console.error('Twilio error:', error.message);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

module.exports = { generateOTP, sendOTP };
