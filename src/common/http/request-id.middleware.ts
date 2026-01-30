import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.header('x-request-id');
  const id = existing && existing.trim().length > 0 ? existing : randomUUID();

  (req as any).requestId = id;
  res.setHeader('x-request-id', id);
  next();
}
