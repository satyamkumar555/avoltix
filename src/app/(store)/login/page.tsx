"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { friendly, useAuth } from "@/lib/auth";

export default function Login() {
  const { signIn, register, reset } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim(), email = String(f.get("email") ?? "").trim(), pw = String(f.get("password") ?? "");
    if (!email || pw.length < 6 || (mode === "up" && name.length < 2)) { setMsg("Fill all fields. Password needs 6+ characters."); return; }
    setBusy(true); setMsg("");
    try { if (mode === "in") await signIn(email, pw); else await register(name, email, pw); router.push(window.history.length > 1 ? "/orders" : "/"); }
    catch (x) { setMsg(friendly(x)); setBusy(false); }
  }
  return (
    <section className="sec narrow"><h1>{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form className="form" onSubmit={submit}>
        {mode === "up" && <input name="name" placeholder="Full name" autoComplete="name" />}
        <input name="email" type="email" placeholder="Email" autoComplete="email" /><input name="password" type="password" placeholder="Password" autoComplete={mode === "in" ? "current-password" : "new-password"} />
        {msg && <p role="alert" className="st out_of_stock">{msg}</p>}
        <button className="btn" disabled={busy}>{mode === "in" ? "Sign in" : "Register"}</button>
      </form>
      <div className="row">
        <button className="btn ghost" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}>{mode === "in" ? "New here? Create account" : "Have an account? Sign in"}</button>
        {mode === "in" && <button className="btn ghost" onClick={async () => { const el = document.querySelector<HTMLInputElement>('input[name="email"]'); if (!el?.value) { setMsg("Enter your email first."); return; } try { await reset(el.value); setMsg("Password reset email sent."); } catch (x) { setMsg(friendly(x)); } }}>Forgot password</button>}
      </div>
    </section>
  );
}
