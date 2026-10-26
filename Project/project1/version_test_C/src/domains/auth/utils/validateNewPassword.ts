export interface NewPasswordValues {
    password: string;
    passwordConfirm: string;
}

export type NewPasswordErrors = Partial<
    Record<keyof NewPasswordValues, string>
>;

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_POLICY_MESSAGE = `Use at least ${MIN_PASSWORD_LENGTH} characters with letters and numbers.`;

export function validateNewPassword(
    values: NewPasswordValues,
): NewPasswordErrors {
    const errors: NewPasswordErrors = {};
    const { password, passwordConfirm } = values;

    if (!password) {
        errors.password = 'Please enter a new password.';
    } else if (
        password.length < MIN_PASSWORD_LENGTH ||
        !/[A-Za-z]/.test(password) ||
        !/\d/.test(password)
    ) {
        errors.password = PASSWORD_POLICY_MESSAGE;
    }

    if (!passwordConfirm) {
        errors.passwordConfirm = 'Please confirm your new password.';
    } else if (password !== passwordConfirm) {
        errors.passwordConfirm = 'Passwords do not match.';
    }

    return errors;
}
