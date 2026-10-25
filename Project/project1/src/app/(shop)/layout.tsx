import Header from '@/shared/components/Header';
import Footer from '@/shared/components/Footer';

export default function ShopLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pb-15">
            {/* 하단 고정 헤더의 높이 60px에 맞춰 본문과 푸터 아래에 여백을 적용함 */}
            <Header />
            {children}
            <Footer />
        </div>
    );
}
