
import { prisma } from './src/db/mysql';

async function main() {
    console.log('Buscando sectores para idPlace = 1...');
    const sectors = await prisma.sector.findMany({
        where: { idPlace: 1 }
    });
    console.log('Sectores encontrados:', sectors);

    console.log('Buscando eventos en idPlace = 1...');
    const events = await prisma.event.findMany({
        where: { idPlace: 1 },
        take: 1
    });
    console.log('Evento ejemplo:', events[0]);

    if (events[0]) {
        console.log('Sectores del evento:', await prisma.eventSector.findMany({ where: { idEvent: events[0].idEvent } }));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
