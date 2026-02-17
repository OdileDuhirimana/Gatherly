const request = require('supertest');
const Stripe = require('stripe');
const app = require('../src/app');

describe('Stripe webhook signature verification', () => {
  const webhookSecret = 'whsec_test_signature_secret';
  const stripe = new Stripe('sk_test_example', { apiVersion: '2024-06-20' });

  beforeAll(() => {
    process.env.STRIPE_WEBHOOK_SECRET = webhookSecret;
  });

  afterAll(() => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  });

  it('accepts valid Stripe signature', async () => {
    const payload = JSON.stringify({
      id: 'evt_test_1',
      type: 'integration.test.event',
      data: { object: {} }
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: webhookSecret
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  it('rejects invalid Stripe signature', async () => {
    const payload = JSON.stringify({
      id: 'evt_test_2',
      type: 'integration.test.event',
      data: { object: {} }
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'invalid-signature')
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Webhook Error');
  });
});
