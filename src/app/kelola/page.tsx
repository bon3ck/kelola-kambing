import Link from "next/link";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, kg, namaJalur, type RingkasanKambing } from "@/lib/format";
import { Foto, Stat } from "@/components/ui";
import { hitungSaldo } from "@/lib/kas";

export default async function Dashboard() {
  const { supabase } = await wajibPengelola();
  const { data } = await supabase.rpc("ringkasan_kambing");
  const rows = (data ?? []) as RingkasanKambing[];
  const aktif = rows.filter((r) => r.status === "dipelihara");
  const terjual = rows.filter((r) => r.status === "terjual");
  const sum = (a: RingkasanKambing[], f: (r: RingkasanKambing) => number | null) => a.reduce((s, r) => s + Number(f(r) ?? 0), 0);
  const { data: foto } = await supabase.from("kambing").select("id,foto_url");
  const fotoOf = new Map((foto ?? []).map((f) => [f.id, f.foto_url as string | null]));
  const { data: t } = await supabase.from("pengaturan").select("nilai").eq("kunci", "tarif_kelola_harian").maybeSingle();
  const tarif = t?.nilai;
  const { count: nInvestor } = await supabase.from("investor").select("*", { count: "exact", head: true });

  const [{ data: kas }, { data: kp }, { count: nTawaran }] = await Promise.all([
    supabase.from("kas").select("jenis,jumlah,metode,investor_id"),
    supabase.from("kepemilikan").select("investor_id,modal"),
    supabase.from("permintaan_dana").select("*", { count: "exact", head: true }).eq("status", "terbuka"),
  ]);
  const saldo = hitungSaldo(kas ?? [], kp ?? []);

  return (
    <>
      <h1>Ringkasan</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Kambing dipelihara" value={String(aktif.length)}
          sub={`${aktif.filter((r) => r.jalur === "idul_adha").length} Idul Adha · ${aktif.filter((r) => r.jalur === "resto").length} resto`} />
        <Stat label="Modal di kandang" value={rupiah(sum(aktif, (r) => r.harga_beli))} sub={`${nInvestor ?? 0} investor`} />
        <Stat label="Biaya pengelola (opsional)" value={rupiah(sum(aktif, (r) => r.total_biaya))}
          sub={tarif ? `+ perkiraan jasa kelola ${rupiah(aktif.reduce((s, r) => s + Math.max(0, Math.floor((Date.now() - new Date(r.tanggal_beli).getTime()) / 864e5)) * Number(tarif), 0))}` : "tidak mengurangi bagian investor"} />
        <Stat label="Keuntungan terealisasi" value={rupiah(sum(terjual, (r) => r.keuntungan))}
          sub={`investor ${rupiah(sum(terjual, (r) => r.bagian_investor))} · pengelola ${rupiah(sum(terjual, (r) => r.bagian_pengelola))}`} />
      </div>
      <Link href="/kelola/kas" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Saldo tunai" value={rupiah(saldo.tunai)} sub="lihat Buku kas" />
        <Stat label="Saldo rekening" value={rupiah(saldo.transfer)} />
        <Stat label="Dana investor belum terpakai" value={rupiah(saldo.totalBelumTerpakai)} />
        <Stat label="Penawaran dana terbuka" value={String(nTawaran ?? 0)} />
      </Link>
      <section className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between">
          <h2>Kambing dipelihara</h2>
          <Link href="/kelola/kambing" className="btn-ghost">+ Tambah kambing</Link>
        </div>
        {aktif.length === 0 ? <p className="muted text-sm">Belum ada kambing. Tambahkan dari menu Kambing.</p> : (
          <table className="tbl">
            <thead><tr><th>Kambing</th><th>Jalur</th><th className="num">Berat awal</th><th className="num">Berat terakhir</th><th className="num">Naik</th><th className="num">Modal</th></tr></thead>
            <tbody>
              {aktif.map((r) => (
                <tr key={r.id}>
                  <td><Link className="flex items-center gap-2 underline" href={`/kelola/kambing/${r.id}`}><Foto url={fotoOf.get(r.id)} />{r.kode} <span className="muted no-underline">{r.jenis_kelamin}</span></Link></td>
                  <td>{namaJalur(r.jalur)}</td>
                  <td className="num">{kg(r.berat_awal)}</td>
                  <td className="num">{kg(r.berat_terakhir)}</td>
                  <td className="num">{r.berat_awal && r.berat_terakhir ? kg(Number(r.berat_terakhir) - Number(r.berat_awal)) : "-"}</td>
                  <td className="num">{rupiah(r.harga_beli)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {terjual.length > 0 && (
        <p className="muted text-sm">Juga ada {terjual.length} kambing terjual. Lihat di menu Kambing.</p>
      )}
    </>
  );
}
