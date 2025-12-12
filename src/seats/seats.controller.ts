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

export const getSeatsForSector = async (req: Request<SeatParams>, res: Response) => {
  try {
    const { idEvent, idSector } = req.params;

    const seats = await prisma.seatEvent.findMany({
      where: {
        idEvent: Number(idEvent),
        idSector: Number(idSector),
      },
      include: { seat: true },
      orderBy: { idSeat: "asc" },
    });

    res.json({
      data: seats.map((s) => ({
        id: s.idSeat,
        label: (s.seat as any)?.label || `Asiento ${s.idSeat}`,
        state: s.state as "available" | "reserved" | "sold" | "selected",
      })),
    });
  } catch (error) {

    res.status(500).json({ message: "Error al obtener asientos" });
  }
};