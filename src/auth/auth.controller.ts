import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { prisma } from '../db/mysql';
import { BOOT_ID } from '../system/boot';
import { AuthRequest } from './auth.middleware';
import { verifyGoogleToken } from './google.helper';

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

// Helper para validar contraseña segura
const isPasswordStrong = (pwd: string): boolean => {
  const length = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /\d/.test(pwd);
  return length && hasUpper && hasLower && hasNumber;
};

// Helper para evaluar la fortaleza de la contraseña
const evaluatePasswordStrength = (pwd: string): { strength: 'weak' | 'medium' | 'strong', score: number, feedback: string[] } => {
  let score = 0;
  const feedback: string[] = [];

  if (!pwd) {
    return { strength: 'weak', score: 0, feedback: ['La contraseña no puede estar vacía'] };
  }

  // Check length
  if (pwd.length >= 8) {
    score += 30;
  } else {
    feedback.push('Mínimo 8 caracteres');
  }

  // Check lowercase
  if (/[a-z]/.test(pwd)) {
    score += 20;
  } else {
    feedback.push('Incluye minúsculas (a-z)');
  }

  // Check uppercase
  if (/[A-Z]/.test(pwd)) {
    score += 20;
  } else {
    feedback.push('Incluye mayúsculas (A-Z)');
  }

  // Check numbers
  if (/\d/.test(pwd)) {
    score += 15;
  } else {
    feedback.push('Incluye números (0-9)');
  }

  // Check special characters
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
    score += 15;
  }

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 70) {
    strength = 'strong';
  } else if (score >= 50) {
    strength = 'medium';
  }

  return { strength, score, feedback };
};

// Endpoint para evaluar la fortaleza de la contraseña (para el frontend)
export const checkPasswordStrength = async (req: Request, res: Response) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'La contraseña es requerida.' });
  }

  const evaluation = evaluatePasswordStrength(password);
  res.json(evaluation);
};

export const register = async (req: Request, res: Response) => {
  let { dni, name, surname, mail, password, birthDate, captchaToken } = req.body;

  // Auto-fill surname from name if missing
  if (!surname && name && name.trim().includes(' ')) {
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      surname = parts.pop(); // Last part is surname
      name = parts.join(' '); // Rest is name
    }
  }

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Verificación de CAPTCHA fallida.' });
  }

  if (!dni || !mail || !password || !name || !birthDate) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).json({ message: 'La contraseña es débil. Debe tener 8 caracteres, mayúscula, minúscula y número.' });
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

// ... (existing helper functions or other exports if any, keeping file structure integrity) ...

// Registro de empresa
export const registerCompany = async (req: Request, res: Response) => {
  // ... existing registerCompany implementation ...
  const { companyName, cuil, contactEmail, password, phone, address, captchaToken } = req.body;

  const isCaptchaValid = await verifyRecaptcha(captchaToken);
  if (!isCaptchaValid) {
    return res.status(400).json({ message: 'Verificación de CAPTCHA fallida.' });
  }

  if (!companyName || !contactEmail || !password || !phone || !address || !cuil) {
    return res.status(400).json({ message: 'Todos los campos obligatorios son requeridos.' });
  }

  if (!isPasswordStrong(password)) {
    return res.status(400).json({ message: 'La contraseña es débil. Debe tener 8 caracteres, mayúscula, minúscula y número.' });
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







export const loginUnified = async (req: Request, res: Response) => {
  const { email, password } = req.body; // Usamos 'email' genérico

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña requeridos' });
  }

  try {
    
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
            birthDate: user.birthDate,
            role: user.role,
            type: 'user'
          }
        });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    
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
          user: { 
            idOrganiser: company.idOrganiser,
            name: company.companyName, 
            email: company.contactEmail,
            phone: company.phone,
            address: company.address,
            cuil: company.cuil,
            role: 'company',
            type: 'company'
          }
        });
      }
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    
    return res.status(401).json({ message: 'Credenciales inválidas' });

  } catch (error) {
    console.error('[Auth] Error en login unificado:', error);
    res.status(500).json({ message: 'Error en el servidor', error });
  }
};


