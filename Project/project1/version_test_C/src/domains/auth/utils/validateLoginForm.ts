import type { LoginFormValues } from '@/domains/auth/types/auth.types';
import { validateEmail } from './validateEmail';

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
    const errors: LoginFormErrors = {};

    const emailError = validateEmail(values.email);
    if (emailError) {
        errors.email = emailError;
    }

    if (!values.password) {
        errors.password = 'Please enter your password.';
    }

    return errors;
}
