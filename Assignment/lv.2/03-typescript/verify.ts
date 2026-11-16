interface Identifiable { id: number; }
type UserRole = 'admin' | 'customer' | 'guest';
interface User extends Identifiable { name: string; email: string; role: UserRole; isActive: boolean; }
type Category = 'electronics' | 'clothing' | 'books';
interface Product extends Identifiable { title: string; price: number; category: Category; stock: number; discountRate?: number; }
const users: User[] = [
 {id:1,name:'Kim',email:'kim@example.com',role:'admin',isActive:true},
 {id:2,name:'Lee',email:'lee@example.com',role:'customer',isActive:true},
 {id:3,name:'Park',email:'park@example.com',role:'guest',isActive:false}
];
const products: Product[] = [
 {id:1,title:'Slacks',price:40000,category:'clothing',stock:10,discountRate:0.1},
 {id:2,title:'Book',price:20000,category:'books',stock:4},
 {id:3,title:'Keyboard',price:50000,category:'electronics',stock:2,discountRate:0}
];
console.log('회원',users.length,'상품',products.length);
function filterUsersByRole(users: User[], targetRole: UserRole): User[] {
 return users.filter(user => user.role === targetRole);
}
function calculateTotalPrice(products: Product[]): number {
 return products.reduce((total, product) => {
  const rate = product.discountRate ?? 0;
  if (!Number.isFinite(rate) || rate<0 || rate>1 || !Number.isFinite(product.price) || product.price<0) throw new RangeError('잘못된 가격/할인율');
  return total + Math.round(product.price * (1-rate));
 }, 0);
}
console.log(filterUsersByRole(users,'customer'));
console.log('총액',calculateTotalPrice(products));
if(calculateTotalPrice(products)!==106000) throw new Error('가격 계산 실패');
if(calculateTotalPrice([])!==0) throw new Error('빈 배열 처리 실패');
console.log('금액 및 빈 배열 검증 통과');
function renderItemSummary(item: User | Product): string {
 if ('email' in item) return '[회원] '+item.name+' ('+item.role+')';
 return '[상품] '+item.title+' - '+item.price+'원';
}
class InMemoryStorage<T extends Identifiable> {
 private items: T[] = [];
 add(item: T): void {
  if(this.items.some(existing=>existing.id===item.id)) throw new Error('중복 ID');
  this.items.push({...item});
 }
 getById(id: number): T | undefined { const found=this.items.find(item=>item.id===id); return found ? {...found}:undefined; }
 getAll(): T[] { return this.items.map(item=>({...item})); }
 update(item: T): void {
  if(!this.items.some(existing=>existing.id===item.id)) throw new Error('없는 ID');
  this.items=this.items.map(existing=>existing.id===item.id?{...item}:existing);
 }
 delete(id: number): boolean { const before=this.items.length;this.items=this.items.filter(item=>item.id!==id);return this.items.length<before; }
}
const userStorage=new InMemoryStorage<User>();
const productStorage=new InMemoryStorage<Product>();
users.forEach(user=>userStorage.add(user));products.forEach(product=>productStorage.add(product));
console.log(userStorage.getById(1));console.log(productStorage.getAll());
console.log(renderItemSummary(users[0]));console.log(renderItemSummary(products[0]));
if(userStorage.getById(999)!==undefined) throw new Error('미존재 ID 오류');
const copy=userStorage.getAll();copy[0].name='changed';
if(userStorage.getById(1)?.name==='changed') throw new Error('저장소 참조 노출');
try {userStorage.add(users[0]);throw new Error('중복 검증 실패');} catch(e: unknown) {if(!(e instanceof Error)||e.message!=='중복 ID')throw e;}
console.log('타입 가드 양 분기, 미존재 ID, 복사 반환, 중복 검증 통과');
// 할인율 미입력, 0%, 100%와 빈 결과를 각각 검증합니다.
const plain: Product = { id: 10, title: 'Plain', price: 10000, category: 'clothing', stock: 0 };
if (calculateTotalPrice([plain]) !== 10000) throw new Error('정가 처리 실패');
if (calculateTotalPrice([{ ...plain, discountRate: 0 }]) !== 10000) throw new Error('0% 할인 처리 실패');
if (calculateTotalPrice([{ ...plain, discountRate: 1 }]) !== 0) throw new Error('100% 할인 처리 실패');
if (filterUsersByRole([], 'admin').length !== 0) throw new Error('빈 회원 목록 처리 실패');
for (const rate of [-0.1, 1.1, Number.NaN]) {
 let rejected = false;
 try { calculateTotalPrice([{ ...plain, discountRate: rate }]); }
 catch (error: unknown) { rejected = error instanceof RangeError; }
 if (!rejected) throw new Error('잘못된 할인율이 통과함');
}
console.log('PASS: 할인율 미입력 / 0% / 100% / 빈 목록 / 잘못된 할인율 3종');
// 추가 시 복사, 조회 시 복사, 수정과 삭제까지 같은 제네릭 클래스를 재사용합니다.
const added: User = { id: 99, name: 'Original', email: 'test@example.com', role: 'customer', isActive: true };
userStorage.add(added);
added.name = 'Outside change';
if (userStorage.getById(99)?.name !== 'Original') throw new Error('add 참조 노출');
const single = userStorage.getById(99);
if (!single) throw new Error('조회 실패');
single.name = 'Changed copy';
if (userStorage.getById(99)?.name !== 'Original') throw new Error('getById 참조 노출');
userStorage.update({ ...single, name: 'Updated' });
if (userStorage.getById(99)?.name !== 'Updated') throw new Error('수정 실패');
if (!userStorage.delete(99) || userStorage.delete(99)) throw new Error('삭제 결과 오류');
if (userStorage.getById(99) !== undefined) throw new Error('삭제 후 조회 오류');
let missingRejected = false;
try { userStorage.update(added); } catch (error: unknown) { missingRejected = error instanceof Error && error.message === '없는 ID'; }
if (!missingRejected) throw new Error('없는 항목 수정이 허용됨');
const summaries: string[] = [...users, ...products].map(renderItemSummary);
console.log(summaries.join('\n'));
console.log('PASS: 추가·단건조회 복사 보호 / 수정 / 삭제 / 없는 항목 수정 거절 / 모든 User·Product 분기');
