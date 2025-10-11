import { randomUUID } from 'crypto';

// Un ID único por arranque del proceso. Cambia con cada restart.
export const BOOT_ID = randomUUID();
