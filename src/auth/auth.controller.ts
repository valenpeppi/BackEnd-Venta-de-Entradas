import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../db/mysql';
import { BOOT_ID } from '../system/boot';

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY;

const verifyRecaptcha = async (token: string): Promise<boolean> => {
  if (!RECAPTCHA_SECRET) {
    console.error('La clave secreta de reCAPTCHA no está configurada en .env');
    return false;
  }
  // if (token === 'TEST_BYPASS') return true; // Descomentar para testing local sin recaptcha válido
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
  let { dni, name, surname, mail, password, birthDate, captchaToken } = req.body;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Verificación de CAPTCHA fallida.' });
  }

  if (!dni || !mail || !password || !name || !birthDate) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  dni = parseInt(dni, 10);
  if (isNaN(dni)) {
    return res.status(400).json({ message: 'DNI inválido. Debe ser un número.' });
  }

  try {
    // Validar unicidad cruzada: Verificar si el email ya existe como empresa
    const existingOrganiser = await prisma.organiser.findUnique({ where: { contactEmail: mail } });
    if (existingOrganiser) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado como Empresa.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        dni,
        name,
        surname: surname || '',
        mail,
        password: hashedPassword,
        birthDate: new Date(birthDate)
      }
    });

    res.status(201).json({ message: 'Usuario registrado correctamente.' });
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
    // Validar unicidad cruzada: Verificar si el email ya existe como usuario
    const existingUser = await prisma.user.findUnique({ where: { mail: contactEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'El correo electrónico ya está registrado como Usuario.' });
    }

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

// Login Unificado
export const loginUnified = async (req: Request, res: Response) => {
  const { email, password } = req.body; // Usamos 'email' genérico

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  try {
    // 1. Buscar en Usuarios
    const user = await prisma.user.findUnique({ where: { mail: email } });

    if (user) {
      const validPassword = await bcrypt.compare(password, user.password);
      if (validPassword) {
        const token = jwt.sign(
          { mail: user.mail, role: user.role, dni: user.dni, type: 'user', bootId: BOOT_ID },
          JWT_SECRET,
          { expiresIn: '2h' }
        );
        return res.json({
          token,
          user: {
            dni: user.dni,
            mail: user.mail,
            name: user.name,
            role: user.role,
            type: 'user'
          }
        });
      }
      // Si encuentra usuario pero pass incorrecto, retornamos error de credenciales aquí para no filtrar existencia
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 2. Buscar en Empresas (Organizadores)
    const company = await prisma.organiser.findUnique({ where: { contactEmail: email } });

    if (company) {
      const validPassword = await bcrypt.compare(password, company.password);
      if (validPassword) {
        const token = jwt.sign(
          {
            idOrganiser: company.idOrganiser,
            contactEmail: company.contactEmail,
            role: 'company',
            type: 'company',
            bootId: BOOT_ID,
          },
          JWT_SECRET,
          { expiresIn: '8h' }
        );
        return res.json({
          token,
          user: { // Normalizamos la respuesta como "user" para el frontend
            idOrganiser: company.idOrganiser,
            name: company.companyName, // Mapeamos companyName a name
            email: company.contactEmail,
            role: 'company',
            type: 'company'
          }
        });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 3. No encontrado en ninguno
    return res.status(401).json({ message: 'Credenciales inválidas' });

  } catch (error) {
    console.error('[Auth] Error en login unificado:', error);
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};

// Mantenemos los logins legacy por compatibilidad
export const login = async (req: Request, res: Response) => {
  return loginUnified(req, res);
};

export const loginCompany = async (req: Request, res: Response) => {
  req.body.email = req.body.contactEmail;
  return loginUnified(req, res);
};
