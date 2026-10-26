import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateLoginForm } from './validateLoginForm';

describe('validateLoginForm 유틸리티 함수 테스트', () => {
    it('이메일과 비밀번호가 비어 있으면 두 필드 모두 오류를 반환해야 한다.', () => {
        const errors = validateLoginForm({ email: '', password: '' });
        assert.strictEqual(errors.email, 'Please enter your email.');
        assert.strictEqual(errors.password, 'Please enter your password.');
    });

    it('공백만 입력된 이메일은 빈 값으로 처리해야 한다.', () => {
        const errors = validateLoginForm({ email: '   ', password: 'pw' });
        assert.strictEqual(errors.email, 'Please enter your email.');
    });

    it('이메일 형식이 잘못되면 형식 오류를 반환해야 한다.', () => {
        const errors = validateLoginForm({
            email: 'user@invalid',
            password: 'pw',
        });
        assert.strictEqual(errors.email, 'Please enter a valid email address.');
    });

    it('올바른 값이면 오류가 없어야 한다.', () => {
        const errors = validateLoginForm({
            email: 'user@onepiece.com',
            password: 'pw',
        });
        assert.deepStrictEqual(errors, {});
    });
});
