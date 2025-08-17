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
    // Convierte la fecha a un formato válido para Prisma si es necesario
    const parsedBirthDate = new Date(birthDate);

    // Crea el usuario
    const newUser = await prisma.user.create({
      data: {
        dni: parseInt(dni), // Asegura que el DNI sea un número
        name,
        surname,
        mail,
        birthDate: parsedBirthDate,
        password, // Asegúrate de hashear la contraseña en una aplicación real
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
    } else if (error.code === 'P2025') {
      // P2025 es para registros no encontrados (aunque no aplica aquí, es bueno conocerlo)
      res.status(404).json({ error: 'Registro no encontrado.' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
};