import { wajibPengelola } from "@/lib/auth";
import { rupiah, type RingkasanInvestor } from "@/lib/format";
import { Field, Pesan } from "@/components/ui";
import { tambahInvestor } from "../actions";

export default async function Investor({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data: inv }, { data: ring }] = await Promise.all([
    supabase.from("investor").select("*").order("nama"),
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
            <thead><tr><th>Nama</th><th>WhatsApp</th><th>Email</th><th>Akun</th><th className="num">Kambing</th><th className="num">Total modal</th></tr></thead>
            <tbody>
              {(inv ?? []).map((i) => {
                const milik = rows.filter((r) => r.investor_id === i.id);
                return (
                  <tr key={i.id}>
                    <td>{i.nama}</td>
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
        <p className="muted mb-3 text-xs">Investor bisa melihat kambingnya setelah mendaftar di halaman login dengan email yang sama.</p>
        <form action={tambahInvestor} className="grid gap-2 sm:grid-cols-5">
          <Field label="Nama"><input className="input" name="nama" required /></Field>
          <Field label="Email (untuk login)"><input className="input" type="email" name="email" /></Field>
          <Field label="No. WhatsApp"><input className="input" name="no_wa" inputMode="tel" placeholder="0812…" /></Field>
          <Field label="Rekening"><input className="input" name="rekening" placeholder="BCA 123… a.n. …" /></Field>
          <div className="flex items-end"><button className="btn w-full">Simpan</button></div>
        </form>
      </section>
    </>
  );
}
