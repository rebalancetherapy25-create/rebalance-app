export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getErrorMessages(errors: Record<string, string | undefined>) {
    return Object.values(errors).filter((value): value is string => Boolean(value));
}

export function getApiErrorMessage(error: unknown, fallback: string) {
    return (error as { response?: { data?: { error?: string } } })?.response?.data?.error || fallback;
}

export function isValidUrl(value: string) {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}
