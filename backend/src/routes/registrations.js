import { Router } from 'express';
import { authenticate, authorizeRoles } from '../middleware/auth.js';
import { validateRegistration, validateCheckIn, handleValidationErrors } from '../middleware/validation.js';
import { 
  registerForEvent, 
  cancelRegistration,
  checkIn, 
  listEventAttendees,
  getUserRegistrations,
  exportAttendeesCSV
} from '../controllers/registrationController.js';

const router = Router({ mergeParams: true });

console.log('Setting up registration routes...');

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Registrations router is working' });
});

// User registration routes - specific routes first
router.get('/user/my-registrations', authenticate, getUserRegistrations);

// Event-specific routes
router.post('/:eventId', validateRegistration, handleValidationErrors, authenticate, registerForEvent);
router.delete('/:eventId', validateRegistration, handleValidationErrors, authenticate, cancelRegistration);

// Organizer/Admin routes
router.put('/:eventId/checkin/:registrationId', validateCheckIn, handleValidationErrors, authenticate, authorizeRoles('admin','organizer'), checkIn);
router.get('/:eventId', validateRegistration, handleValidationErrors, authenticate, authorizeRoles('admin','organizer'), listEventAttendees);
router.get('/:eventId/export', validateRegistration, handleValidationErrors, authenticate, authorizeRoles('admin','organizer'), exportAttendeesCSV);

export default router;
