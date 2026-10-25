import Link from 'next/link';

export default function BackToLoginLink() {
    return (
        <Link
            href="/login"
            className="self-center text-xs font-semibold tracking-widest text-black underline-offset-4 hover:underline"
        >
            BACK TO LOGIN
        </Link>
    );
}
