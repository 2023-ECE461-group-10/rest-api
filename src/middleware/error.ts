import { Request, Response, NextFunction } from 'express';

export function OpenAPIErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    res.status(err.status || 500).json({
      errors: err.errors,
    });
    next();
}