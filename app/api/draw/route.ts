import { supabase } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { generateDrawNumbers } from "@/lib/draw";
import { getUserFromRequest } from "@/lib/supabaseFromRequest";
import { isAdminEmail } from "@/lib/env";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    if (!user?.email || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "algorithm" ? "algorithm" : "random";

    const drawNumbers =
      mode === "algorithm"
        ? generateDrawNumbersAlgorithmic()
        : generateDrawNumbers();

    const db = createSupabaseAdmin() ?? supabase;

    await db.from("draws").insert([{ numbers: drawNumbers, mode }]);

    const { data: scores, error } = await db.from("scores").select("*");
    if (error) throw error;

    const userScoresMap: Record<string, number[]> = {};
    scores?.forEach((s) => {
      if (!userScoresMap[s.user_id]) userScoresMap[s.user_id] = [];
      userScoresMap[s.user_id].push(s.score);
    });

    const matchGroups: Record<3 | 4 | 5, string[]> = {
      3: [],
      4: [],
      5: [],
    };

    Object.keys(userScoresMap).forEach((userId) => {
      const userScores = userScoresMap[userId];
      const matchCount = userScores.filter((s: number) =>
        drawNumbers.includes(s),
      ).length;
      if (matchCount >= 5) matchGroups[5].push(userId);
      else if (matchCount === 4) matchGroups[4].push(userId);
      else if (matchCount === 3) matchGroups[3].push(userId);
    });

    const { count: activeCount } = await db
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("subscription_status", "active");

    const subscribers = activeCount ?? 0;
    const totalPool = Math.max(1000, subscribers * 250);

    const prizeDistribution = {
      5: totalPool * 0.4,
      4: totalPool * 0.35,
      3: totalPool * 0.25,
    } as const;

    const winners: {
      user_id: string;
      match_count: number;
      prize: number;
    }[] = [];

    for (const tier of [5, 4, 3] as const) {
      const users = matchGroups[tier];
      if (users.length === 0) continue;
      const pool = prizeDistribution[tier];
      const prizePerUser = pool / users.length;
      for (const userId of users) {
        winners.push({
          user_id: userId,
          match_count: tier,
          prize: Math.round(prizePerUser * 100) / 100,
        });
      }
    }

    if (matchGroups[5].length === 0) {
      
      console.info("No 5-match winner: jackpot rolls forward.");
    }

    if (winners.length > 0) {
      await db.from("winners").insert(winners);
    }

    return NextResponse.json({
      success: true,
      drawNumbers,
      mode,
      totalPool,
      activeSubscribers: subscribers,
      winners,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Draw failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


function generateDrawNumbersAlgorithmic(): number[] {
 
  const picks = new Set<number>();
  while (picks.size < 5) {
    const base = 18 + Math.floor(Math.random() * 12);
    const jitter = Math.floor(Math.random() * 7) - 3;
    const v = Math.min(45, Math.max(1, base + jitter));
    picks.add(v);
  }
  return Array.from(picks);
}
