'use client';

import { useState, useSyncExternalStore, type PointerEvent } from 'react';
import Image from 'next/image';
import styles from './CampaignHero.module.scss';

const VIDEO_SRC = '/campaign/campaign-video.mp4';
const POSTER_SRC = '/campaign/campaign-poster.jpg';
const LOGO_SRC = '/campaign/onepiece-logo.svg'; // 원본 1302×287, 흰색 로고 + 투명 배경
const PRODUCTS_PATH = '/products';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// 움직임 줄이기 설정이 바뀌면 다시 계산하도록 구독합니다.
function subscribeReducedMotion(onChange: () => void) {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
}

// 움직임 줄이기 / 데이터 절약 모드에서는 영상 없이 사진만 보여줍니다.
function getCanPlayVideo() {
    const saveData = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;
    return !window.matchMedia(REDUCED_MOTION_QUERY).matches && !saveData;
}

// 서버 렌더링에서는 사진만 그립니다.
function getServerCanPlayVideo() {
    return false;
}

export function CampaignHero() {
    const [videoFailed, setVideoFailed] = useState(false);
    const canPlayVideo = useSyncExternalStore(
        subscribeReducedMotion,
        getCanPlayVideo,
        getServerCanPlayVideo,
    );
    // 영상 재생에 실패하면 깔아 둔 사진이 그대로 보입니다.
    const showVideo = canPlayVideo && !videoFailed;

    // 마우스 위치를 CSS 변수로 넘기면, CSS가 가이드선을 움직입니다.
    function handlePointerMove(e: PointerEvent<HTMLElement>) {
        const { left, top } = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty('--x', `${e.clientX - left}px`);
        e.currentTarget.style.setProperty('--y', `${e.clientY - top}px`);
    }

    return (
        <main
            className={styles.campaign}
            aria-label="ONEPIECE 캠페인"
            onPointerMove={handlePointerMove}
        >
            {/* 사진은 항상 깔아 두고, 영상이 재생되지 않을 때도 사진이 보입니다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                className={styles.media}
                src={POSTER_SRC}
                alt="강변 건축물을 배경으로 검은 의상을 착용한 ONEPIECE 캠페인 모델"
                fetchPriority="high"
            />
            {showVideo && (
                <video
                    className={styles.media}
                    src={VIDEO_SRC}
                    poster={POSTER_SRC}
                    autoPlay
                    muted
                    loop
                    playsInline
                    aria-hidden="true"
                    tabIndex={-1}
                    onError={() => setVideoFailed(true)}
                />
            )}
            <div className={styles.shade} aria-hidden="true" />
            <a
                className={styles.modelLink}
                href={PRODUCTS_PATH}
                aria-label="캠페인 상품 보기"
            />
            <section className={styles.discovery} aria-labelledby="brand-title">
                {/* SVG는 Next.js가 자동으로 최적화 없이(unoptimized) 그대로 내려 줍니다. 크기는 CSS가 화면에 맞춰 조정합니다. */}
                <h1 id="brand-title">
                    <Image
                        className={styles.logo}
                        src={LOGO_SRC}
                        alt="OnePiece"
                        width={1302}
                        height={287}
                        preload
                    />
                </h1>
                <div className={styles.sloganBox}>
                    <p className={styles.slogan}>ONEPIECE IS MASTER-PIECE.</p>
                </div>
            </section>
            <div className={styles.crosslines} aria-hidden="true">
                <div className={styles.horizontal} />
                <div className={styles.vertical} />
            </div>
        </main>
    );
}
