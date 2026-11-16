import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { serverClient } from "../../../lib/server";
import TodoEditor from "../../../components/TodoEditor";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const db = await serverClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await db
    .from("practice_todos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("할 일 조회 실패");
  if (!data) notFound();
  return (
    <>
      <Link href="/todos">← 목록</Link>
      <h1>할 일 수정</h1>
      <TodoEditor todo={data} />
    </>
  );
}
