import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-zinc-200/80 bg-[color:var(--surface-muted)] py-12 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="max-w-md space-y-3">
          <p className="font-[family-name:var(--font-display)] text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Impact Circle
          </p>
          <p>
            A subscription that turns your rounds into community outcomes — transparent draws,
            measurable giving, and a dashboard that keeps the story human.
          </p>
        </div>
        <div className="flex flex-wrap gap-6">
          <Link href="/charities" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Charity directory
          </Link>
          <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Sign in
          </Link>
          <Link href="/signup" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Get started
          </Link>
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl px-4 text-xs text-zinc-500 sm:px-6">
        Sample build for evaluation — configure Stripe, Supabase, and webhooks for production.
      </p>
    </footer>
  );
}
