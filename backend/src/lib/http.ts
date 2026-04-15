import crypto from 'crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodTypeAny } from 'zod';
import { ZodError } from 'zod';

export type ApiSuccess<T> = {
    data: T;
    requestId?: string;
};

export type ApiFailure = {
    error: string;
    code?: string;
    fields?: Record<string, string>;
    requestId?: string;
};

export class ApiError extends Error {
    statusCode: number;
    code: string | undefined;
    fields: Record<string, string> | undefined;

    constructor(statusCode: number, message: string, options?: { code?: string; fields?: Record<string, string> }) {
        super(message);
        this.statusCode = statusCode;
        this.code = options?.code;
        this.fields = options?.fields;
    }
}

declare global {
    namespace Express {
        interface Locals {
            requestId?: string;
        }
    }
}

const formatZodIssues = (error: ZodError) => {
    const fields: Record<string, string> = {};
    for (const issue of error.issues) {
        const key = issue.path.join('.') || 'root';
        if (!fields[key]) {
            fields[key] = issue.message;
        }
    }
    return fields;
};

export const getRequestId = (res: Response) => res.locals.requestId;

export const sendData = <T>(res: Response, data: T, statusCode = 200) => {
    const payload: ApiSuccess<T> = { data };
    const requestId = getRequestId(res);
    if (requestId) {
        payload.requestId = requestId;
    }
    return res.status(statusCode).json(payload);
};

export const sendError = (
    res: Response,
    statusCode: number,
    error: string,
    options?: { code?: string; fields?: Record<string, string> },
) => {
    const payload: ApiFailure = { error };
    if (options?.code) payload.code = options.code;
    if (options?.fields && Object.keys(options.fields).length > 0) payload.fields = options.fields;
    const requestId = getRequestId(res);
    if (requestId) {
        payload.requestId = requestId;
    }
    return res.status(statusCode).json(payload);
};

export const asyncHandler = (handler: RequestHandler): RequestHandler => {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
};

export const validate = <TSchema extends ZodTypeAny>(
    schema: TSchema,
    target: 'body' | 'query' | 'params' = 'body',
): RequestHandler => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req[target]);
            req[target] = parsed;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return sendError(res, 400, 'Invalid request data', {
                    code: 'VALIDATION_ERROR',
                    fields: formatZodIssues(error),
                });
            }
            next(error);
        }
    };
};

export const requestContext: RequestHandler = (req, res, next) => {
    const headerRequestId = req.header('x-request-id');
    const requestId = headerRequestId && headerRequestId.trim().length > 0
        ? headerRequestId.trim()
        : crypto.randomUUID();

    res.locals.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
};

export const notFoundHandler: RequestHandler = (req, res) => {
    sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`, { code: 'ROUTE_NOT_FOUND' });
};

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) {
        return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error';
    const requestId = getRequestId(res);

    console.error('[api:error]', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        error: message,
        stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof ApiError) {
        const options: { code?: string; fields?: Record<string, string> } = {};
        if (error.code) options.code = error.code;
        if (error.fields) options.fields = error.fields;
        return sendError(res, error.statusCode, error.message, options);
    }

    return sendError(res, 500, 'Something went wrong', { code: 'INTERNAL_SERVER_ERROR' });
};

export const requestLogger: RequestHandler = (req, res, next) => {
    const startedAt = Date.now();

    res.on('finish', () => {
        console.info('[api:request]', {
            requestId: res.locals.requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - startedAt,
            userAgent: req.get('user-agent'),
        });
    });

    next();
};
