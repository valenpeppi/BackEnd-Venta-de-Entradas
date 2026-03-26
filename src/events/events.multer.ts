import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const unique = crypto.randomUUID();
        const ext = path.extname(file.originalname);
        cb(null, `event-${unique}${ext}`);
    },
});

export const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        allowedTypes.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Tipo de archivo no permitido'));
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});
