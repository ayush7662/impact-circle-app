"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { ctaPrimaryClass, ctaSecondaryClass } from "@/components/ui";

const fade = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Home() {
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        window.location.href = "/dashboard";
      }
    };
    void checkUser();
  }, []);

  return (
    <div className="overflow-hidden">
      <section className="relative isolate">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_-10%,theme(colors.rose.200),transparent)] dark:bg-[radial-gradient(70%_50%_at_50%_-10%,theme(colors.rose.950),transparent)]"
        />
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:flex-row lg:items-center lg:gap-16 lg:pt-24">
          <div className="max-w-xl space-y-6 lg:flex-1">
            <p className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/70 px-3 py-1 text-xs font-medium text-rose-800 shadow-sm dark:border-rose-900/60 dark:bg-zinc-900/70 dark:text-rose-200">
              Charity-first · Monthly draws · Rolling 5-score journal
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold leading-tight tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
              Your rounds fund{" "}
              <span className="bg-gradient-to-r from-rose-600 to-amber-500 bg-clip-text text-transparent">
                real community outcomes
              </span>
              .
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
              Subscribe once a month (or save with yearly). Log your last five Stableford scores,
              unlock the draw, and send at least 10% of every payment to a charity you believe in.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/signup" className={ctaPrimaryClass}>
                Start your impact
              </Link>
              <Link href="/charities" className={ctaSecondaryClass}>
                Browse charities
              </Link>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No fairway stock photos. No plaid. Just clarity, motion, and the story your subscription tells.
            </p>
          </div>

          <motion.div
            {...fade}
            className="relative flex-1 rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-xl shadow-zinc-950/10 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50 dark:shadow-black/30 sm:p-8"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/40 blur-2xl dark:bg-amber-500/20" />
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              What you do here
            </h2>
            <ul className="mt-4 space-y-4 text-sm text-zinc-600 dark:text-zinc-300">
              <li className="flex gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-rose-100 text-center text-xs font-bold leading-6 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
                  1
                </span>
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">Subscribe</strong> — monthly
                  or discounted yearly billing through Stripe.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-rose-100 text-center text-xs font-bold leading-6 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
                  2
                </span>
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">Log five scores</strong> — we
                  keep only your latest five, always in date order.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 h-6 w-6 shrink-0 rounded-full bg-rose-100 text-center text-xs font-bold leading-6 text-rose-700 dark:bg-rose-950 dark:text-rose-200">
                  3
                </span>
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">Enter the draw</strong> — 3, 4,
                  or 5-number tiers split the pool; 5-match can roll when nobody hits.
                </span>
              </li>
            </ul>
          </motion.div>
        </div>
      </section>

      <section id="flow" className="border-y border-zinc-200/80 bg-[color:var(--surface-muted)] py-20 dark:border-zinc-800">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-3 sm:px-6">
          {[
            {
              title: "Impact you can trace",
              body: "Pick a charity directory partner and raise your contribution above the 10% floor whenever you want.",
            },
            {
              title: "Draws with guardrails",
              body: "Random or weighted simulation-style logic — admins can rehearse, publish, and track payouts responsibly.",
            },
            {
              title: "A dashboard that respects you",
              body: "Subscription health, winnings, proof uploads, and score edits — all in one calm surface.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              {...fade}
              className="rounded-2xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
            >
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          {...fade}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-rose-900 px-8 py-12 text-zinc-50 sm:px-12"
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,theme(colors.rose.500),transparent_65%)] opacity-40" />
          <div className="relative max-w-xl space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold">
             
            </h2>
            <p className="text-zinc-200">
              Create a test account, run a subscription in Stripe test mode, and explore the admin draw
              tools — the whole loop is wired for a credible demo.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium text-white ring-1 ring-white/30 transition hover:bg-white/10"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
