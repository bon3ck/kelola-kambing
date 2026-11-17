import Link from "next/link";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, tgl, namaJalur, labelInvestor } from "@/lib/format";
import { Field, Pesan } from "@/components/ui";
import { batalkanPermintaan, buatPermintaan } from "../actions";

const APP = "https://kelola-kambing.vercel.app/portal";
const waNomor = (n?: string | null) => (n ?? "").replace(/\D/g, "").replace(/^0/, "62");

export default async function PermintaanDana({ searchParams }: { searchParams: Promise<{ pesan?: string }> }) {
  const { pesan } = await searchParams;
  const { supabase } = await wajibPengelola();
  const [{ data: list }, { data: target }, { data: inv }] = await Promise.all([
    supabase.from("permintaan_dana").select("*").order("dibuat", { ascending: false }),
    supabase.from("permintaan_target").select("*"),
    supabase.from("investor").select("id,nama,nama_panggilan,email,no_wa").order("id"),
  ]);
  const invOf = new Map((inv ?? []).map((i) => [i.id, i]));

  return (
    <>
      <h1>Permintaan dana</h1>
      <p className="muted text-sm">
        Tawarkan kebutuhan modal ke investor. Investor melihatnya di halaman mereka dan menekan <b>Ambil</b>. Penawaran hanya bisa diambil
        satu investor, siapa cepat dia dapat, jadi tidak ada investor dobel. Setelah diambil, catat uangnya di Buku kas saat diterima.
      </p>
      <Pesan pesan={pesan} />
      <section className="card">
        <h2 className="mb-3">Buat penawaran</h2>
        <form action={buatPermintaan} className="grid gap-2 sm:grid-cols-3">
          <Field label="Judul"><input className="input" name="judul" required placeholder="2 kambing jantan untuk Idul Adha" /></Field>
          <Field label="Jalur">
            <select className="input" name="jalur"><option value="idul_adha">Idul Adha (50:50)</option><option value="resto">Resto/cafe (investor 30%)</option><option value="bongkaran">Bongkaran (investor 30%)</option></select>
          </Field>
          <Field label="Jumlah kambing"><input className="input" name="jumlah_ekor" inputMode="numeric" placeholder="2" /></Field>
          <Field label="Dana yang dibutuhkan (Rp)"><input className="input" name="nominal" inputMode="numeric" required /></Field>
          <Field label="Keterangan"><input className="input" name="keterangan" placeholder="Beli di pasar Senin depan" /></Field>
          <Field label="Ditawarkan ke">
            <select className="input" name="untuk" defaultValue="semua"><option value="semua">Semua investor</option><option value="pilih">Investor yang dicentang</option></select>
          </Field>
          <fieldset className="sm:col-span-3">
            <legend className="label">Kalau pilih investor, centang di sini</legend>
            <div className="flex flex-wrap gap-3 text-sm">
              {(inv ?? []).map((i) => (
                <label key={i.id} className="flex items-center gap-1"><input type="checkbox" name="target" value={i.id} />{labelInvestor(i)}</label>
              ))}
            </div>
          </fieldset>
          <div><button className="btn">Kirim penawaran</button></div>
        </form>
      </section>
      <section className="card space-y-3">
        <h2>Daftar penawaran</h2>
        {(list ?? []).length === 0 && <p className="muted text-sm">Belum ada penawaran.</p>}
        {(list ?? []).map((p) => {
          const tg = (target ?? []).filter((t) => t.permintaan_id === p.id).map((t) => invOf.get(t.investor_id));
          const teks = `Penawaran investasi kambing: ${p.judul}, ${namaJalur(p.jalur)}, dana ${rupiah(p.nominal)}. Ambil di aplikasi: ${APP}`;
          const pengambil = p.diambil_oleh ? invOf.get(p.diambil_oleh) : null;
          return (
            <div key={p.id} className="border-t pt-3 text-sm" style={{ borderColor: "var(--line)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <b>{p.judul}</b>
                <span className="badge">{namaJalur(p.jalur)}</span>
                <span className="badge">{p.status === "terbuka" ? "terbuka" : p.status === "diambil" ? "sudah diambil" : "dibatalkan"}</span>
                <span className="muted">{tgl(p.dibuat)}</span>
              </div>
              <div>{rupiah(p.nominal)}{p.jumlah_ekor ? ` · ${p.jumlah_ekor} ekor` : ""}{p.keterangan ? ` · ${p.keterangan}` : ""}</div>
              <div className="muted text-xs">Ditawarkan ke: {p.untuk_semua ? "semua investor" : tg.map((i) => labelInvestor(i)).join(", ")}</div>
              {p.status === "diambil" && (
                <div className="mt-1">
                  Diambil oleh <b>{labelInvestor(pengambil)}</b> pada {tgl(p.diambil_pada)}.{" "}
                  <Link className="underline" href={`/kelola/kas?investor=${p.diambil_oleh}&jumlah=${p.nominal ?? ""}&ket=${encodeURIComponent("Modal: " + p.judul)}&pid=${p.id}`}>Catat dana masuk di Buku kas</Link>
                </div>
              )}
              {p.status === "terbuka" && (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {p.untuk_semua ? (
                    <a className="btn-ghost" target="_blank" href={`https://wa.me/?text=${encodeURIComponent(teks)}`}>Bagikan ke WhatsApp</a>
                  ) : tg.filter((i) => i?.no_wa).map((i) => (
                    <a key={i!.id} className="btn-ghost" target="_blank" href={`https://wa.me/${waNomor(i!.no_wa)}?text=${encodeURIComponent(teks)}`}>WA {labelInvestor(i)}</a>
                  ))}
                  <form action={batalkanPermintaan}><input type="hidden" name="id" value={p.id} /><button className="muted text-xs underline">batalkan</button></form>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </>
  );
}
