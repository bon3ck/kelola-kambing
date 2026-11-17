import Link from "next/link";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, tgl, labelInvestor } from "@/lib/format";
import { Field, Foto, Pesan, hariIni } from "@/components/ui";
import { FotoInput } from "@/components/FotoInput";
import { buatBorongan } from "../actions";

export default async function Borongan({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data: daftar }, { data: kambing }, { data: investor }] = await Promise.all([
    supabase.from("borongan").select("*").order("tanggal_beli", { ascending: false }),
    supabase.from("kambing").select("borongan_id,status").not("borongan_id", "is", null),
    supabase.from("investor").select("id,nama,nama_panggilan,email").order("id"),
  ]);
  const terjual = (id: number) => (kambing ?? []).filter((k) => k.borongan_id === id && k.status === "terjual").length;

  return (
    <>
      <h1>Bongkaran</h1>
      <p className="muted text-sm">
        Beli kambing borongan dari peternak lain dengan dana investor, lalu jual kembali dengan cepat. Bagi hasil: investor 30%, pengelola 70%.
        Setiap borongan otomatis dipecah menjadi kambing satu per satu, dengan harga beli dibagi rata.
      </p>
      <Pesan pesan={pesan} />
      <section className="card overflow-x-auto">
        {(daftar ?? []).length === 0 ? <p className="muted text-sm">Belum ada borongan.</p> : (
          <table className="tbl">
            <thead><tr><th>Borongan</th><th>Tanggal</th><th>Penjual</th><th className="num">Ekor</th><th className="num">Harga total</th><th className="num">Terjual</th></tr></thead>
            <tbody>
              {(daftar ?? []).map((b) => (
                <tr key={b.id}>
                  <td><Link className="flex items-center gap-2 underline" href={`/kelola/borongan/${b.id}`}><Foto url={b.foto_url} />{b.kode}</Link></td>
                  <td>{tgl(b.tanggal_beli)}</td><td>{b.penjual ?? "-"}</td>
                  <td className="num">{b.jumlah_ekor}</td><td className="num">{rupiah(b.harga_total)}</td>
                  <td className="num">{terjual(b.id)}/{b.jumlah_ekor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card">
        <h2 className="mb-3">Catat borongan baru</h2>
        <form action={buatBorongan} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4"><Field label="Foto rombongan kambing (identitas)"><FotoInput required /></Field></div>
          <Field label="Kode (opsional, otomatis BR-001)"><input className="input" name="kode" /></Field>
          <Field label="Tanggal beli"><input className="input" type="date" name="tanggal_beli" defaultValue={hariIni()} required /></Field>
          <Field label="Penjual / peternak"><input className="input" name="penjual" placeholder="Pak Darmo, Boyolali" /></Field>
          <Field label="Jenis kelamin (mayoritas)">
            <select className="input" name="jenis_kelamin"><option value="jantan">Jantan</option><option value="betina">Betina</option></select>
          </Field>
          <Field label="Jumlah ekor"><input className="input" name="jumlah_ekor" inputMode="numeric" required placeholder="10" /></Field>
          <Field label="Harga total (Rp)"><input className="input" name="harga_total" inputMode="numeric" required placeholder="25000000" /></Field>
          <div className="sm:col-span-2"><Field label="Catatan"><input className="input" name="catatan" /></Field></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:col-span-2">
              <Field label={`Investor ${i}${i > 1 ? " (opsional)" : ""}`}>
                <select className="input" name={`investor_${i}`} defaultValue="">
                  <option value="">-</option>
                  {(investor ?? []).map((v) => <option key={v.id} value={v.id}>{labelInvestor(v)}</option>)}
                </select>
              </Field>
              <Field label="Modal (Rp)"><input className="input" name={`modal_${i}`} inputMode="numeric" /></Field>
            </div>
          ))}
          <div className="flex items-end sm:col-span-2 lg:col-span-4"><button className="btn">Simpan borongan</button></div>
        </form>
      </section>
    </>
  );
}
