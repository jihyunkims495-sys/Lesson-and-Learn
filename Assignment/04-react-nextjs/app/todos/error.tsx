"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ErrorView({ reset }: { reset: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function retry() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <>
      <p role="alert">요청 처리에 실패했습니다.</p>
      <button onClick={retry} disabled={isPending}>
        {isPending ? "다시 불러오는 중…" : "다시 시도"}
      </button>
    </>
  );
}
