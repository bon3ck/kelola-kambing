import { MetodeFields } from "@/components/Metode";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, tgl } from "@/lib/format";
import { Field, Pesan, hariIni } from "@/components/ui";
import { catatBiaya, hapus, simpanTarif } from "../actions";

export default async function BiayaBersama({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const { data } = await supabase.from("biaya").select("*").is("kambing_id", null).order("tanggal", { ascending: false });
  const { data: t } = await supabase.from("pengaturan").select("nilai").eq("kunci", "tarif_kelola_harian").maybeSingle();
  const tarif = t?.nilai;
  return (
    <>
      <h1>Biaya pengelola <span className="badge">opsional</span></h1>
      <p className="muted text-sm">
        Semua biaya ditanggung pengelola dan tidak mengurangi bagian investor. Halaman ini hanya untuk pembukuan pengelola, boleh diisi atau tidak.
        Biaya yang dicatat di sini, misalnya pakan seminggu untuk semua kambing, dibagi rata ke kambing yang sedang dipelihara pada tanggal itu.
      </p>
      <section className="card">
        <h2 className="mb-1">Tarif jasa kelola harian</h2>
        <p className="muted mb-3 text-xs">Dipakai untuk perkiraan biaya kelola di Ringkasan: tarif × jumlah hari × kambing yang dipelihara. Opsional.</p>
        <form action={simpanTarif} className="flex items-end gap-2">
          <Field label="Rp per kambing per hari"><input className="input" name="tarif" inputMode="numeric" defaultValue={String(tarif ?? "")} /></Field>
          <button className="btn-ghost">Simpan</button>
        </form>
      </section>
      <Pesan pesan={pesan} />
      <section className="card">
        <form action={catatBiaya} className="grid gap-2 sm:grid-cols-5">
          <Field label="Tanggal"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
          <Field label="Jenis">
            <select className="input" name="jenis"><option value="pakan">Pakan</option><option value="obat">Obat</option><option value="kelola">Jasa kelola</option><option value="lain">Lain-lain</option></select>
          </Field>
          <Field label="Jumlah (Rp)"><input className="input" name="jumlah" inputMode="numeric" required /></Field>
          <Field label="Keterangan"><input className="input" name="keterangan" placeholder="Rumput 1 minggu" /></Field>
          <MetodeFields />
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
