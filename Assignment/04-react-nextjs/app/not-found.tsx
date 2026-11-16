import Link from "next/link";
export default function NotFound() {
  return (
    <>
      <h1>할 일을 찾을 수 없습니다.</h1>
      <Link href="/todos">목록</Link>
    </>
  );
}
