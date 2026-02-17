const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const getSecret = () => process.env.TICKET_QR_SECRET || process.env.JWT_SECRET;

const signCheckInToken = ({ attendeeId, eventId, ticketId }) => {
  const secret = getSecret();
  if (!secret) throw new Error('Missing TICKET_QR_SECRET or JWT_SECRET');

  return jwt.sign(
    {
      attendeeId,
      eventId,
      ticketId,
      type: 'checkin'
    },
    secret,
    {
      expiresIn: process.env.CHECKIN_TOKEN_EXPIRES_IN || '30d',
      issuer: 'gatherly',
      audience: 'gatherly-checkin',
      jwtid: crypto.randomUUID()
    }
  );
};

const verifyCheckInToken = (token) => {
  const secret = getSecret();
  if (!secret) throw new Error('Missing TICKET_QR_SECRET or JWT_SECRET');
  return jwt.verify(token, secret, {
    issuer: 'gatherly',
    audience: 'gatherly-checkin'
  });
};

module.exports = { signCheckInToken, verifyCheckInToken };
