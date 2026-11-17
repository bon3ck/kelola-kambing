"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export async function masuk(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(fd.get("email")),
    password: String(fd.get("password")),
  });
  if (error) redirect("/login?pesan=" + encodeURIComponent("Email atau kata sandi salah."));
  redirect("/");
}

export async function daftar(fd: FormData) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(fd.get("email")),
    password: String(fd.get("password")),
    options: { emailRedirectTo: `${(await headers()).get("origin") ?? ""}/auth/konfirmasi` },
  });
  if (error) redirect("/login?mode=daftar&pesan=" + encodeURIComponent(error.message));
  if (!data.session)
    redirect("/login?pesan=" + encodeURIComponent("Cek email Anda untuk konfirmasi, lalu masuk."));
  redirect("/");
}
