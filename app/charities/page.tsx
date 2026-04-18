"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card } from "@/components/ui";

type Charity = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  tagline: string | null;
  featured: boolean | null;
};

export default function CharitiesPage() {
  const [rows, setRows] = useState<Charity[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("charities")
        .select("id, name, slug, description, tagline, featured")
        .order("featured", { ascending: false });
      if (cancelled) return;
      if (err) setError(err.message);
      else setRows((data as Charity[]) || []);
      setLoading(false);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (c) =>
        c.name.toLowerCase().includes(s) ||
        (c.description && c.description.toLowerCase().includes(s)),
    );
  }, [q, rows]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
          Directory
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Charities you can champion
        </h1>
        <p className="text-zinc-600 dark:text-zinc-300">
          Every subscription routes at least 10% to the partner you pick. Raise the percentage anytime
          from your dashboard.
        </p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or mission…"
          className="mt-2 w-full max-w-md rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-inner dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {error && (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          Could not load charities ({error}). Run <code className="font-mono text-xs">supabase/seed.sql</code>{" "}
          after <code className="font-mono text-xs">schema.sql</code> in your Supabase project.
        </p>
      )}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-zinc-200/80 dark:bg-zinc-800/80"
            />
          ))}

        {!loading &&
          filtered.map((c) => (
            <Card key={c.id} className="flex flex-col border-zinc-200/90 dark:border-zinc-800">
              {c.featured && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-800 dark:bg-rose-950 dark:text-rose-200">
                  Spotlight
                </span>
              )}
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {c.name}
              </h2>
              {c.tagline && (
                <p className="mt-1 text-sm font-medium text-rose-700 dark:text-rose-300">{c.tagline}</p>
              )}
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {c.description || "Mission details coming soon."}
              </p>
            </Card>
          ))}
      </div>

      {!loading && !error && filtered.length === 0 && (
        <p className="mt-10 text-sm text-zinc-600 dark:text-zinc-400">No charities match that search.</p>
      )}
    </div>
  );
}