export const googleLogin = async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: 'Credencial de Google requerida' });
  }

  try {
    const payload = await verifyGoogleToken(credential);

    if (!payload || !payload.email) {
      return res.status(401).json({ message: 'Token de Google inválido' });
    }

    const { email, sub: googleId } = payload;

    // Buscar si ya existe un usuario con este googleId
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleId },
          { mail: email }
        ]
      }
    });

    if (user) {
      // Si existe pero no tiene googleId, lo actualizamos (linking)
      if (!user.googleId) {
        await prisma.user.update({
          where: { dni: user.dni },
          data: { googleId: googleId }
        });
      }

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
          surname: user.surname,
          role: user.role,
          type: 'user'
        }
      });
    }

    // Si NO existe el usuario, devolvemos error (no creamos cuentas automáticamente por falta de DNI/Fecha)
    return res.status(404).json({
      message: 'Usuario no encontrado',
      code: 'USER_NOT_FOUND',
      email: email,
      googleId: googleId
    });

  } catch (error) {
    console.error('[Auth] Error en Google Login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


export const login = async (req: Request, res: Response) => {
  return loginUnified(req, res);
};

export const loginCompany = async (req: Request, res: Response) => {
  req.body.email = req.body.contactEmail;
  return loginUnified(req, res);
};


export const updateUser = async (req: AuthRequest, res: Response) => {
  const { name, surname, phone, address, birthDate } = req.body;
  const userType = req.auth?.type;
  const userMail = req.auth?.mail; 
  const companyId = req.auth?.idOrganiser; 

  try {
    if (userType === 'user' && userMail) {
      const updateData: any = { name, surname };
      if (birthDate) updateData.birthDate = new Date(birthDate);

      await prisma.user.update({
        where: { mail: userMail },
        data: updateData
      });
      return res.json({ ok: true, message: 'Perfil de usuario actualizado', user: { name, surname, birthDate } });

    } else if (userType === 'company' && companyId) {
      await prisma.organiser.update({
        where: { idOrganiser: companyId },
        data: {
          companyName: name,
          phone,
          address
        }
      });
      return res.json({ ok: true, message: 'Perfil de empresa actualizado', user: { name, phone, address } });
    }

    res.status(400).json({ message: 'No se pudo identificar el tipo de usuario o faltan permisos' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno al actualizar perfil' });
  }
};

export const removeUser = async (req: AuthRequest, res: Response) => {
  const userType = req.auth?.type;
  const userMail = req.auth?.mail;
  const companyId = req.auth?.idOrganiser;

  try {
    if (userType === 'user' && userMail) {
      await prisma.user.delete({ where: { mail: userMail } });
      return res.json({ ok: true, message: 'Cuenta de usuario eliminada' });

    } else if (userType === 'company' && companyId) {

      const activeEvents = await prisma.event.findFirst({
        where: {
          idOrganiser: companyId,
          state: {
            notIn: ['Rejected', 'Cancelled', 'Finalized']
          }
        }
      });

      if (activeEvents) {
        return res.status(400).json({
          message: 'No puedes eliminar la cuenta mientras tengas eventos activos (Pendientes o Aprobados).'
        });
      }

      await prisma.organiser.delete({ where: { idOrganiser: companyId } });
      return res.json({ ok: true, message: 'Cuenta de empresa eliminada' });
    }

    res.status(400).json({ message: 'No se pudo identificar el tipo de usuario' });
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    // Handle specific Prisma errors (e.g., Foreign Key Constraint)
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'No se puede eliminar la cuenta porque tiene registros asociados (entradas o eventos).' });
    }
    res.status(500).json({ message: 'Error interno al eliminar cuenta' });
  }
};


export const validateSession = async (req: AuthRequest, res: Response) => {
  const userType = req.auth?.type;
  const userMail = req.auth?.mail;
  const companyId = req.auth?.idOrganiser;

  try {
    if (userType === 'user' && userMail) {
      const user = await prisma.user.findUnique({ where: { mail: userMail } });
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

      return res.json({
        valid: true,
        user: {
          dni: user.dni,
          mail: user.mail,
          name: user.name,
          surname: user.surname,
          birthDate: user.birthDate,
          role: user.role,
          type: 'user'
        }
      });
    } else if (userType === 'company' && companyId) {
      const company = await prisma.organiser.findUnique({ where: { idOrganiser: companyId } });
      if (!company) return res.status(404).json({ message: 'Empresa no encontrada' });

      return res.json({
        valid: true,
        user: {
          idOrganiser: company.idOrganiser,
          name: company.companyName,
          email: company.contactEmail,
          phone: company.phone,
          address: company.address,
          cuil: company.cuil,
          role: 'company',
          type: 'company'
        }
      });
    }

    return res.status(400).json({ valid: false, message: 'Token inválido o tipo de usuario desconocido' });
  } catch (error) {
    console.error('Error en validación de sesión:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
