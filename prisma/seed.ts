import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureSeatsForSector(idPlace: number, idSector: number, capacity: number) {
  for (let i = 1; i <= capacity; i++) {
    await prisma.seat.upsert({
      where: {
        idSeat_idSector_idPlace: { idSeat: i, idSector, idPlace },
      },
      update: {},
      create: {
        idSeat: i,
        idSector,
        idPlace,
      },
    });
  }
}

async function createSeatEventGridForEvent(idEvent: number, idPlace: number) {
  const sectors = await prisma.sector.findMany({
    where: { idPlace },
    include: { seats: true },
  });

  for (const sec of sectors) {
    for (const st of sec.seats) {
      await prisma.seatEvent.upsert({
        where: {
          idEvent_idPlace_idSector_idSeat: {
            idEvent,
            idPlace,
            idSector: sec.idSector,
            idSeat: st.idSeat,
          },
        },
        update: {},
        create: {
          idEvent,
          idPlace,
          idSector: sec.idSector,
          idSeat: st.idSeat,
          state: 'available',
        },
      });
    }
  }
}

async function generateTicketsForEvent(idEvent: number, idPlace: number) {
  const seatEvents = await prisma.seatEvent.findMany({
    where: { idEvent, idPlace },
  });

  for (const se of seatEvents) {
    const existing = await prisma.ticket.findFirst({
      where: {
        idEvent: se.idEvent,
        idPlace: se.idPlace,
        idSector: se.idSector,
        idSeat: se.idSeat,
      },
    });

    if (existing) continue;

    const ticketCount = await prisma.ticket.count({
      where: {
        idEvent: se.idEvent,
        idPlace: se.idPlace,
        idSector: se.idSector,
      },
    });

    await prisma.ticket.create({
      data: {
        idEvent: se.idEvent,
        idPlace: se.idPlace,
        idSector: se.idSector,
        idTicket: ticketCount + 1,
        idSeat: se.idSeat,
        state: 'available',
      },
    });
  }

  console.log(`Tickets generados para evento ${idEvent}`);
}

