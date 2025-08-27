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
  const { dni, name, surname, mail, birthDate, password } = req.body;
  
  // Validación básica de los datos de entrada
  if (!dni || !name || !surname || !mail || !birthDate || !password) {
    res.status(400).json({ error: 'Faltan campos obligatorios para crear el usuario.' });
    return;
  }
  
  try {
    const parsedBirthDate = new Date(birthDate);

    // Crea el usuario
    const newUser = await prisma.user.create({
      data: {
        dni: parseInt(dni), 
        name,
        surname,
        mail,
        birthDate: parsedBirthDate,
        password, 
      },
    });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: newUser.dni, 
    });
  } catch (error: any) {
    console.error('Error al crear el usuario:', error);
    if (error.code === 'P2002') {
      // P2002 es el código de error de Prisma para violaciones de unicidad
      res.status(409).json({ error: 'El usuario ya existe (DNI o email duplicado).' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
};