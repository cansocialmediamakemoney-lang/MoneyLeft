"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Btn, Card, TextInput, ErrorMsg } from "@/components/UI";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e?.preventDefault();
    setError("");

    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) { setError(error.message || "Something went wrong."); return; }
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)" }}>
      <div style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }} className="px-5 pt-10 pb-6 text-center">
        <div className="text-5xl mb-2">💰</div>
        <h1 className="text-3xl font-bold text-white">Set New Password</h1>
      </div>
      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        <Card>
          <form onSubmit={handleReset} className="space-y-5">
            <TextInput label="New Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" autoFocus />
            <TextInput label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Type it again" />
            <ErrorMsg>{error}</ErrorMsg>
            <Btn type="submit" disabled={loading || !password || !confirm}>
              {loading ? "Saving…" : "Save New Password"}
            </Btn>
          </form>
        </Card>
      </div>
    </div>
  );
}
