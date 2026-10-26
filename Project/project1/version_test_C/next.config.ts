import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? [
                  {
                      protocol: 'https',
                      hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
                          .hostname,
                      port: '',
                      pathname: '/storage/v1/object/sign/product-images/**',
                      // 서명 token이 달라지므로 search는 지정하지 않습니다.
                  },
              ]
            : [],
    },
    /* config options here */
    experimental: {
        agentFeedback: true,
    },
    cacheComponents: true,
    partialPrefetching: true,
    turbopack: {
        rules: {
            '*.css': {
                // Preserve native CSS Module exports instead of treating them as global CSS.
                condition: { not: { path: '*.module.css' } },
                loaders: ['@tailwindcss/turbopack'],
                as: '*.css',
            },
        },
    },
};

export default nextConfig;
