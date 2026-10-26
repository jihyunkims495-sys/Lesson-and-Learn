import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    confirmStoredPayment,
    type PaymentStore,
    type StoredPayment,
} from './paymentWorkflow';

const input = {
    orderId: 'test_12345678-1234-1234-1234-123456789abc',
    paymentKey: 'test_payment_key',
    amount: 114460,
};
const approved = {
    ...input,
    totalAmount: input.amount,
    balanceAmount: input.amount,
    currency: 'KRW',
    status: 'DONE',
    method: '카드',
    approvedAt: '2026-10-22T12:00:00+09:00',
    requestedAt: '2026-10-22T11:59:00+09:00',
    lastTransactionKey: 'test_transaction',
};
function fixture() {
    let saved: StoredPayment = {
        orderId: input.orderId,
        orderNumber: '20261022-test',
        orderName: '블랙 집업 자켓',
        amount: input.amount,
        status: 'IN_PROGRESS',
        paymentKey: input.paymentKey,
        confirmIdempotencyKey: 'stable-key',
        customerName: '테스트',
        items: [],
        method: null,
        approvedAt: null,
    };
    let writes = 0;
    const store: PaymentStore = {
        bind: async (uid, request) => {
            assert.equal(uid, 'owner');
            assert.equal(request.amount, input.amount);
            assert.equal(request.paymentKey, input.paymentKey);
            return saved;
        },
        complete: async (_uid, _input, approval) => {
            writes++;
            saved = {
                ...saved,
                status: 'DONE',
                method: approval.method,
                approvedAt: approval.approvedAt,
            };
            return saved;
        },
    };
    return { store, writes: () => writes };
}

describe('DB 결제 승인 흐름', () => {
    it('저장된 멱등키로 승인하고 DB 저장이 끝난 뒤에만 완료를 반환한다', async () => {
        const f = fixture();
        let calls = 0;
        const provider = {
            confirm: async (request: typeof input, key: string) => {
                calls++;
                assert.deepEqual(request, input);
                assert.equal(key, 'stable-key');
                return approved;
            },
            get: async () => {
                throw new Error('unexpected lookup');
            },
        };
        const result = await confirmStoredPayment(
            input,
            'owner',
            f.store,
            provider,
        );
        assert.equal(result.orderNumber, '20261022-test');
        assert.equal(f.writes(), 1);
        await confirmStoredPayment(input, 'owner', f.store, provider);
        assert.equal(calls, 1);
        assert.equal(f.writes(), 1);
    });
    it('소유권·금액 검증이 실패하면 토스 API를 호출하지 않는다', async () => {
        let calls = 0;
        const f = fixture();
        await assert.rejects(
            confirmStoredPayment(input, 'other', f.store, {
                confirm: async () => {
                    calls++;
                    return approved;
                },
                get: async () => approved,
            }),
        );
        assert.equal(calls, 0);
        assert.equal(f.writes(), 0);
    });
    it('승인 응답이 유실되면 실제 조회 결과로 저장을 복구한다', async () => {
        const f = fixture();
        const result = await confirmStoredPayment(input, 'owner', f.store, {
            confirm: async () => {
                throw new Error('timeout');
            },
            get: async (key) => {
                assert.equal(key, input.paymentKey);
                return approved;
            },
        });
        assert.equal(result.amount, input.amount);
        assert.equal(f.writes(), 1);
    });
    it('금액이나 상태가 다른 토스 응답은 저장하지 않는다', async () => {
        for (const change of [
            { status: 'IN_PROGRESS' },
            { totalAmount: 1 },
            { paymentKey: 'other' },
            { lastTransactionKey: null },
        ]) {
            const f = fixture();
            await assert.rejects(
                confirmStoredPayment(input, 'owner', f.store, {
                    confirm: async () => ({ ...approved, ...change }),
                    get: async () => approved,
                }),
            );
            assert.equal(f.writes(), 0);
        }
    });
    it('토스 승인 뒤 DB 저장이 실패하면 완료로 표시하지 않고 재시도로 복구한다', async () => {
        const f = fixture();
        const complete = f.store.complete;
        f.store.complete = async () => {
            throw new Error('database unavailable');
        };
        await assert.rejects(
            confirmStoredPayment(input, 'owner', f.store, {
                confirm: async () => approved,
                get: async () => approved,
            }),
        );
        f.store.complete = complete;
        const result = await confirmStoredPayment(input, 'owner', f.store, {
            confirm: async () => {
                throw new Error('already processed');
            },
            get: async () => approved,
        });
        assert.equal(result.testMode, true);
        assert.equal(f.writes(), 1);
    });
});
