import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth';

async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.get('X-Authorization');
    try {
        req.authTokenData = await verifyAccessToken(token);
        next();
    } catch (error) {
        res.status(400).end('Problem verifying token.');
    }
}

function IfNotAdmin(notAdminStatus: number)  {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.authTokenData.isAdmin)
            res.status(notAdminStatus).end('Not authorized.');
        next();
    };
}

export {
    AuthMiddleware,
    IfNotAdmin
};