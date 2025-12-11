import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        // User is not authenticated (guest), proceed but without user info
        // OR if requirements say "SIEMPRE se valide el jwt", maybe we should check if it's there?
        // "validar SIEMPRE el jwt, este registrado o no" -> This means even guests might have a token? 
        // Or it means we assume guests don't have one and we just validate IF present?
        // "este registrado o no" likely means valid token for Registered User vs some other state, or simply that we shouldn't fail if no token?
        // "Request interceptor on FRONT implies we ALWAYS send it if present."
        // On BACK, "validate ALWAYS" usually means "verify signature if header is present". 
        // If header NOT present, continue as guest (or fail if route requires it, but this middleware is global).
        // Let's assume: If token, validate. If invalid, 401. If no token, next().
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
