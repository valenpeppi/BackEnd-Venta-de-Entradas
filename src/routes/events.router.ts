import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createEvent, getAllEvents, getAllEventTypes } from '../controllers/event.controller';

const router = Router();

// === Multer config ===
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
const upload = multer({ storage });

// Rutas
router.post('/createEvent', upload.single('image'), createEvent);
router.get('/', getAllEvents);
router.get('/types', getAllEventTypes);

export default router;
