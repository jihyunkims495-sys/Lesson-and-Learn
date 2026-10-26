// Suspense: 아직 도착하지 않은 값을 기다리는 동안 대신 보여 줄 화면(fallback)을 정하는 리액트 컴포넌트
import { Suspense } from 'react';
// ProductDetail은 export default로 내보냈기 때문에 { } 없이 가져옴
import ProductDetail from '@/domains/products/components/ProductDetail';

{
    /*
params	주소의 [id] 값이 들어 있음. Next.js 16에서는 나중에 도착하는 값(Promise) 이라 바로 꺼낼 수 없음
PageProps<'/products/[id]'>	Next.js가 주소 모양에 맞춰 자동으로 만들어 주는 타입
<Suspense fallback=...>	값이 도착할 때까지 Loading...을 보여 줌. 이 프로젝트는 cacheComponents 설정이 켜져 있어서 필수
params.then(({ id }) => ...)	값이 도착하면 id를 꺼내 ProductDetail에 넘김
Number(id)	주소 값은 항상 글자('6')라서 숫자(6)로 바꿈
*/
}

/*
 * 페이지 컴포넌트: Next.js가 /products/[id] 주소로 들어오면 이 함수를 실행해 화면을 그림
 * (app 폴더 안의 page.tsx는 반드시 export default로 컴포넌트를 내보내야 함)
 *
 * ({ params }: ...)	페이지가 받는 값(props) 중 params만 구조 분해 할당으로 꺼냄
 * props	부모가 자식 컴포넌트에게 넘겨주는 값. 여기서는 Next.js가 부모 역할을 해서 params를 넘겨줌
 */
export default function ProductDetailPage({
    params,
}: PageProps<'/products/[id]'>) {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            {/*
            <ProductDetail id={Number(id)} />	자식 컴포넌트에 id라는 이름의 props를 넘김
                                            HTML 속성처럼 생겼지만, 받는 쪽(ProductDetail)에서는 함수의 매개변수로 받음
                                            → ProductDetail({ id }) 형태로 받아야 함 (가이드 11번 ②)
            */}
            {params.then(({ id }) => (
                <ProductDetail key={id} id={Number(id)} />
            ))}
        </Suspense>
    );
}
