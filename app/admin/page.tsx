"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button, Card } from "@/components/ui";

type DrawResult = {
  success: boolean;
  drawNumbers?: number[];
  winners?: { user_id: string; match_count: number; prize: number }[];
  totalPool?: number;
  activeSubscribers?: number;
  mode?: string;
  error?: string;
};

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function Admin() {
  const [result, setResult] = useState<DrawResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"random" | "algorithm">("random");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setEmail(data.user.email ?? null);
    };
    void checkUser();
  }, []);

  const runDraw = async () => {
    setLoading(true);
    setResult(null);
    const token = await getAccessToken();
    const res = await fetch("/api/draw", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ mode }),
    });
    const data = (await res.json()) as DrawResult;
    setLoading(false);
    if (!res.ok) {
      setResult({ success: false, error: data.error || `HTTP ${res.status}` });
      return;
    }
    setResult(data);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-12 sm:px-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
          Operations
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Admin console
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Draw execution is restricted to emails listed in the server{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-900">ADMIN_EMAILS</code>{" "}
          env variable. Use a service role key so draws can read all scores.
        </p>
        {email && (
          <p className="text-xs text-zinc-500">
            Signed in as <span className="font-mono">{email}</span>
          </p>
        )}
      </div>

      <Card className="space-y-6">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Monthly draw
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Executes draw logic, persists numbers, inserts winners, and returns a JSON summary for review
            before you communicate results to members.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2 rounded-xl border border-zinc-200 p-1 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setMode("random")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === "random"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Random
            </button>
            <button
              type="button"
              onClick={() => setMode("algorithm")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                mode === "algorithm"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-300"
              }`}
            >
              Algorithmic (demo)
            </button>
          </div>
          <Button onClick={() => void runDraw()} disabled={loading}>
            {loading ? "Running…" : "Run draw now"}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="space-y-4">
          {!result.success ? (
            <p className="text-sm text-rose-700 dark:text-rose-300">{result.error}</p>
          ) : (
            <>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-300">
                <span>
                  Mode: <strong className="text-zinc-900 dark:text-zinc-50">{result.mode}</strong>
                </span>
                <span>
                  Active subscribers:{" "}
                  <strong className="text-zinc-900 dark:text-zinc-50">{result.activeSubscribers}</strong>
                </span>
                <span>
                  Pool (demo calc):{" "}
                  <strong className="text-zinc-900 dark:text-zinc-50">₹{result.totalPool}</strong>
                </span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Draw numbers</h3>
                <p className="mt-1 font-mono text-lg tracking-widest text-rose-700 dark:text-rose-300">
                  {result.drawNumbers?.join(" · ")}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Winners</h3>
                {result.winners?.length === 0 && (
                  <p className="mt-2 text-sm text-zinc-500">No winners for this run — jackpot rules apply for 5-match.</p>
                )}
                <div className="mt-3 space-y-2">
                  {result.winners?.map((w, i) => (
                    <div
                      key={`${w.user_id}-${i}`}
                      className="rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50"
                    >
                      <p className="font-mono text-xs text-zinc-500">{w.user_id}</p>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {w.match_count}-match · ₹{w.prize}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
