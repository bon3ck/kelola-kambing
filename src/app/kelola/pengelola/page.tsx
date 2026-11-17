import { wajibAdmin, namaPeran, type Peran } from "@/lib/auth";
import { Field, Pesan } from "@/components/ui";
import { tgl } from "@/lib/format";
import { putuskanPengelola, daftarkanEmailPeran } from "../actions";

export default async function Pengelola({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase, peran } = await wajibAdmin();
  const [{ data: profil }, { data: daftar }] = await Promise.all([
    supabase.from("profil").select("user_id,email,peran,disetujui,minta_pengelola,dibuat").order("dibuat"),
    supabase.from("daftar_peran").select("email,peran").order("email"),
  ]);
  const menunggu = (profil ?? []).filter((p) => p.minta_pengelola && !p.disetujui);
  const staf = (profil ?? []).filter((p) => p.peran !== "investor" && p.disetujui);
  const sudahDaftar = new Set((profil ?? []).map((p) => p.email.toLowerCase()));
  const belumDaftar = (daftar ?? []).filter((d) => !sudahDaftar.has(d.email));

  return (
    <>
      <h1>Pengelola</h1>
      <Pesan pesan={pesan} />
      <section className="card space-y-3">
        <h2>Menunggu persetujuan</h2>
        {menunggu.length === 0 ? <p className="muted text-sm">Tidak ada permintaan.</p> : (
          <table className="tbl">
            <tbody>
              {menunggu.map((p) => (
                <tr key={p.user_id}>
                  <td>{p.email}</td>
                  <td className="muted">daftar {tgl(p.dibuat.slice(0, 10))}</td>
                  <td className="num">
                    <form action={putuskanPengelola} className="inline-flex gap-2">
                      <input type="hidden" name="user_id" value={p.user_id} />
                      <button className="btn" name="keputusan" value="setuju">Setujui</button>
                      <button className="btn-ghost" name="keputusan" value="tolak">Tolak (jadikan investor)</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card space-y-3">
        <h2>Tim pengelola</h2>
        <table className="tbl">
          <tbody>
            {staf.map((p) => (
              <tr key={p.user_id}><td>{p.email}</td><td><span className="badge">{namaPeran[p.peran as Peran]}</span></td></tr>
            ))}
            {belumDaftar.map((d) => (
              <tr key={d.email}><td>{d.email}</td><td><span className="badge">{namaPeran[d.peran as Peran]}</span> <span className="muted text-xs">belum mendaftar</span></td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2 className="mb-1">Daftarkan email pengelola</h2>
        <p className="muted mb-3 text-xs">Email ini langsung dikenali saat orangnya mendaftar, tanpa perlu persetujuan lagi.</p>
        <form action={daftarkanEmailPeran} className="grid gap-2 sm:grid-cols-3">
          <Field label="Email"><input className="input" type="email" name="email" required /></Field>
          <Field label="Peran">
            <select className="input" name="peran" defaultValue="pengelola">
              <option value="pengelola">Pengelola</option>
              {peran === "developer" && <option value="pengelola_utama">Pengelola utama</option>}
            </select>
          </Field>
          <div className="flex items-end"><button className="btn w-full">Simpan</button></div>
        </form>
      </section>
    </>
  );
}
