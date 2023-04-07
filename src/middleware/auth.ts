import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth';

export async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.get('X-Authorization');
    try {
        req.authTokenData = await verifyAccessToken(token);
        next();
    } catch (error) {
        res.status(400).end();
    }
}