async function main() {
  console.log('Iniciando el proceso de seeding...');

  // Event Types
  await prisma.eventType.createMany({
    skipDuplicates: true,
    data: [
      { idType: 1, name: 'Concierto' },
      { idType: 2, name: 'Stand Up' },
      { idType: 3, name: 'Festival' },
      { idType: 4, name: 'Fiesta' },
      { idType: 5, name: 'Evento Deportivo' },
      { idType: 6, name: 'Arte' },
      { idType: 7, name: 'Conferencia' },
      { idType: 8, name: 'Taller' },
      { idType: 9, name: 'Feria' },
    ],
  });
  console.log('Tipos de evento cargados');

  // Organizadores
  await prisma.organiser.createMany({
    skipDuplicates: true,
    data: [
      {
        idOrganiser: 1,
        companyName: 'Agus SRL',
        cuil: '3090090999',
        contactEmail: 'agus@gmail.com',
        password: '$2b$10$KFeJhHRJJikyjqUX.KSiU.oBXr7FLASKDKtq15m517BI2b6WaIkd6',
        phone: '5493212567375',
        address: 'Viamonte 2847',
      },
      {
        idOrganiser: 2,
        companyName: 'peppi SRL',
        cuil: '2046497046',
        contactEmail: 'sbrolla@gmail.com',
        password: '$2b$10$z31P7gTLFV6fuwbaOeVKP.kYGuhP.nreAoklSnVo3z.s3gtp55CIG',
        phone: '03465654471',
        address: 'GODINO 887',
      },
      {
        idOrganiser: 3,
        companyName: 'gian SRL',
        cuil: '20-46187000-1',
        contactEmail: 'gian@hotmail.com',
        password: '$2b$10$nGs0vxZ66jyQE4bMELcTBOKorrT62lQfuZsbPTRT7aC8fQZhOkNFm',
        phone: '3465656777',
        address: 'zeballos 14453',
      },
    ],
  });
  console.log('Organizadores cargados');

  // Lugares
  await prisma.place.createMany({
    skipDuplicates: true,
    data: [
      { idPlace: 1, name: 'Anfiteatro', totalCap: 40, address: 'Av. Belgrano 100 bis', placeType: 'nonEnumerated' },
      { idPlace: 2, name: 'Estadio Gigante de Arroyito', totalCap: 260, address: 'Av. Génova 640', placeType: 'hybrid' },
      { idPlace: 3, name: 'Bioceres Arena', totalCap: 50, address: 'Cafferata 729', placeType: 'hybrid' },
      { idPlace: 4, name: 'El Ateneo', totalCap: 25, address: 'Cordoba 1473', placeType: 'nonEnumerated' },
      { idPlace: 5, name: 'El Circulo', totalCap: 60, address: 'Laprida 1223', placeType: 'enumerated' },
    ],
  });
  console.log('Lugares cargados');

  // Sectores
  const sectores: { idSector: number; idPlace: number; name: string; sectorType: string; capacity: number }[] = [
    { idSector: 1, idPlace: 1, name: 'Platea Inferior', sectorType: 'nonEnumerated', capacity: 40 },
    { idSector: 1, idPlace: 2, name: 'Campo', sectorType: 'nonEnumerated', capacity: 80 },
    { idSector: 2, idPlace: 2, name: 'Tribuna Norte', sectorType: 'enumerated', capacity: 60 },
    { idSector: 3, idPlace: 2, name: 'Tribuna Sur', sectorType: 'enumerated', capacity: 60 },
    { idSector: 4, idPlace: 2, name: 'Popular', sectorType: 'nonEnumerated', capacity: 60 },
    { idSector: 1, idPlace: 3, name: 'VIP', sectorType: 'enumerated', capacity: 20 },
    { idSector: 2, idPlace: 3, name: 'General', sectorType: 'nonEnumerated', capacity: 30 },
    { idSector: 1, idPlace: 4, name: 'Sala Principal', sectorType: 'nonEnumerated', capacity: 25 },
    { idSector: 1, idPlace: 5, name: 'Sala Principal', sectorType: 'enumerated', capacity: 40 },
    { idSector: 2, idPlace: 5, name: 'Tribuna Superior', sectorType: 'enumerated', capacity: 20 },
  ];

  for (const s of sectores) {
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: s.idSector, idPlace: s.idPlace } },
      update: {},
      create: s,
    });
  }
  console.log('Sectores cargados');

  // Seats
  const allSectors = await prisma.sector.findMany();
  for (const s of allSectors) {
    await ensureSeatsForSector(s.idPlace, s.idSector, s.capacity);
  }
  console.log('Asientos cargados');

  // Eventos
  const now = new Date();

  const in10d = new Date(now.getTime() + 90 * 24 * 3600 * 1000);
  in10d.setHours(22, 0, 0, 0); 

  const in20d = new Date(now.getTime() + 79 * 24 * 3600 * 1000);
  in20d.setHours(20, 30, 0, 0); 

  const in30d = new Date(now.getTime() + 68 * 24 * 3600 * 1000);
  in30d.setHours(23, 45, 0, 0); 


  const ev1 = await prisma.event.upsert({
    where: { idEvent: 1 },
    update: {},
    create: {
      idEvent: 1,
      name: 'Nicky Nicole',
      description: 'Nicky Nicole se presenta en Rosario para una noche espectacular.',
      date: in10d,
      state: 'Approved',
      image: '/uploads/event-1757442435231-517072449.jpeg',
      featured: true,
      idEventType: 1,
      idOrganiser: 1,
      idPlace: 2,
    },
  });

  const ev2 = await prisma.event.upsert({
    where: { idEvent: 2 },
    update: {},
    create: {
      idEvent: 2,
      name: 'Bad Bunny',
      description: 'Bad Bunny se presenta en el Gigante de Arroyito en una noche que romperá corazones.',
      date: in20d,
      state: 'Approved',
      image: '/uploads/event-1755092653867-52272554.jpg',
      featured: true,
      idEventType: 1,
      idOrganiser: 2,
      idPlace: 2,
    },
  });

  const ev3 = await prisma.event.upsert({
    where: { idEvent: 3 },
    update: {},
    create: {
      idEvent: 3,
      name: 'Bizarrap',
      description: '¡Bizarrap llega al Bioceres para reventar la ciudad de Rosario en este show exclusivo!',
      date: in30d,
      state: 'Approved',
      image: '/uploads/event-1758722694684-973176483.webp',
      featured: true,
      idEventType: 1,
      idOrganiser: 1,
      idPlace: 3,
    },
  });

  // Precios por sector
  const place2Sectors = await prisma.sector.findMany({ where: { idPlace: 2 } });
  for (const s of place2Sectors) {
    await prisma.eventSector.upsert({
      where: { idEvent_idPlace_idSector: { idEvent: ev1.idEvent, idPlace: 2, idSector: s.idSector } },
      update: {},
      create: {
        idEvent: ev1.idEvent,
        idPlace: 2,
        idSector: s.idSector,
        price: new Prisma.Decimal(s.name.includes('Tribuna') ? '65000.00' : '80000.00'),
      },
    });
    await prisma.eventSector.upsert({
      where: { idEvent_idPlace_idSector: { idEvent: ev2.idEvent, idPlace: 2, idSector: s.idSector } },
      update: {},
      create: {
        idEvent: ev2.idEvent,
        idPlace: 2,
        idSector: s.idSector,
        price: new Prisma.Decimal(s.name.includes('Tribuna') ? '60000.00' : '80000.00'),
      },
    });
  }

  await prisma.eventSector.upsert({
    where: { idEvent_idPlace_idSector: { idEvent: ev3.idEvent, idPlace: 3, idSector: 1 } },
    update: {},
    create: {
      idEvent: ev3.idEvent,
      idPlace: 3,
      idSector: 1,
      price: new Prisma.Decimal('100000.00'),
    },
  });

  await prisma.eventSector.upsert({
    where: { idEvent_idPlace_idSector: { idEvent: ev3.idEvent, idPlace: 3, idSector: 2 } },
    update: {},
    create: {
      idEvent: ev3.idEvent,
      idPlace: 3,
      idSector: 2,
      price: new Prisma.Decimal('150000.00'),
    },
  });

  console.log('EventSectors cargados');

  await createSeatEventGridForEvent(ev1.idEvent, 2);
  await generateTicketsForEvent(ev1.idEvent, 2);

  await createSeatEventGridForEvent(ev2.idEvent, 2);
  await generateTicketsForEvent(ev2.idEvent, 2);

  await createSeatEventGridForEvent(ev3.idEvent, 3);
  await generateTicketsForEvent(ev3.idEvent, 3);

  console.log('SeatEvents y Tickets generados');

  // Usuarios
  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      {
        dni: 45500050,
        name: 'peppi',
        surname: '',
        mail: 'peppi@gmail.com',
        birthDate: new Date('2005-04-14'),
        password: '$2b$10$Z7PACw9ViPwDBQigQCYY8ODKtGCr/KgCv5A8x9I5VgT1u9UJ.4wBG',
        role: 'admin',
      },
      {
        dni: 46187000,
        name: 'gian',
        surname: '',
        mail: 'gian@hotmail.com',
        birthDate: new Date('2005-01-02'),
        password: '$2b$10$hMdQajMzMI1W6a4bysyO/ujN9Ug9tfV0uA5pskfeJKaTUsrFsH63a',
        role: 'user',
      },
      {
        dni: 46497046,
        name: 'Valen',
        surname: '',
        mail: 'maiusbrolla@gmail.com',
        birthDate: new Date('2005-03-31'),
        password: '$2b$10$LWfwZicvt64Tzk7I/PJd3e/VosjjA7r594X6gDPMdFi5vHJ7XYIcO',
        role: 'user',
      },
    ],
  });

  console.log('Usuarios cargados');
  console.log('Seed finalizado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
