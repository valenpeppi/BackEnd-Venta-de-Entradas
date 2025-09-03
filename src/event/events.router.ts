import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyToken, isCompany } from '../auth/auth.middleware';
import { createEvent, getAllEvents, getAllEventTypes, getPendingEvents,
  approveEvent, rejectEvent, getFeaturedEvents, getAvailableDatesByPlace } from './event.controller';

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

// === Rutas Protegidas ===
router.post(
  '/createEvent',
  verifyToken, 
  isCompany,    
  upload.single('image'),
  createEvent
);

router.get('/', verifyToken, getAllEvents);

// === Rutas Públicas ===
router.get('/types', getAllEventTypes);

router.get('/pending', verifyToken, getPendingEvents);

router.patch("/:id/approve", verifyToken,  approveEvent);
router.patch("/:id/reject", verifyToken,  rejectEvent);
router.get('/featured', getFeaturedEvents);
router.get('/available-dates/:idPlace', getAvailableDatesByPlace);

export default router;
