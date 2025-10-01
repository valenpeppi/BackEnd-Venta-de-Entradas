import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

class SalesController {
  public async confirmSale(req: Request, res: Response): Promise<void> {
    const { dniClient, tickets } = req.body;

    if (dniClient === null || dniClient === undefined || !Array.isArray(tickets) || tickets.length === 0) {
      res.status(400).json({ error: 'Faltan datos requeridos (dniClient, tickets[])' });
      return;
    }

    try {
      // Verificar que el usuario existe
      console.log("🔍 Buscando usuario con dni:", dniClient);
      const user = await prisma.user.findUnique({
        where: { dni: dniClient }
      });

      if (!user) {
        console.error("❌ Usuario no encontrado:", dniClient);
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Crear la venta principal
      
      console.log("🧾 Creando venta con dniClient:", dniClient);
      const sale = await prisma.sale.create({
        data: {
          date: new Date(),
          dniClient,
        },
      });

      // Para cada grupo de tickets (mismo evento + sector)
      for (const ticketGroup of tickets) {
        const { ids, idEvent, idPlace, idSector } = ticketGroup;
        console.log("🎫 Procesando grupo de tickets:", ticketGroup);

        if (!Array.isArray(ids) || ids.length === 0) {
          continue;
        }

        // Crear un SaleItem para este grupo
        const saleItem = await prisma.saleItem.create({
          data: {
            idSale: sale.idSale,
            dateSaleItem: new Date(),
            quantity: ids.length,
          },
        });
        console.log("📝 SaleItem creado:", saleItem);

        // Si es sector 0 (entrada general), no hay asientos específicos
        if (idSector === 0) {
          console.log(`🎫 Creando tickets de entrada general para evento ${idEvent}`);
          // Para entrada general, crear tickets sin asientos específicos
          for (let i = 0; i < ids.length; i++) {
            const ticket = await prisma.ticket.create({
              data: {
                idEvent,
                idPlace,
                idSector: 0,
                idTicket: i + 1, // ID secuencial
                state: 'sold',
                idSeat: 0, // Sin asiento específico
                idSale: sale.idSale,
                dateSaleItem: new Date(),
              },
            });
            console.log("🎟️ Ticket general creado:", ticket);
          }
        } else {
          // Para sectores enumerados, verificar y actualizar asientos específicos
          const available = await prisma.seatEvent.findMany({
            where: {
              idSeat: { in: ids },
              idEvent,
              idPlace,
              idSector,
              state: 'reserved', // o 'available', según el flujo
            },
          });
           console.log(`📊 Asientos encontrados: ${available.length} de ${ids.length}`);

          if (available.length !== ids.length) {
            throw new Error('Algunos asientos no están disponibles para la venta');
          }

          // Actualizar los seatEvents como vendidos
          const update = await prisma.seatEvent.updateMany({
            where: {
              idSeat: { in: ids },
              idEvent,
              idPlace,
              idSector,
            },
            data: {
              state: 'sold',
              idSale: sale.idSale,
              dateSaleItem: new Date(),
            },
          });
          console.log("✅ seatEvent actualizado:", update);

          // Crear los tickets correspondientes
          for (const seatId of ids) {
            const ticket = await prisma.ticket.create({
              data: {
                idEvent,
                idPlace,
                idSector,
                idTicket: seatId, // Usar el seatId como ticketId
                state: 'sold',
                idSeat: seatId,
                idSale: sale.idSale,
                dateSaleItem: new Date(),
              },
            });
            console.log("🎟️ Ticket de asiento creado:", ticket);
          }
        }
      }
      console.log("✅ Venta confirmada exitosamente:", sale);
      res.status(201).json({ message: 'Venta confirmada', idSale: sale.idSale });
    } catch (error: any) {
      console.error('Error al confirmar venta:', error);
      res.status(500).json({ error: 'Error al registrar venta', details: error.message });
    }
  }
}

export default new SalesController();
