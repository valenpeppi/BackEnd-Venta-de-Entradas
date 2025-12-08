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

export async function createSeatEventGridForEvent(idEvent: number, idPlace: number) {
  const sectors = await prisma.sector.findMany({
    where: { idPlace },
    include: { seats: true },
  });

  for (const sec of sectors) {
    for (const seat of sec.seats) {
      await prisma.seatEvent.upsert({
        where: {
          idEvent_idPlace_idSector_idSeat: {
            idEvent,
            idPlace,
            idSector: sec.idSector,
            idSeat: seat.idSeat,
          },
        },
        update: {},
        create: {
          idEvent,
          idPlace,
          idSector: sec.idSector,
          idSeat: seat.idSeat,
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

  // Generar tickets solo para sectores enumerados que tienen seatEvents
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
        idSale: null,
        lineNumber: null,
      },
    });

  }

  console.log(`Tickets generados para evento ${idEvent}`);
}

async function main() {
  console.log('Iniciando el proceso de seeding...');

  await prisma.eventType.createMany({
    skipDuplicates: true,
    data: [
      { idType: 1, name: 'Concierto' },
      { idType: 2, name: 'Stand Up' },
      { idType: 3, name: 'Festival' },
      { idType: 4, name: 'Fiesta' },
      { idType: 5, name: 'Evento Deportivo' },
      { idType: 6, name: 'Arte' },
    ],
  });
  console.log('Tipos de evento cargados');

  const organisers = [
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
      companyName: 'martin SRL',
      cuil: '20-46187000-1',
      contactEmail: 'martin@gmail.com',
      password: '$2b$10$h5FLr6S5SYfgXqSeUvmvk.flx3VVmSi8icbr8dFaooKQ0fFP.08Bq',
      phone: '3465656777',
      address: 'zeballos 14453',
    },
  ];

  for (const org of organisers) {
    await prisma.organiser.upsert({
      where: { idOrganiser: org.idOrganiser },
      update: org,
      create: org,
    });
  }
  console.log('Organizadores cargados');

  await prisma.place.createMany({
    skipDuplicates: true,
    data: [
      { idPlace: 1, name: 'Anfiteatro', totalCap: 40, address: 'Av. Belgrano 100 bis', placeType: 'nonEnumerated' },
      { idPlace: 2, name: 'Estadio Gigante de Arroyito', totalCap: 260, address: 'Av. Génova 640', placeType: 'hybrid' },
      { idPlace: 3, name: 'Bioceres Arena', totalCap: 50, address: 'Cafferata 729', placeType: 'hybrid' },
      { idPlace: 4, name: 'El Circulo', totalCap: 60, address: 'Laprida 1223', placeType: 'enumerated' },
    ],
  });
  console.log('Lugares cargados');

  const sectores: { idSector: number; idPlace: number; name: string; sectorType: string; capacity: number }[] = [
    { idSector: 1, idPlace: 1, name: 'Platea Inferior', sectorType: 'nonEnumerated', capacity: 40 },
    { idSector: 1, idPlace: 2, name: 'Campo', sectorType: 'nonEnumerated', capacity: 80 },
    { idSector: 2, idPlace: 2, name: 'Tribuna Norte', sectorType: 'enumerated', capacity: 60 },
    { idSector: 3, idPlace: 2, name: 'Tribuna Sur', sectorType: 'enumerated', capacity: 60 },
    { idSector: 4, idPlace: 2, name: 'Popular', sectorType: 'nonEnumerated', capacity: 60 },
    { idSector: 1, idPlace: 3, name: 'VIP', sectorType: 'enumerated', capacity: 20 },
    { idSector: 2, idPlace: 3, name: 'General', sectorType: 'nonEnumerated', capacity: 30 },
    { idSector: 1, idPlace: 4, name: 'Sala Principal', sectorType: 'enumerated', capacity: 40 },
    { idSector: 2, idPlace: 4, name: 'Tribuna Superior', sectorType: 'enumerated', capacity: 20 },
  ];

  for (const s of sectores) {
    await prisma.sector.upsert({
      where: { idSector_idPlace: { idSector: s.idSector, idPlace: s.idPlace } },
      update: {},
      create: s,
    });
  }
  console.log('Sectores cargados');

  const allSectors = await prisma.sector.findMany();
  for (const s of allSectors) {
    await ensureSeatsForSector(s.idPlace, s.idSector, s.capacity); // ← CAMBIO APLICADO AQUÍ
  }
  console.log('Asientos cargados');

  const now = new Date();
  const in10d = new Date(now.getTime() + 90 * 24 * 3600 * 1000);
  in10d.setHours(22, 0, 0, 0);
  const in20d = new Date(now.getTime() + 79 * 24 * 3600 * 1000);
  in20d.setHours(20, 30, 0, 0);
  const in30d = new Date(now.getTime() + 68 * 24 * 3600 * 1000);
  in30d.setHours(23, 45, 0, 0);

  const ev1 = await prisma.event.upsert({
    where: { idEvent: 1 }, update: {}, create: {
      idEvent: 1, name: 'Nicky Nicole', description: 'Nicky Nicole se presenta en Rosario para una noche espectacular.',
      date: in10d, state: 'Approved', image: '/uploads/event-1757442435231-517072449.jpeg',
      featured: true, idEventType: 1, idOrganiser: 1, idPlace: 2,
    },
  });

  const ev2 = await prisma.event.upsert({
    where: { idEvent: 2 }, update: {}, create: {
      idEvent: 2, name: 'Bad Bunny', description: 'Bad Bunny se presenta en el Gigante de Arroyito en una noche que romperá corazones y emocionará a la ciudad de Rosario.',
      date: in20d, state: 'Approved', image: '/uploads/event-1755092653867-52272554.jpg',
      featured: true, idEventType: 1, idOrganiser: 2, idPlace: 2,
    },
  });

  const ev3 = await prisma.event.upsert({
    where: { idEvent: 3 }, update: {}, create: {
      idEvent: 3, name: 'Bizarrap', description: '¡Bizarrap llega al Bioceres para revolucionar la ciudad en este show exclusivo!',
      date: in30d, state: 'Approved', image: '/uploads/event-1758722694684-973176483.webp',
      featured: true, idEventType: 1, idOrganiser: 1, idPlace: 3,
    },
  });

  const ev4 = await prisma.event.upsert({
    where: { idEvent: 4 }, update: {}, create: {
      idEvent: 4, name: 'Lucho Mellera', description: '¡Preparate para una noche espectacular llena de risas de la mano de Lucho Mellera!',
      date: in30d, state: 'Approved', image: '/uploads/event-1759701239921-814065860.webp',
      featured: false, idEventType: 2, idOrganiser: 3, idPlace: 4
    }
  });

  const ev5 = await prisma.event.upsert({
    where: { idEvent: 5 }, update: {}, create: {
      idEvent: 5, name: '¡Vuelve Yayo a Rosario!', description: 'Vuelve el mejor humorista de la historia de la Republica Argentina a esta ciudad, preparate para reirte con humor de todo tipo!',
      date: new Date('2026-11-20 23:00:00'), state: 'Approved', image: '/uploads/event-1759701392664-86226707.jpg',
      featured: true, idEventType: 2, idOrganiser: 3, idPlace: 4
    }
  });

  const ev6 = await prisma.event.upsert({
    where: { idEvent: 6 }, update: {}, create: {
      idEvent: 6, name: 'Viernes en la Jungla', description: 'Preparate la * que te re pario\r\nPorque Los viernes de la jungla son a todo *!',
      date: new Date('2026-01-20 03:00:00'), state: 'Approved', image: '/uploads/event-1759701574472-372104597.jpg',
      featured: false, idEventType: 4, idOrganiser: 3, idPlace: 2
    }
  });

  const ev7 = await prisma.event.upsert({
    where: { idEvent: 7 }, update: {}, create: {
      idEvent: 7, name: 'La Bresh', description: 'Somos un movimiento que conecta a miles de personas a través de la música y la alegría. Hitazo tras hitazo. Revive cada fiesta.',
      date: new Date('2026-01-15 18:00:00'), state: 'Approved', image: '/uploads/event-1759701709738-724959945.jpg',
      featured: false, idEventType: 4, idOrganiser: 3, idPlace: 2
    }
  });

  const ev8 = await prisma.event.upsert({
    where: { idEvent: 8 }, update: {}, create: {
      idEvent: 8, name: 'Festival de Danzas Clásicas', description: 'Un encuentro de las compañías de ballet más prestigiosas del mundo, conocido por su excelencia técnica y espectáculos innovadores.',
      date: new Date('2026-12-12 19:00:00'), state: 'Approved', image: '/uploads/event-1759701884936-793533149.JPG',
      featured: false, idEventType: 3, idOrganiser: 3, idPlace: 3
    }
  });

  const ev9 = await prisma.event.upsert({
    where: { idEvent: 9 }, update: {}, create: {
      idEvent: 9, name: 'La previa de 9 de Julio contra Belgrano', description: 'El mejor clasico de la liga se jugará pronto, compra tus entradas con 1 año de anticipacion!',
      date: new Date('2026-07-19 19:00:00'), state: 'Approved', image: '/uploads/event-1759702021862-561109661.jpg',
      featured: false, idEventType: 5, idOrganiser: 3, idPlace: 2
    }
  });

  const ev10 = await prisma.event.upsert({
    where: { idEvent: 10 }, update: {}, create: {
      idEvent: 10, name: 'Demostración de Arte de La Siberia', description: 'Hacemos una gran demostración de arte de nuestros alumnos para despedir el año lectivo.',
      date: new Date('2026-12-01 16:00:00'), state: 'Approved', image: '/uploads/event-1759702283861-940723684.jpg',
      featured: false, idEventType: 6, idOrganiser: 3, idPlace: 4
    }
  });
  console.log('Todos los eventos han sido cargados.');

  const eventSectorsData = [
    { idEvent: ev1.idEvent, idPlace: 2, idSector: 1, price: '80000.00' },
    { idEvent: ev1.idEvent, idPlace: 2, idSector: 2, price: '65000.00' },
    { idEvent: ev1.idEvent, idPlace: 2, idSector: 3, price: '65000.00' },
    { idEvent: ev1.idEvent, idPlace: 2, idSector: 4, price: '80000.00' },
    { idEvent: ev2.idEvent, idPlace: 2, idSector: 1, price: '80000.00' },
    { idEvent: ev2.idEvent, idPlace: 2, idSector: 2, price: '60000.00' },
    { idEvent: ev2.idEvent, idPlace: 2, idSector: 3, price: '60000.00' },
    { idEvent: ev2.idEvent, idPlace: 2, idSector: 4, price: '80000.00' },
    { idEvent: ev3.idEvent, idPlace: 3, idSector: 1, price: '100000.00' },
    { idEvent: ev3.idEvent, idPlace: 3, idSector: 2, price: '150000.00' },
    { idEvent: ev4.idEvent, idPlace: 4, idSector: 1, price: '25000.00' },
    { idEvent: ev4.idEvent, idPlace: 4, idSector: 2, price: '30000.00' },
    { idEvent: ev5.idEvent, idPlace: 4, idSector: 1, price: '50000.00' },
    { idEvent: ev5.idEvent, idPlace: 4, idSector: 2, price: '80000.00' },
    { idEvent: ev6.idEvent, idPlace: 2, idSector: 1, price: '20000.00' },
    { idEvent: ev6.idEvent, idPlace: 2, idSector: 2, price: '25000.00' },
    { idEvent: ev6.idEvent, idPlace: 2, idSector: 3, price: '25000.00' },
    { idEvent: ev6.idEvent, idPlace: 2, idSector: 4, price: '30000.00' },
    { idEvent: ev7.idEvent, idPlace: 2, idSector: 1, price: '60000.00' },
    { idEvent: ev7.idEvent, idPlace: 2, idSector: 2, price: '70000.00' },
    { idEvent: ev7.idEvent, idPlace: 2, idSector: 3, price: '70000.00' },
    { idEvent: ev7.idEvent, idPlace: 2, idSector: 4, price: '65000.00' },
    { idEvent: ev8.idEvent, idPlace: 3, idSector: 1, price: '40000.00' },
    { idEvent: ev8.idEvent, idPlace: 3, idSector: 2, price: '40000.00' },
    { idEvent: ev9.idEvent, idPlace: 2, idSector: 1, price: '7000.00' },
    { idEvent: ev9.idEvent, idPlace: 2, idSector: 2, price: '10000.00' },
    { idEvent: ev9.idEvent, idPlace: 2, idSector: 3, price: '10000.00' },
    { idEvent: ev9.idEvent, idPlace: 2, idSector: 4, price: '10000.00' },
    { idEvent: ev10.idEvent, idPlace: 4, idSector: 1, price: '10000.00' },
    { idEvent: ev10.idEvent, idPlace: 4, idSector: 2, price: '10000.00' },
  ];

  for (const data of eventSectorsData) {
    await prisma.eventSector.upsert({
      where: { idEvent_idPlace_idSector: { idEvent: data.idEvent, idPlace: data.idPlace, idSector: data.idSector } },
      update: { price: new Prisma.Decimal(data.price) },
      create: { ...data, price: new Prisma.Decimal(data.price) },
    });
  }
  console.log('EventSectors cargados');

  const allEvents = await prisma.event.findMany();
  for (const event of allEvents) {
    await createSeatEventGridForEvent(event.idEvent, event.idPlace);
    await generateTicketsForEvent(event.idEvent, event.idPlace);
  }
  console.log('SeatEvents y Tickets generados para todos los eventos');

  await prisma.user.createMany({
    skipDuplicates: true,
    data: [
      {
        dni: 45500050, name: 'peppi', surname: '', mail: 'peppi@gmail.com',
        birthDate: new Date('2005-04-14'),
        password: '$2b$10$Z7PACw9ViPwDBQigQCYY8ODKtGCr/KgCv5A8x9I5VgT1u9UJ.4wBG', role: 'admin',
        idUser: 1
      },
      {
        dni: 46187000, name: 'gian', surname: '', mail: 'gian@hotmail.com',
        birthDate: new Date('2005-01-02'),
        password: '$2b$10$hMdQajMzMI1W6a4bysyO/ujN9Ug9tfV0uA5pskfeJKaTUsrFsH63a', role: 'user', idUser: 2
      },
      {
        dni: 46497046, name: 'Valen', surname: '', mail: 'maiusbrolla@gmail.com',
        birthDate: new Date('2005-03-31'),
        password: '$2b$10$LWfwZicvt64Tzk7I/PJd3e/VosjjA7r594X6gDPMdFi5vHJ7XYIcO', role: 'user', idUser: 3
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
