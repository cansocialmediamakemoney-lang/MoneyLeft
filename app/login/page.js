"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Btn, Card, TextInput, ErrorMsg } from "@/components/UI";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError(""); setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "That email and password don't match. Please try again."
        : (error.message || "Something went wrong. Please try again."));
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)", fontFamily: "Georgia,serif" }}>
      <div style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }} className="px-5 pt-10 pb-6 text-center">
        <div className="text-5xl mb-2">💰</div>
        <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
      </div>
      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        <Card>
          <form onSubmit={handleLogin} className="space-y-5">
            <TextInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
            <TextInput label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" />
            <ErrorMsg>{error}</ErrorMsg>
            <Btn type="submit" disabled={loading || !email || !password}>
              {loading ? "Signing in…" : "Sign In"}
            </Btn>
          </form>
          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-emerald-700 text-base font-semibold underline">Forgot your password?</Link>
          </div>
        </Card>
        <div className="mt-5 text-center">
          <p className="text-stone-600 text-lg">New to MoneyLeft?</p>
          <Link href="/signup" className="text-emerald-700 text-lg font-bold underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
