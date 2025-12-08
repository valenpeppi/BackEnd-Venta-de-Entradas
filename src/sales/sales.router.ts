import { Router } from 'express';
import SalesController from './sales.controller';
import { verifyToken, isAdmin } from '../auth/auth.middleware';
import { prisma } from '../db/mysql';

const router: Router = Router();

router.post('/confirm', (req, res, next) => {
  console.log('📩 /api/sales/confirm recibido:', req.body);
  next();
}, SalesController.confirmSale);

router.get('/my-tickets', verifyToken, SalesController.getUserTickets);
router.get('/stats', verifyToken, isAdmin, SalesController.getAdminStats);

router.get('/check', async (req, res) => {
  const dniClient = Number(req.query.dniClient);
  if (!Number.isFinite(dniClient)) {
    return res.status(400).json({ error: 'DNI inválido' });
  }

  try {
    const since = new Date(Date.now() - 5 * 60 * 1000);
    const recentSale = await prisma.sale.findFirst({
      where: { client: { dni: dniClient }, date: { gte: since } },
      orderBy: { date: 'desc' },
      take: 1,
    });

    if (!recentSale) {
      return res.status(200).json({ confirmed: false });
    }
    return res.status(200).json({ confirmed: true, idSale: recentSale.idSale });
  } catch (err) {
    console.error('Error verificando venta:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
