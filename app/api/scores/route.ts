import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabaseFromRequest";

export async function POST(req: Request) {
  const { user, supabase } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { score, date } = await req.json();
  if (date == null || score == null) {
    return NextResponse.json(
      { error: "score and date are required" },
      { status: 400 },
    );
  }

  const n = Number(score);
  if (!Number.isFinite(n) || n < 1 || n > 45) {
    return NextResponse.json(
      { error: "Score must be between 1 and 45" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("scores")
    .select("id")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error:
          "You already have a score for this date. Edit it instead of adding a new one.",
      },
      { status: 409 },
    );
  }

  const { data: scores } = await supabase
    .from("scores")
    .select("id, date")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (scores && scores.length >= 5) {
    await supabase.from("scores").delete().eq("id", scores[0].id);
  }

  const { data, error } = await supabase
    .from("scores")
    .insert([{ user_id: user.id, score: n, date }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const { user, supabase } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { score, date } = await req.json();
  if (date == null || score == null) {
    return NextResponse.json(
      { error: "score and date are required" },
      { status: 400 },
    );
  }

  const n = Number(score);
  if (!Number.isFinite(n) || n < 1 || n > 45) {
    return NextResponse.json(
      { error: "Score must be between 1 and 45" },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("scores")
    .update({ score: n })
    .eq("user_id", user.id)
    .eq("date", date)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) {
    return NextResponse.json({ error: "Score not found for that date" }, { status: 404 });
  }
  return NextResponse.json({ data });
}

export async function DELETE(req: Request) {
  const { user, supabase } = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("scores")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
