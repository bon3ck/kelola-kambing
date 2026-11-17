import Link from "next/link";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, namaJalur, tgl, type RingkasanInvestor , labelInvestor, type InvestorLabel } from "@/lib/format";
import { Pesan, hariIni } from "@/components/ui";
import { catatPembayaran, hapus } from "../actions";

export default async function BagiHasil({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data }, { data: bayar }] = await Promise.all([
    supabase.rpc("ringkasan_investor"),
    supabase.from("pembayaran").select("*, investor(nama,nama_panggilan,email), kambing(kode)").order("tanggal", { ascending: false }),
  ]);
  const rows = (data ?? []) as RingkasanInvestor[];
  const terjual = rows.filter((r) => r.total_hak !== null);
  return (
    <>
      <h1>Bagi hasil</h1>
      <p className="muted text-sm">Keuntungan = harga jual − harga beli (semua biaya ditanggung pengelola). Hak investor = modal + porsi keuntungan (Idul Adha 50%, resto/cafe dan bongkaran 30%), dibagi sesuai besar modal kalau patungan.</p>
      <Pesan pesan={pesan} />
      <section className="card overflow-x-auto">
        <h2 className="mb-3">Kambing terjual</h2>
        {terjual.length === 0 ? <p className="muted text-sm">Belum ada kambing terjual.</p> : (
          <table className="tbl">
            <thead><tr><th>Investor</th><th>Kambing</th><th>Jalur</th><th className="num">Modal</th><th className="num">Keuntungan</th><th className="num">Total hak</th><th className="num">Dibayar</th><th className="num">Sisa</th><th>Catat bayar</th></tr></thead>
            <tbody>
              {terjual.map((r) => (
                <tr key={`${r.investor_id}-${r.kambing_id}`}>
                  <td>{r.nama}</td>
                  <td><Link className="underline" href={`/kelola/kambing/${r.kambing_id}`}>{r.kode}</Link></td>
                  <td>{namaJalur(r.jalur)}</td>
                  <td className="num">{rupiah(r.modal)}</td>
                  <td className="num">{rupiah(r.bagian_keuntungan)}</td>
                  <td className="num font-semibold">{rupiah(r.total_hak)}</td>
                  <td className="num">{rupiah(r.sudah_dibayar)}</td>
                  <td className="num">{Number(r.sisa) <= 0 ? <span className="badge">lunas</span> : rupiah(r.sisa)}</td>
                  <td>
                    {Number(r.sisa) > 0 && (
                      <form action={catatPembayaran} className="flex gap-1">
                        <input type="hidden" name="investor_id" value={r.investor_id} />
                        <input type="hidden" name="kambing_id" value={r.kambing_id} />
                        <input type="hidden" name="tanggal" value={hariIni()} />
                        <input className="input w-32" name="jumlah" defaultValue={String(r.sisa)} inputMode="numeric" />
                        <select className="input w-24" name="metode" defaultValue="transfer"><option value="transfer">Transfer</option><option value="tunai">Tunai</option></select>
                        <button className="btn-ghost">Bayar</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card overflow-x-auto">
        <h2 className="mb-3">Riwayat pembayaran</h2>
        {(bayar ?? []).length === 0 ? <p className="muted text-sm">Belum ada pembayaran.</p> : (
          <table className="tbl">
            <tbody>
              {(bayar ?? []).map((b) => (
                <tr key={b.id}>
                  <td>{tgl(b.tanggal)}</td>
                  <td>{labelInvestor(b.investor as InvestorLabel | null)}</td>
                  <td>{(b.kambing as { kode: string } | null)?.kode}</td>
                  <td className="num">{rupiah(b.jumlah)}</td>
                  <td className="num"><form action={hapus}><input type="hidden" name="tabel" value="pembayaran" /><input type="hidden" name="id" value={b.id} /><button className="muted text-xs underline">hapus</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
