"use client";

import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Password and confirm password must match.");
      return;
    }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md items-center px-4 py-16 sm:px-6">
      <Card className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
            Join the circle
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Create your account
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Choose a charity and contribution after you sign in — we keep onboarding calm and honest.
          </p>
        </div>

        {success ? (
          <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p>
              Check your inbox to confirm your email. Once verified, you can sign in and finish your
              profile.
            </p>
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSignup}>
            <Field label="Email">
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </Field>
            <Field label="Confirm password">
              <Input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
            </Field>
            {message && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
                {message}
              </p>
            )}
            <Button type="submit" className="w-full py-3 text-base" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-rose-700 underline-offset-4 hover:underline dark:text-rose-300">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
