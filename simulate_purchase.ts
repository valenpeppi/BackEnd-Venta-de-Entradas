
import { reserveTickets } from './src/services/reservation.service';
import { prisma } from './src/db/mysql';

async function simulatePurchase() {
    console.log('Iniciando simulación de compra con Sector ID 1 (Correcto)...');

    // Datos del evento obtenidos del debug anterior: Evento 11, Lugar 1, Sector 1.
    const ticketGroups = [
        {
            idEvent: 11,
            idPlace: 1,
            idSector: 1,
            quantity: 1, // Comprar 1 entrada
            ids: [] // No numerado
        }
    ];

    try {
        console.log('Intentando reservar...');
        await reserveTickets(ticketGroups);
        console.log('✅ Reserva exitosa!');
        console.log('IDs reservados:', ticketGroups[0].ids);

        // Verificar en DB
        const reserved = await prisma.seatEvent.findMany({
            where: { idEvent: 11, idPlace: 1, idSector: 1, idSeat: { in: ticketGroups[0].ids as number[] } }
        });
        console.log('Estado en DB:', reserved.map(s => ({ id: s.idSeat, state: s.state })));

    } catch (error: any) {
        console.error('❌ Error en reserva:', error.message);
    }
}

simulatePurchase()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
