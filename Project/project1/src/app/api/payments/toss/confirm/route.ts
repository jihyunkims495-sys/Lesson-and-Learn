import { confirmTestPayment } from '@/domains/orders/server/testPayment';
import { requirePaymentUser } from '@/domains/orders/server/paymentDatabase';
import {
    paymentErrorResponse,
    paymentRequestBody,
} from '@/domains/orders/server/paymentRoute';

export async function POST(request: Request) {
    try {
        const body = await paymentRequestBody(request);
        const user = await requirePaymentUser();
        const receipt = await confirmTestPayment(body, user.id);
        return Response.json(receipt, {
            headers: { 'Cache-Control': 'no-store' },
        });
    } catch (error) {
        return paymentErrorResponse(error);
    }
}
