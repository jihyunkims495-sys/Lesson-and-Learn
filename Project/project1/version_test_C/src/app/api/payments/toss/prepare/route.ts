import { prepareTestPayment } from '@/domains/orders/server/testPayment';
import { requirePaymentUser } from '@/domains/orders/server/paymentDatabase';
import {
    paymentErrorResponse,
    paymentRequestBody,
} from '@/domains/orders/server/paymentRoute';

export async function POST(request: Request) {
    try {
        const body = await paymentRequestBody(request);
        const user = await requirePaymentUser();
        const payment = await prepareTestPayment(
            body,
            user.id,
            new URL(request.url).origin,
        );
        return Response.json(payment, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        return paymentErrorResponse(error);
    }
}
