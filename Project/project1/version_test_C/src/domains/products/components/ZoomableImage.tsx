/*
 * 클릭 확대 + 드래그 이동 이미지 칸
 *
 * 동작
 * - 클릭: 칸 크기는 그대로 두고, 누른 지점을 중심으로 이미지만 2.5배 확대
 * - 확대 상태에서 드래그: 칸 안에서 이미지를 움직여 다른 부분을 볼 수 있음
 * - 확대 상태에서 그냥 클릭 또는 Esc: 원래 크기로 돌아감
 *
 * 원리
 * - 바깥 칸(button)은 overflow-hidden으로 칸 밖으로 넘친 부분을 가림
 * - 안쪽 이미지(img)는 CSS transform의 scale(확대)과 translate(이동)로만 움직임
 *
 * 'use client': 클릭·드래그 이벤트와 상태(useState)를 쓰므로 브라우저에서 실행되어야 함
 */
'use client';

// useRef: 화면을 다시 그리지 않고 값을 기억해 두는 상자 / useState: 바뀌면 화면을 다시 그리는 상태
import { useRef, useState } from 'react';
// cn: 여러 className을 합치고, 조건에 따라 클래스를 붙였다 뗐다 하는 팀 공용 함수
import { cn } from '@/shared/utils/cn';

// 확대 배율 (2.5배). 이 숫자만 바꾸면 확대 정도가 바뀜
const ZOOM_SCALE = 2.5;
// 이 거리(px)보다 적게 움직이면 드래그가 아니라 클릭으로 봄 (손 떨림으로 확대가 풀리는 것 방지)
const DRAG_THRESHOLD = 4;

// Offset: 이미지를 가로(x)·세로(y)로 얼마나 옮겼는지 나타내는 값의 모양 (단위 px)
type Offset = { x: number; y: number };

/*
 * 이 컴포넌트가 바깥에서 받는 값(props)의 모양
 *
 * src: 이미지 주소
 * alt: 이미지 설명 글 (이미지가 안 보일 때, 화면 낭독기가 읽을 때 사용)
 * className?: 칸 크기 등을 바깥에서 추가로 정할 때 사용 (안 넘겨도 됨)
 *        (갤러리용으로 만들었고, 갤러리를 없앤 지금은 쓰는 곳이 없음)
 */
type ZoomableImageProps = {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
};

