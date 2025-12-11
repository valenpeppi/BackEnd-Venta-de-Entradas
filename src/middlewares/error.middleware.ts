import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
    statusCode?: number;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';


    res.status(statusCode).json({
        ok: false,
        error: message,
        // Solo mostrar stack en desarrollo
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};
