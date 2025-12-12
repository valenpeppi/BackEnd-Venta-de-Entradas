import { Router } from 'express';
import { BOOT_ID } from './boot';

const router = Router();

router.get('/boot', (req, res) => {
  res.json({ bootId: BOOT_ID });
});

export default router;
