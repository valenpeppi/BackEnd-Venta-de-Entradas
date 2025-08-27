import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SeatsController {
  public async getAvailableSeats(req: Request, res: Response): Promise<void> {
    const { eventId, placeId, sectorId } = req.query;

    try {
      const where: any = { is_available: true };
      if (eventId) where.idEvent = Number(eventId);
      if (placeId) where.idPlace = Number(placeId);
      if (sectorId) where.idSector = Number(sectorId);

      const seats = await prisma.seat.findMany({ where });
      res.status(200).json(seats);
    } catch (error: any) {
      console.error('Error al obtener asientos disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }

  public async updateSeatState(req: Request, res: Response): Promise<void> {
    const { idPlace, idSector, idSeat } = req.params;
    const { state } = req.body; 

    try {
      const result = await prisma.seat.update({
        where: {
            idSeat_idSector_idPlace: {
                idSeat: Number(idSeat),
                idSector: Number(idSector),
                idPlace: Number(idPlace)
            }
        },
        data: { state },
      });

      res.status(200).json({ message: `Asiento ${idSeat} actualizado correctamente.`, result });
    } catch (error: any) {
      console.error('Error al actualizar el estado del asiento:', error);
      if (error.code === 'P2025') {
          res.status(404).json({ message: 'Asiento no encontrado.' });
      } else {
          res.status(500).json({ error: 'Error interno del servidor', details: error.message });
      }
    }
  }
}

export default new SeatsController();