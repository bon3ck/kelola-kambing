"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function isiNama(fd: FormData) {
  const supabase = await createClient();
  await supabase.rpc("isi_nama_saya", { nama_baru: String(fd.get("nama") ?? "") });
  revalidatePath("/portal");
}
