'use client';

import { useEffect, useState } from 'react';
import { PRODUCT_IMAGE_URL_LIFETIME } from '@/domains/products/api/getProductCatalog';
import { PRODUCT_IMAGE_BUCKET } from '@/domains/products/api/getProductDetail';
import type { CartItem } from '@/domains/cart/types/cart.types';
import { cartImagePath } from '@/domains/cart/utils/cartImagePath';
import { getSupabaseClient } from '@/shared/lib/supabase/client';

type SignedImage = { url: string; expiresAt: number };

export default function useCartImageUrls(items: CartItem[]) {
    const [state, setState] = useState<{
        key: string;
        urls: Record<string, SignedImage>;
    }>({ key: '', urls: {} });
    const pathsKey = JSON.stringify(
        [
            ...new Set(
                items
                    .map((item) => cartImagePath(item))
                    .filter((path): path is string => Boolean(path)),
            ),
        ].sort(),
    );

    useEffect(() => {
        const paths = JSON.parse(pathsKey) as string[];
        if (!paths.length) return;
        let active = true;
        let signing = false;
        async function sign() {
            if (signing) return;
            signing = true;
            try {
                const supabase = getSupabaseClient();
                if (!supabase) throw new Error('Supabase is not configured');
                const { data, error } = await supabase.storage
                    .from(PRODUCT_IMAGE_BUCKET)
                    .createSignedUrls(paths, PRODUCT_IMAGE_URL_LIFETIME);
                if (error) throw error;
                if (!active) return;
                const urls: Record<string, SignedImage> = {};
                for (const image of data ?? []) {
                    if (!image.error && image.path && image.signedUrl)
                        urls[image.path] = {
                            url: image.signedUrl,
                            expiresAt:
                                Date.now() + PRODUCT_IMAGE_URL_LIFETIME * 1000,
                        };
                }
                setState({ key: pathsKey, urls });
            } catch {
                if (!active) return;
                setState((previous) => ({
                    key: pathsKey,
                    urls: Object.fromEntries(
                        Object.entries(previous.urls).filter(
                            ([path, image]) =>
                                paths.includes(path) &&
                                image.expiresAt > Date.now(),
                        ),
                    ),
                }));
            } finally {
                signing = false;
            }
        }
        const onVisible = () => {
            if (document.visibilityState === 'visible') void sign();
        };
        void sign();
        const interval = window.setInterval(
            () => void sign(),
            PRODUCT_IMAGE_URL_LIFETIME * 500,
        );
        window.addEventListener('focus', onVisible);
        window.addEventListener('online', onVisible);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            active = false;
            window.clearInterval(interval);
            window.removeEventListener('focus', onVisible);
            window.removeEventListener('online', onVisible);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [pathsKey]);

    function getImageUrl(item: CartItem): string | null {
        const path = cartImagePath(item);
        return path ? (state.urls[path]?.url ?? null) : item.imageUrlAtAdded;
    }
    function isImagePending(item: CartItem): boolean {
        return (
            Boolean(cartImagePath(item)) &&
            !getImageUrl(item) &&
            state.key !== pathsKey
        );
    }
    return { getImageUrl, isImagePending };
}
