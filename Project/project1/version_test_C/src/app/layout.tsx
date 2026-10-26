import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    // 하위 페이지가 title을 지정하면 "페이지 이름 | ONEPIECE"로 표시됩니다.
    title: { default: 'ONEPIECE', template: '%s | ONEPIECE' },
    description:
        'ONEPIECE IS MASTER-PIECE. 아우터·상의·하의·신발·가방을 만나는 온라인 쇼핑몰',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html
            lang="ko"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body>{children}</body>
        </html>
    );
}
