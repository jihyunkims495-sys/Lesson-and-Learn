import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
    validateCheckoutItems,
    validateShipping,
    validateConfirmation,
    verifyApprovedPayment,
} from './testPaymentValidation';

const shipping = {
    recipientName: '테스트',
    recipientPhone: '010-1234-5678',
    postalCode: '04524',
    addressLine1: '테스트 주소',
};
const item = { productVariantId: 1, quantity: 2 };
const confirmation = {
    orderId: 'test_12345678-1234-1234-1234-123456789abc',
    paymentKey: 'test_payment_key',
    amount: 378000,
};
const payment = {
    ...confirmation,
    totalAmount: confirmation.amount,
    currency: 'KRW',
    status: 'DONE',
    method: '카드',
    balanceAmount: confirmation.amount,
    lastTransactionKey: 'transaction_test',
    requestedAt: '2026-10-22T11:59:00+09:00',
    approvedAt: '2026-10-22T12:00:00+09:00',
};

describe('토스 테스트 결제 검증', () => {
    it('브라우저가 보낸 가격·상품명을 제거하고 옵션과 수량만 사용한다', () => {
        assert.deepEqual(
            validateCheckoutItems([{ ...item, unitPrice: 1, name: '변조' }]),
            [item],
        );
    });
    it('잘못된 옵션 ID, 중복 옵션과 범위 밖 수량을 거부한다', () => {
        for (const items of [
            [],
            [{ ...item, productVariantId: -1 }],
            [item, item],
            [{ ...item, quantity: 0 }],
            [{ ...item, quantity: -1 }],
            [{ ...item, quantity: 1.5 }],
            [{ ...item, quantity: 100 }],
        ]) {
            assert.throws(() => validateCheckoutItems(items));
        }
    });
    it('배송지 공백을 정리하고 필수 값·전화번호·우편번호를 검증한다', () => {
        assert.equal(
            validateShipping({ ...shipping, recipientName: ' 테스트 ' })
                .recipientName,
            '테스트',
        );
        for (const change of [
            { recipientName: '  ' },
            { postalCode: '1234' },
            { recipientPhone: 'hello' },
            { addressLine1: '' },
        ]) {
            assert.throws(() => validateShipping({ ...shipping, ...change }));
        }
    });
    it('승인 요청의 금액·결제 키·주문번호 형식을 검증한다', () => {
        assert.deepEqual(validateConfirmation(confirmation), confirmation);
        for (const change of [
            { amount: '378000' },
            { amount: -1 },
            { amount: 1.5 },
            { orderId: '../../file' },
            { paymentKey: '' },
        ]) {
            assert.throws(() =>
                validateConfirmation({ ...confirmation, ...change }),
            );
        }
    });
    it('DONE 상태와 일치하는 주문번호·금액·통화·결제 키가 있어야 승인 결과를 받아들인다', () => {
        assert.deepEqual(verifyApprovedPayment(payment, confirmation), {
            method: '카드',
            approvedAt: payment.approvedAt,
            requestedAt: payment.requestedAt,
            transactionKey: payment.lastTransactionKey,
            balanceAmount: payment.balanceAmount,
            receiptUrl: null,
            approvalNumber: null,
        });
        for (const change of [
            { status: 'WAITING_FOR_DEPOSIT' },
            { status: 'CANCELED' },
            { totalAmount: 1 },
            { currency: 'USD' },
            { orderId: 'other_order' },
            { paymentKey: 'other_key' },
            { approvedAt: 'invalid' },
            { lastTransactionKey: null },
            { balanceAmount: 0 },
            { requestedAt: null },
        ]) {
            assert.throws(() =>
                verifyApprovedPayment({ ...payment, ...change }, confirmation),
            );
        }
    });
});
