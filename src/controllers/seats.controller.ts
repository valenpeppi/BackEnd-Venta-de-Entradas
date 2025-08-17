import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SeatsController {
  public async getAvailableSeats(req: Request, res: Response): Promise<void> {
    const { eventId, placeId, sectorId } = req.query;

    try {
      const where: any = { is_available: true };
      if (eventId) where.event_id = Number(eventId);
      if (placeId) where.place_id = Number(placeId);
      if (sectorId) where.sector_id = Number(sectorId);

      const seats = await prisma.seat.findMany({ where });
      res.status(200).json(seats);
    } catch (error: any) {
      console.error('Error al obtener asientos disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  public async updateSeatState(req: Request, res: Response): Promise<void> {
    const { idPlace, idSector, idSeat } = req.params;
    const { is_available, status } = req.body;

    try {
      const result = await prisma.seat.updateMany({
        where: {
          id_place: Number(idPlace),
          id_sector: Number(idSector),
          id: Number(idSeat),
        },
        data: { is_available, status },
      });

      if (result.count === 0) {
        res.status(404).json({ message: 'Asiento no encontrado o no se realizó ninguna actualización' });
        return;
      }
      res.status(200).json({ message: `Asiento ${idSeat} actualizado correctamente.` });
    } catch (error: any) {
      console.error('Error al actualizar el estado del asiento:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
}

export default new SeatsController();