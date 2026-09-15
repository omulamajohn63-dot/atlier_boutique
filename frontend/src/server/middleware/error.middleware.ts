import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // 1. App-specific domain errors
  if (
    err instanceof AppError ||
    (err && typeof err === 'object' && 'statusCode' in err && 'code' in err)
  ) {
    const customErr = err as AppError;
    res.status(customErr.statusCode).json({
      error: {
        code: customErr.code,
        message: customErr.message,
        details: customErr.details,
      },
    });
    return;
  }

  // 2. Zod validation errors (supports Zod v3 .errors and Zod v4 .issues)
  const isZod =
    err instanceof ZodError ||
    (err && typeof err === 'object' && ('issues' in err || 'errors' in err));

  if (isZod) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawIssues: any[] = (err as any).issues || (err as any).errors || [];
    const formattedDetails = rawIssues.map((e) => ({
      path: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message || 'Invalid input',
    }));

    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed.',
        details: formattedDetails,
      },
    });
    return;
  }

  // 3. SyntaxError (e.g. malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body.',
      },
    });
    return;
  }

  // 4. Fallback internal server error
  console.error('[API Internal Error]:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
};