export default function ZoomableImage({
    src,
    alt,
    className,
    fill = false,
}: ZoomableImageProps) {
    /*
     * useRef로 만든 "기억 상자" 3개 (값이 바뀌어도 화면을 다시 그리지 않음)
     *
     * frameRef: 바깥 칸(button) 요소 자체를 가리킴 → 칸의 너비·높이를 잴 때 사용
     * dragRef: 드래그 중일 때의 정보 (시작 마우스 위치, 시작할 때 이미지 위치, 실제로 움직였는지)
     *          드래그 중이 아니면 null
     * suppressClickRef: 방금 드래그를 끝냈는지 표시
     *          → 드래그를 끝내고 손을 떼면 브라우저가 click도 함께 보내는데,
     *            그 click 때문에 확대가 풀리지 않게 한 번 무시하기 위해 사용
     */
    const frameRef = useRef<HTMLButtonElement>(null);
    const dragRef = useRef<{
        startX: number;
        startY: number;
        startOffset: Offset;
        moved: boolean;
    } | null>(null);
    const suppressClickRef = useRef(false);

    /*
     * 상태(state) 3개 (바뀌면 화면을 다시 그림)
     *
     * zoomed: 확대 상태인지 (처음엔 false)
     * offset: 확대된 이미지를 옮긴 거리 (처음엔 0, 0)
     * dragging: 지금 드래그 중인지 → 드래그 중에는 애니메이션을 끄고, 커서를 쥔 손 모양으로 바꿈
     */
    const [zoomed, setZoomed] = useState(false);
    const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);

    /*
     * 이동 범위 제한 함수
     *
     * 이미지를 너무 멀리 끌면 칸 안에 빈 공간이 보이므로, 옮길 수 있는 최대 거리를 계산해 막음
     * - 칸 가운데를 기준으로 확대하면, 이미지는 좌우로 각각 (배율 - 1) × 칸 너비 ÷ 2 만큼 칸 밖으로 넘침
     * - 그 넘친 만큼까지만 옮길 수 있게 함 (세로도 같은 방식)
     * Math.max(-최대, 값): 최소값 제한 / Math.min(최대, 값): 최대값 제한
     */
    function clamp(next: Offset): Offset {
        const frame = frameRef.current;
        if (!frame) return next;
        const maxX = ((ZOOM_SCALE - 1) * frame.clientWidth) / 2;
        const maxY = ((ZOOM_SCALE - 1) * frame.clientHeight) / 2;
        return {
            x: Math.min(maxX, Math.max(-maxX, next.x)),
            y: Math.min(maxY, Math.max(-maxY, next.y)),
        };
    }

    /*
     * 클릭했을 때 실행되는 함수
     *
     * 1. 방금 드래그를 끝낸 거라면 이번 click은 무시하고 끝냄
     * 2. 이미 확대 상태면 → 원래 크기로 되돌리고 위치도 0으로
     * 3. 확대 상태가 아니면 → 누른 지점을 중심으로 확대
     */
    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
        if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
        }

        if (zoomed) {
            setZoomed(false);
            setOffset({ x: 0, y: 0 });
            return;
        }

        /*
         * 누른 지점이 확대 후에도 마우스 바로 아래에 오도록 이동 거리 계산
         *
         * getBoundingClientRect(): 칸의 화면상 위치와 크기를 알려 줌
         * fromCenterX/Y: 누른 지점이 칸 가운데에서 얼마나 떨어져 있는지
         * 확대하면 그 거리가 배율만큼 커지므로, 늘어난 만큼(배율 - 1배) 반대 방향으로 옮겨 제자리에 맞춤
         * event.detail === 0: 마우스가 아니라 키보드(Enter)로 누른 경우 → 가운데 기준으로 확대
         */
        const rect = event.currentTarget.getBoundingClientRect();
        const fromCenterX =
            event.detail === 0 ? 0 : event.clientX - rect.left - rect.width / 2;
        const fromCenterY =
            event.detail === 0 ? 0 : event.clientY - rect.top - rect.height / 2;
        setZoomed(true);
        setOffset(
            clamp({
                x: -(ZOOM_SCALE - 1) * fromCenterX,
                y: -(ZOOM_SCALE - 1) * fromCenterY,
            }),
        );
    }

    /*
     * 마우스(또는 손가락)를 누른 순간 실행되는 함수
     *
     * 확대 상태일 때만 드래그 준비: 누른 위치와 현재 이미지 위치를 기억해 둠
     * setPointerCapture: 드래그 중 마우스가 칸 밖으로 나가도 계속 이 칸이 움직임을 받도록 붙잡음
     */
    function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
        if (!zoomed) return;
        dragRef.current = {
            startX: event.clientX,
            startY: event.clientY,
            startOffset: offset,
            moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    /*
     * 누른 채로 움직일 때 실행되는 함수
     *
     * dx, dy: 처음 누른 위치에서 지금까지 움직인 거리
     * Math.hypot(dx, dy): 움직인 직선거리. 4px 미만이면 아직 클릭으로 보고 아무것도 안 함
     * 4px 이상 움직이면 드래그로 확정 → 시작 위치 + 움직인 거리만큼 이미지를 옮김 (범위 제한 적용)
     */
    function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
        const drag = dragRef.current;
        if (!drag) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

        drag.moved = true;
        setDragging(true);
        setOffset(
            clamp({ x: drag.startOffset.x + dx, y: drag.startOffset.y + dy }),
        );
    }

    /*
     * 손을 뗐을 때(또는 드래그가 취소됐을 때) 실행되는 함수
     *
     * 실제로 드래그했다면 → 곧이어 올 click을 무시하도록 표시
     * 드래그 정보를 지우고, 드래그 중 상태를 끔
     */
    function handlePointerUp() {
        const drag = dragRef.current;
        if (!drag) return;
        suppressClickRef.current = drag.moved;
        dragRef.current = null;
        setDragging(false);
    }

    // 키보드 Esc를 누르면 확대 해제
    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'Escape' && zoomed) {
            setZoomed(false);
            setOffset({ x: 0, y: 0 });
        }
    }

    return (
        /*
         * 바깥 칸: 클릭할 수 있는 요소라 button을 사용 (키보드 Tab·Enter로도 조작 가능)
         *
         * ref={frameRef}: 이 요소를 frameRef에 연결 → 칸 크기를 잴 수 있음
         * type="button": 폼 제출을 방지
         * aria-label: 화면 낭독기가 읽을 버튼 이름 (확대 상태에 따라 "확대"/"축소")
         * aria-pressed: 확대 상태인지 알려 줌
         * onPointerDown/Move/Up/Cancel: 누름·움직임·뗌·취소 때 각각 위 함수 실행
         *
         * relative: 안쪽 이미지 위치의 기준
         * block w-full: 박스 형태로 부모 너비 전체를 차지
         * overflow-hidden: 확대되어 칸 밖으로 넘친 이미지를 가림 (칸 크기 유지의 핵심)
         * bg-neutral-100: 이미지가 뜨기 전 연한 회색 배경
         * select-none: 드래그할 때 글자·이미지가 파랗게 선택되지 않게 함
         * (확대 상태) touch-none: 모바일에서 손가락 드래그가 페이지 스크롤 대신 이미지 이동으로 쓰이게 함
         * (확대 상태) cursor-grab / cursor-grabbing: 손바닥 / 쥔 손 모양 커서
         * (확대 전) cursor-zoom-in: 돋보기(+) 모양 커서
         * className: 바깥에서 넘긴 클래스를 마지막에 덧붙임
         */
        <button
            ref={frameRef}
            type="button"
            aria-label={zoomed ? `${alt} 축소` : `${alt} 확대`}
            aria-pressed={zoomed}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className={cn(
                'relative block w-full overflow-hidden bg-neutral-100 select-none',
                zoomed
                    ? 'touch-none ' +
                          (dragging ? 'cursor-grabbing' : 'cursor-grab')
                    : 'cursor-zoom-in',
                className,
            )}
        >
            {/*
             * 안쪽 이미지
             *
             * img 태그 사용 이유: next/image로 외부(picsum) 이미지를 쓰려면 next.config 설정이 필요함
             * 팀 설정 파일을 건드리지 않으려고 일반 img를 쓰고, ESLint 경고는 아래 주석으로 끔
             *
             * draggable={false}: 브라우저 기본 "이미지 끌어다 놓기" 기능을 끔 (우리가 만든 드래그와 충돌 방지)
             * pointer-events-none: 마우스 이벤트는 이미지가 아니라 바깥 칸(button)이 받게 함
             * block w-full: 칸 너비에 맞춰 표시
             * (fill일 때) h-full object-cover: 칸 높이까지 꽉 채우고 넘치는 부분은 잘라냄
             * (드래그 중이 아닐 때) transition-transform duration-300 ease-out:
             *     확대·축소가 0.3초 동안 부드럽게 움직임. 드래그 중에는 꺼서 마우스를 바로 따라오게 함
             *
             * style transform: 확대 상태일 때만 적용
             *   translate(x, y): offset만큼 이미지를 이동
             *   scale(2.5): 가운데를 기준으로 2.5배 확대
             */}
            {/* eslint-disable-next-line @next/next/no-img-element -- 외부 mock 이미지라 next.config 설정 없이 표시 */}
            <img
                src={src}
                alt={alt}
                draggable={false}
                className={cn(
                    'pointer-events-none block w-full',
                    fill && 'h-full object-cover',
                    !dragging && 'transition-transform duration-300 ease-out',
                )}
                style={{
                    transform: zoomed
                        ? `translate(${offset.x}px, ${offset.y}px) scale(${ZOOM_SCALE})`
                        : undefined,
                }}
            />
        </button>
    );
}
