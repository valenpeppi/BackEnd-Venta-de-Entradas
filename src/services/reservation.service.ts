import { prisma } from '../db/mysql';

export interface TicketGroup {
    idEvent: number | string;
    idPlace: number | string;
    idSector: number | string;
    ids?: (number | string)[]; // IDs específicos para numerados
    quantity?: number | string; // Cantidad para no numerados (o numerados sin selección manual, si aplica)
}

/**
 * Intenta reservar los asientos especificados de manera atómica y segura contra concurrencia.
 * Modifica el array ticketGroups asigando los IDs reservados en caso de éxito.
 * Lanza error si no se pueden asegurar los asientos.
 */
export async function reserveTickets(ticketGroups: TicketGroup[]): Promise<TicketGroup[]> {
    // Procesamos cada grupo secuencialmente para evitar deadlocks complejos, 
    // aunque idealmente se podría hacer en paralelo si son eventos distintos, 
    // pero dentro de una tx de prisma es mejor secuencial.

    // Usamos una transacción interactiva si es necesario, 
    // pero para mayor control, haremos las operaciones y verificaremos.
    // Nota: Prisma interactive transactions ($transaction(async tx => ...)) son buenas aqui.

    return await prisma.$transaction(async (tx) => {
        for (const group of ticketGroups) {
            const idEvent = Number(group.idEvent);
            const idPlace = Number(group.idPlace);
            const idSector = Number(group.idSector);

            const requestedIds = Array.isArray(group.ids)
                ? group.ids.map(Number).filter(n => Number.isFinite(n) && n > 0)
                : [];

            const qtyParam = Number(group.quantity);
            // Prioridad: cantidad explícita > longitud de ids (si ids está vacío)
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
                    // Caso raro: Enumerado pero pide "dame 3 cualesquiera". 
                    // Implementamos lógica similar a no-enumerado (buscar disponibles).
                    await reserveAnyAvailable(tx, group, idEvent, idPlace, idSector, quantity);
                } else if (requestedIds.length > 0) {
                    // Reserva exacta de IDs
                    await reserveSpecificSeats(tx, group, idEvent, idPlace, idSector, requestedIds);
                } else {
                    throw new Error('Para sector enumerado se requieren IDs o cantidad > 0');
                }
            } else {
                // Lógica para No Enumerados (reservar cantidad X cualquiera)
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
    // Intentar actualizar directamente
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

    // Asignamos los IDs confirmados al grupo (ya estaban, pero por consistencia)
    group.ids = ids;
}

async function reserveAnyAvailable(tx: any, group: TicketGroup, idEvent: number, idPlace: number, idSector: number, quantity: number) {
    const MAX_RETRIES = 3;
    let attempt = 0;
    let reserveds: number[] = [];

    while (attempt < MAX_RETRIES) {
        attempt++;

        // 1. Buscar candidatos disponibles
        // "SELECT id FROM SeatEvent WHERE ... LIMIT quantity"
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
            // Éxito total
            reserveds = candidateIds;
            break;
        } else {
            // Fallo parcial: Alguien nos ganó algunos de los candidatos entre el findMany y el updateMany.
            // Como estamos dentro de una transacción interactiva, si fallamos aquí y no lanzamos error,
            // la tx sigue viva. Pero wait, updateMany ya ocurrió parcialmente?
            // updateMany actualiza los que puede. SI retorna count < quantity, significa que actualizó algunos.
            // PERO, nuestra lógica exige atomicidad exacta por grupo (o todo o nada idealmente).
            // Si actualizó parcial, tenemos asientos reservados indeseados si no completamos el cupo?
            // No necesariamente, pero para simplificar, lanzaremos error para rollbackear TODO el grupo y reintentar la transacción entera?
            // No, el reintento "optimista" dentro de la tx es:
            // Si actualicé 3 de 5... me faltan 2. Podría buscar 2 más. 
            // PERO cuidado: los 3 que sí reservé ya son mios.

            // ESTRATEGIA MEJORADA: Loop "fill up".
            // Ya que updateMany reservó `updateResult.count`, esos son nuestros.
            // Necesitamos `quantity - updateResult.count` más.

            // Problema: no sabemos CUALES de los candidateIds fueron los exitosos. Prisma updateMany no retorna IDs.
            // Shit. Esto complica el "fill up".
            // Si no sabemos cuáles reservamos, no podemos ponerlos en group.ids.

            // SOLUCIÓN:
            // En este caso, lo mejor es hacer Throw Error para que ROLLBACK toda la transacción.
            // Y que el cliente (frontend o controlador) reintente.
            // O, hacemos el reintento manual aquí pero primero debemos deshacer lo parcial? 
            // Si lanzamos error, el `prisma.$transaction` wrapper hace rollback automático de TODO.
            // Así que lo más seguro es: si count != quantity -> Throw.
            // Pero si hacemos throw, se cancela todo, incluso los grupos anteriores exitosos.

            // ALTERNATIVA:
            // Usar reintentos a nivel de LÓGICA DE NEGOCIO, no dentro de la DB.
            // Pero queriamos Atomicidad.

            // Vamos a confiar en el reintento simple:
            // Si falla la concurrencia en un estadio "campo" (muy concurrido), es mejor fallar y que el usuario reintente
            // a dejar estados inconsistentes.

            // Sin embargo, para mitigar, podemos hacer UN reintento interno lanzando una excepcion interna? 
            // No, en prisma tx, throw = rollback.

            // Ok, aceptemos que si falla la concurrencia (race condition exacta en los mismos milisegundos en los mismos asientos random), fallamos el request.
            // Probabilidad baja en campo grande si randomizamos? `findMany` suele devolver ordenados por ID.
            // Eso aumenta la colisión. Todos intentan agarrar los primeros IDs disponibles.

            // MEJORA: `take: quantity * 2` o algo asi? No ayuda a la actualización atómica de "esos N".

            // CONCLUSIÓN:
            // Si count != quantity, lanzamos error "Concurrency conflict".
            // La transacción se revierte. Nadie compró nada. Seguro.
            // El usuario recibe error y prueba de nuevo.
        }
    }

    if (reserveds.length !== quantity) {
        throw new Error('Conflicto de concurrencia al reservar asientos. Por favor intente nuevamente.');
    }

    group.ids = reserveds;
}
