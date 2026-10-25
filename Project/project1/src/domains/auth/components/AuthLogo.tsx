import Image from 'next/image';

export default function AuthLogo() {
    return (
        <Image
            src="/Logo.png"
            alt="ONEPIECE"
            width={2048}
            height={768}
            priority
            className="h-auto w-[180px] md:w-[220px]"
        />
    );
}
