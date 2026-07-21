import { RequestHandler } from 'express';
import { ZodType } from 'zod';
import { AppError } from './AppError';

export function validate(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      next(new AppError(message, 400));
      return;
    }

    req.body = result.data;
    next();
  };
}
