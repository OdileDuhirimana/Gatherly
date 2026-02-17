jest.mock('../src/models', () => ({
  models: {
    User: {
      findOne: jest.fn(),
      create: jest.fn()
    }
  }
}));

jest.mock('../src/utils/password', () => ({
  hashPassword: jest.fn(async () => 'hashed-password'),
  comparePassword: jest.fn()
}));

jest.mock('../src/utils/jwt', () => ({
  signToken: jest.fn(() => 'mock-jwt-token')
}));

const request = require('supertest');
const app = require('../src/app');
const { models } = require('../src/models');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth register hardening', () => {
  it('rejects role in self-registration payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Doe',
        email: 'alice@example.com',
        password: 'password123',
        role: 'Admin'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors[0]).toHaveProperty('msg', 'Role cannot be set during self-registration');
    expect(models.User.findOne).not.toHaveBeenCalled();
    expect(models.User.create).not.toHaveBeenCalled();
  });

  it('creates attendee role when registration payload is valid', async () => {
    models.User.findOne.mockResolvedValue(null);
    models.User.create.mockResolvedValue({
      id: 1,
      name: 'Alice Doe',
      email: 'alice@example.com',
      role: 'Attendee'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice Doe',
        email: 'alice@example.com',
        password: 'password123'
      });

    expect(res.status).toBe(201);
    expect(models.User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'Attendee' }));
    expect(res.body).toMatchObject({
      token: 'mock-jwt-token',
      user: {
        id: 1,
        name: 'Alice Doe',
        email: 'alice@example.com',
        role: 'Attendee'
      }
    });
  });
});
