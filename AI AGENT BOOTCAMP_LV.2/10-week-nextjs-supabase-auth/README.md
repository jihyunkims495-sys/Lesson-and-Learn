# Week 10 — Next.js & Supabase Auth

> 2026-10-19 시작 · LV.2

Next.js App Router의 클라이언트·서버 실행 경계를 구분하고, Server Action과 Supabase Auth를 연결해 회원가입 흐름을 구성하는 주차입니다.

## Learning goals

- Server Component와 Client Component의 역할 구분
- CSR, hydration, `'use client'`의 관계 이해
- Server Action을 통한 폼 제출과 서버 입력 검증
- Supabase 브라우저·서버 클라이언트의 책임 분리
- 인증, 세션 쿠키, RLS의 보안 계층 구분
- 환경변수 공개 범위와 배포 전 검증 절차 이해

## Daily learning log

| Date | Topic | Records |
|---|---|---|
| 2026-10-19 | Next.js 실행 경계와 Supabase 회원가입 | [Preview](./2026-10-19/01-preview-notes-01-nextjs-supabase-auth-deployment.md) · [Learning Notes](./2026-10-19/02-learning-notes-01-nextjs-auth-server-actions.md) |

## Evidence boundary

- 회원가입 폼의 입력 상태, 서버 검증, Supabase Auth 호출과 프로필 저장 코드 흐름을 구성했습니다.
- 개발 화면 렌더링과 정적 검사는 확인했습니다.
- 실제 회원가입 완료, 세션 유지, 사용자별 RLS 격리는 별도 검증이 필요합니다.

[← Level 2 curriculum](../README.md)
