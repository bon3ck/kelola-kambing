import { wajibPengelola } from "@/lib/auth";
import { rupiah, tgl } from "@/lib/format";
import { Field, Pesan, hariIni } from "@/components/ui";
import { catatBiaya, hapus } from "../actions";

export default async function BiayaBersama({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const { data } = await supabase.from("biaya").select("*").is("kambing_id", null).order("tanggal", { ascending: false });
  return (
    <>
      <h1>Biaya bersama</h1>
      <p className="muted text-sm">Biaya untuk semua kambing, misalnya pakan mingguan atau gaji kandang. Setiap biaya dibagi rata ke kambing yang sedang dipelihara pada tanggal itu.</p>
      <Pesan pesan={pesan} />
      <section className="card">
        <form action={catatBiaya} className="grid gap-2 sm:grid-cols-5">
          <Field label="Tanggal"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
          <Field label="Jenis">
            <select className="input" name="jenis"><option value="pakan">Pakan</option><option value="obat">Obat</option><option value="lain">Lain-lain</option></select>
          </Field>
          <Field label="Jumlah (Rp)"><input className="input" name="jumlah" inputMode="numeric" required /></Field>
          <Field label="Keterangan"><input className="input" name="keterangan" placeholder="Rumput 1 minggu" /></Field>
          <div className="flex items-end"><button className="btn w-full">Catat</button></div>
        </form>
      </section>
      <section className="card overflow-x-auto">
        {(data ?? []).length === 0 ? <p className="muted text-sm">Belum ada biaya bersama.</p> : (
          <table className="tbl">
            <thead><tr><th>Tanggal</th><th>Jenis</th><th>Keterangan</th><th className="num">Jumlah</th><th></th></tr></thead>
            <tbody>
              {(data ?? []).map((b) => (
                <tr key={b.id}>
                  <td>{tgl(b.tanggal)}</td><td>{b.jenis}</td><td>{b.keterangan ?? ""}</td><td className="num">{rupiah(b.jumlah)}</td>
                  <td className="num">
                    <form action={hapus}><input type="hidden" name="tabel" value="biaya" /><input type="hidden" name="id" value={b.id} /><button className="muted text-xs underline">hapus</button></form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
