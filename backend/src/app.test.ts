import type { NextFunction, Request, Response } from 'express';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { hashToken, tokenMatchesHash } from './lib/security';
import { authSchemas, bookingSchemas } from './validation/schemas';
import { notFoundHandler, requestContext, sendData, validate } from './lib/http';

let isOriginAllowed: (origin?: string) => boolean;

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET ??= 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET ??= 'test_jwt_refresh_secret';
    process.env.MONGO_URI ??= 'mongodb://localhost:27017/rebalance-test';
    process.env.FRONTEND_URL ??= 'http://localhost:3000';
    process.env.ADMIN_URL ??= 'http://localhost:3001';
    process.env.THERAPIST_URL ??= 'http://localhost:3002';

    const imported = await import('./app');
    isOriginAllowed = imported.isOriginAllowed;
});

const createMockResponse = () => {
    const response = {
        locals: {},
        headers: {} as Record<string, string>,
        statusCode: 200,
        body: undefined as unknown,
        setHeader(name: string, value: string) {
            this.headers[name.toLowerCase()] = value;
        },
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: unknown) {
            this.body = payload;
            return this;
        },
    };

    return response as unknown as Response & {
        headers: Record<string, string>;
        statusCode: number;
        body: unknown;
    };
};

describe('security helpers', () => {
    it('hashes refresh tokens deterministically', () => {
        const token = 'sample-refresh-token';
        const hashed = hashToken(token);

        expect(hashed).not.toBe(token);
        expect(tokenMatchesHash(token, hashed)).toBe(true);
        expect(tokenMatchesHash('other-token', hashed)).toBe(false);
    });
});

describe('request validation schemas', () => {
    it('rejects incomplete registration payloads', () => {
        const result = authSchemas.register.safeParse({ email: 'bad', password: '123' });
        expect(result.success).toBe(false);
    });

    it('rejects empty profile updates', () => {
        const result = authSchemas.updateProfile.safeParse({});
        expect(result.success).toBe(false);
    });

    it('accepts a valid booking request', () => {
        const result = bookingSchemas.create.safeParse({
            therapistId: 'therapist-id',
            date: '2026-04-15',
            time: '10:30',
            sessionType: 'video',
            name: 'A Client',
            email: 'client@example.com',
        });

        expect(result.success).toBe(true);
    });
});

describe('http helpers', () => {
    it('attaches a request id and includes it in success payloads', () => {
        const req = {
            header: vi.fn().mockReturnValue(undefined),
        } as unknown as Request;
        const res = createMockResponse();
        const next = vi.fn() as NextFunction;

        requestContext(req, res, next);
        sendData(res, { status: 'ok', service: 'rebalance-api' });

        expect(next).toHaveBeenCalled();
        expect(res.headers['x-request-id']).toBeTruthy();
        expect((res.body as { data: { status: string }; requestId: string }).data.status).toBe('ok');
        expect((res.body as { requestId: string }).requestId).toBeTruthy();
    });

    it('returns a structured 404 payload', () => {
        const req = {
            method: 'GET',
            originalUrl: '/api/does-not-exist',
        } as Request;
        const res = createMockResponse();

        notFoundHandler(req, res, vi.fn());

        expect(res.statusCode).toBe(404);
        expect((res.body as { code: string }).code).toBe('ROUTE_NOT_FOUND');
        expect((res.body as { error: string }).error).toContain('Route not found');
    });

    it('returns structured validation errors for malformed auth requests', () => {
        const req = {
            body: { email: 'bad-email', password: '123' },
        } as Request;
        const res = createMockResponse();
        const next = vi.fn();

        validate(authSchemas.register)(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(400);
        expect((res.body as { code: string }).code).toBe('VALIDATION_ERROR');
        expect((res.body as { fields: Record<string, string> }).fields.email).toBeTruthy();
        expect((res.body as { fields: Record<string, string> }).fields.name).toBeTruthy();
    });

    it('allows trusted origins and rejects unknown origins', () => {
        expect(isOriginAllowed('http://localhost:3000')).toBe(true);
        expect(isOriginAllowed('https://admin.rebalancetherapy.co.in')).toBe(true);
        expect(isOriginAllowed('https://preview-branch.vercel.app')).toBe(true);
        expect(isOriginAllowed('https://evil.example.com')).toBe(false);
    });
});
