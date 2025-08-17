import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando el proceso de seeding...');

  try {
    // --- Tipos de Evento (`eventtype`) ---
    await prisma.eventType.upsert({
      where: { idType: 1 },
      update: {},
      create: { idType: 1, name: 'Concierto' },
    });
    await prisma.eventType.upsert({
      where: { idType: 2 },
      update: {},
      create: { idType: 2, name: 'Stand Up' },
    });
    await prisma.eventType.upsert({
      where: { idType: 3 },
      update: {},
      create: { idType: 3, name: 'Jornada de Lectura' },
    });
    await prisma.eventType.upsert({
      where: { idType: 4 },
      update: {},
      create: { idType: 4, name: 'Fiesta' },
    });
    await prisma.eventType.upsert({
      where: { idType: 5 },
      update: {},
      create: { idType: 5, name: 'Evento Deportivo' },
    });
    await prisma.eventType.upsert({
      where: { idType: 6 },
      update: {},
      create: { idType: 6, name: 'Arte' },
    });
    console.log('Datos de eventtype cargados.');

    // --- Organizadores (`organiser_company`) ---
    await prisma.organiser.upsert({
      where: { idOrganiser: 1 },
      update: {},
      create: {
        idOrganiser: 1,
        companyName: 'Eventos SRL',
        cuil: '30-12345678-9',
        contactEmail: 'contacto@eventos.com',
        password: 'password_hash_ejemplo',
        phone: '3411234567',
        address: 'Av. San Martín 123',
      },
    });
    await prisma.organiser.upsert({
      where: { idOrganiser: 2 },
      update: {},
      create: {
        idOrganiser: 2,
        companyName: 'peppi SRL',
        cuil: '2046497046',
        contactEmail: 'sbrolla@gmail.com',
        password: '$2b$10$z31P7gTLFV6fuwbaOeVKP.kYGuhP.nreAoklSnVo3z.s3gtp55CIG',
        phone: '03465654471',
        address: 'GODINO 887',
      },
    });
    await prisma.organiser.upsert({
      where: { idOrganiser: 3 },
      update: {},
      create: {
        idOrganiser: 3,
        companyName: 'gian SRL',
        cuil: '20-46187000-1',
        contactEmail: 'gian@hotmail.com',
        password: '$2b$10$nGs0vxZ66jyQE4bMELcTBOKorrT62lQfuZsbPTRT7aC8fQZhOkNFm',
        phone: '3465656777',
        address: 'zeballos 14453',
      },
    });
    console.log('Datos de organiser_company cargados.');

    // --- Lugares (`places`) ---
    await prisma.place.upsert({
      where: { idPlace: 1 },
      update: {},
      create: { idPlace: 1, name: 'Anfiteatro', totalCap: 100, address: 'Av. Belgrano 100 bis' },
    });
    await prisma.place.upsert({
      where: { idPlace: 2 },
      update: {},
      create: { idPlace: 2, name: 'Estadio Gigante de Arroyito', totalCap: 200, address: 'Av. Génova 640' },
    });
    await prisma.place.upsert({
      where: { idPlace: 3 },
      update: {},
      create: { idPlace: 3, name: 'Bioceres Arena', totalCap: 50, address: 'Cafferata 729' },
    });
    await prisma.place.upsert({
      where: { idPlace: 4 },
      update: {},
      create: { idPlace: 4, name: 'El Ateneo', totalCap: 25, address: 'Cordoba 1473' },
    });
    console.log('Datos de places cargados.');

    // --- Sectores (`sectors`) ---
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 1, idPlace: 1 } },
      update: {},
      create: { idSector: 1, idPlace: 1, name: 'Platea', capacity: 40 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 1, idPlace: 2 } },
      update: {},
      create: { idSector: 1, idPlace: 2, name: 'Campo', capacity: 80 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 1, idPlace: 3 } },
      update: {},
      create: { idSector: 1, idPlace: 3, name: 'VIP', capacity: 20 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 1, idPlace: 4 } },
      update: {},
      create: { idSector: 1, idPlace: 4, name: 'Sala Principal', capacity: 25 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 2, idPlace: 1 } },
      update: {},
      create: { idSector: 2, idPlace: 1, name: 'Pullman', capacity: 60 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 2, idPlace: 2 } },
      update: {},
      create: { idSector: 2, idPlace: 2, name: 'Tribuna Norte', capacity: 60 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 2, idPlace: 3 } },
      update: {},
      create: { idSector: 2, idPlace: 3, name: 'General', capacity: 30 },
    });
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: 3, idPlace: 2 } },
      update: {},
      create: { idSector: 3, idPlace: 2, name: 'Tribuna Sur', capacity: 60 },
    });
    console.log('Datos de sectors cargados.');

    // --- Eventos (`event`) ---
    await prisma.event.upsert({
      where: { idEvent: 1 },
      update: {},
      create: {
        idEvent: 1,
        name: 'Bad Bunny',
        description: 'Bad Bunny en Argentina!',
        date: new Date('2025-12-31T00:00:00Z'),
        state: 'Aceptado',
        idEventType: 1,
        idOrganiser: 1,
        image: null,
      },
    });
    await prisma.event.upsert({
      where: { idEvent: 2 },
      update: {},
      create: {
        idEvent: 2,
        name: 'la vela puerca',
        description: 'la vela en Rosario!',
        date: new Date('2025-10-31T20:00:00Z'),
        state: 'Aceptado',
        idEventType: 1,
        idOrganiser: 1,
        image: '/uploads/event-1755092653867-52272554.jpg',
      },
    });
    console.log('Datos de event cargados.');

    // --- Usuarios (`users`) ---
    await prisma.user.upsert({
      where: { dni: 45500050 },
      update: {},
      create: {
        dni: 45500050,
        name: 'peppi',
        surname: '',
        mail: 'peppi@gmail.com',
        birthDate: new Date('2005-04-14T00:00:00Z'),
        password: '$2b$10$Z7PACw9ViPwDBQigQCYY8ODKtGCr/KgCv5A8x9I5VgT1u9UJ.4wBG',
        role: 'admin',
      },
    });
    await prisma.user.upsert({
      where: { dni: 46187000 },
      update: {},
      create: {
        dni: 46187000,
        name: 'gian',
        surname: '',
        mail: 'gian@hotmail.com',
        birthDate: new Date('2005-01-02T00:00:00Z'),
        password: '$2b$10$hMdQajMzMI1W6a4bysyO/ujN9Ug9tfV0uA5pskfeJKaTUsrFsH63a',
        role: 'user',
      },
    });
    await prisma.user.upsert({
      where: { dni: 46497046 },
      update: {},
      create: {
        dni: 46497046,
        name: 'Valen',
        surname: '',
        mail: 'maiusbrolla@gmail.com',
        birthDate: new Date('2005-03-31T00:00:00Z'),
        password: '$2b$10$LWfwZicvt64Tzk7I/PJd3e/VosjjA7r594X6gDPMdFi5vHJ7XYIcO',
        role: 'user',
      },
    });
    console.log('Datos de users cargados.');

    // --- Tablas sin datos en tu script SQL ---
    // No hay datos para event_sector, prices, saleitem, sales, seats y ticket.
    // No se insertará nada en estas tablas.

  } catch (e) {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('Seeding completado.');
  }
}

main();