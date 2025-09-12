import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/auth.js';
import { 
  registerForEvent, 
  cancelRegistration,
  checkIn, 
  listEventAttendees,
  getUserRegistrations,
  exportAttendeesCSV
} from '../controllers/registrationController.js';

const router = Router({ mergeParams: true });

// User registration routes
router.post('/:id/register', authenticate, registerForEvent);
router.delete('/:id/register', authenticate, cancelRegistration);
router.get('/user/my-registrations', authenticate, getUserRegistrations);

// Organizer/Admin routes
router.post('/:id/registrations/:regId/check-in', authenticate, authorizeRoles('admin','organizer'), checkIn);
router.get('/:id/registrations', authenticate, authorizeRoles('admin','organizer'), listEventAttendees);
router.get('/:id/export', authenticate, authorizeRoles('admin','organizer'), exportAttendeesCSV);

export default router;
