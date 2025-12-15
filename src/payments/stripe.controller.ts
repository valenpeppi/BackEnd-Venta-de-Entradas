import { Request, Response } from 'express';
import { stripe } from './stripe.client';
import { prisma } from '../db/mysql';
import SalesController from '../sales/sales.controller';
import { reserveTickets } from '../services/reservation.service';
import crypto from 'crypto';
import { env } from '../config/env';

const toMinorUnits = (v: number) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid amount');
    return Math.round(n);
};

export class StripeController {

    static async createCheckoutSession(req: Request, res: Response) {
        try {
            const { items, dniClient, ticketGroups, customerEmail } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'No se enviaron ítems válidos' });
            }
            if (!ticketGroups || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
                return res.status(400).json({ error: 'No se enviaron ticketGroups válidos' });
            }
            if (!dniClient || !customerEmail) {
                return res.status(400).json({ error: 'Faltan datos del cliente (dniClient, customerEmail)' });
            }

            await reserveTickets(ticketGroups);

            const line_items = items.map((item: any) => ({
                price_data: {
                    currency: 'ars',
                    product_data: { name: String(item.name).slice(0, 120) },
                    unit_amount: toMinorUnits(Number(item.amount)),
                },
                quantity: Number(item.quantity) || 1,
            }));

            const idemKey = crypto
                .createHash('sha256')
                .update(`${dniClient}:${customerEmail}:${JSON.stringify(ticketGroups)}`)
                .digest('hex');

            const session = await stripe.checkout.sessions.create(
                {
                    payment_method_types: ['card'],
                    line_items,
                    mode: 'payment',
                    customer_email: customerEmail,
                    success_url: `${env.FRONTEND_URL}/pay/processing?session_id={CHECKOUT_SESSION_ID}`,
                    cancel_url: `${env.FRONTEND_URL}/pay/failure`,
                    metadata: {
                        dniClient: String(dniClient),
                        ticketGroups: JSON.stringify(ticketGroups),
                    },
                },
                { idempotencyKey: idemKey }
            );

            res.json({ url: session.url });
        } catch (error: any) {
            console.error('Error creating Stripe session:', error);
            res.status(500).json({ error: error.message || 'No se pudo iniciar el pago' });
        }
    }

    static async releaseTickets(req: Request, res: Response) {
        try {
            const { ticketGroups } = req.body as { ticketGroups: Array<any> };

            if (!Array.isArray(ticketGroups) || ticketGroups.length === 0) {
                return res.status(400).json({ error: 'ticketGroups inválido' });
            }

            let totalReleased = 0;

            for (const g of ticketGroups) {
                const idEvent = Number(g.idEvent);
                const idPlace = Number(g.idPlace);
                const idSector = Number(g.idSector);
                const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number).filter(Number.isFinite) : [];

                if (!idEvent || !idPlace || !idSector || ids.length === 0) {
                    continue;
                }

                const updated = await prisma.seatEvent.updateMany({
                    where: {
                        idEvent,
                        idPlace,
                        idSector,
                        idSeat: { in: ids },
                        state: 'reserved',
                    },
                    data: {
                        state: 'available',
                        idSale: null,
                        lineNumber: null,
                    },
                });

                totalReleased += updated.count;
            }

            return res.status(200).json({ released: totalReleased });
        } catch (error: any) {
            console.error('Error releasing tickets manually:', error?.message || error);
            return res.status(500).json({ error: 'Error liberando reservas' });
        }
    }

    static async confirmSession(req: Request, res: Response) {
        try {
            const sessionId = String(req.query.session_id || '');
            if (!sessionId) {
                return res.status(400).json({ error: 'session_id requerido' });
            }

            const session = await stripe.checkout.sessions.retrieve(sessionId);
            if (!session) {
                return res.status(404).json({ error: 'Sesión no encontrada' });
            }

            const paid =
                session.payment_status === 'paid' ||
                (session.status === 'complete' && session.payment_status !== 'unpaid');

            if (!paid) {
                return res.status(409).json({ error: 'El pago aún no está confirmado' });
            }

            let dniClient: number | null = null;
            let ticketGroups: any[] = [];
            try {
                dniClient = session?.metadata?.dniClient ? Number(session.metadata.dniClient) : null;
                ticketGroups = session?.metadata?.ticketGroups ? JSON.parse(session.metadata.ticketGroups) : [];
            } catch (e) { }

            if (!dniClient || !Array.isArray(ticketGroups) || ticketGroups.length === 0) {
                return res.status(400).json({ error: 'Metadata incompleta para confirmar la venta' });
            }

            const anySold = await prisma.seatEvent.count({
                where: {
                    OR: ticketGroups.flatMap((g: any) => {
                        const idEvent = Number(g.idEvent);
                        const idPlace = Number(g.idPlace);
                        const idSector = Number(g.idSector);
                        const ids: number[] = Array.isArray(g.ids) ? g.ids.map(Number) : [];
                        if (!idEvent || !idPlace || !idSector || ids.length === 0) return [];
                        return [{ idEvent, idPlace, idSector, idSeat: { in: ids }, state: 'sold' }];
                    }),
                },
            });

            if (anySold > 0) {
                return res.status(200).json({ confirmed: true, message: 'Venta ya confirmada previamente' });
            }

            const mockReq = { body: { dniClient, tickets: ticketGroups }, auth: { dni: dniClient } } as any;
            const mockRes = {
                status: (code: number) => ({
                    json: (data: any) => ({ code, data }),
                }),
            } as any;

            await SalesController.confirmSale(mockReq, mockRes);

            return res.status(200).json({ confirmed: true });
        } catch (err: any) {
            console.error('Error confirming session:', err?.message || err);
            return res.status(500).json({ error: 'No se pudo confirmar la venta por session_id' });
        }
    }
}
