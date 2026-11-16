import Link from "next/link";
import type { Todo } from "../lib/types";
export default function TodoRow({
  todo,
  busy,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  busy: boolean;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li>
      <input
        type="checkbox"
        checked={todo.done}
        disabled={busy}
        aria-label={todo.title + " 완료"}
        onChange={() => onToggle(todo)}
      />
      <Link className={todo.done ? "done" : ""} href={"/todos/" + todo.id}>
        {todo.title}
      </Link>
      <button disabled={busy} onClick={() => onDelete(todo.id)}>
        삭제
      </button>
    </li>
  );
}
