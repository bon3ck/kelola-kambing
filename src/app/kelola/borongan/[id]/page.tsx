import { MetodeFields } from "@/components/Metode";
import Link from "next/link";
import { notFound } from "next/navigation";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, tgl, type RingkasanKambing } from "@/lib/format";
import { Field, Pesan, Stat, hariIni } from "@/components/ui";
import { jualBorongan } from "../../actions";

export default async function DetailBorongan({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ pesan?: string }>;
}) {
  const { id } = await params;
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data: b }, { data: ring }, { data: kb }] = await Promise.all([
    supabase.from("borongan").select("*").eq("id", Number(id)).maybeSingle(),
    supabase.rpc("ringkasan_kambing"),
    supabase.from("kambing").select("id").eq("borongan_id", Number(id)),
  ]);
  if (!b) notFound();
  const ids = new Set((kb ?? []).map((k) => k.id));
  const rows = ((ring ?? []) as RingkasanKambing[]).filter((r) => ids.has(r.id));
  const sisa = rows.filter((r) => r.status === "dipelihara").length;
  const sum = (f: (r: RingkasanKambing) => number | null) => rows.reduce((s, r) => s + Number(f(r) ?? 0), 0);

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/kelola/borongan" className="muted text-sm">← Bongkaran</Link>
        <h1>{b.kode}</h1>
        <span className="muted text-sm">{tgl(b.tanggal_beli)} · {b.penjual ?? "-"}</span>
      </div>
      <Pesan pesan={pesan} />
      {b.foto_url && /* eslint-disable-next-line @next/next/no-img-element */
        <img src={b.foto_url} alt={`Foto ${b.kode}`} className="max-h-72 rounded-lg object-cover" />}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Harga beli total" value={rupiah(b.harga_total)} sub={`${b.jumlah_ekor} ekor`} />
        <Stat label="Belum terjual" value={`${sisa} ekor`} />
        <Stat label="Hasil jual" value={rupiah(sum((r) => r.harga_jual))} />
        <Stat label="Keuntungan" value={rupiah(sum((r) => r.keuntungan))}
          sub={`investor ${rupiah(sum((r) => r.bagian_investor))} · pengelola ${rupiah(sum((r) => r.bagian_pengelola))}`} />
      </div>
      {sisa > 0 && (
        <section className="card">
          <h2 className="mb-1">Jual sisa {sisa} ekor sekaligus</h2>
          <p className="muted mb-3 text-xs">Harga dibagi rata ke kambing yang belum terjual. Untuk menjual satu per satu, buka kambingnya di tabel bawah.</p>
          <form action={jualBorongan} className="grid gap-2 sm:grid-cols-4">
            <input type="hidden" name="borongan_id" value={b.id} />
            <Field label="Tanggal jual"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
            <Field label="Pembeli"><input className="input" name="pembeli" /></Field>
            <Field label="Harga jual total (Rp)"><input className="input" name="harga_total" inputMode="numeric" required /></Field>
            <MetodeFields />
            <div className="flex items-end"><button className="btn w-full">Catat penjualan</button></div>
          </form>
        </section>
      )}
      <section className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Kambing</th><th>Status</th><th className="num">Harga beli</th><th className="num">Harga jual</th><th className="num">Keuntungan</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><Link className="underline" href={`/kelola/kambing/${r.id}`}>{r.kode}</Link></td>
                <td><span className="badge">{r.status}</span></td>
                <td className="num">{rupiah(r.harga_beli)}</td><td className="num">{rupiah(r.harga_jual)}</td><td className="num">{rupiah(r.keuntungan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
