import 'server-only';

import { PaymentError } from './testPaymentValidation';

export async function paymentRequestBody(request: Request) {
    if (request.headers.get('origin') !== new URL(request.url).origin) {
        throw new PaymentError(
            'INVALID_ORIGIN',
            '요청 출처를 확인할 수 없습니다.',
            403,
        );
    }
    const body = await request.text();
    if (body.length > 16384)
        throw new PaymentError(
            'REQUEST_TOO_LARGE',
            '요청 정보가 너무 큽니다.',
            413,
        );
    try {
        return JSON.parse(body) as unknown;
    } catch {
        throw new PaymentError('INVALID_REQUEST', '요청 정보를 확인해 주세요.');
    }
}

export function paymentErrorResponse(error: unknown) {
    const known = error instanceof PaymentError;
    return Response.json(
        {
            code: known ? error.code : 'PAYMENT_SERVER_ERROR',
            message: known
                ? error.message
                : '결제 처리 중 오류가 발생했습니다. 잠시 후 다시 확인해 주세요.',
        },
        {
            status: known ? error.status : 500,
            headers: { 'Cache-Control': 'no-store' },
        },
    );
}
