"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../lib/supabase";
export default function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const data = new FormData(e.currentTarget);
    const credentials = {
      email: String(data.get("email")),
      password: String(data.get("password")),
    };
    try {
      const supabase = browserClient();
      const result =
        mode === "login"
          ? await supabase.auth.signInWithPassword(credentials)
          : await supabase.auth.signUp({
              ...credentials,
              options: {
                emailRedirectTo: window.location.origin + "/auth/callback",
              },
            });
      if (result.error) throw result.error;
      if (result.data.session) {
        router.replace("/todos");
        router.refresh();
      } else setMessage("가입 확인 이메일을 확인한 뒤 로그인하세요.");
    } catch {
      setMessage("인증 실패: 이메일·비밀번호 또는 인증 상태를 확인하세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <form onSubmit={submit}>
        <label>
          이메일
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          비밀번호
          <input
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
          />
        </label>
        <button disabled={busy}>
          {busy ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
      >
        {mode === "login" ? "회원가입으로 전환" : "로그인으로 전환"}
      </button>
      <p role="status">{message}</p>
    </>
  );
}
