import ForgotPasswordForm from '@/domains/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
    return (
        // 하단 고정 헤더(60px)를 뺀 화면 높이 안에서 그룹을 가로·세로 중앙에 둔다.
        <main className="flex min-h-[calc(100svh-60px)] items-center justify-center px-4 py-12">
            <ForgotPasswordForm />
        </main>
    );
}
