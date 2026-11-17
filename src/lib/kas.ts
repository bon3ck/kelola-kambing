import type { SupabaseClient, User } from "@supabase/supabase-js";

export const jenisKas: Record<string, { label: string; arah: 1 | -1 }> = {
  modal_masuk: { label: "Modal masuk dari investor", arah: 1 },
  hasil_jual: { label: "Hasil jual kambing", arah: 1 },
  lain_masuk: { label: "Pemasukan lain", arah: 1 },
  beli_kambing: { label: "Beli kambing", arah: -1 },
  bayar_investor: { label: "Bayar bagi hasil investor", arah: -1 },
  pakan: { label: "Pakan", arah: -1 },
  obat: { label: "Obat / kesehatan", arah: -1 },
  kelola: { label: "Jasa kelola", arah: -1 },
  lain_keluar: { label: "Pengeluaran lain", arah: -1 },
};

export async function unggahBukti(supabase: SupabaseClient, fd: FormData) {
  const f = fd.get("bukti") as File | null;
  if (!f || f.size === 0) return null;
  const path = `${new Date().toISOString().slice(0, 7)}/${Date.now()}-${f.name.replace(/[^\w.]/g, "_")}`;
  const { error } = await supabase.storage.from("bukti").upload(path, f, { contentType: f.type });
  return error ? null : path;
}

type KasRow = {
  tanggal?: string | null; jenis: string; jumlah: number; kambing_id?: number | null; borongan_id?: number | null;
  investor_id?: number | null; keterangan?: string | null; sumber_tabel?: string; sumber_id?: number;
};

// Catat satu baris kas. Metode, bank, dan foto bukti diambil dari form.
export async function catatKas(supabase: SupabaseClient, user: User, fd: FormData, row: KasRow) {
  if (!row.jumlah || row.jumlah <= 0) return;
  const bukti_path = await unggahBukti(supabase, fd);
  const metode = String(fd.get("metode") ?? "tunai") === "transfer" ? "transfer" : "tunai";
  const bank = String(fd.get("bank") ?? "").trim() || null;
  await supabase.from("kas").insert({
    ...row, metode, bank, bukti_path, dipegang_oleh: String(fd.get("dipegang_oleh") ?? "").trim() || user.email,
    dibuat_oleh: user.id,
  });
}

export async function buktiUrls(supabase: SupabaseClient, paths: (string | null)[]) {
  const list = paths.filter((p): p is string => !!p);
  if (list.length === 0) return new Map<string, string>();
  const { data } = await supabase.storage.from("bukti").createSignedUrls(list, 3600);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}

type BarisKas = { jenis: string; jumlah: number | string; metode: string; investor_id?: number | null };

// Saldo per metode (tunai di tangan pengelola vs rekening) dan dana investor yang belum dipakai beli kambing.
export function hitungSaldo(kas: BarisKas[], kepemilikan: { investor_id: number; modal: number | string | null }[]) {
  let tunai = 0, transfer = 0;
  for (const k of kas) {
    const v = (jenisKas[k.jenis]?.arah ?? 0) * Number(k.jumlah);
    if (k.metode === "transfer") transfer += v; else tunai += v;
  }
  const masuk = new Map<number, number>();
  for (const k of kas) if (k.jenis === "modal_masuk" && k.investor_id) masuk.set(k.investor_id, (masuk.get(k.investor_id) ?? 0) + Number(k.jumlah));
  const pakai = new Map<number, number>();
  for (const p of kepemilikan) pakai.set(p.investor_id, (pakai.get(p.investor_id) ?? 0) + Number(p.modal ?? 0));
  const belumTerpakai = [...masuk].map(([investor_id, m]) => ({ investor_id, masuk: m, terpakai: pakai.get(investor_id) ?? 0, sisa: Math.max(0, m - (pakai.get(investor_id) ?? 0)) }));
  return { tunai, transfer, total: tunai + transfer, belumTerpakai, totalBelumTerpakai: belumTerpakai.reduce((s, b) => s + b.sisa, 0) };
}
