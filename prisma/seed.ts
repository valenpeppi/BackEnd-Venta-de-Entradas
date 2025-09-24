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

async function main() {
  console.log('Iniciando el proceso de seeding...');

  // --- Tipos de Evento ---
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

  // --- Organizadores ---
  await prisma.organiser.upsert({
    where: { idOrganiser: 1 },
    update: {},
    create: {
      idOrganiser: 1,
      companyName: 'Agus SRL',
      cuil: '3090090999',
      contactEmail: 'agus@gmail.com',
      password: '$2b$10$KFeJhHRJJikyjqUX.KSiU.oBXr7FLASKDKtq15m517BI2b6WaIkd6',
      phone: '5493212567375',
      address: 'Viamonte 2847',
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

  // --- Places ---
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
      totalCap: 60,
      address: 'Laprida 1223',
      placeType: 'enumerated',
    },
  });
  console.log('Datos de places cargados.');

  // --- Sectores ---
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 1 } },
    update: {},
    create: {
      idSector: 1,
      idPlace: 1,
      name: 'Platea Inferior',
      sectorType: 'nonEnumerated',
      capacity: 40,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 2 } },
    update: {},
    create: {
      idSector: 1,
      idPlace: 2,
      name: 'Campo',
      sectorType: 'nonEnumerated',
      capacity: 80,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 2, idPlace: 2 } },
    update: {},
    create: {
      idSector: 2,
      idPlace: 2,
      name: 'Tribuna Norte',
      sectorType: 'enumerated',
      capacity: 60,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 3, idPlace: 2 } },
    update: {},
    create: {
      idSector: 3,
      idPlace: 2,
      name: 'Tribuna Sur',
      sectorType: 'enumerated',
      capacity: 60,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 4, idPlace: 2 } },
    update: {},
    create: {
      idSector: 4,
      idPlace: 2,
      name: 'Popular',
      sectorType: 'nonEnumerated',
      capacity: 60,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 3 } },
    update: {},
    create: {
      idSector: 1,
      idPlace: 3,
      name: 'VIP',
      sectorType: 'enumerated',
      capacity: 20,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 2, idPlace: 3 } },
    update: {},
    create: {
      idSector: 2,
      idPlace: 3,
      name: 'General',
      sectorType: 'nonEnumerated',
      capacity: 30,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 4 } },
    update: {},
    create: {
      idSector: 1,
      idPlace: 4,
      name: 'Sala Principal',
      sectorType: 'nonEnumerated',
      capacity: 25,
    },
  });
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 1, idPlace: 5 } },
    update: {},
    create: {
      idSector: 1,
      idPlace: 5,
      name: 'Sala Principal',
      sectorType: 'enumerated',
      capacity: 40,
    },
  });
  // NUEVO: Tribuna Superior en El Circulo
  await prisma.sector.upsert({
    where: { idSector_idPlace: { idSector: 2, idPlace: 5 } },
    update: {},
    create: {
      idSector: 2,
      idPlace: 5,
      name: 'Tribuna Superior',
      sectorType: 'enumerated',
      capacity: 20,
    },
  });

  console.log('Datos de sectors cargados.');

  // Generar seats
  const allSectors = await prisma.sector.findMany();
  for (const s of allSectors) {
    await ensureSeatsForSector(s.idPlace, s.idSector, s.capacity);
  }
  console.log('Seats generados por sector según capacity.');

  // --- Evento Bizarrap ---
  await prisma.event.upsert({
    where: { idEvent: 3 },
    update: {},
    create: {
      idEvent: 3,
      name: 'Bizarrap',
      description: 'Bizarrap llega al bioceres para reventar todo!!',
      date: new Date('2025-11-12T00:00:00'),
      state: 'Approved',
      image: '/uploads/event-1758722694684-973176483.webp',
      featured: true,
      idEventType: 1,
      idOrganiser: 1,
      idPlace: 3,
    },
  });

  await prisma.eventSector.upsert({
    where: { idEvent_idPlace_idSector: { idEvent: 3, idPlace: 3, idSector: 1 } },
    update: { price: new Prisma.Decimal('450000.00') },
    create: {
      idEvent: 3,
      idPlace: 3,
      idSector: 1,
      price: new Prisma.Decimal('450000.00'),
    },
  });
  await prisma.eventSector.upsert({
    where: { idEvent_idPlace_idSector: { idEvent: 3, idPlace: 3, idSector: 2 } },
    update: { price: new Prisma.Decimal('300000.00') },
    create: {
      idEvent: 3,
      idPlace: 3,
      idSector: 2,
      price: new Prisma.Decimal('300000.00'),
    },
  });


  await createSeatEventGridForEvent(3, 3);

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
