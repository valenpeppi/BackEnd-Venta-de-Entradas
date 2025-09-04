import { prisma } from '../db/mysql';

/**
 * Populates the seat_event table for a given event and place.
 * It creates an entry for every seat in each sector of the place
 * with initial state 'available'.
 */
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