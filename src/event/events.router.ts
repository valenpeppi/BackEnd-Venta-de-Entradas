import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, isCompany, isAdmin } from '../auth/auth.middleware';
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
  getEventSummary
  
  
} from './event.controller';

const router = Router();

// === Configuración de Multer ===
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `event-${unique}${ext}`);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    allowedTypes.includes(file.mimetype) 
      ? cb(null, true)
      : cb(new Error('Tipo de archivo no permitido'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// === Rutas Protegidas para Empresas ===
router.post(
  '/createEvent',
  verifyToken, 
  isCompany,    
  upload.single('image'),
  createEvent
);

// === Rutas de Admin ===
router.get('/pending', verifyToken, isAdmin, getPendingEvents);
router.get('/all', verifyToken, isAdmin, getAdminAllEvents);
router.patch("/:id/approve", verifyToken, isAdmin, approveEvent);
router.patch("/:id/reject", verifyToken, isAdmin, rejectEvent);
router.patch('/:id/feature', verifyToken, isAdmin, toggleFeatureStatus);


// === Rutas Públicas ===
router.get('/types', getAllEventTypes);
router.get('/featured', getFeaturedEvents);
router.get('/approved', getApprovedEvents);
router.get('/available-dates/:idPlace', getAvailableDatesByPlace);
router.get('/events/:id', getEventSummary);      // resumen del evento (incluye placeType y precio/minPrice)
router.get('/events/:id/sectors', getEventSectors); // sectores (solo Hybrid)




export default router;

