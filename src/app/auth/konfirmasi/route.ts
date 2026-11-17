import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Tautan konfirmasi email dari Supabase mengarah ke sini dengan ?code=...
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.redirect(
    new URL("/login?pesan=" + encodeURIComponent("Email sudah dikonfirmasi. Silakan masuk."), req.url),
  );
}
