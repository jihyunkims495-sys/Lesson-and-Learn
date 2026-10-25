const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
        return 'Please enter your email.';
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
        return 'Please enter a valid email address.';
    }

    return undefined;
}
