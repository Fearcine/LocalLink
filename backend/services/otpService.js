
/**
 * otpService.js
 *
 * Responsible for two things only:
 *   1. Generating a cryptographically random 6-digit OTP.
 *   2. Delivering it via Twilio SMS.
 *
 * Required environment variables:
 *   TWILIO_ACCOUNT_SID   — Twilio account SID  (ACxxxxxxxxxxxxxxxx)
 *   TWILIO_AUTH_TOKEN    — Twilio auth token
 *   TWILIO_PHONE_NUMBER  — Twilio sender number in E.164 format (+1...)
 *
 * No mock / dev flags exist in this module. All environments use real SMS.
 * For local testing without real SMS, use Twilio's test credentials:
 *   https://www.twilio.com/docs/iam/test-credentials
 */

const crypto = require('crypto');
const twilio = require('twilio');

// Lazily initialised Twilio client — created once, reused across calls.
let _client = null;

/**
 * Returns the singleton Twilio client.
 * Throws a clear error at call-time if credentials are missing,
 * rather than crashing the whole process on startup.
 *
 * @returns {import('twilio').Twilio}
 */
function getClient() {
  if (_client) return _client;

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error(
      'Twilio credentials missing. ' +
      'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in your environment.'
    );
  }

  _client = twilio(sid, token);
  return _client;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically random 6-digit OTP string.
 * Uses crypto.randomInt (available Node 14.10+) — not Math.random().
 *
 * @returns {string}  e.g. "048271"
 */
function generateOtp() {
  // randomInt(min, max) is exclusive of max, so 100000–999999 gives 6 digits.
  return String(crypto.randomInt(100000, 1000000)).padStart(6, '0');
}

/**
 * Send a 6-digit OTP to a phone number via Twilio SMS.
 *
 * @param {string} phone — E.164 recipient number, e.g. "+919876543210"
 * @param {string} code  — The plain 6-digit OTP to include in the message body
 * @returns {Promise<void>}
 * @throws  {Error} if Twilio rejects the request or credentials are invalid
 */
async function sendOtp(phone, code) {
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error(
      'Twilio sender number missing. Set TWILIO_PHONE_NUMBER in your environment.'
    );
  }

  const client = getClient();

  try {
    await client.messages.create({
      to:   phone,
      from: from,
      body: `Your LocalLink verification code is ${code}. It expires in 5 minutes. Do not share it with anyone.`,
    });
  } catch (err) {
    // Surface the Twilio error code for easier debugging in logs,
    // but send a generic message to the client.
    console.error(`[otpService] Twilio error sending to ${phone}:`, err.message, `(code: ${err.code})`);
    throw new Error('Failed to send OTP. Please try again.');
  }
}

module.exports = { generateOtp, sendOtp };