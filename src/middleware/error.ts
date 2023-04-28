import { Request, Response, NextFunction } from 'express';

function OpenAPIErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    logger.log('debug', err);
    res.status(err.status || 500).json({
      errors: err.errors,
    });
    next();
}

export {
  OpenAPIErrorHandler
};