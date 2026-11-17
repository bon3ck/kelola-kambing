import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export async function getSesi() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: profil } = await supabase.from("profil").select("peran,email").eq("user_id", data.user.id).single();
  return { supabase, user: data.user, peran: (profil?.peran ?? "investor") as "pengelola" | "investor" };
}

export async function wajibPengelola() {
  const s = await getSesi();
  if (s.peran !== "pengelola") redirect("/portal");
  return s;
}
