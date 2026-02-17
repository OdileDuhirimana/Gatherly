jest.mock('../src/models', () => ({
  models: {
    User: { findByPk: jest.fn() },
    Event: { findByPk: jest.fn() },
    Attendee: { findOne: jest.fn() }
  }
}));

jest.mock('../src/utils/audit', () => ({
  logAudit: jest.fn(async () => undefined)
}));

jest.mock('../src/utils/checkinToken', () => ({
  signCheckInToken: jest.fn(() => 'signed-checkin-token'),
  verifyCheckInToken: jest.fn()
}));

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../src/app');
const { models } = require('../src/models');
const { verifyCheckInToken } = require('../src/utils/checkinToken');
const { logAudit } = require('../src/utils/audit');

describe('Attendee scan check-in endpoint', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'scan-test-secret';

    models.User.findByPk.mockResolvedValue({
      id: 10,
      role: 'Organizer',
      email: 'org@example.com',
      name: 'Organizer User'
    });

    models.Event.findByPk.mockResolvedValue({ id: 1, organizerId: 10 });
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  const authToken = () => jwt.sign({ id: 10, role: 'Organizer' }, process.env.JWT_SECRET);

  it('returns 401 when authorization is missing', async () => {
    const res = await request(app)
      .post('/api/events/1/attendees/scan/checkin')
      .send({ token: 'x'.repeat(32) });

    expect(res.status).toBe(401);
  });

  it('checks in attendee from a valid signed token', async () => {
    verifyCheckInToken.mockReturnValue({ attendeeId: 77, eventId: 1, ticketId: 12 });

    const attendee = {
      id: 77,
      eventId: 1,
      checkedIn: false,
      waitlisted: false,
      save: jest.fn(async () => undefined)
    };

    models.Attendee.findOne.mockResolvedValue(attendee);

    const res = await request(app)
      .post('/api/events/1/attendees/scan/checkin')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ token: 'valid-signed-checkin-token-example' });

    expect(res.status).toBe(200);
    expect(attendee.checkedIn).toBe(true);
    expect(attendee.save).toHaveBeenCalled();
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'attendee.checkin.scan', targetId: 77 }));
    expect(res.body).toHaveProperty('meta.method', 'qr-signed-token');
  });

  it('returns 409 if attendee is already checked in', async () => {
    verifyCheckInToken.mockReturnValue({ attendeeId: 88, eventId: 1, ticketId: 15 });
    models.Attendee.findOne.mockResolvedValue({
      id: 88,
      eventId: 1,
      checkedIn: true,
      waitlisted: false
    });

    const res = await request(app)
      .post('/api/events/1/attendees/scan/checkin')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ token: 'already-checked-in-token-example' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Attendee already checked in');
  });

  it('returns 400 for invalid check-in token', async () => {
    verifyCheckInToken.mockImplementation(() => {
      throw new Error('jwt malformed');
    });

    const res = await request(app)
      .post('/api/events/1/attendees/scan/checkin')
      .set('Authorization', `Bearer ${authToken()}`)
      .send({ token: 'invalid-token-example-invalid-token' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid or expired check-in token');
  });
});
