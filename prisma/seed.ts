
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();


const IDS = {
  EVENT_TYPES: {
    CONCIERTO: '550e8400-e29b-41d4-a716-446655440001',
    STAND_UP: '550e8400-e29b-41d4-a716-446655440002',
    FESTIVAL: '550e8400-e29b-41d4-a716-446655440003',
    FIESTA: '550e8400-e29b-41d4-a716-446655440004',
    DEPORTIVO: '550e8400-e29b-41d4-a716-446655440005',
    ARTE: '550e8400-e29b-41d4-a716-446655440006',
  },
  PLACES: {
    ANFITEATRO: '550e8400-e29b-41d4-a716-446655440010',
    GIGANTE: '550e8400-e29b-41d4-a716-446655440011',
    BIOCERES: '550e8400-e29b-41d4-a716-446655440012',
    ATENEO: '550e8400-e29b-41d4-a716-446655440013',
    CIRCULO: '550e8400-e29b-41d4-a716-446655440014',
  },
  ORGANISERS: {
    AGUS: '550e8400-e29b-41d4-a716-446655440020',
    PEPPI: '550e8400-e29b-41d4-a716-446655440021',
    MARTIN: '550e8400-e29b-41d4-a716-446655440022',
  },
  EVENTS: {
    EV1: '550e8400-e29b-41d4-a716-446655440030',
    EV2: '550e8400-e29b-41d4-a716-446655440031',
    EV3: '550e8400-e29b-41d4-a716-446655440032',
    EV4: '550e8400-e29b-41d4-a716-446655440033',
    EV5: '550e8400-e29b-41d4-a716-446655440034',
    EV6: '550e8400-e29b-41d4-a716-446655440035',
    EV7: '550e8400-e29b-41d4-a716-446655440036',
    EV8: '550e8400-e29b-41d4-a716-446655440037',
    EV9: '550e8400-e29b-41d4-a716-446655440038',
    EV10: '550e8400-e29b-41d4-a716-446655440039',
    EV11: '550e8400-e29b-41d4-a716-446655440040',
  },
  USERS: {
    ADMIN_VALEN: '550e8400-e29b-41d4-a716-446655440050',
    USER_GIAN: '550e8400-e29b-41d4-a716-446655440051',
    USER_VALEN: '550e8400-e29b-41d4-a716-446655440052',
    ADMIN_SYSTEM: '550e8400-e29b-41d4-a716-446655440053',
  }
};

