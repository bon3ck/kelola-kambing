import { wajibPengelola } from "@/lib/auth";
import { rupiah, type RingkasanInvestor } from "@/lib/format";
import { Field, Pesan } from "@/components/ui";
import { tambahInvestor, ubahInvestor } from "../actions";

export default async function Investor({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data: inv }, { data: ring }] = await Promise.all([
    supabase.from("investor").select("*").order("id"),
    supabase.rpc("ringkasan_investor"),
  ]);
  const rows = (ring ?? []) as RingkasanInvestor[];
  return (
    <>
      <h1>Investor</h1>
      <Pesan pesan={pesan} />
      <section className="card overflow-x-auto">
        {(inv ?? []).length === 0 ? <p className="muted text-sm">Belum ada investor.</p> : (
          <table className="tbl">
            <thead><tr><th>Nama (diisi investor)</th><th>Panggilan / catatan</th><th>WhatsApp</th><th>Email</th><th>Akun</th><th className="num">Kambing</th><th className="num">Total modal</th></tr></thead>
            <tbody>
              {(inv ?? []).map((i) => {
                const milik = rows.filter((r) => r.investor_id === i.id);
                return (
                  <tr key={i.id}>
                    <td>{i.nama ?? <span className="muted text-xs">belum diisi</span>}</td>
                    <td className="whitespace-normal">
                      <form action={ubahInvestor} className="flex gap-1">
                        <input type="hidden" name="id" value={i.id} />
                        <input className="input w-28" name="nama_panggilan" defaultValue={i.nama_panggilan ?? ""} placeholder="Panggilan" />
                        <input className="input w-40" name="catatan" defaultValue={i.catatan ?? ""} placeholder="Catatan" />
                        <button className="btn-ghost">Simpan</button>
                      </form>
                    </td>
                    <td>{i.no_wa ? <a className="underline" href={`https://wa.me/${i.no_wa.replace(/\D/g, "").replace(/^0/, "62")}`}>{i.no_wa}</a> : "-"}</td>
                    <td>{i.email ?? "-"}</td>
                    <td>{i.user_id ? <span className="badge">aktif</span> : <span className="muted text-xs">belum daftar</span>}</td>
                    <td className="num">{milik.length}</td>
                    <td className="num">{rupiah(milik.reduce((s, r) => s + Number(r.modal), 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
      <section className="card">
        <h2 className="mb-1">Tambah investor</h2>
        <p className="muted mb-3 text-xs">
          Cukup isi email dan WhatsApp. Investor mengisi nama lengkapnya sendiri setelah mendaftar dengan email yang sama.
          Nama panggilan dan catatan membantu pengelola supaya tidak salah orang.
        </p>
        <form action={tambahInvestor} className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Nama panggilan (opsional)"><input className="input" name="nama_panggilan" placeholder="Pak Kardono" /></Field>
          <Field label="Email (untuk login)"><input className="input" type="email" name="email" required /></Field>
          <Field label="No. WhatsApp"><input className="input" name="no_wa" inputMode="tel" placeholder="0812…" /></Field>
          <Field label="Rekening"><input className="input" name="rekening" placeholder="BCA 123… a.n. …" /></Field>
          <Field label="Catatan (opsional)"><input className="input" name="catatan" placeholder="Teman Pak Bilal" /></Field>
          <div className="flex items-end"><button className="btn w-full">Simpan</button></div>
        </form>
      </section>
    </>
  );
}
