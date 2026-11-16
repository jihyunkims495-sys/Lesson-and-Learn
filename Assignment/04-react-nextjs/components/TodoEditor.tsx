"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Todo } from "../lib/types";
import { browserClient } from "../lib/supabase";
export default function TodoEditor({ todo }: { todo: Todo }) {
  const [title, setTitle] = useState(todo.title);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        setBusy(true);
        setError("");
        try {
          const { error } = await browserClient()
            .from("practice_todos")
            .update({ title: title.trim() })
            .eq("id", todo.id)
            .eq("user_id", todo.user_id)
            .select()
            .single();
          if (error) throw error;
          router.push("/todos");
          router.refresh();
        } catch {
          setError("수정 실패");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        할 일
        <input
          value={title}
          maxLength={120}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>
      <button disabled={busy}>저장</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
