import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../controllers/auth';

async function AuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const token = req.get('X-Authorization');
    try {
        req.authTokenData = await verifyAccessToken(token);
        next();
    } catch (error) {
        res.status(400).end();
    }
}

function IfNotAdmin(notAdminStatus: number)  {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.authTokenData.isAdmin)
            res.status(notAdminStatus).end();
        next();
    };
}

export {
    AuthMiddleware,
    IfNotAdmin
};