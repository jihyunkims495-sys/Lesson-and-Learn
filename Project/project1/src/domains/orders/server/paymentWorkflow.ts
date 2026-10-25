import type { TestPaymentItem, TestPaymentReceipt } from '../types/order.types';
import {
    PaymentError,
    validateConfirmation,
    verifyApprovedPayment,
} from './testPaymentValidation';

export interface StoredPayment {
    orderId: string;
    orderNumber: string;
    orderName: string;
    amount: number;
    status: string;
    paymentKey: string | null;
    confirmIdempotencyKey: string;
    customerName: string;
    items: TestPaymentItem[];
    method: string | null;
    approvedAt: string | null;
}

export interface PaymentStore {
    bind(
        userId: string,
        input: ReturnType<typeof validateConfirmation>,
    ): Promise<StoredPayment>;
    complete(
        userId: string,
        input: ReturnType<typeof validateConfirmation>,
        approval: ReturnType<typeof verifyApprovedPayment>,
    ): Promise<StoredPayment>;
}

export interface PaymentProvider {
    confirm(
        input: ReturnType<typeof validateConfirmation>,
        idempotencyKey: string,
    ): Promise<unknown>;
    get(paymentKey: string): Promise<unknown>;
}

function receipt(payment: StoredPayment): TestPaymentReceipt {
    if (payment.status !== 'DONE' || !payment.method || !payment.approvedAt) {
        throw new PaymentError(
            'PAYMENT_NOT_APPROVED',
            '결제 승인을 확인하지 못했습니다. 다시 확인해 주세요.',
            409,
        );
    }
    return {
        orderId: payment.orderId,
        orderNumber: payment.orderNumber,
        orderName: payment.orderName,
        amount: payment.amount,
        method: payment.method,
        approvedAt: payment.approvedAt,
        items: payment.items,
        testMode: true,
    };
}

export async function confirmStoredPayment(
    body: unknown,
    userId: string,
    store: PaymentStore,
    provider: PaymentProvider,
) {
    const input = validateConfirmation(body);
    // DB binds a key atomically after verifying owner, price and current state.
    const order = await store.bind(userId, input);
    if (order.status === 'DONE') return receipt(order);
    let payment: unknown;
    try {
        payment = await provider.confirm(input, order.confirmIdempotencyKey);
    } catch (approvalError) {
        try {
            payment = await provider.get(input.paymentKey);
        } catch {
            throw approvalError;
        }
    }
    const approved = verifyApprovedPayment(payment, input);
    // A persistence failure after Toss approval returns an error. A retry recovers
    // the same Toss payment and commits the payment and ledger together.
    return receipt(await store.complete(userId, input, approved));
}
