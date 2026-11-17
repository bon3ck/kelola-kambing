import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";

export type Peran = "developer" | "pengelola_utama" | "pengelola" | "investor";
export const namaPeran: Record<Peran, string> = {
  developer: "Developer",
  pengelola_utama: "Pengelola utama",
  pengelola: "Pengelola",
  investor: "Investor",
};

export async function getSesi() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  const { data: profil } = await supabase
    .from("profil").select("peran,email,disetujui,minta_pengelola").eq("user_id", data.user.id).single();
  const peran = (profil?.peran ?? "investor") as Peran;
  const disetujui = profil?.disetujui ?? true;
  const staf = peran !== "investor" && disetujui;
  const admin = disetujui && (peran === "developer" || peran === "pengelola_utama");
  const menunggu = !disetujui && !!profil?.minta_pengelola;
  return { supabase, user: data.user, peran, staf, admin, menunggu };
}

export async function wajibPengelola() {
  const s = await getSesi();
  if (s.menunggu) redirect("/menunggu");
  if (!s.staf) redirect("/portal");
  return s;
}

export async function wajibAdmin() {
  const s = await wajibPengelola();
  if (!s.admin) redirect("/kelola");
  return s;
}
