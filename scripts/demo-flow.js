/* eslint-disable no-console */

const baseUrl = process.env.DEMO_BASE_URL || 'http://localhost:5000';
const organizerEmail = process.env.DEMO_ORGANIZER_EMAIL || 'org1@gatherly.local';
const organizerPassword = process.env.DEMO_ORGANIZER_PASSWORD || 'Organizer@1234';
const attendeePassword = process.env.DEMO_ATTENDEE_PASSWORD || 'Attendee@1234';

const now = Date.now();
const suffix = String(now).slice(-6);
const attendeeEmail = process.env.DEMO_ATTENDEE_EMAIL || `attendee.${suffix}@example.com`;
const attendeeName = process.env.DEMO_ATTENDEE_NAME || `Attendee ${suffix}`;

const state = {
  organizerToken: null,
  attendeeToken: null,
  eventId: null,
  ticketId: null,
  attendeeId: null,
  checkInToken: null,
  paymentId: null
};

const readJsonResponse = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return { raw: text };
  }
};

const request = async (method, path, { token, body, headers = {} } = {}) => {
  const url = `${baseUrl}${path}`;
  const reqHeaders = { ...headers };
  if (token) reqHeaders.Authorization = `Bearer ${token}`;
  if (body !== undefined && !reqHeaders['Content-Type']) {
    reqHeaders['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const data = await readJsonResponse(res);
  return { status: res.status, data };
};

const assertStatus = (result, expected, context) => {
  if (!expected.includes(result.status)) {
    throw new Error(`${context} failed with status ${result.status}: ${JSON.stringify(result.data)}`);
  }
};

const step = async (name, fn) => {
  console.log(`\n==> ${name}`);
  await fn();
};

const run = async () => {
  await step('Health check', async () => {
    const result = await request('GET', '/health');
    assertStatus(result, [200], 'Health check');
    console.log('ok', result.data);
  });

  await step('Organizer login', async () => {
    const result = await request('POST', '/api/auth/login', {
      body: { email: organizerEmail, password: organizerPassword }
    });
    assertStatus(result, [200], 'Organizer login');
    state.organizerToken = result.data.token;
    console.log('organizer authenticated');
  });

  await step('Create event as organizer', async () => {
    const start = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    const end = new Date(now + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString();

    const result = await request('POST', '/api/events', {
      token: state.organizerToken,
      body: {
        title: `Portfolio Demo Event ${suffix}`,
        description: 'Automated portfolio walkthrough event',
        category: 'Technology',
        location: 'Online',
        tags: ['portfolio', 'demo'],
        images: [],
        startDate: start,
        endDate: end,
        published: true,
        featured: true
      }
    });

    assertStatus(result, [201], 'Create event');
    state.eventId = result.data.data.id;
    console.log('eventId', state.eventId);
  });

  await step('Create ticket for event', async () => {
    const result = await request('POST', `/api/events/${state.eventId}/tickets`, {
      token: state.organizerToken,
      body: {
        type: 'Regular',
        price: 20,
        currency: 'usd',
        quantity: 50,
        limitPerUser: 2
      }
    });

    assertStatus(result, [201], 'Create ticket');
    state.ticketId = result.data.data.id;
    console.log('ticketId', state.ticketId);
  });

  await step('Register attendee account', async () => {
    const registerResult = await request('POST', '/api/auth/register', {
      body: {
        name: attendeeName,
        email: attendeeEmail,
        password: attendeePassword
      }
    });

    assertStatus(registerResult, [201], 'Register attendee');

    const loginResult = await request('POST', '/api/auth/login', {
      body: {
        email: attendeeEmail,
        password: attendeePassword
      }
    });

    assertStatus(loginResult, [200], 'Attendee login');
    state.attendeeToken = loginResult.data.token;
    console.log('attendee authenticated', attendeeEmail);
  });

  await step('Attendee discovers events', async () => {
    const result = await request('GET', '/api/events?published=true');
    assertStatus(result, [200], 'List events');
    console.log('events found', result.data?.data?.length || 0);
  });

  await step('Attendee registers to event ticket', async () => {
    const result = await request('POST', `/api/events/${state.eventId}/attendees/register`, {
      token: state.attendeeToken,
      body: { ticketId: state.ticketId }
    });

    assertStatus(result, [201], 'Attendee registration');
    state.attendeeId = result.data.data.id;
    state.checkInToken = result.data.checkInToken;
    console.log('attendeeId', state.attendeeId);
  });

  await step('Attendee posts feedback comment', async () => {
    const result = await request('POST', `/api/events/${state.eventId}/comments`, {
      token: state.attendeeToken,
      body: { content: 'Great flow and smooth APIs.', rating: 5 }
    });
    assertStatus(result, [201], 'Create comment');
    console.log('commentId', result.data.data.id);
  });

  await step('Organizer checks attendee in by scanning signed QR token', async () => {
    if (!state.checkInToken) {
      throw new Error('Missing check-in token in attendee registration response');
    }

    const result = await request('POST', `/api/events/${state.eventId}/attendees/scan/checkin`, {
      token: state.organizerToken,
      body: { token: state.checkInToken }
    });

    assertStatus(result, [200], 'Check-in attendee');
    console.log('checkedIn', result.data.data.checkedIn);
  });

  await step('Attempt purchase flow (optional, depends on Stripe setup)', async () => {
    const result = await request('POST', `/api/payments/purchase/${state.ticketId}`, {
      token: state.attendeeToken,
      headers: { 'Idempotency-Key': `demo-${suffix}` },
      body: { quantity: 1 }
    });

    if (result.status === 201) {
      state.paymentId = result.data.paymentId;
      console.log('payment created', state.paymentId);
      return;
    }

    if (result.status === 500 && result.data && result.data.error === 'Payments not configured') {
      console.log('skipped: Stripe not configured in this environment');
      return;
    }

    throw new Error(`Purchase flow failed with status ${result.status}: ${JSON.stringify(result.data)}`);
  });

  await step('Organizer opens analytics', async () => {
    const result = await request('GET', `/api/analytics/events/${state.eventId}`, {
      token: state.organizerToken
    });

    assertStatus(result, [200], 'Event analytics');
    console.log('analytics', result.data.data);
  });

  console.log('\nDemo flow completed successfully.');
  console.log(JSON.stringify({ baseUrl, ...state, attendeeEmail }, null, 2));
};

run().catch((error) => {
  console.error('\nDemo flow failed.');
  console.error(error.message);
  process.exit(1);
});
