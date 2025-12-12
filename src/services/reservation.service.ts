/**
 
 * Servicio de Reservas de Entradas que se encarga de bloquear los asientos en la base de datos para que nadie más pueda comprarlos mientras el usuario paga.
 
 * Funcionalidades:
1. `reserveTickets`: Función principal que recibe un array de grupos de tickets y ejecuta la reserva en una transacción.
2. Soporte para dos modos de reserva:
    - **Asientos específicos: Para sectores numerados donde el usuario elige ubicación exacta (`reserveSpecificSeats`).
    - **Cantidad automática: Para sectores generales (campo) o cuando no se elige asiento (`reserveAnyAvailable`).

 * Todo se ejecuta bajo una transacción de Prisma para asegurar que o se reservan TODOS los tickets solicitados o ninguno, evitando inconsistencias.
 */

import { prisma } from '../db/mysql';

export interface TicketGroup {
    idEvent: number | string;
    idPlace: number | string;
    idSector: number | string;
    ids?: (number | string)[]; // IDs específicos para numerados
    quantity?: number | string; // Cantidad para no numerados (o numerados sin selección manual, si aplica)
}

export async function reserveTickets(ticketGroups: TicketGroup[]): Promise<TicketGroup[]> {

    return await prisma.$transaction(async (tx) => {
        for (const group of ticketGroups) {
            const idEvent = Number(group.idEvent);
            const idPlace = Number(group.idPlace);
            const idSector = Number(group.idSector);

            const requestedIds = Array.isArray(group.ids)
                ? group.ids.map(Number).filter(n => Number.isFinite(n) && n > 0)
                : [];

            const qtyParam = Number(group.quantity);
            // Si ids está vacío:
            const quantity = (Number.isFinite(qtyParam) && qtyParam > 0)
                ? qtyParam
                : requestedIds.length;

            if (!idEvent || !idPlace || (idSector !== 0 && !idSector)) {
                throw new Error('Grupo de tickets inválido: faltan IDs');
            }

            // 1. Verificar tipo de sector
            const sector = await tx.sector.findUnique({
                where: { idSector_idPlace: { idSector, idPlace } },
                select: { sectorType: true }
            });

            if (!sector) throw new Error(`Sector ${idSector} no encontrado en lugar ${idPlace}`);
            const isEnumerated = sector.sectorType.toLowerCase() === 'enumerated';

            if (isEnumerated) {
                // Lógica para Enumerados
                if (requestedIds.length === 0 && quantity > 0) {
                    await reserveAnyAvailable(tx, group, idEvent, idPlace, idSector, quantity);
                } else if (requestedIds.length > 0) {
                    // Reserva exacta de IDs
                    await reserveSpecificSeats(tx, group, idEvent, idPlace, idSector, requestedIds);
                } else {
                    throw new Error('Para sector enumerado se requieren IDs o cantidad > 0');
                }
            } else {
                // Lógica para No Enumerados (reservar cantidad X)
                if (quantity <= 0) throw new Error('Cantidad debe ser mayor a 0 para no enumerados');
                await reserveAnyAvailable(tx, group, idEvent, idPlace, idSector, quantity);
            }
        }
        return ticketGroups;
    }, {
        timeout: 10000 // 10s timeout para evitar bloqueos largos
    });
}

async function reserveSpecificSeats(tx: any, group: TicketGroup, idEvent: number, idPlace: number, idSector: number, ids: number[]) {
    // Actualizamos
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

    // Asignamos los IDs confirmados al grupo
    group.ids = ids;
}

async function reserveAnyAvailable(tx: any, group: TicketGroup, idEvent: number, idPlace: number, idSector: number, quantity: number) {
    const MAX_RETRIES = 3;
    let attempt = 0;
    let reserveds: number[] = [];

    while (attempt < MAX_RETRIES) {
        attempt++;

        // 1. Buscar candidatos disponibles
        const candidates = await tx.seatEvent.findMany({
            where: { idEvent, idPlace, idSector, state: 'available' },
            take: quantity,
            select: { idSeat: true }
        });

        if (candidates.length < quantity) {
            throw new Error(`No hay suficientes entradas disponibles. Disponibles: ${candidates.length}, Solicitadas: ${quantity}`);
        }

        const candidateIds = candidates.map((c: any) => c.idSeat);

        // 2. Intentar reservar estos candidatos específicos
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
        }
    }

    if (reserveds.length !== quantity) {
        throw new Error('Conflicto de concurrencia al reservar asientos. Por favor intente nuevamente.');
    }

    group.ids = reserveds;
}
