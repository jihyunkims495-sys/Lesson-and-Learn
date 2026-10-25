export interface CartItem {
    id: number;
    cartId: number;
    productVariantId: number;
    quantity: number;
    unitPriceAtAdded: number;
    productNameAtAdded: string;
    optionTextAtAdded: string | null;
    // 고정 주소 이미지(예: public 폴더의 /images/cart/...)에만 사용한다.
    imageUrlAtAdded: string | null;
    // Supabase product-images 버킷 안의 파일 경로. 서명 URL은 1시간 뒤 만료되므로
    // URL 대신 경로를 저장하고, 화면에 보여 줄 때마다 URL을 새로 받는다 (useCartImageUrls).
    // 예전에 저장된 장바구니에는 없을 수 있어 선택 속성으로 둔다.
    imageStoragePathAtAdded?: string | null;
}
