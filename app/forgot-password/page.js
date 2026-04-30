"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Btn, Card, TextInput, ErrorMsg } from "@/components/UI";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e?.preventDefault();
    setError(""); setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) { setError(error.message || "Something went wrong."); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)" }}>
      <div style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }} className="px-5 pt-10 pb-6 text-center">
        <div className="text-5xl mb-2">💰</div>
        <h1 className="text-3xl font-medium text-white">Reset Password</h1>
      </div>
      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        <Card>
          {sent ? (
            <div className="text-center py-3">
              <div className="text-5xl mb-3">📬</div>
              <h2 className="text-xl font-medium text-stone-800 mb-2">Check your email</h2>
              <p className="text-stone-600 text-lg">If an account exists for <strong>{email}</strong>, we've sent a password reset link.</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <p className="text-stone-600 text-lg">Enter your email and we'll send you a link to set a new password.</p>
              <TextInput label="Email Address" type="email" value={email} onChange={setEmail} autoFocus />
              <ErrorMsg>{error}</ErrorMsg>
              <Btn type="submit" disabled={loading || !email}>
                {loading ? "Sending…" : "Send Reset Link"}
              </Btn>
            </form>
          )}
        </Card>
        <div className="mt-5 text-center">
          <Link href="/login" className="text-emerald-700 text-lg font-medium underline">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
