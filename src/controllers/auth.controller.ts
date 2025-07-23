import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Registro de usuario
export const register = async (req: Request, res: Response) => {
    const { dni, name, mail, password } = req.body;
    
    if (!dni || !mail || !password || !name) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO users (dni, name, mail, password) VALUES (?, ?, ?, ?)',
        [dni, name, mail, hashedPassword]
      );
      res.status(201).json({ message: 'Usuario registrado' });
    } catch (error) {
      console.error('[Auth] Error en registro:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  };

// Login de usuario
  export const login = async (req: Request, res: Response) => {
    const { mail, password } = req.body;
    console.log('[Auth] Login para:', mail);
  
    if (!mail || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }
  
    try {
      const [rows]: any = await db.query(
        'SELECT dni, mail, password, name, role FROM users WHERE mail = ?', 
        [mail]
      );
  
      if (!rows.length) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const user = rows[0];
      console.log('[Auth] Usuario DB:', user);
  
      // const validPassword = await bcrypt.compare(password, user.password);
      const validPassword = password === user.password;
      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const token = jwt.sign(
        { mail: user.mail },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );
  
      res.json({
        token,
        user: {
          dni: user.dni,
          mail: user.mail,
          name: user.name,
          role: user.role 
        }
      });
  
    } catch (error) {
      console.error('[Auth] Error:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  };
  // Registro de empresa
  export const registerCompany = async (req: Request, res: Response) => {
    const { dniOrganiser, company_name, cuil, contactEmail, password, phone, adress } = req.body;

    if (!dniOrganiser || !company_name || !cuil || !contactEmail || !password || !phone || !adress) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        'INSERT INTO companies (dniOrganiser, company_name , cuil, contactEmail, password, phone, adress) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [dniOrganiser, company_name, cuil, contactEmail, hashedPassword, phone, adress]
      );
      res.status(201).json({ message: 'Empresa registrada exitosamente' });
    } catch (error) {
      console.error('[Auth] Error en registro de empresa:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  };

  // Login de empresa
  export const loginCompany = async (req: Request, res: Response) => {
    const { contactEmail, password } = req.body;

    if (!contactEmail || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }

    try {
      const [rows]: any = await db.query(
        'SELECT id, dniOrganiser, company_name, cuil, contactEmail, password, phone, adress FROM companies WHERE contactEmail = ?',
        [contactEmail]
      );

      if (!rows.length) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const company = rows[0];
      const validPassword = await bcrypt.compare(password, company.password);

      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const token = jwt.sign(
        { contactEmail: company.contactEmail, companyId: company.id },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );

      res.json({
        token,
        company: {
          id: company.id,
          dniOrganiser: company.dniOrganiser,
          company_name: company.company_name,
          cuil: company.cuil,
          contactEmail: company.contactEmail,
          phone: company.phone,
          adress: company.adress
        }
      });
    } catch (error) {
      console.error('[Auth] Error en login de empresa:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
  };
