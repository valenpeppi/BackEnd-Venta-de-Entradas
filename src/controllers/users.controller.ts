import { Request, Response } from 'express';
import { prisma } from '../db/mysql';

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error: any) {
    console.error('Error al obtener todos los usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const userData = req.body;
  try {
    const user = await prisma.user.create({ data: userData });
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: user.id || user.dni // Ajusta según tu modelo
    });
  } catch (error: any) {
    console.error('Error al crear el usuario:', error);
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'El usuario ya existe (ej. DNI o email duplicado)' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
};