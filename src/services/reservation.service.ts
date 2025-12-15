

import { prisma } from '../db/mysql';

export interface TicketGroup {
    idEvent: number | string;
    idPlace: number | string;
    idSector: number | string;
    ids?: (number | string)[];
    quantity?: number | string;
}

export async function reserveTickets(ticketGroups: TicketGroup[]): Promise<TicketGroup[]> {

    return await prisma.$transaction(async (tx) => {
        for (const group of ticketGroups) {
            const idEvent = String(group.idEvent);
            const idPlace = String(group.idPlace);
            const idSector = Number(group.idSector);

            const requestedIds = Array.isArray(group.ids)
                ? group.ids.map(Number).filter(n => Number.isFinite(n) && n > 0)
                : [];

            const qtyParam = Number(group.quantity);

            const quantity = (Number.isFinite(qtyParam) && qtyParam > 0)
                ? qtyParam
                : requestedIds.length;

            if (!idEvent || !idPlace || (idSector !== 0 && !idSector)) {
                throw new Error('Grupo de tickets inválido: faltan IDs');
            }


            const sector = await tx.sector.findUnique({
                where: { idSector_idPlace: { idSector, idPlace } },
                select: { sectorType: true }
            });

            if (!sector) throw new Error(`Sector ${idSector} no encontrado en lugar ${idPlace}`);
            const isEnumerated = sector.sectorType.toLowerCase() === 'enumerated';

            if (isEnumerated) {

                if (requestedIds.length === 0 && quantity > 0) {
                    await reserveAnyAvailable(tx, group, idEvent, idPlace, idSector, quantity);
                } else if (requestedIds.length > 0) {

                    await reserveSpecificSeats(tx, group, idEvent, idPlace, idSector, requestedIds);
                } else {
                    throw new Error('Para sector enumerado se requieren IDs o cantidad > 0');
                }
            } else {

                if (quantity <= 0) throw new Error('Cantidad debe ser mayor a 0 para no enumerados');
                await reserveAnyAvailable(tx, group, idEvent, idPlace, idSector, quantity);
            }
        }
        return ticketGroups;
    }, {
        timeout: 10000
    });
}

async function reserveSpecificSeats(tx: any, group: TicketGroup, idEvent: string, idPlace: string, idSector: number, ids: number[]) {

    const result = await tx.seatEvent.updateMany({
        where: {
            idEvent,
            idPlace,
            idSector,
            idSeat: { in: ids },
            state: 'available'
        },
        data: { state: 'reserved' }
    });

    if (result.count !== ids.length) {
        throw new Error(`Uno o más asientos seleccionados ya no están disponibles. Solicitados: ${ids.length}, Reservados: ${result.count}`);
    }


    group.ids = ids;
}

async function reserveAnyAvailable(tx: any, group: TicketGroup, idEvent: string, idPlace: string, idSector: number, quantity: number) {
    const MAX_RETRIES = 3;
    let attempt = 0;
    let reserveds: number[] = [];

    while (attempt < MAX_RETRIES) {
        attempt++;


        const candidates = await tx.seatEvent.findMany({
            where: { idEvent, idPlace, idSector, state: 'available' },
            take: quantity,
            select: { idSeat: true }
        });

        if (candidates.length < quantity) {
            throw new Error(`No hay suficientes entradas disponibles. Disponibles: ${candidates.length}, Solicitadas: ${quantity}`);
        }

        const candidateIds = candidates.map((c: any) => c.idSeat);


        const updateResult = await tx.seatEvent.updateMany({
            where: {
                idEvent,
                idPlace,
                idSector,
                idSeat: { in: candidateIds },
                state: 'available'
            },
            data: { state: 'reserved' }
        });

        if (updateResult.count === quantity) {
            reserveds = candidateIds;
            break;
        } else {
            // Concurrency conflict (some seats taken), retrying...
            await new Promise((r) => setTimeout(r, 50 + Math.random() * 50));
        }
    }

    if (reserveds.length !== quantity) {
        throw new Error('Conflicto de concurrencia al reservar asientos. Por favor intente nuevamente.');
    }

    group.ids = reserveds;
}
