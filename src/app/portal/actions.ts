"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function isiNama(fd: FormData) {
  const supabase = await createClient();
  await supabase.rpc("isi_nama_saya", { nama_baru: String(fd.get("nama") ?? "") });
  revalidatePath("/portal");
}

export async function ambilPermintaan(fd: FormData) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ambil_permintaan", { pid: Number(fd.get("id")) });
  revalidatePath("/portal");
  redirect("/portal?ambil=" + (data ? "ok" : "gagal"));
}
