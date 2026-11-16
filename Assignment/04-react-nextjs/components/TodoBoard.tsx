"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../lib/supabase";
import type { Todo } from "../lib/types";
import TodoRow from "./TodoRow";
export default function TodoBoard({
  initialTodos,
  userId,
  initialError,
}: {
  initialTodos: Todo[];
  userId: string;
  initialError: string;
}) {
  const [todos, setTodos] = useState(initialTodos);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [filter, setFilter] = useState("all");
  const db = useMemo(() => browserClient(), []);
  const router = useRouter();
  useEffect(() => {
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, [db, router]);
  async function mutate(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch {
      setError("저장 실패. 로그인 상태와 네트워크를 확인하세요.");
    } finally {
      setBusy(false);
    }
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await mutate(async () => {
      const { data, error } = await db
        .from("practice_todos")
        .insert({ title: title.trim(), user_id: userId })
        .select()
        .single();
      if (error) throw error;
      setTodos((items) => [data, ...items]);
      setTitle("");
    });
  }
  async function toggle(todo: Todo) {
    await mutate(async () => {
      const { data, error } = await db
        .from("practice_todos")
        .update({ done: !todo.done })
        .eq("id", todo.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      setTodos((items) =>
        items.map((item) => (item.id === todo.id ? data : item)),
      );
    });
  }
  async function remove(id: string) {
    await mutate(async () => {
      const { error } = await db
        .from("practice_todos")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)
        .select("id")
        .single();
      if (error) throw error;
      setTodos((items) => items.filter((item) => item.id !== id));
    });
  }
  const shown = todos.filter(
    (todo) => filter === "all" || (filter === "done" ? todo.done : !todo.done),
  );
  return (
    <>
      <button
        disabled={busy}
        onClick={() =>
          mutate(async () => {
            const { error } = await db.auth.signOut();
            if (error) throw error;
            router.replace("/login");
          })
        }
      >
        로그아웃
      </button>
      <form onSubmit={add}>
        <label>
          할 일
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />
        </label>
        <button disabled={busy}>추가</button>
      </form>
      <label>
        조회 조건
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">전체</option>
          <option value="active">진행 중</option>
          <option value="done">완료</option>
        </select>
      </label>
      {busy && <p role="status">저장 중…</p>}
      {error && <p role="alert">{error}</p>}
      {!busy && !shown.length && <p>조회된 할 일이 없습니다.</p>}
      <ul>
        {shown.map((todo) => (
          <TodoRow
            key={todo.id}
            todo={todo}
            busy={busy}
            onToggle={toggle}
            onDelete={remove}
          />
        ))}
      </ul>
    </>
  );
}
