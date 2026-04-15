import crypto from 'crypto';

export const hashToken = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const tokenMatchesHash = (value: string, hash?: string | null) => {
    if (!hash) return false;
    return hashToken(value) === hash;
};
