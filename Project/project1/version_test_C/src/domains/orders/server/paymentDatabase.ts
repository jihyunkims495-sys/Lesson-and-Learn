import 'server-only';

import { getSupabaseRouteClient } from '@/shared/lib/supabase/server';
import { PaymentError } from './testPaymentValidation';
import type { StoredPayment } from './paymentWorkflow';

export async function requirePaymentUser() {
    const client = await getSupabaseRouteClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user)
        throw new PaymentError(
            'LOGIN_REQUIRED',
            '주문과 결제 내역을 저장하려면 먼저 로그인해 주세요.',
            401,
        );
    return data.user;
}

const databaseErrors: Record<string, [string, number]> = {
    LOGIN_REQUIRED: ['로그인 후 다시 시도해 주세요.', 401],
    ORDER_NOT_FOUND: ['이 계정의 주문을 찾을 수 없습니다.', 404],
    AMOUNT_CHANGED: [
        '상품 금액이 변경되었습니다. 장바구니를 확인해 주세요.',
        409,
    ],
    AMOUNT_MISMATCH: ['주문 금액과 결제 금액이 일치하지 않습니다.', 409],
    PAYMENT_KEY_MISMATCH: ['주문의 결제 정보가 일치하지 않습니다.', 409],
    PAYMENT_STATE_INVALID: ['현재 주문 상태에서는 승인할 수 없습니다.', 409],
    ORDER_EXPIRED: ['주문이 만료되었습니다. 주문을 다시 시작해 주세요.', 409],
    CHECKOUT_CHANGED: [
        '주문 정보가 변경되었습니다. 주문을 다시 시작해 주세요.',
        409,
    ],
    PRODUCT_UNAVAILABLE: [
        '주문할 수 없는 상품 옵션이 있습니다. 장바구니를 확인해 주세요.',
        409,
    ],
    INVALID_CART: ['상품 옵션과 수량을 확인해 주세요.', 400],
    INVALID_SHIPPING: ['배송지 정보를 확인해 주세요.', 400],
    INVALID_PAYMENT: ['결제 정보를 확인해 주세요.', 400],
};

export async function paymentRpc(
    name: string,
    args: Record<string, unknown>,
): Promise<StoredPayment> {
    // 로그인 회원의 세션으로 호출합니다. DB 함수가 auth.uid()로 회원을 확인합니다.
    const client = await getSupabaseRouteClient();
    const { data, error } = await client.rpc(name, args);
    if (error) {
        const known = databaseErrors[error.message];
        if (known) throw new PaymentError(error.message, ...known);
        if (error.code === 'PGRST202')
            throw new PaymentError(
                'PAYMENT_SCHEMA_REQUIRED',
                'Supabase 결제 마이그레이션을 적용해 주세요.',
                503,
            );
        throw new PaymentError(
            'PAYMENT_SAVE_FAILED',
            '주문·결제 내역을 저장하지 못했습니다. 승인 상태를 다시 확인해 주세요.',
            503,
        );
    }
    return data as StoredPayment;
}
