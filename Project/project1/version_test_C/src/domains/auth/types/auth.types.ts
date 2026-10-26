export interface LoginFormValues {
    email: string;
    password: string;
}

export interface SignupFormValues extends LoginFormValues {
    passwordConfirm: string;
}
