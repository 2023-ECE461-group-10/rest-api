import { Request, Response, NextFunction } from 'express';

function ValidateParamIsNumberElse(paramName: string, statusCode: number)  {
    return (req: Request, res: Response, next: NextFunction) => {
        const num = parseInt(req.params[paramName]);
        if (!num || isNaN(num) || !isFinite(num)) {
            logger.log('info', `${paramName} is not a valid number`);
            res.status(statusCode).end();
            return;
        }
        next();
    };
}

export {
    ValidateParamIsNumberElse
}