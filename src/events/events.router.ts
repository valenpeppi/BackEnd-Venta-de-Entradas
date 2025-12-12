import { Router, Response } from 'express';
import { verifyToken, isCompany, isAdmin } from '../auth/auth.middleware';
import { upload } from './events.multer';
import {
  createEvent,
  getAllEventTypes,
  getPendingEvents,
  getAdminAllEvents,
  approveEvent,
  rejectEvent,
  getFeaturedEvents,
  getAvailableDatesByPlace,
  toggleFeatureStatus,
  getApprovedEvents,
  getEventSectors,
  getEventSummary,
  getSeatsForEventSector,
  searchEvents,
  getTicketMap,
  getEventTypes,
  getEventsByOrganiser,
  deleteEvent,
  updateEvent,
  markEventAsDeleted
} from './events.controller';

const router = Router();

 
router.post(
  '/createEvent',
  verifyToken,
  isCompany,
  upload.single('image'),
  createEvent
);

router.get(
  '/company',
  verifyToken,
  isCompany,
  getEventsByOrganiser
);

router.delete(
  '/:id',
  verifyToken,
  isCompany,
  deleteEvent
);

router.put(
  '/:id',
  verifyToken,
  isCompany,
  upload.single('image'),
  updateEvent
);

 
router.get('/pending', verifyToken, isAdmin, getPendingEvents);
router.get('/all', verifyToken, isAdmin, getAdminAllEvents);
router.patch("/:id/approve", verifyToken, isAdmin, approveEvent);
router.patch("/:id/reject", verifyToken, isAdmin, rejectEvent);
router.patch("/:id/state-delete", verifyToken, isAdmin, markEventAsDeleted);
router.patch('/:id/feature', verifyToken, isAdmin, toggleFeatureStatus);


 
router.get('/event-types', getEventTypes);
router.get('/types', getAllEventTypes);
router.get('/featured', getFeaturedEvents);
router.get('/approved', getApprovedEvents);
router.get('/available-dates/:idPlace', getAvailableDatesByPlace);
router.get('/search', searchEvents);
router.get('/events/:id', getEventSummary);
router.get('/events/:id/sectors', getEventSectors);
router.get('/events/:id/sectors/:idSector/seats', getSeatsForEventSector);
router.get('/events/:id/tickets/map', getTicketMap);


export default router;

