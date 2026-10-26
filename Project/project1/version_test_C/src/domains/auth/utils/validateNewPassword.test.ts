import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    PASSWORD_POLICY_MESSAGE,
    validateNewPassword,
} from './validateNewPassword';

describe('validateNewPassword 유틸리티 함수 테스트', () => {
    it('두 값이 비어 있으면 두 필드 모두 오류를 반환해야 한다.', () => {
        const errors = validateNewPassword({
            password: '',
            passwordConfirm: '',
        });
        assert.strictEqual(errors.password, 'Please enter a new password.');
        assert.strictEqual(
            errors.passwordConfirm,
            'Please confirm your new password.',
        );
    });

    it('8자 미만이거나 영문·숫자가 섞이지 않으면 정책 오류를 반환해야 한다.', () => {
        for (const password of ['abc123', 'abcdefgh', '12345678']) {
            const errors = validateNewPassword({
                password,
                passwordConfirm: password,
            });
            assert.strictEqual(errors.password, PASSWORD_POLICY_MESSAGE);
        }
    });

    it('확인 값이 다르면 불일치 오류를 반환해야 한다.', () => {
        const errors = validateNewPassword({
            password: 'onepiece123',
            passwordConfirm: 'onepiece124',
        });
        assert.strictEqual(errors.passwordConfirm, 'Passwords do not match.');
    });

    it('정책을 만족하고 두 값이 같으면 오류가 없어야 한다.', () => {
        const errors = validateNewPassword({
            password: 'onepiece123',
            passwordConfirm: 'onepiece123',
        });
        assert.deepStrictEqual(errors, {});
    });
});