async function ensureSeatsForSector(idPlace: string, idSector: number, capacity: number) {
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

export async function createSeatEventGridForEvent(idEvent: string, idPlace: string) {
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


async function generateTicketsForEvent(idEvent: string, idPlace: string) {
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
      { idType: IDS.EVENT_TYPES.CONCIERTO, name: 'Concierto' },
      { idType: IDS.EVENT_TYPES.STAND_UP, name: 'Stand Up' },
      { idType: IDS.EVENT_TYPES.FESTIVAL, name: 'Festival' },
      { idType: IDS.EVENT_TYPES.FIESTA, name: 'Fiesta' },
      { idType: IDS.EVENT_TYPES.DEPORTIVO, name: 'Evento Deportivo' },
      { idType: IDS.EVENT_TYPES.ARTE, name: 'Arte' },
    ],
  });
  console.log('Tipos de evento cargados');

  const organisers = [
    {
      idOrganiser: IDS.ORGANISERS.AGUS,
      companyName: 'Agus SRL',
      cuil: '3090090999',
      contactEmail: 'agus@gmail.com',
      password: '$2b$10$KFeJhHRJJikyjqUX.KSiU.oBXr7FLASKDKtq15m517BI2b6WaIkd6',
      phone: '5493212567375',
      address: 'Viamonte 2847',
    },
    {
      idOrganiser: IDS.ORGANISERS.PEPPI,
      companyName: 'Peppi SRL',
      cuil: '2046497046',
      contactEmail: 'sbrolla@gmail.com',
      password: '$2b$10$z31P7gTLFV6fuwbaOeVKP.kYGuhP.nreAoklSnVo3z.s3gtp55CIG',
      phone: '03465654471',
      address: 'Godino 887',
    },
    {
      idOrganiser: IDS.ORGANISERS.MARTIN,
      companyName: 'Martin SRL',
      cuil: '20-46187000-1',
      contactEmail: 'martin@gmail.com',
      password: '$2b$10$h5FLr6S5SYfgXqSeUvmvk.flx3VVmSi8icbr8dFaooKQ0fFP.08Bq',
      phone: '3465656777',
      address: 'Zeballos 753',
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
      { idPlace: IDS.PLACES.ANFITEATRO, name: 'Anfiteatro', totalCap: 40, address: 'Av. Belgrano 100 bis', placeType: 'nonEnumerated' },
      { idPlace: IDS.PLACES.GIGANTE, name: 'Estadio Gigante de Arroyito', totalCap: 260, address: 'Av. Génova 640', placeType: 'hybrid' },
      { idPlace: IDS.PLACES.BIOCERES, name: 'Bioceres Arena', totalCap: 50, address: 'Cafferata 729', placeType: 'hybrid' },
      { idPlace: IDS.PLACES.ATENEO, name: 'El Ateneo', totalCap: 25, address: 'Cordoba 1473', placeType: 'nonEnumerated' },
      { idPlace: IDS.PLACES.CIRCULO, name: 'El Circulo', totalCap: 60, address: 'Laprida 1223', placeType: 'enumerated' },
    ],
  });
  console.log('Lugares cargados');

  const sectores: { idSector: number; idPlace: string; name: string; sectorType: string; capacity: number }[] = [
    { idSector: 1, idPlace: IDS.PLACES.ANFITEATRO, name: 'Platea Inferior', sectorType: 'nonEnumerated', capacity: 40 },
    { idSector: 1, idPlace: IDS.PLACES.GIGANTE, name: 'Campo', sectorType: 'nonEnumerated', capacity: 80 },
    { idSector: 2, idPlace: IDS.PLACES.GIGANTE, name: 'Tribuna Norte', sectorType: 'enumerated', capacity: 60 },
    { idSector: 3, idPlace: IDS.PLACES.GIGANTE, name: 'Tribuna Sur', sectorType: 'enumerated', capacity: 60 },
    { idSector: 4, idPlace: IDS.PLACES.GIGANTE, name: 'Popular', sectorType: 'nonEnumerated', capacity: 60 },
    { idSector: 1, idPlace: IDS.PLACES.BIOCERES, name: 'VIP', sectorType: 'enumerated', capacity: 20 },
    { idSector: 2, idPlace: IDS.PLACES.BIOCERES, name: 'General', sectorType: 'nonEnumerated', capacity: 30 },
    { idSector: 1, idPlace: IDS.PLACES.ATENEO, name: 'Sala Principal', sectorType: 'nonEnumerated', capacity: 25 },
    { idSector: 1, idPlace: IDS.PLACES.CIRCULO, name: 'Sala Principal', sectorType: 'enumerated', capacity: 40 },
    { idSector: 2, idPlace: IDS.PLACES.CIRCULO, name: 'Tribuna Superior', sectorType: 'enumerated', capacity: 20 },
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
    await ensureSeatsForSector(s.idPlace, s.idSector, s.capacity);
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
    where: { idEvent: IDS.EVENTS.EV1 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV1, name: 'Nicky Nicole', description: 'Nicky Nicole se presenta en Rosario para una noche espectacular.',
      date: in10d, state: 'Approved', image: '/uploads/event-1757442435231-517072449.jpeg',
      featured: true, idEventType: IDS.EVENT_TYPES.CONCIERTO, idOrganiser: IDS.ORGANISERS.AGUS, idPlace: IDS.PLACES.GIGANTE,
    },
  });

  const ev2 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV2 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV2, name: 'Bad Bunny', description: 'Bad Bunny se presenta en el Gigante de Arroyito en una noche que romperá corazones y emocionará a la ciudad de Rosario.',
      date: in20d, state: 'Approved', image: '/uploads/event-1755092653867-52272554.jpg',
      featured: true, idEventType: IDS.EVENT_TYPES.CONCIERTO, idOrganiser: IDS.ORGANISERS.PEPPI, idPlace: IDS.PLACES.GIGANTE,
    },
  });

  const ev3 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV3 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV3, name: 'Bizarrap', description: '¡Bizarrap llega al Bioceres para revolucionar la ciudad en este show exclusivo!',
      date: in30d, state: 'Approved', image: '/uploads/event-1758722694684-973176483.webp',
      featured: true, idEventType: IDS.EVENT_TYPES.CONCIERTO, idOrganiser: IDS.ORGANISERS.AGUS, idPlace: IDS.PLACES.BIOCERES,
    },
  });

  const ev4 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV4 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV4, name: 'Lucho Mellera', description: '¡Preparate para una noche espectacular llena de risas de la mano de Lucho Mellera!',
      date: in30d, state: 'Pending', image: '/uploads/event-1759701239921-814065860.webp',
      featured: false, idEventType: IDS.EVENT_TYPES.STAND_UP, idOrganiser: IDS.ORGANISERS.PEPPI, idPlace: IDS.PLACES.CIRCULO
    }
  });

  const ev5 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV5 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV5, name: '¡Vuelve Yayo a Rosario!', description: 'Vuelve el mejor humorista de la historia de la Republica Argentina a esta ciudad, preparate para reirte con humor de todo tipo!',
      date: new Date('2026-11-20 23:00:00'), state: 'Approved', image: '/uploads/event-1759701392664-86226707.jpg',
      featured: true, idEventType: IDS.EVENT_TYPES.STAND_UP, idOrganiser: IDS.ORGANISERS.MARTIN, idPlace: IDS.PLACES.ATENEO
    }
  });

  const ev6 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV6 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV6, name: 'Viernes en la Jungla', description: 'Preparate la * que te re pario\r\nPorque Los viernes de la jungla son a todo *!',
      date: new Date('2026-01-20 03:00:00'), state: 'Approved', image: '/uploads/event-1759701574472-372104597.jpg',
      featured: false, idEventType: IDS.EVENT_TYPES.FIESTA, idOrganiser: IDS.ORGANISERS.MARTIN, idPlace: IDS.PLACES.GIGANTE
    }
  });

  const ev7 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV7 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV7, name: 'La Bresh', description: 'Somos un movimiento que conecta a miles de personas a través de la música y la alegría. Hitazo tras hitazo. Revive cada fiesta.',
      date: new Date('2026-01-15 18:00:00'), state: 'Approved', image: '/uploads/event-1759701709738-724959945.jpg',
      featured: false, idEventType: IDS.EVENT_TYPES.FIESTA, idOrganiser: IDS.ORGANISERS.MARTIN, idPlace: IDS.PLACES.GIGANTE
    }
  });

  const ev8 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV8 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV8, name: 'Festival de Danzas Clásicas', description: 'Un encuentro de las compañías de ballet más prestigiosas del mundo, conocido por su excelencia técnica y espectáculos innovadores.',
      date: new Date('2026-12-12 19:00:00'), state: 'Approved', image: '/uploads/event-1759701884936-793533149.JPG',
      featured: false, idEventType: IDS.EVENT_TYPES.FESTIVAL, idOrganiser: IDS.ORGANISERS.MARTIN, idPlace: IDS.PLACES.BIOCERES
    }
  });

  const ev9 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV9 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV9, name: 'La previa de 9 de Julio contra Belgrano', description: 'El mejor clasico de la liga se jugará pronto, compra tus entradas con 1 año de anticipacion!',
      date: new Date('2026-07-19 19:00:00'), state: 'Approved', image: '/uploads/event-1759702021862-561109661.jpg',
      featured: false, idEventType: IDS.EVENT_TYPES.DEPORTIVO, idOrganiser: IDS.ORGANISERS.PEPPI, idPlace: IDS.PLACES.GIGANTE
    }
  });

  const ev10 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV10 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV10, name: 'Demostración de Arte de La Siberia', description: 'Hacemos una gran demostración de arte de nuestros alumnos para despedir el año lectivo.',
      date: new Date('2026-12-01 16:00:00'), state: 'Approved', image: '/uploads/event-1759702283861-940723684.jpg',
      featured: false, idEventType: IDS.EVENT_TYPES.ARTE, idOrganiser: IDS.ORGANISERS.MARTIN, idPlace: IDS.PLACES.CIRCULO
    }
  });

  const ev11 = await prisma.event.upsert({
    where: { idEvent: IDS.EVENTS.EV11 }, update: {}, create: {
      idEvent: IDS.EVENTS.EV11, name: 'Bingo', description: 'Se armo el bingo en el Ateneo, no te lo pierdas.',
      date: new Date('2026-03-01 14:10:00'), state: 'Approved', image: '/uploads/event-1765227214870-640653029.png',
      featured: false, idEventType: IDS.EVENT_TYPES.ARTE, idOrganiser: IDS.ORGANISERS.PEPPI, idPlace: IDS.PLACES.ATENEO
    }
  });
  console.log('Todos los eventos han sido cargados.');

  const eventSectorsData = [
    { idEvent: ev1.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 1, price: '80000.00' },
    { idEvent: ev1.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 2, price: '65000.00' },
    { idEvent: ev1.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 3, price: '65000.00' },
    { idEvent: ev1.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 4, price: '80000.00' },
    { idEvent: ev2.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 1, price: '80000.00' },
    { idEvent: ev2.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 2, price: '60000.00' },
    { idEvent: ev2.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 3, price: '60000.00' },
    { idEvent: ev2.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 4, price: '80000.00' },
    { idEvent: ev3.idEvent, idPlace: IDS.PLACES.BIOCERES, idSector: 1, price: '100000.00' },
    { idEvent: ev3.idEvent, idPlace: IDS.PLACES.BIOCERES, idSector: 2, price: '150000.00' },
    { idEvent: ev4.idEvent, idPlace: IDS.PLACES.CIRCULO, idSector: 1, price: '25000.00' },
    { idEvent: ev4.idEvent, idPlace: IDS.PLACES.CIRCULO, idSector: 2, price: '30000.00' },
    { idEvent: ev5.idEvent, idPlace: IDS.PLACES.ATENEO, idSector: 1, price: '50000.00' },
    { idEvent: ev6.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 1, price: '20000.00' },
    { idEvent: ev6.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 2, price: '25000.00' },
    { idEvent: ev6.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 3, price: '25000.00' },
    { idEvent: ev6.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 4, price: '30000.00' },
    { idEvent: ev7.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 1, price: '60000.00' },
    { idEvent: ev7.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 2, price: '70000.00' },
    { idEvent: ev7.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 3, price: '70000.00' },
    { idEvent: ev7.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 4, price: '65000.00' },
    { idEvent: ev8.idEvent, idPlace: IDS.PLACES.BIOCERES, idSector: 1, price: '40000.00' },
    { idEvent: ev8.idEvent, idPlace: IDS.PLACES.BIOCERES, idSector: 2, price: '40000.00' },
    { idEvent: ev9.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 1, price: '7000.00' },
    { idEvent: ev9.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 2, price: '10000.00' },
    { idEvent: ev9.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 3, price: '10000.00' },
    { idEvent: ev9.idEvent, idPlace: IDS.PLACES.GIGANTE, idSector: 4, price: '10000.00' },
    { idEvent: ev10.idEvent, idPlace: IDS.PLACES.CIRCULO, idSector: 1, price: '10000.00' },
    { idEvent: ev10.idEvent, idPlace: IDS.PLACES.CIRCULO, idSector: 2, price: '10000.00' },
    { idEvent: ev11.idEvent, idPlace: IDS.PLACES.ATENEO, idSector: 1, price: '5000.00' },
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

  const users = [
    {
      dni: 45500050, name: 'Valentin', surname: 'Peppino', mail: 'peppi@gmail.com',
      birthDate: new Date('2005-04-14'),
      password: '$2b$10$Z7PACw9ViPwDBQigQCYY8ODKtGCr/KgCv5A8x9I5VgT1u9UJ.4wBG', role: 'admin' as const,
      idUser: IDS.USERS.ADMIN_VALEN
    },
    {
      dni: 46187000, name: 'Gianlucas', surname: 'Zabaleta', mail: 'gian@hotmail.com',
      birthDate: new Date('2005-01-02'),
      password: '$2b$10$hMdQajMzMI1W6a4bysyO/ujN9Ug9tfV0uA5pskfeJKaTUsrFsH63a', role: 'user' as const, idUser: IDS.USERS.USER_GIAN
    },
    {
      dni: 99999999, name: 'TicketAdmin', surname: 'System', mail: 'ticketapp15@gmail.com',
      birthDate: new Date('2000-01-01'),
      password: '$2b$10$358N2e.8s4jLmHGaFZjZSOyLIULv5d/QtgzBSHcFNFfQMBv.rBGWq', role: 'admin' as const, idUser: IDS.USERS.ADMIN_SYSTEM
    },
  ];

  for (const u of users) {
    const { idUser, ...userData } = u;
    await prisma.user.upsert({
      where: { dni: u.dni },
      update: userData,
      create: u,
    });
  }

  console.log('Usuarios cargados');

  const messages = [
    {
      title: 'Consulta sobre entradas',
      description: 'Hola, quería saber si queda stock para el evento de Bad Bunny.',
      date: new Date('2025-12-05 10:00:00'),
      senderEmail: 'maria@gmail.com',
      state: 'unread',
      response: '',
    },
    {
      title: 'Problema con el pago',
      description: 'Intenté pagar con tarjeta pero me dio error.',
      date: new Date('2025-12-06 15:30:00'),
      senderEmail: 'juan@hotmail.com',
      state: 'unread',
      response: '',
    },
    {
      title: 'Cambio de fecha',
      description: '¿Es posible cambiar la fecha de mi entrada?',
      date: new Date('2025-12-07 09:15:00'),
      senderEmail: 'pedro@yahoo.com',
      state: 'unread',
      response: '',
    },
    {
      title: 'Entradas discapacitados',
      description: 'Hola, quería saber si hay cupo para personas con discapacidad.',
      date: new Date('2025-12-08 11:20:00'),
      senderEmail: 'ana@gmail.com',
      state: 'unread',
      response: '',
    }
  ];

  for (const m of messages) {
    await prisma.message.create({
      data: m
    });
  }
  console.log('Mensajes cargados');

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
