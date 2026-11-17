export const rupiah = (n: number | string | null | undefined) =>
  n === null || n === undefined || n === ""
    ? "-"
    : "Rp" + Math.round(Number(n)).toLocaleString("id-ID");

export const tgl = (d: string | null | undefined) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export const kg = (n: number | string | null | undefined) =>
  n === null || n === undefined ? "-" : Number(n).toLocaleString("id-ID") + " kg";

export const namaJalur = (j: string) =>
  ({ idul_adha: "Idul Adha", resto: "Resto/cafe", bongkaran: "Bongkaran" })[j] ?? j;
export const namaStatus = (s: string) =>
  ({ dipelihara: "Dipelihara", terjual: "Terjual" })[s] ?? s;

export type RingkasanKambing = {
  id: number; kode: string; jenis_kelamin: string; ras: string | null; jalur: string; status: string;
  tanggal_beli: string; harga_beli: number; berat_awal: number | null; berat_terakhir: number | null;
  tanggal_timbang: string | null; biaya_langsung: number; biaya_kesehatan: number; biaya_bersama: number;
  total_biaya: number; tanggal_jual: string | null; harga_jual: number | null; keuntungan: number | null;
  porsi_investor: number; bagian_investor: number | null; bagian_pengelola: number | null;
};

export type RingkasanInvestor = {
  investor_id: number; nama: string; kambing_id: number; kode: string; jalur: string; status: string;
  modal: number; persen_modal: number; bagian_keuntungan: number | null; total_hak: number | null;
  sudah_dibayar: number; sisa: number | null;
};

export type InvestorLabel = { nama?: string | null; nama_panggilan?: string | null; email?: string | null };
export const labelInvestor = (i: InvestorLabel | null | undefined) =>
  !i ? "-" : i.nama ? (i.nama_panggilan ? `${i.nama} (${i.nama_panggilan})` : i.nama) : (i.nama_panggilan ?? i.email ?? "(tanpa nama)");
