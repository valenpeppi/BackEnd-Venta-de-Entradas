 
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        next();
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        next();
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'secreto_super_seguro';
        const user = jwt.verify(token, secret);
        (req as any).user = user;
        next();
    } catch (err) {

        next();
    }
};
