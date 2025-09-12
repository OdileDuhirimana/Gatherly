import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { 
  listEvents, 
  createEvent, 
  getEvent, 
  updateEvent, 
  deleteEvent, 
  getEventStats,
  getUserEvents 
} from '../controllers/eventController.js';

const router = Router();

// Public routes
router.get('/', listEvents);
router.get('/:id', getEvent);

// Protected routes
router.post('/', authenticate, authorizeRoles('admin','organizer'), upload.single('image'), createEvent);
router.put('/:id', authenticate, authorizeRoles('admin','organizer'), upload.single('image'), updateEvent);
router.delete('/:id', authenticate, authorizeRoles('admin','organizer'), deleteEvent);
router.get('/:id/stats', authenticate, authorizeRoles('admin','organizer'), getEventStats);
router.get('/user/my-events', authenticate, getUserEvents);

export default router;
