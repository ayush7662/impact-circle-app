"use client";

import { supabase } from "@/lib/supabaseClient";
import { useCallback, useEffect, useState } from "react";
import { Button, Card, Field, Input } from "@/components/ui";

type ScoreRow = { id: string; score: number; date: string };
type WinnerRow = { id: string; match_count: number; prize: number; payment_status: string };
type CharityRow = { id: string; name: string };
type ProfileRow = {
  id: string;
  charity_id: string | null;
  charity_percent: number | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_renews_at: string | null;
};

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export default function Dashboard() {
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [charities, setCharities] = useState<CharityRow[]>([]);
  const [score, setScore] = useState("");
  const [date, setDate] = useState("");
  const [scores, setScores] = useState<ScoreRow[]>([]);
  const [winnings, setWinnings] = useState<WinnerRow[]>([]);
  const [editing, setEditing] = useState<ScoreRow | null>(null);
  const [editValue, setEditValue] = useState("");
  const [charityId, setCharityId] = useState<string>("");
  const [charityPercent, setCharityPercent] = useState(10);
  const [banner, setBanner] = useState<string | null>(null);

  const refreshScores = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("scores")
      .select("id, score, date")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    setScores((data as ScoreRow[]) || []);
  }, []);

  const refreshWinnings = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("winners")
      .select("id, match_count, prize, payment_status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setWinnings((data as WinnerRow[]) || []);
  }, []);

  const refreshProfile = useCallback(async (userId: string, email?: string | null) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (!data) {
      await supabase.from("profiles").upsert(
        { id: userId, email: email ?? null, charity_percent: 10 },
        { onConflict: "id" },
      );
      const { data: again } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      setProfile((again as ProfileRow) || null);
      setCharityId(again?.charity_id ?? "");
      setCharityPercent(again?.charity_percent ?? 10);
      return;
    }
    const p = data as ProfileRow;
    setProfile(p);
    setCharityId(p.charity_id ?? "");
    setCharityPercent(p.charity_percent ?? 10);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (checkout === "success") {
      setBanner("Checkout completed — subscription will activate after webhook sync.");
    }
    if (checkout === "cancel") {
      setBanner("Checkout cancelled — you can try again anytime.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      if (cancelled) return;
      setUser({ id: data.user.id, email: data.user.email });

      const { data: ch } = await supabase.from("charities").select("id, name").order("name");
      if (!cancelled) setCharities((ch as CharityRow[]) || []);

      await refreshProfile(data.user.id, data.user.email);
      await refreshScores(data.user.id);
      await refreshWinnings(data.user.id);
    };
    void init();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile, refreshScores, refreshWinnings]);

  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    const token = await getAccessToken();
    const headers = new Headers(init?.headers);
    headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };

  const subscribe = async (plan: "month" | "year") => {
    const res = await authFetch("/api/checkout", {
      method: "POST",
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Could not start checkout");
      return;
    }
    if (data.url) window.location.href = data.url;
  };

  const submitScore = async () => {
    if (!user) return;
    if (!score || !date) {
      alert("Please enter score and date");
      return;
    }
    const res = await authFetch("/api/scores", {
      method: "POST",
      body: JSON.stringify({ score: Number(score), date }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Could not save score");
      return;
    }
    setScore("");
    setDate("");
    await refreshScores(user.id);
  };

  const saveEdit = async () => {
    if (!user || !editing) return;
    const res = await authFetch("/api/scores", {
      method: "PATCH",
      body: JSON.stringify({ score: Number(editValue), date: editing.date }),
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Could not update score");
      return;
    }
    setEditing(null);
    await refreshScores(user.id);
  };

  const removeScore = async (id: string) => {
    if (!user) return;
    if (!confirm("Delete this score?")) return;
    const token = await getAccessToken();
    const res = await fetch(`/api/scores?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    const result = await res.json();
    if (!res.ok) {
      alert(result.error || "Could not delete");
      return;
    }
    await refreshScores(user.id);
  };

  const saveCharity = async () => {
    if (!user) return;
    if (charityPercent < 10 || charityPercent > 100) {
      alert("Charity contribution must be between 10% and 100%.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        charity_id: charityId || null,
        charity_percent: charityPercent,
      })
      .eq("id", user.id);
    if (error) {
      alert(error.message);
      return;
    }
    await refreshProfile(user.id, user.email);
    alert("Charity preferences saved.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const statusLabel = profile?.subscription_status || "inactive";
  const renews = profile?.subscription_renews_at
    ? new Date(profile.subscription_renews_at).toLocaleString()
    : "—";

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-600 dark:text-rose-300">
            Member hub
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          {user?.email && (
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Signed in as {user.email}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => (window.location.href = "/charities")}>
            Charity directory
          </Button>
          <Button variant="ghost" onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      {banner && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100">
          {banner}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Subscription
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-950/60">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Status</p>
              <p className="mt-1 text-base font-semibold capitalize text-zinc-900 dark:text-zinc-50">
                {statusLabel}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-950/60">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Plan</p>
              <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">
                {profile?.subscription_plan ? profile.subscription_plan : "Not subscribed"}
              </p>
            </div>
            <div className="rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-950/60">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Renews</p>
              <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-50">{renews}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => void subscribe("month")}>Subscribe monthly</Button>
            <Button variant="secondary" onClick={() => void subscribe("year")}>
              Subscribe yearly (save)
            </Button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Uses Stripe Checkout in INR (see <code className="font-mono">/api/checkout</code>). Webhook updates
            status when configured.
          </p>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Charity impact
          </h2>
          <Field label="Recipient">
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              value={charityId}
              onChange={(e) => setCharityId(e.target.value)}
            >
              <option value="">Select a charity</option>
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Contribution (${charityPercent}% minimum 10%)`}>
            <Input
              type="number"
              min={10}
              max={100}
              value={charityPercent}
              onChange={(e) => setCharityPercent(Number(e.target.value))}
            />
          </Field>
          <Button className="w-full" onClick={() => void saveCharity()}>
            Save charity settings
          </Button>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Stableford scores (last 5)
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            One score per date. New entries beyond five drop the oldest. Range 1–45.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Score">
              <Input
                inputMode="numeric"
                placeholder="e.g. 36"
                value={score}
                onChange={(e) => setScore(e.target.value)}
              />
            </Field>
            <Field label="Date">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => void submitScore()}>
            Add score
          </Button>

          <div className="mt-4 space-y-2">
            {scores.length === 0 && <p className="text-sm text-zinc-500">No scores yet.</p>}
            {scores.map((s) => (
              <div
                key={s.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:items-center"
              >
                {editing?.id === s.id ? (
                  <div className="flex flex-1 flex-wrap items-center gap-2">
                    <span className="text-zinc-500">{s.date}</span>
                    <Input
                      className="max-w-[120px]"
                      inputMode="numeric"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <Button className="px-3 py-2 text-xs" onClick={() => void saveEdit()}>
                      Save
                    </Button>
                    <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        Score <span className="tabular-nums">{s.score}</span>
                      </p>
                      <p className="text-xs text-zinc-500">{s.date}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        onClick={() => {
                          setEditing(s);
                          setEditValue(String(s.score));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
                        onClick={() => void removeScore(s.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Winnings
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Pending → Paid after admin verification (see PRD winner flow).
          </p>
          {winnings.length === 0 && <p className="text-sm text-zinc-500">No winnings recorded yet.</p>}
          <div className="space-y-2">
            {winnings.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-zinc-200/80 bg-white/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {w.match_count}-number match
                </p>
                <p className="text-xs text-zinc-500">
                  Prize ₹{w.prize} · {w.payment_status}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
