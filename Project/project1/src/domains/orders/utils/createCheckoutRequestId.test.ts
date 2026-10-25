import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { describe, it } from 'node:test';
import { createCheckoutRequestId } from './createCheckoutRequestId';

// 서버(testPayment.ts)가 결제 요청 번호를 검사하는 형식과 같습니다.
const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('결제 요청 번호 생성', () => {
    it('randomUUID가 있으면 그대로 사용한다', () => {
        assert.equal(
            createCheckoutRequestId({
                randomUUID: () => '11111111-1111-4111-8111-111111111111',
            }),
            '11111111-1111-4111-8111-111111111111',
        );
    });

    it('HTTP처럼 randomUUID가 없으면 getRandomValues로 UUID v4를 만든다', () => {
        const source = {
            getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
        };
        const ids = new Set(
            Array.from({ length: 50 }, () => createCheckoutRequestId(source)),
        );
        assert.equal(ids.size, 50);
        for (const id of ids) assert.match(id, UUID_V4);
    });

    it('난수 기능이 모두 없으면 결제를 시작하지 않는다', () => {
        assert.throws(
            () => createCheckoutRequestId({}),
            /현재 브라우저에서는 결제를 시작할 수 없습니다/,
        );
    });
});
