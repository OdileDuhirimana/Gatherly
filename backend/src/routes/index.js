
import { Router } from 'express';
import authRouter from './auth.js';
import eventsRouter from './events.js';
import registrationsRouter from './registrations.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/events', eventsRouter);
router.use('/events', registrationsRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
