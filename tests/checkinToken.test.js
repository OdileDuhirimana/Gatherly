const { signCheckInToken, verifyCheckInToken } = require('../src/utils/checkinToken');

describe('check-in token utility', () => {
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalQrSecret = process.env.TICKET_QR_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'unit-test-jwt-secret';
    process.env.TICKET_QR_SECRET = 'unit-test-qr-secret';
    process.env.CHECKIN_TOKEN_EXPIRES_IN = '1h';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.TICKET_QR_SECRET = originalQrSecret;
    delete process.env.CHECKIN_TOKEN_EXPIRES_IN;
  });

  it('signs and verifies check-in token payload', () => {
    const token = signCheckInToken({ attendeeId: 15, eventId: 3, ticketId: 9 });
    const payload = verifyCheckInToken(token);

    expect(payload.attendeeId).toBe(15);
    expect(payload.eventId).toBe(3);
    expect(payload.ticketId).toBe(9);
    expect(payload.type).toBe('checkin');
  });

  it('rejects a tampered token', () => {
    const token = signCheckInToken({ attendeeId: 15, eventId: 3, ticketId: 9 });
    const tampered = `${token.slice(0, -1)}x`;

    expect(() => verifyCheckInToken(tampered)).toThrow();
  });
});
