import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../db/mysql';

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
    await prisma.user.create({
      data: {
        dni,
        name,
        surname,
        mail,
        password: hashedPassword,
        birthDate: new Date(birthDate)
      }
    });
    res.status(201).json({ message: 'Usuario registrado' });
  } catch (error: any) {
    console.error('[Auth] Error en registro:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El DNI o el Email ya están registrados.' });
    }
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

// Registro de empresa
export const registerCompany = async (req: Request, res: Response) => {
  const { companyName, cuil, contactEmail, password, phone, address, captchaToken } = req.body;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Verificación de CAPTCHA fallida.' });
  }

  if (!companyName || !contactEmail || !password || !phone || !address || !cuil) {
    return res.status(400).json({ message: 'Todos los campos obligatorios son requeridos.' });
  }

  try {
    // Corregido: prisma.organiser_company -> prisma.organiser
    const existingCompany = await prisma.organiser.findFirst({
      where: {
        OR: [
          { cuil: cuil },
          { contactEmail: contactEmail } 
        ]
      }
    });

    if (existingCompany) {
      if (existingCompany.cuil === cuil) {
        return res.status(409).json({ message: 'El CUIL ya está registrado para otra empresa.' });
      }
      if (existingCompany.contactEmail === contactEmail) {
        return res.status(409).json({ message: 'El Email de contacto ya está registrado para otra empresa.' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.organiser.create({ 
      data: {
        companyName, 
        cuil,
        contactEmail,
        password: hashedPassword,
        phone,
        address
      }
    });
    res.status(201).json({ message: 'Empresa registrada exitosamente' });
  } catch (error: any) {
    console.error('[Auth] Error en registro de empresa:', error);
    if (error.code === 'P2002') {
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
    const user = await prisma.user.findUnique({ where: { mail } });

    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

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
      const company = await prisma.organiser.findUnique({ where: { contactEmail: contact_email } });
    if (!company) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, company.password);

    if (!validPassword) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      {
        idOrganiser: company.idOrganiser,
        contact_email: company.contactEmail, 
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
        companyName: company.companyName, 
        cuil: company.cuil,
        contact_email: company.contactEmail, 
        phone: company.phone,
        address: company.address
      }
    });
  } catch (error) {
    console.error('[Auth] Error en login de empresa:', error);
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};