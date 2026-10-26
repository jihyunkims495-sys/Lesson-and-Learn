'use client';

import Script from 'next/script';
import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type RefObject,
} from 'react';

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/shared/components/ui/dialog';

interface AddressSelection {
    postalCode: string;
    address: string;
}

interface PostcodeData {
    zonecode: string;
    userSelectedType: string;
    roadAddress: string;
    jibunAddress: string;
    address: string;
}

type PostcodeWindow = Window & {
    kakao?: {
        Postcode: new (options: {
            oncomplete: (data: PostcodeData) => void;
            width: string;
            height: string;
        }) => {
            embed: (
                container: HTMLElement,
                options: { autoClose: boolean },
            ) => void;
        };
    };
};

function PostcodeSearch({
    onSelect,
}: {
    onSelect: (selection: AddressSelection) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        const container = containerRef.current;
        const Postcode = (window as PostcodeWindow).kakao?.Postcode;
        if (!ready || !container || !Postcode) return;

        new Postcode({
            oncomplete: (data) =>
                onSelect({
                    postalCode: data.zonecode,
                    address:
                        (data.userSelectedType === 'R'
                            ? data.roadAddress
                            : data.jibunAddress) || data.address,
                }),
            width: '100%',
            height: '100%',
        }).embed(container, { autoClose: true });

        return () => container.replaceChildren();
    }, [ready, onSelect]);

    return (
        <>
            <Script
                src="https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
                strategy="afterInteractive"
                onReady={() => setReady(true)}
                onError={() => setFailed(true)}
            />
            {!ready && (
                <p
                    role="status"
                    className="text-xs leading-relaxed text-gray-500"
                >
                    {failed
                        ? '주소 검색을 불러오지 못했습니다. 창을 닫고 주소를 직접 입력해 주세요.'
                        : '주소 검색을 불러오는 중입니다…'}
                </p>
            )}
            <div
                ref={containerRef}
                className={ready ? 'h-[min(480px,60dvh)] w-full' : 'hidden'}
            />
        </>
    );
}

export default function AddressSearch({
    onSelect,
    finalFocus,
}: {
    onSelect: (selection: AddressSelection) => void;
    finalFocus: RefObject<HTMLInputElement | null>;
}) {
    const [open, setOpen] = useState(false);
    const selectRef = useRef(onSelect);
    useEffect(() => {
        selectRef.current = onSelect;
    }, [onSelect]);
    const handleSelect = useCallback((selection: AddressSelection) => {
        selectRef.current(selection);
        setOpen(false);
    }, []);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                type="button"
                className="min-h-11 cursor-pointer rounded-lg border border-gray-200 px-3 text-[10px] tracking-wide hover:border-black sm:px-4"
            >
                주소 검색
            </DialogTrigger>
            <DialogContent
                lang="ko"
                showCloseButton={false}
                finalFocus={finalFocus}
                className="rounded-xl bg-white p-5 sm:max-w-[520px]"
            >
                <DialogTitle className="pr-7 text-xs tracking-widest">
                    주소 검색
                </DialogTitle>
                <DialogClose
                    type="button"
                    aria-label="주소 검색 닫기"
                    className="absolute top-3 right-4 cursor-pointer p-1 text-xs text-gray-500 hover:text-black"
                >
                    닫기
                </DialogClose>
                <DialogDescription className="text-xs">
                    도로명이나 지번으로 주소를 검색해 주세요. 배송지 입력란에
                    직접 입력할 수도 있습니다.
                </DialogDescription>
                {open && <PostcodeSearch onSelect={handleSelect} />}
            </DialogContent>
        </Dialog>
    );
}
