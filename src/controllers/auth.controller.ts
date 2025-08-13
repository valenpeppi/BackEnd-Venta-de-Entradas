import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { db } from '../db/mysql';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

// Función para verificar el token de reCAPTCHA
const verifyRecaptcha = async (token: string): Promise<boolean> => {
  if (!RECAPTCHA_SECRET) {
    console.error('La clave secreta de reCAPTCHA no está configurada en .env');
    return false;
  }
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET}&response=${token}`
    );
    return response.data.success;
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error);
    return false;
  }
};

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  const { dni, name, surname, mail, password, birthDate, captchaToken } = req.body;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Verificación de CAPTCHA fallida.' });
  }

  if (!dni || !mail || !password || !name || !birthDate) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      `INSERT INTO users (dni, name, surname, mail, password, birthDate) VALUES (?, ?, ?, ?, ?, ?)`,
      [dni, name, surname, mail, hashedPassword, birthDate]
    );
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error: any) {
    console.error('[Auth] Error en registro:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El DNI o el Email ya están registrados.' });
    }
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

// Registro de empresa
export const registerCompany = async (req: Request, res: Response) => {
  const { company_name, cuil, contactEmail, password, phone, address, captchaToken } = req.body;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Verificación de CAPTCHA fallida.' });
  }

  if (!company_name || !contactEmail || !password || !phone || !address || !cuil) {
    return res.status(400).json({ message: 'Todos los campos obligatorios son requeridos.' });
  }

  try {
    const [existingCompany]: any = await db.query(
      'SELECT cuil, contact_email FROM organiser_company WHERE cuil = ? OR contact_email = ?',
      [cuil, contactEmail]
    );

    if (existingCompany.length > 0) {
      if (existingCompany[0].cuil === cuil) {
        return res.status(409).json({ message: 'El CUIL ya está registrado para otra empresa.' });
      }
      if (existingCompany[0].contact_email === contactEmail) {
        return res.status(409).json({ message: 'El Email de contacto ya está registrado para otra empresa.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO organiser_company (company_name, cuil, contact_email, password, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
      [company_name, cuil, contactEmail, hashedPassword, phone, address]
    );
    res.status(201).json({ message: 'Empresa registrada exitosamente' });
  } catch (error: any) {
    console.error('[Auth] Error en registro de empresa:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una empresa con ese CUIL o Email de contacto.' });
    }
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

// Login de usuario
export const login = async (req: Request, res: Response) => {
    const { mail, password } = req.body;
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
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const token = jwt.sign(
        { mail: user.mail, role: user.role, dni: user.dni },
        JWT_SECRET,
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

// Login de empresa
export const loginCompany = async (req: Request, res: Response) => {
    const { contact_email, password } = req.body;

    if (!contact_email || !password) {
      return res.status(400).json({ message: 'Email y contraseña requeridos' });
    }

    try {
      const [rows]: any = await db.query(
        'SELECT idOrganiser, company_name, cuil, contact_email, password, phone, address FROM organiser_company WHERE contact_email = ?',
        [contact_email]
      );

      if (!rows.length) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      const company = rows[0];
      const validPassword = await bcrypt.compare(password, company.password);

      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }

      // --- MODIFICACIÓN AQUÍ ---
      // Se añade el idOrganiser al token para identificar a la empresa
      const token = jwt.sign(
        { 
          idOrganiser: company.idOrganiser,
          contact_email: company.contact_email, 
          role: 'company',
          type: 'company'
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({
        token,
        company: {
          idOrganiser: company.idOrganiser, 
          company_name: company.company_name,
          cuil: company.cuil,
          contact_email: company.contact_email,
          phone: company.phone,
          address: company.address 
        }
      });
    } catch (error) {
      console.error('[Auth] Error en login de empresa:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
};
