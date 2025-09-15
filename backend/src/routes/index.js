
import { Router } from 'express';
import authRouter from './auth.js';
import eventsRouter from './events.js';
import registrationsRouter from './registrations.js';

const router = Router();

console.log('Mounting routes...');
router.use('/auth', authRouter);
router.use('/events', eventsRouter);
try {
  router.use('/registrations', registrationsRouter);
  console.log('Registrations router mounted successfully');
} catch (error) {
  console.error('Error mounting registrations router:', error);
}
console.log('Routes mounted successfully');

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;
