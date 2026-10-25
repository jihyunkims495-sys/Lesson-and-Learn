// 장바구니가 어느 회원의 것인지 판단합니다.
// 비회원(null)이 담은 상품은 로그인 후에도 유지해 바로 주문할 수 있게 합니다.
// 로그아웃하거나 다른 회원으로 바뀌면 이전 회원의 장바구니를 비웁니다.
export function resolveCartOwner(
    currentOwnerId: string | null,
    nextUserId: string | null,
): { ownerId: string | null; clear: boolean } {
    return {
        ownerId: nextUserId,
        clear: currentOwnerId !== null && currentOwnerId !== nextUserId,
    };
}
