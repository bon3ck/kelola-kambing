import { redirect } from "next/navigation";
import { getSesi } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Foto, Stat, Pertumbuhan } from "@/components/ui";
import { rupiah, kg, namaJalur, namaStatus, tgl, type RingkasanKambing, type RingkasanInvestor } from "@/lib/format";

export default async function Portal() {
  const { supabase, user, staf, menunggu } = await getSesi();
  if (menunggu) redirect("/menunggu");
  const peran = staf ? "pengelola" : "investor";
  const [{ data: inv }, { data: rk }, { data: ri }, { data: timbang }, { data: sehat }] = await Promise.all([
    supabase.from("investor").select("nama").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("ringkasan_kambing"),
    supabase.rpc("ringkasan_investor"),
    supabase.from("timbang").select("kambing_id,tanggal,berat").order("tanggal"),
    supabase.from("kesehatan").select("kambing_id,tanggal,keterangan").order("tanggal", { ascending: false }),
  ]);
  const { data: foto } = await supabase.from("kambing").select("id,foto_url");
  const fotoOf = new Map((foto ?? []).map((f) => [f.id, f.foto_url as string | null]));
  const milik = (ri ?? []) as RingkasanInvestor[];
  const kambing = new Map(((rk ?? []) as RingkasanKambing[]).map((k) => [k.id, k]));
  const sum = (f: (r: RingkasanInvestor) => number | null) => milik.reduce((s, r) => s + Number(f(r) ?? 0), 0);

  return (
    <>
      <Nav peran={peran} email={user.email} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <h1>Halo{inv?.nama ? `, ${inv.nama}` : ""}</h1>
        {milik.length === 0 ? (
          <p className="card text-sm">Belum ada kambing atas nama Anda. Kalau Anda sudah berinvestasi, minta pengelola mendaftarkan email {user.email}.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Kambing" value={String(milik.length)} sub={`${milik.filter((m) => m.status === "dipelihara").length} masih dipelihara`} />
              <Stat label="Total modal" value={rupiah(sum((r) => r.modal))} />
              <Stat label="Keuntungan diterima" value={rupiah(sum((r) => r.bagian_keuntungan))} sub="dari kambing terjual" />
              <Stat label="Belum dibayar" value={rupiah(sum((r) => (r.sisa && r.sisa > 0 ? r.sisa : 0)))} />
            </div>
            {milik.map((m) => {
              const k = kambing.get(m.kambing_id)!;
              const t = (timbang ?? []).filter((x) => x.kambing_id === m.kambing_id).map((x) => ({ tanggal: x.tanggal, berat: Number(x.berat) }));
              const s = (sehat ?? []).filter((x) => x.kambing_id === m.kambing_id).slice(0, 3);
              return (
                <section key={m.kambing_id} className="card space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Foto url={fotoOf.get(m.kambing_id)} size={64} />
                    <h2>{m.kode}</h2>
                    <span className="badge">{k.jenis_kelamin}</span>
                    <span className="badge">{namaJalur(m.jalur)}</span>
                    <span className="badge">{namaStatus(m.status)}</span>
                    {Number(m.persen_modal) < 100 && <span className="muted text-xs">porsi Anda {m.persen_modal}%</span>}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm">Berat {kg(k.berat_awal)} → {kg(k.berat_terakhir)} {k.tanggal_timbang && <span className="muted">({tgl(k.tanggal_timbang)})</span>}</p>
                      <Pertumbuhan data={t} />
                      {s.length > 0 && (
                        <ul className="mt-2 text-sm">
                          {s.map((x, i) => <li key={i}><span className="muted">{tgl(x.tanggal)}</span> {x.keterangan}</li>)}
                        </ul>
                      )}
                    </div>
                    <table className="tbl self-start">
                      <tbody>
                        <tr><td>Modal Anda</td><td className="num">{rupiah(m.modal)}</td></tr>
                        <tr><td>Harga jual</td><td className="num">{k.harga_jual ? rupiah(k.harga_jual) : "belum terjual"}</td></tr>
                        <tr><td>Keuntungan kambing (jual − beli)</td><td className="num">{rupiah(k.keuntungan)}</td></tr>
                        <tr><td>Bagian Anda ({Math.round(k.porsi_investor * 100)}%)</td><td className="num">{rupiah(m.bagian_keuntungan)}</td></tr>
                        <tr><td className="font-semibold">Total hak (modal + bagian)</td><td className="num font-semibold">{rupiah(m.total_hak)}</td></tr>
                        <tr><td>Sudah dibayar</td><td className="num">{rupiah(m.sudah_dibayar)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </>
        )}
      </main>
    </>
  );
}
