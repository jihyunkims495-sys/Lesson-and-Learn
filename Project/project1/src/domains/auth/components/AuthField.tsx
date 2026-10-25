import { Input } from '@/shared/components/ui/input';

interface AuthFieldProps {
    label: string;
    name: string;
    type: 'email' | 'password';
    autoComplete: string;
    value: string;
    error?: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthField({
    label,
    name,
    type,
    autoComplete,
    value,
    error,
    onChange,
}: AuthFieldProps) {
    const errorId = `auth-${name}-error`;

    return (
        <label className="flex flex-col gap-1 text-xs tracking-widest">
            {label}
            <Input
                type={type}
                name={name}
                autoComplete={autoComplete}
                required
                value={value}
                onChange={onChange}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="h-11 rounded-none border-0 border-b border-black/30 px-0 focus-visible:border-black focus-visible:ring-0 aria-invalid:border-red-600 aria-invalid:ring-0"
            />
            {error && (
                <span
                    id={errorId}
                    className="text-xs tracking-normal text-red-600"
                >
                    {error}
                </span>
            )}
        </label>
    );
}
