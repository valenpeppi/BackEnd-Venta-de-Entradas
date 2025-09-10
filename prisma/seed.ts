import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function ensureSeatsForSector(idPlace: number, idSector: number, capacity: number) {
  // Crea seats 1..capacity para (place, sector) si no existen
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
  // Toma los sectores del place y sus seats para crear seat_event en "available"
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

async function main() {
  console.log('Iniciando el proceso de seeding...');

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

  await prisma.place.upsert({
    where: { idPlace: 1 },
    update: {},
    create: {
      idPlace: 1,
      name: 'Anfiteatro',
      totalCap: 40, 
      address: 'Av. Belgrano 100 bis',
      placeType: 'nonEnumerated',
    },
  });

  await prisma.place.upsert({
    where: { idPlace: 2 },
    update: {},
    create: {
      idPlace: 2,
      name: 'Estadio Gigante de Arroyito',
      totalCap: 260, 
      address: 'Av. Génova 640',
      placeType: 'hybrid',
    },
  });
  await prisma.place.upsert({
    where: { idPlace: 3 },
    update: {},
    create: {
      idPlace: 3,
      name: 'Bioceres Arena',
      totalCap: 50, 
      address: 'Cafferata 729',
      placeType: 'hybrid',
    },
  });
  await prisma.place.upsert({
    where: { idPlace: 4 },
    update: {},
    create: {
      idPlace: 4,
      name: 'El Ateneo',
      totalCap: 25, 
      address: 'Cordoba 1473',
      placeType: 'nonEnumerated',
    },
  });
  await prisma.place.upsert({
    where: { idPlace: 5 },
    update: {},
    create: {
      idPlace: 5,
      name: 'El Circulo',
      totalCap: 25, 
      address: 'Laprida 1223',
      placeType: 'enumerated',
    },
  });
  console.log('Datos de places cargados.');


  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 1 } },
    update: {},
    create: { idSector: 1, idPlace: 1, name: 'Platea Inferior', sectorType: 'nonEnumerated', capacity: 40 },
  });

  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 2 } },
    update: {},
    create: { idSector: 1, idPlace: 2, name: 'Campo', sectorType: 'nonEnumerated', capacity: 80 },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 2, idPlace: 2 } },
    update: {},
    create: { idSector: 2, idPlace: 2, name: 'Tribuna Norte', sectorType: 'enumerated', capacity: 60 },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 3, idPlace: 2 } },
    update: {},
    create: { idSector: 3, idPlace: 2, name: 'Tribuna Sur', sectorType: 'enumerated', capacity: 60 },
  });
    await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 4, idPlace: 2 } },
    update: {},
    create: { idSector: 4, idPlace: 2, name: 'Popular', sectorType: 'nonEnumerated', capacity: 60 },
  });

  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 3 } },
    update: {},
    create: { idSector: 1, idPlace: 3, name: 'VIP', sectorType: 'enumerated', capacity: 20 },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 2, idPlace: 3 } },
    update: {},
    create: { idSector: 2, idPlace: 3, name: 'General', sectorType: 'nonEnumerated', capacity: 30 },
  });

  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 4 } },
    update: {},
    create: { idSector: 1, idPlace: 4, name: 'Sala Principal', sectorType: 'nonEnumerated', capacity: 25 },
  });


  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 5 } },
    update: {},
    create: { idSector: 1, idPlace: 5, name: 'Sala Principal', sectorType: 'enumerated', capacity: 25 },
  });

  console.log('Datos de sectors cargados.');

  const allSectors = await prisma.sector.findMany();
  for (const s of allSectors) {
    await ensureSeatsForSector(s.idPlace, s.idSector, s.capacity);
  }
  console.log('Seats generados por sector según capacity.');

  const now = new Date();
  const in10d = new Date(now.getTime() + 10 * 24 * 3600 * 1000);
  const in20d = new Date(now.getTime() + 20 * 24 * 3600 * 1000);

  const ev1 = await prisma.event.upsert({
    where: { idEvent: 1 },
    update: {},
    create: {
      idEvent: 1,
      name: 'Nicky Nicole',
      description: 'Nicky Nicole se presenta en rosario para una noche espectacular.',
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

  console.log('Eventos cargados.');

  const place1Sectors = await prisma.sector.findMany({ where: { idPlace: 2 } });
  for (const s of place1Sectors) {
    await prisma.eventSector.upsert({
      where: {
        idEvent_idPlace_idSector: { idEvent: ev1.idEvent, idPlace: 2, idSector: s.idSector },
      },
      update: {},
      create: {
        idEvent: ev1.idEvent,
        idPlace: 2,
        idSector: s.idSector,
        price: new Prisma.Decimal( s.name.includes('Tribuna') ? '65000.00' : '80000.00'),
      },
    });
  }

  const place2Sectors = await prisma.sector.findMany({ where: { idPlace: 2 } });
  for (const s of place2Sectors) {
    await prisma.eventSector.upsert({
      where: {
        idEvent_idPlace_idSector: { idEvent: ev2.idEvent, idPlace: 2, idSector: s.idSector },
      },
      update: {},
      create: {
        idEvent: ev2.idEvent,
        idPlace: 2,
        idSector: s.idSector,
        price: new Prisma.Decimal(
          s.name.includes('Tribuna') ? '90000.00' : '130000.00'
        ),
      },
    });
  }

  console.log('EventSectors con price cargados.');

  await createSeatEventGridForEvent(ev1.idEvent, 2);
  await createSeatEventGridForEvent(ev2.idEvent, 2);
  console.log('SeatEvent cargado en estado "available".');

  await prisma.user.upsert({
    where: { dni: 45500050 },
    update: {},
    create: {
      dni: 45500050,
      name: 'peppi',
      surname: '',
      mail: 'peppi@gmail.com',
      birthDate: new Date('2005-04-14'),
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
      birthDate: new Date('2005-01-02'),
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
      birthDate: new Date('2005-03-31'),
      password: '$2b$10$LWfwZicvt64Tzk7I/PJd3e/VosjjA7r594X6gDPMdFi5vHJ7XYIcO',
      role: 'user',
    },
  });
  console.log('Datos de users cargados.');

  console.log('Seeding completado.');
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
