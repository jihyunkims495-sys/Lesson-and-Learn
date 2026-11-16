import { redirect } from "next/navigation";
import { serverClient } from "../../lib/server";
import TodoBoard from "../../components/TodoBoard";
export const dynamic = "force-dynamic";
export default async function Todos() {
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await db
    .from("practice_todos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error("목록 조회 실패");
  return (
    <>
      <h1>오늘의 할 일</h1>
      <TodoBoard initialTodos={data ?? []} userId={user.id} initialError="" />
    </>
  );
}
