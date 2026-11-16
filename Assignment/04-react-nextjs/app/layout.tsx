import "./globals.css";
import Link from "next/link";
export const metadata = {
  title: "Member Todo",
  description: "회원 전용 할 일 관리",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header>
          <Link href="/todos">MEMBER / TODO</Link>
        </header>
        <main>{children}</main>
        <footer>Supabase Auth · 사용자별 RLS</footer>
      </body>
    </html>
  );
}
