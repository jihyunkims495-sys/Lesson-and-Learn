// 의도한 오류가 타입 검사에서 실제로 거절되는지 확인. 실행용 파일이 아니다.
// @ts-expect-error: 허용된 세 권한 외 문자열은 지정할 수 없다.
const invalidRole: UserRole = 'manager';
// @ts-expect-error: 상품 가격은 문자열이 아닌 숫자이다.
const invalidPrice: Product = { id: 1, title: 'Book', price: '10000', category: 'books', stock: 1 };
// @ts-expect-error: 공통 id가 없는 자료는 저장소 제약을 충족하지 못한다.
const invalidStorage = new InMemoryStorage<{ title: string }>();
// @ts-expect-error: User 저장소에는 Product를 추가할 수 없다.
userStorage.add(products[0]);
