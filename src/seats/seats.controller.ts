import { prisma } from '../db/mysql';
import { Request, Response } from "express";

type SeatParams = {
  idEvent: string;
  idPlace: string;
  idSector: string;
};


export async function createSeatEventGridForEvent(idEvent: number, idPlace: number): Promise<void> {
  const sectors = await prisma.sector.findMany({
    where: { idPlace },
    include: { seats: true },
  });

  for (const sector of sectors) {
    for (const seat of sector.seats) {
      await prisma.seatEvent.upsert({
        where: {
          idEvent_idPlace_idSector_idSeat: {
            idEvent,
            idPlace,
            idSector: sector.idSector,
            idSeat: seat.idSeat,
          },
        },
        update: {},
        create: {
          idEvent,
          idPlace,
          idSector: sector.idSector,
          idSeat: seat.idSeat,
          state: 'available',
        },
      });
    }
  }
}

export const getSeatsForSector = async (req: Request, res: Response) => {
  try {
    const { idEvent, idPlace, idSector } = req.params;

    const seats = await prisma.seatEvent.findMany({
      where: {
        idEvent: Number(idEvent),
        idPlace: Number(idPlace),
        idSector: Number(idSector),
      },
      include: {
        seat: true, // para traer label/número
      },
      orderBy: { idSeat: 'asc' }
    });

    res.json({
      data: seats.map(s => ({
        id: s.idSeat,
        state: s.state
      }))
    });
  } catch (error) {
    console.error('Error al obtener asientos', error);
    res.status(500).json({ message: 'Error al obtener asientos' });
  }
};