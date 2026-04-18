"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const linkBtn =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-4 sm:text-sm";
const ghost = `${linkBtn} text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800`;
const secondary = `${linkBtn} border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900`;
const primary = `${linkBtn} bg-rose-600 text-white hover:bg-rose-500 focus-visible:outline-rose-500`;

export function SiteHeader() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setEmail(data.user?.email ?? null);
    };
    void run();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void run();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-[color:var(--surface)]/85 backdrop-blur-md dark:border-zinc-800/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-400 text-sm font-bold text-white shadow-md shadow-rose-600/25">
            IC
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Impact Circle
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-300">
          <Link className="hover:text-zinc-900 dark:hover:text-white" href="/#flow">
            How it works
          </Link>
          <Link className="hover:text-zinc-900 dark:hover:text-white" href="/charities">
            Charities
          </Link>
          <Link className="hover:text-zinc-900 dark:hover:text-white" href="/signup">
            Subscribe
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {email ? (
            <>
              <Link href="/dashboard" className={secondary}>
                Dashboard
              </Link>
              <Link href="/admin" className={`${ghost} hidden sm:inline-flex`}>
                Admin
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={ghost}>
                Sign in
              </Link>
              <Link href="/signup" className={primary}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
