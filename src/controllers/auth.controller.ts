import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    console.log('[Auth] Login para:', email);
  
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
  
    try {
      // 👇 Cambia 'id' por 'dni' en la consulta
      const [rows]: any = await db.query(
        'SELECT dni, email, password, name FROM users WHERE email = ?', 
        [email]
      );
  
      if (!rows.length) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const user = rows[0];
      console.log('[Auth] Usuario DB:', user); // Verifica que trae 'dni'
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      // 👇 Usa 'dni' en lugar de 'id' para el token
      const token = jwt.sign(
        { dni: user.dni, email: user.email }, // ¡Clave cambiada aquí!
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
  
      res.json({
        token,
        user: {
          dni: user.dni, // 👈 Actualizado
          email: user.email,
          name: user.name
        }
      });
  
    } catch (error) {
      console.error('[Auth] Error:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  };
  export const register = async (req: Request, res: Response) => {
    const { dni, name, email, password } = req.body; // 👈 Agrega 'dni'
    
    if (!dni || !email || !password || !name) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (dni, name, email, password) VALUES (?, ?, ?, ?)', // 👈 Incluye 'dni'
        [dni, name, email, hashedPassword]
      );
      res.status(201).json({ message: 'Usuario registrado' });
    } catch (error) {
      console.error('[Auth] Error en registro:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  };