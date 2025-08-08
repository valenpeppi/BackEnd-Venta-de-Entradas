import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/mysql'; // Asegúrate de que esta ruta sea correcta para tu `mysql.ts`

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Registro de usuario
export const register = async (req: Request, res: Response) => {
  const { dni, name, surname, mail, password, birthDate ,} = req.body;

  if (!dni || !mail || !password || !name || !birthDate) {
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (dni, name, surname, mail, password, birthDate)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dni, name, surname, mail, hashedPassword, birthDate, ]
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
  
      const validPassword = await bcrypt.compare(password, user.password); // Usando bcrypt.compare
      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
  
      const token = jwt.sign(
        { mail: user.mail, role: user.role, dni: user.dni }, // Incluye el rol y DNI en el token
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
    // Eliminado 'dniOrganiser' de la desestructuración, ya que no es una columna en organiser_company
    const { company_name, cuil, contactEmail, password, phone, address } = req.body; // Corregido 'adress' a 'address'

    // Validaciones: ahora no se valida 'dniOrganiser'
    if (!company_name || !contactEmail || !password || !phone || !address) {
      return res.status(400).json({ message: 'Todos los campos obligatorios (Nombre de Empresa, Email, Contraseña, Teléfono, Dirección) son requeridos para registrar la empresa.' });
    }
 
    try {
      // 1. Verificar si el CUIL o el email de contacto ya existen
      const [existingCompany]: any = await db.query(
        'SELECT cuil, contact_email FROM organiser_company WHERE cuil = ? OR contact_email = ?', // Corregido contactEmail a contact_email
        [cuil, contactEmail]
      );

      if (existingCompany.length > 0) {
        if (existingCompany[0].cuil === cuil) {
            return res.status(409).json({ message: 'El CUIL ya está registrado para otra empresa.' });
        }
        if (existingCompany[0].contact_email === contactEmail) { // Corregido contactEmail a contact_email
            return res.status(409).json({ message: 'El Email de contacto ya está registrado para otra empresa.' });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        // Asegúrate de que los nombres de las columnas coincidan exactamente con tu esquema de DB
        'INSERT INTO organiser_company (company_name, cuil, contact_email, password, phone, address) VALUES (?, ?, ?, ?, ?, ?)', // Eliminado dniOrganiser, corregido contactEmail a contact_email, y adress a address
        [company_name, cuil, contactEmail, hashedPassword, phone, address]
      );
      res.status(201).json({ message: 'Empresa registrada exitosamente' });
    } catch (error: any) {
      console.error('[Auth] Error en registro de empresa:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        // Este caso ya debería ser manejado por la verificación previa, pero se mantiene como fallback
        return res.status(409).json({ message: 'Ya existe una empresa con ese CUIL o Email de contacto.' });
      }
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
        'SELECT idOrganiser, company_name, cuil, contact_email, password, phone, address FROM organiser_company WHERE contact_email = ?', // Corregido 'id' a 'idOrganiser' y 'adress' a 'address', y contactEmail a contact_email
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
        { contactEmail: company.contact_email, companyId: company.idOrganiser }, // Corregido 'id' a 'idOrganiser' y 'contactEmail' a 'contact_email'
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '1h' }
      );

      res.json({
        token,
        company: {
          idOrganiser: company.idOrganiser, // Corregido 'id' a 'idOrganiser'
          company_name: company.company_name,
          cuil: company.cuil,
          contact_email: company.contact_email, // Corregido 'contactEmail' a 'contact_email'
          phone: company.phone,
          address: company.address // Corregido 'adress' a 'address'
        }
      });
    } catch (error) {
      console.error('[Auth] Error en login de empresa:', error);
      res.status(500).json({ message: 'Error en el servidor', error });
    }
};
