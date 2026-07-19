import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { supabaseSignIn, supabaseSignUp, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase authentication not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") ?? "signin";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (action === "signup") {
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    const result = await supabaseSignUp(parsed.data.email, parsed.data.password, parsed.data.name);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ user: result.user });
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const result = await supabaseSignIn(parsed.data.email, parsed.data.password);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ user: result.user });
}
