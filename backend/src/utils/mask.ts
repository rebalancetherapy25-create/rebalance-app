/**
 * Utilities for masking sensitive user data (e.g. email addresses)
 * when communicating with therapists or external parties.
 */

/**
 * Masks an email address to protect user privacy.
 * Examples:
 * - "john.doe@gmail.com" -> "j***e@gmail.com"
 * - "ab@domain.com" -> "a***@domain.com"
 * - "a@domain.com" -> "a***@domain.com"
 * - "user@sub.domain.co.uk" -> "u***r@sub.domain.co.uk"
 */
export const maskEmail = (email?: string | null): string => {
    if (!email) return '';
    const trimmed = String(email).trim();
    if (!trimmed) return '';

    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex <= 0 || atIndex === trimmed.length - 1) {
        // Not a standard email local@domain structure
        if (trimmed.length <= 2) return '***';
        return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
    }

    const user = trimmed.slice(0, atIndex);
    const domain = trimmed.slice(atIndex + 1);

    let maskedUser: string;
    if (user.length <= 1) {
        maskedUser = `${user}***`;
    } else if (user.length === 2) {
        maskedUser = `${user[0]}***`;
    } else {
        maskedUser = `${user[0]}***${user[user.length - 1]}`;
    }

    return `${maskedUser}@${domain}`;
};

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Checks text and masks any email addresses contained within it.
 * If the input itself is an email or name with email (e.g. "john@example.com" or "John (john@example.com)"),
 * all email instances are masked.
 */
export const maskClientIdentifier = (identifier?: string | null): string => {
    if (!identifier) return '';
    const trimmed = String(identifier).trim();
    if (!trimmed) return '';

    if (EMAIL_REGEX.test(trimmed)) {
        // Reset lastIndex because of /g flag
        EMAIL_REGEX.lastIndex = 0;
        return trimmed.replace(EMAIL_REGEX, (match) => maskEmail(match));
    }

    return trimmed;
};
