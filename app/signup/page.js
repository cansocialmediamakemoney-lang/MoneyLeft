"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { Btn, Card, TextInput, ErrorMsg } from "@/components/UI";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e) => {
    e?.preventDefault();
    setError(""); setLoading(true);

    if (password.length < 8) {
      setError("Please use a password with at least 8 characters.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });

    setLoading(false);

    if (error) {
      setError(error.message || "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)" }}>
      <Card className="max-w-md w-full text-center">
        <div className="text-6xl mb-4">📬</div>
        <h2 className="text-2xl font-medium text-stone-800 mb-3">Check your email</h2>
        <p className="text-stone-600 text-lg mb-5">We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account.</p>
        <Link href="/login"><Btn variant="secondary">Back to Sign In</Btn></Link>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(150deg,#f0ede8 0%,#e8f0ec 100%)" }}>
      <div style={{ background: "linear-gradient(135deg,#1a6b4a,#2d9e6b)" }} className="px-5 pt-10 pb-6 text-center">
        <div className="text-5xl mb-2">💰</div>
        <h1 className="text-3xl font-medium text-white">Create Your Account</h1>
      </div>
      <div className="flex-1 px-5 py-6 max-w-md mx-auto w-full">
        <Card>
          <form onSubmit={handleSignup} className="space-y-5">
            <TextInput label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoFocus />
            <TextInput label="Create a Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
            <ErrorMsg>{error}</ErrorMsg>
            <Btn type="submit" disabled={loading || !email || !password}>
              {loading ? "Creating account…" : "Create Account"}
            </Btn>
          </form>
        </Card>
        <div className="mt-5 text-center">
          <p className="text-stone-600 text-lg">Already have an account?</p>
          <Link href="/login" className="text-emerald-700 text-lg font-medium underline">Sign in instead</Link>
        </div>
        <p className="text-stone-400 text-base text-center mt-6 px-3">🔒 We never share or sell your information. Your data is encrypted and stored securely.</p>
      </div>
    </div>
  );
}
