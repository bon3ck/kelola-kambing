import Link from "next/link";
import { FotoInput } from "@/components/FotoInput";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, kg, namaJalur, namaStatus, tgl, type RingkasanKambing } from "@/lib/format";
import { Field, Foto, Pesan, hariIni } from "@/components/ui";
import { tambahKambing } from "../actions";

export default async function DaftarKambing({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data }, { data: investor }] = await Promise.all([
    supabase.rpc("ringkasan_kambing"),
    supabase.from("investor").select("id,nama").order("nama"),
  ]);
  const { data: foto } = await supabase.from("kambing").select("id,foto_url");
  const fotoOf = new Map((foto ?? []).map((f) => [f.id, f.foto_url as string | null]));
  const rows = (data ?? []) as RingkasanKambing[];

  return (
    <>
      <h1>Kambing</h1>
      <Pesan pesan={pesan} />
      <section className="card overflow-x-auto">
        {rows.length === 0 ? <p className="muted text-sm">Belum ada kambing.</p> : (
          <table className="tbl">
            <thead><tr><th>Kambing</th><th>Kelamin</th><th>Jalur</th><th>Status</th><th>Tgl beli</th><th className="num">Berat</th><th className="num">Modal</th><th className="num">Biaya</th><th className="num">Harga jual</th><th className="num">Keuntungan</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link className="flex items-center gap-2 underline" href={`/kelola/kambing/${r.id}`}><Foto url={fotoOf.get(r.id)} />{r.kode}</Link></td>
                  <td>{r.jenis_kelamin}</td>
                  <td>{namaJalur(r.jalur)}</td>
                  <td><span className="badge">{namaStatus(r.status)}</span></td>
                  <td>{tgl(r.tanggal_beli)}</td>
                  <td className="num">{kg(r.berat_terakhir)}</td>
                  <td className="num">{rupiah(r.harga_beli)}</td>
                  <td className="num">{rupiah(r.total_biaya)}</td>
                  <td className="num">{rupiah(r.harga_jual)}</td>
                  <td className="num">{rupiah(r.keuntungan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h2 className="mb-3">Tambah kambing</h2>
        <form action={tambahKambing} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <Field label="Foto kambing (dipakai sebagai identitas)">
              <FotoInput required />
            </Field>
          </div>
          <Field label="Nama / kode (opsional, otomatis KB-001 dst.)"><input className="input" name="kode" placeholder="Si Belang" /></Field>
          <Field label="Jenis kelamin">
            <select className="input" name="jenis_kelamin" required defaultValue="jantan">
              <option value="jantan">Jantan</option><option value="betina">Betina</option>
            </select>
          </Field>
          <Field label="Jalur jual">
            <select className="input" name="jalur" required defaultValue="idul_adha">
              <option value="idul_adha">Idul Adha (50:50)</option><option value="resto">Resto/cafe (investor 30%)</option>
            </select>
          </Field>
          <Field label="Ras"><input className="input" name="ras" placeholder="Etawa, Jawa, Boer…" /></Field>
          <Field label="Tanggal beli"><input className="input" type="date" name="tanggal_beli" defaultValue={hariIni()} required /></Field>
          <Field label="Harga beli (Rp)"><input className="input" name="harga_beli" inputMode="numeric" required placeholder="3000000" /></Field>
          <Field label="Berat awal (kg)"><input className="input" name="berat_awal" inputMode="decimal" placeholder="25" /></Field>
          <Field label="Investor (modal = harga beli)">
            <select className="input" name="investor_id" defaultValue="">
              <option value="">Belum ada / atur nanti</option>
              {(investor ?? []).map((i) => <option key={i.id} value={i.id}>{i.nama}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Ciri-ciri / catatan"><input className="input" name="catatan" placeholder="Putih belang hitam, tanduk pendek" /></Field></div>
          <div className="flex items-end"><button className="btn w-full">Simpan</button></div>
        </form>
      </section>
    </>
  );
}
