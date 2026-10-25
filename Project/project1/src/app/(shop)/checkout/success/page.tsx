import { Suspense } from 'react';
import PaymentResult from '@/domains/orders/components/PaymentResult';

export default function CheckoutSuccess() {
    return (
        <Suspense
            fallback={
                <p role="status" className="px-5 py-24 text-center text-sm">
                    결제 정보를 불러오는 중입니다…
                </p>
            }
        >
            <PaymentResult />
        </Suspense>
    );
}
