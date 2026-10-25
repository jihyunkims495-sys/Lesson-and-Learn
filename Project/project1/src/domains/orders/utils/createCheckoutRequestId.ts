type RandomSource = Partial<Pick<Crypto, 'randomUUID' | 'getRandomValues'>>;

// 결제 요청 번호(멱등키)를 UUID v4 형식으로 만듭니다. 서버가 이 형식만 받습니다.
// crypto.randomUUID()는 HTTPS·localhost에서만 있어서, HTTP로 연 서버에서는
// 어디서나 쓸 수 있는 crypto.getRandomValues()로 같은 형식을 만듭니다.
export function createCheckoutRequestId(
    source: RandomSource | undefined = globalThis.crypto,
): string {
    if (typeof source?.randomUUID === 'function') return source.randomUUID();
    if (typeof source?.getRandomValues !== 'function')
        throw new Error('현재 브라우저에서는 결제를 시작할 수 없습니다.');
    const bytes = source.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // 버전 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 변형
    const hex = Array.from(bytes, (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
