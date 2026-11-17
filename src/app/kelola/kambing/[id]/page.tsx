import Link from "next/link";
import { FotoInput } from "@/components/FotoInput";
import { notFound } from "next/navigation";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, kg, namaJalur, tgl, type RingkasanKambing } from "@/lib/format";
import { Field, Pesan, Pertumbuhan, hariIni } from "@/components/ui";
import {
  ubahKambing, gantiFoto, catatTimbang, catatKesehatan, catatBiaya, catatPenjualan, tambahPemilik, hapus,
} from "../../actions";

function Hapus({ tabel, id, kambingId }: { tabel: string; id: number; kambingId?: number }) {
  return (
    <form action={hapus} className="inline">
      <input type="hidden" name="tabel" value={tabel} />
      <input type="hidden" name="id" value={id} />
      {kambingId && <input type="hidden" name="kambing_id" value={kambingId} />}
      <button className="muted text-xs underline" title="Hapus">hapus</button>
    </form>
  );
}

export default async function DetailKambing({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ pesan?: string }>;
}) {
  const { id } = await params;
  const { pesan } = await searchParams;
  const kid = Number(id);
  const { supabase } = await wajibPengelola();
  const [{ data: k }, { data: ring }, { data: timbang }, { data: sehat }, { data: biaya }, { data: jual }, { data: pemilik }, { data: investor }] =
    await Promise.all([
      supabase.from("kambing").select("*").eq("id", kid).maybeSingle(),
      supabase.rpc("ringkasan_kambing"),
      supabase.from("timbang").select("*").eq("kambing_id", kid).order("tanggal"),
      supabase.from("kesehatan").select("*").eq("kambing_id", kid).order("tanggal", { ascending: false }),
      supabase.from("biaya").select("*").eq("kambing_id", kid).order("tanggal", { ascending: false }),
      supabase.from("penjualan").select("*").eq("kambing_id", kid).maybeSingle(),
      supabase.from("kepemilikan").select("id,modal,investor(id,nama)").eq("kambing_id", kid),
      supabase.from("investor").select("id,nama").order("nama"),
    ]);
  if (!k) notFound();
  const r = ((ring ?? []) as RingkasanKambing[]).find((x) => x.id === kid)!;
  const totalModal = (pemilik ?? []).reduce((s, p) => s + Number(p.modal), 0);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/kelola/kambing" className="muted text-sm">← Kambing</Link>
        <h1>{k.kode}</h1>
        <span className="badge">{k.jenis_kelamin}</span>
        <span className="badge">{namaJalur(k.jalur)}</span>
        <span className="badge">{k.status}</span>
      </div>
      <Pesan pesan={pesan} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-1">
          {k.foto_url && /* eslint-disable-next-line @next/next/no-img-element */
            <img src={k.foto_url} alt={`Foto ${k.kode}`} className="aspect-square w-full rounded-lg object-cover" />}
          <form action={gantiFoto} className="flex items-end gap-2">
            <input type="hidden" name="id" value={k.id} />
            <Field label={k.foto_url ? "Ganti foto" : "Tambah foto"}><FotoInput required /></Field>
            <button className="btn-ghost">Unggah</button>
          </form>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="muted">Ras</dt><dd>{k.ras ?? "-"}</dd>
            <dt className="muted">Tanggal beli</dt><dd>{tgl(k.tanggal_beli)}</dd>
            <dt className="muted">Harga beli</dt><dd>{rupiah(k.harga_beli)}</dd>
            <dt className="muted">Berat awal</dt><dd>{kg(k.berat_awal)}</dd>
            <dt className="muted">Berat terakhir</dt><dd>{kg(r?.berat_terakhir)}</dd>
          </dl>
          <form action={ubahKambing} className="grid grid-cols-2 gap-2">
            <input type="hidden" name="id" value={k.id} />
            <Field label="Jalur">
              <select className="input" name="jalur" defaultValue={k.jalur}>
                <option value="idul_adha">Idul Adha</option><option value="resto">Resto/cafe</option>
              </select>
            </Field>
            <Field label="Ras"><input className="input" name="ras" defaultValue={k.ras ?? ""} /></Field>
            <Field label="Catatan"><input className="input" name="catatan" defaultValue={k.catatan ?? ""} /></Field>
            <button className="btn-ghost col-span-2">Simpan perubahan</button>
          </form>
        </section>

        <section className="card space-y-3 lg:col-span-2">
          <h2>Biaya dan bagi hasil</h2>
          <table className="tbl">
            <tbody>
              <tr><td>Harga beli (modal)</td><td className="num">{rupiah(r.harga_beli)}</td></tr>
              <tr><td>Biaya langsung (pakan, obat, lain)</td><td className="num">{rupiah(r.biaya_langsung)}</td></tr>
              <tr><td>Biaya kesehatan</td><td className="num">{rupiah(r.biaya_kesehatan)}</td></tr>
              <tr><td>Bagian biaya bersama</td><td className="num">{rupiah(r.biaya_bersama)}</td></tr>
              <tr><td className="font-semibold">Total biaya</td><td className="num font-semibold">{rupiah(r.total_biaya)}</td></tr>
              <tr><td>Harga jual</td><td className="num">{rupiah(r.harga_jual)}</td></tr>
              <tr><td className="font-semibold">Keuntungan</td><td className="num font-semibold">{rupiah(r.keuntungan)}</td></tr>
              <tr><td>Bagian investor ({Math.round(r.porsi_investor * 100)}%)</td><td className="num">{rupiah(r.bagian_investor)}</td></tr>
              <tr><td>Bagian pengelola ({100 - Math.round(r.porsi_investor * 100)}%)</td><td className="num">{rupiah(r.bagian_pengelola)}</td></tr>
            </tbody>
          </table>
          {jual ? (
            <p className="text-sm">Terjual {tgl(jual.tanggal)} ke {jual.pembeli ?? "-"} seharga {rupiah(jual.harga_jual)}. <Hapus tabel="penjualan" id={jual.id} kambingId={kid} /></p>
          ) : (
            <form action={catatPenjualan} className="grid gap-2 sm:grid-cols-4">
              <input type="hidden" name="kambing_id" value={kid} />
              <Field label="Tanggal jual"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
              <Field label="Pembeli"><input className="input" name="pembeli" placeholder="Nama / resto" /></Field>
              <Field label="Harga jual (Rp)"><input className="input" name="harga_jual" inputMode="numeric" required /></Field>
              <div className="flex items-end"><button className="btn w-full">Catat penjualan</button></div>
            </form>
          )}
        </section>
      </div>

      <section className="card space-y-3">
        <h2>Investor</h2>
        {(pemilik ?? []).length === 0 ? <p className="muted text-sm">Belum ada investor untuk kambing ini.</p> : (
          <table className="tbl">
            <thead><tr><th>Investor</th><th className="num">Modal</th><th className="num">Porsi</th><th></th></tr></thead>
            <tbody>
              {(pemilik ?? []).map((p) => {
                const inv = p.investor as unknown as { id: number; nama: string };
                return (
                  <tr key={p.id}>
                    <td>{inv?.nama}</td>
                    <td className="num">{rupiah(p.modal)}</td>
                    <td className="num">{totalModal ? Math.round((Number(p.modal) / totalModal) * 1000) / 10 : 0}%</td>
                    <td className="num"><Hapus tabel="kepemilikan" id={p.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <form action={tambahPemilik} className="grid gap-2 sm:grid-cols-4">
          <input type="hidden" name="kambing_id" value={kid} />
          <Field label="Investor">
            <select className="input" name="investor_id" required>
              {(investor ?? []).map((i) => <option key={i.id} value={i.id}>{i.nama}</option>)}
            </select>
          </Field>
          <Field label="Modal (Rp)"><input className="input" name="modal" inputMode="numeric" required defaultValue={totalModal ? "" : String(k.harga_beli)} /></Field>
          <div className="flex items-end"><button className="btn-ghost w-full">+ Tambah investor</button></div>
        </form>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card space-y-3">
          <h2>Timbang</h2>
          <Pertumbuhan data={(timbang ?? []).map((t) => ({ tanggal: t.tanggal, berat: Number(t.berat) }))} />
          <form action={catatTimbang} className="grid grid-cols-3 gap-2">
            <input type="hidden" name="kambing_id" value={kid} />
            <Field label="Tanggal"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
            <Field label="Berat (kg)"><input className="input" name="berat" inputMode="decimal" required /></Field>
            <div className="flex items-end"><button className="btn w-full">Catat</button></div>
          </form>
          <table className="tbl">
            <tbody>
              {[...(timbang ?? [])].reverse().map((t) => (
                <tr key={t.id}><td>{tgl(t.tanggal)}</td><td className="num">{kg(t.berat)}</td><td className="num"><Hapus tabel="timbang" id={t.id} /></td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card space-y-3">
          <h2>Kesehatan</h2>
          <form action={catatKesehatan} className="grid grid-cols-2 gap-2">
            <input type="hidden" name="kambing_id" value={kid} />
            <Field label="Tanggal"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
            <Field label="Keluhan / tindakan"><input className="input" name="keterangan" required placeholder="Vaksin, cacingan…" /></Field>
            <Field label="Obat"><input className="input" name="obat" /></Field>
            <Field label="Dosis"><input className="input" name="dosis" /></Field>
            <Field label="Biaya (Rp)"><input className="input" name="biaya" inputMode="numeric" defaultValue="0" /></Field>
            <div className="flex items-end"><button className="btn w-full">Catat</button></div>
          </form>
          <table className="tbl">
            <tbody>
              {(sehat ?? []).map((s) => (
                <tr key={s.id}>
                  <td>{tgl(s.tanggal)}</td>
                  <td className="whitespace-normal">{s.keterangan}{s.obat ? ` · ${s.obat}` : ""}{s.dosis ? ` (${s.dosis})` : ""}</td>
                  <td className="num">{rupiah(s.biaya)}</td>
                  <td className="num"><Hapus tabel="kesehatan" id={s.id} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="card space-y-3">
        <h2>Biaya khusus kambing ini</h2>
        <p className="muted text-xs">Pakan untuk semua kambing dicatat di menu Biaya bersama, lalu dibagi rata otomatis.</p>
        <form action={catatBiaya} className="grid gap-2 sm:grid-cols-5">
          <input type="hidden" name="kambing_id" value={kid} />
          <Field label="Tanggal"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
          <Field label="Jenis">
            <select className="input" name="jenis"><option value="pakan">Pakan</option><option value="obat">Obat</option><option value="lain">Lain-lain</option></select>
          </Field>
          <Field label="Jumlah (Rp)"><input className="input" name="jumlah" inputMode="numeric" required /></Field>
          <Field label="Keterangan"><input className="input" name="keterangan" /></Field>
          <div className="flex items-end"><button className="btn w-full">Catat</button></div>
        </form>
        <table className="tbl">
          <tbody>
            {(biaya ?? []).map((b) => (
              <tr key={b.id}><td>{tgl(b.tanggal)}</td><td>{b.jenis}</td><td>{b.keterangan ?? ""}</td><td className="num">{rupiah(b.jumlah)}</td><td className="num"><Hapus tabel="biaya" id={b.id} /></td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
