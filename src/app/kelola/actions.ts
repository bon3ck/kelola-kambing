"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { wajibAdmin, wajibPengelola } from "@/lib/auth";

const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return v === null || String(v).trim() === "" ? null : String(v).trim();
};
const num = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === null ? null : Number(v.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", "."));
};
const numKg = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v === null ? null : Number(v.replace(",", "."));
};
function gagal(path: string, msg: string): never {
  redirect(path + (path.includes("?") ? "&" : "?") + "pesan=" + encodeURIComponent(msg));
}

async function unggahFoto(supabase: Awaited<ReturnType<typeof wajibPengelola>>["supabase"], fd: FormData) {
  const foto = fd.get("foto") as File | null;
  if (!foto || foto.size === 0) return null;
  const nama = `${Date.now()}-${foto.name.replace(/[^\w.]/g, "_")}`;
  const { error } = await supabase.storage.from("foto-kambing").upload(nama, foto, { contentType: foto.type });
  return error ? null : supabase.storage.from("foto-kambing").getPublicUrl(nama).data.publicUrl;
}

export async function gantiFoto(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const id = num(fd, "id");
  const foto_url = await unggahFoto(supabase, fd);
  if (!foto_url) gagal(`/kelola/kambing/${id}`, "Foto gagal diunggah. Coba foto yang lebih kecil.");
  await supabase.from("kambing").update({ foto_url }).eq("id", id);
  revalidatePath("/kelola", "layout");
}

export async function tambahKambing(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const foto_url = await unggahFoto(supabase, fd);
  let kode = str(fd, "kode");
  if (!kode) {
    const { count } = await supabase.from("kambing").select("*", { count: "exact", head: true });
    kode = `KB-${String((count ?? 0) + 1).padStart(3, "0")}`;
  }
  const { data, error } = await supabase.from("kambing").insert({
    kode,
    jenis_kelamin: str(fd, "jenis_kelamin"),
    ras: str(fd, "ras"),
    tanggal_beli: str(fd, "tanggal_beli"),
    harga_beli: num(fd, "harga_beli"),
    berat_awal: numKg(fd, "berat_awal"),
    jalur: str(fd, "jalur"),
    catatan: str(fd, "catatan"),
    foto_url,
  }).select("id").single();
  if (error) gagal("/kelola/kambing", error.code === "23505" ? "Kode kambing sudah dipakai." : error.message);
  const investor_id = num(fd, "investor_id");
  if (investor_id) {
    await supabase.from("kepemilikan").insert({ kambing_id: data.id, investor_id, modal: num(fd, "harga_beli") });
  }
  if (numKg(fd, "berat_awal")) {
    await supabase.from("timbang").insert({ kambing_id: data.id, tanggal: str(fd, "tanggal_beli"), berat: numKg(fd, "berat_awal") });
  }
  revalidatePath("/kelola", "layout");
  redirect(`/kelola/kambing/${data.id}`);
}

export async function ubahKambing(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const id = num(fd, "id");
  const { error } = await supabase.from("kambing").update({
    jalur: str(fd, "jalur"), ras: str(fd, "ras"), catatan: str(fd, "catatan"),
  }).eq("id", id);
  if (error) gagal(`/kelola/kambing/${id}`, error.message);
  revalidatePath("/kelola", "layout");
}

async function catat(tabel: string, row: Record<string, unknown>, back: string) {
  const { supabase } = await wajibPengelola();
  const { error } = await supabase.from(tabel).insert(row);
  if (error) gagal(back, error.message);
  revalidatePath("/kelola", "layout");
}

export async function catatTimbang(fd: FormData) {
  const id = num(fd, "kambing_id");
  await catat("timbang", { kambing_id: id, tanggal: str(fd, "tanggal"), berat: numKg(fd, "berat") }, `/kelola/kambing/${id}`);
}

export async function catatKesehatan(fd: FormData) {
  const id = num(fd, "kambing_id");
  await catat("kesehatan", {
    kambing_id: id, tanggal: str(fd, "tanggal"), keterangan: str(fd, "keterangan"),
    obat: str(fd, "obat"), dosis: str(fd, "dosis"), biaya: num(fd, "biaya") ?? 0,
  }, `/kelola/kambing/${id}`);
}

