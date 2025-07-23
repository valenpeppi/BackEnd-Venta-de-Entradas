import { Request, Response } from 'express';
import { db } from '../db/mysql'; // Importa el pool de conexiones

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ejemplo de obtención de todos los usuarios desde la tabla 'users'
    const [rows] = await db.query('SELECT * FROM users');
    res.status(200).json(rows);
  } catch (error: any) {
    console.error('Error al obtener todos los usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const userData = req.body; // Los datos del usuario vendrán en el cuerpo de la solicitud
  try {
    // Ejemplo de inserción de un usuario en la tabla 'users'
    // Asegúrate de que los campos en userData coincidan con las columnas de tu tabla
    const [result] = await db.query('INSERT INTO users SET ?', [userData]);
    res.status(201).json({
      message: 'Usuario creado exitosamente',
      userId: (result as any).insertId // 'insertId' está disponible para inserciones
    });
  } catch (error: any) {
    console.error('Error al crear el usuario:', error);
    // Puedes añadir lógica para manejar errores de duplicados (ej. email ya existe)
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'El usuario ya existe (ej. DNI o email duplicado)' });
    } else {
      res.status(500).json({ error: 'Error interno del servidor', details: error.message });
    }
  }
};