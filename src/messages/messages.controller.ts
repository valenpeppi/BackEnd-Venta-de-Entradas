import { Request, Response } from 'express';
import { prisma } from '../db/mysql';
import { AuthRequest } from '../auth/auth.middleware';

// Create a new message
export const createMessage = async (req: Request, res: Response) => {
    const { title, description, senderEmail } = req.body;

    if (!title || !description || !senderEmail) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    try {
        const message = await prisma.message.create({
            data: {
                title,
                description,
                senderEmail,
                state: 'unread',
                response: '' // Default empty
            }
        });

        res.status(201).json(message);
    } catch (error) {

        res.status(500).json({ message: 'Error interno al crear el mensaje.' });
    }
};

// Get all messages (Admin only) - Exclude 'discarded'
export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const messages = await prisma.message.findMany({
            where: {
                state: { not: 'discarded' }
            },
            orderBy: { date: 'desc' }
        });
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener mensajes.' });
    }
};

// Reply to a message (Set state to 'answered' and save response)
export const replyMessage = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { responseText } = req.body;

    try {
        const message = await prisma.message.update({
            where: { idMessage: Number(id) },
            data: {
                state: 'answered',
                response: responseText || "Gracias por contactarnos."
            }
        });

        res.json({ message: 'Mensaje respondido.', data: message });
    } catch (error) {
        // console.error('Error replying message:', error);
        res.status(500).json({ message: 'Error al responder el mensaje.' });
    }
};

// Reject a message (Set state to 'rejected') - Keeps it in list
export const rejectMessage = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const message = await prisma.message.update({
            where: { idMessage: Number(id) },
            data: { state: 'rejected' }
        });

        res.json({ message: 'Mensaje rechazado.', data: message });
    } catch (error) {
        // console.error('Error rejecting message:', error);
        res.status(500).json({ message: 'Error al rechazar el mensaje.' });
    }
};

// Discard a message (Set state to 'discarded') - Hides it from list
export const discardMessage = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    try {
        const message = await prisma.message.update({
            where: { idMessage: Number(id) },
            data: { state: 'discarded' }
        });

        res.json({ message: 'Mensaje descartado.', data: message });
    } catch (error) {
        // console.error('Error discarding message:', error);
        res.status(500).json({ message: 'Error al descartar el mensaje.' });
    }
};