export async function catatBiaya(fd: FormData) {
  const id = num(fd, "kambing_id");
  await catat("biaya", {
    kambing_id: id, tanggal: str(fd, "tanggal"), jenis: str(fd, "jenis"),
    jumlah: num(fd, "jumlah"), keterangan: str(fd, "keterangan"),
  }, id ? `/kelola/kambing/${id}` : "/kelola/biaya");
}

export async function catatPenjualan(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const id = num(fd, "kambing_id");
  const { error } = await supabase.from("penjualan").upsert({
    kambing_id: id, tanggal: str(fd, "tanggal"), pembeli: str(fd, "pembeli"), harga_jual: num(fd, "harga_jual"),
  }, { onConflict: "kambing_id" });
  if (error) gagal(`/kelola/kambing/${id}`, error.message);
  await supabase.from("kambing").update({ status: "terjual" }).eq("id", id);
  revalidatePath("/kelola", "layout");
}

export async function tambahPemilik(fd: FormData) {
  const id = num(fd, "kambing_id");
  await catat("kepemilikan", { kambing_id: id, investor_id: num(fd, "investor_id"), modal: num(fd, "modal") }, `/kelola/kambing/${id}`);
}

export async function hapus(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const tabel = String(fd.get("tabel"));
  if (!["timbang", "kesehatan", "biaya", "kepemilikan", "pembayaran", "penjualan"].includes(tabel)) return;
  await supabase.from(tabel).delete().eq("id", num(fd, "id"));
  if (tabel === "penjualan") await supabase.from("kambing").update({ status: "dipelihara" }).eq("id", num(fd, "kambing_id"));
  revalidatePath("/kelola", "layout");
}

export async function tambahInvestor(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const { error } = await supabase.from("investor").insert({
    nama_panggilan: str(fd, "nama_panggilan"), catatan: str(fd, "catatan"),
    email: str(fd, "email")?.toLowerCase() ?? null, no_wa: str(fd, "no_wa"), rekening: str(fd, "rekening"),
  });
  if (error) gagal("/kelola/investor", error.code === "23505" ? "Email investor sudah terdaftar." : error.message);
  revalidatePath("/kelola", "layout");
}

export async function catatPembayaran(fd: FormData) {
  await catat("pembayaran", {
    investor_id: num(fd, "investor_id"), kambing_id: num(fd, "kambing_id"),
    tanggal: str(fd, "tanggal"), jumlah: num(fd, "jumlah"), catatan: str(fd, "catatan"),
  }, "/kelola/bagi-hasil");
}

export async function putuskanPengelola(fd: FormData) {
  const { supabase } = await wajibAdmin();
  const user_id = String(fd.get("user_id"));
  const setuju = fd.get("keputusan") === "setuju";
  const { error } = await supabase.from("profil")
    .update(setuju ? { disetujui: true, minta_pengelola: false } : { peran: "investor", disetujui: true, minta_pengelola: false })
    .eq("user_id", user_id);
  if (error) gagal("/kelola/pengelola", error.message);
  revalidatePath("/kelola", "layout");
}

export async function daftarkanEmailPeran(fd: FormData) {
  const { supabase, peran } = await wajibAdmin();
  const email = str(fd, "email")?.toLowerCase();
  const p = str(fd, "peran");
  if (!email || !p) return;
  if (p === "pengelola_utama" && peran !== "developer") gagal("/kelola/pengelola", "Hanya developer yang bisa menambah pengelola utama.");
  const { error } = await supabase.from("daftar_peran").upsert({ email, peran: p });
  if (error) gagal("/kelola/pengelola", error.message);
  // kalau orangnya sudah punya akun, langsung naikkan perannya
  await supabase.from("profil").update({ peran: p, disetujui: true, minta_pengelola: false }).ilike("email", email);
  revalidatePath("/kelola", "layout");
}

export async function simpanTarif(fd: FormData) {
  const { supabase } = await wajibAdmin();
  const { error } = await supabase.from("pengaturan").upsert({ kunci: "tarif_kelola_harian", nilai: num(fd, "tarif"), diubah: new Date().toISOString() });
  if (error) gagal("/kelola/biaya", error.message);
  revalidatePath("/kelola", "layout");
}

export async function ubahInvestor(fd: FormData) {
  const { supabase } = await wajibPengelola();
  const { error } = await supabase.from("investor")
    .update({ nama_panggilan: str(fd, "nama_panggilan"), catatan: str(fd, "catatan") }).eq("id", num(fd, "id"));
  if (error) gagal("/kelola/investor", error.message);
  revalidatePath("/kelola", "layout");
}
