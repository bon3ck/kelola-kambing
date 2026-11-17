import { ambilPermintaan, isiNama } from "./actions";
import { buktiUrls, jenisKas } from "@/lib/kas";
import { redirect } from "next/navigation";
import { getSesi } from "@/lib/auth";
import { Nav } from "@/components/Nav";
import { Foto, Stat, Pertumbuhan } from "@/components/ui";
import { rupiah, kg, namaJalur, namaStatus, tgl, type RingkasanKambing, type RingkasanInvestor } from "@/lib/format";

export default async function Portal({ searchParams }: { searchParams: Promise<{ ambil?: string }> }) {
  const { ambil } = await searchParams;
  const { supabase, user, staf, menunggu } = await getSesi();
  if (menunggu) redirect("/menunggu");
  const peran = staf ? "pengelola" : "investor";
  const [{ data: inv }, { data: rk }, { data: ri }, { data: timbang }, { data: sehat }] = await Promise.all([
    supabase.from("investor").select("id,nama").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("ringkasan_kambing"),
    supabase.rpc("ringkasan_investor"),
    supabase.from("timbang").select("kambing_id,tanggal,berat").order("tanggal"),
    supabase.from("kesehatan").select("kambing_id,tanggal,keterangan").order("tanggal", { ascending: false }),
  ]);
  const { data: foto } = await supabase.from("kambing").select("id,foto_url");
  const { data: kabar } = await supabase.from("perubahan_jalur").select("*").order("dibuat", { ascending: false }).limit(20);
  const { data: tawaran } = await supabase.from("permintaan_dana").select("*").order("dibuat", { ascending: false });
  const { data: kas } = await supabase.from("kas").select("*").order("tanggal", { ascending: false });
  const urls = await buktiUrls(supabase, (kas ?? []).map((r) => r.bukti_path));
  const terbuka = (tawaran ?? []).filter((p) => p.status === "terbuka");
  const punyaku = (tawaran ?? []).filter((p) => inv && p.diambil_oleh === inv.id);
  const fotoOf = new Map((foto ?? []).map((f) => [f.id, f.foto_url as string | null]));
  const milik = (ri ?? []) as RingkasanInvestor[];
  const kambing = new Map(((rk ?? []) as RingkasanKambing[]).map((k) => [k.id, k]));
  const sum = (f: (r: RingkasanInvestor) => number | null) => milik.reduce((s, r) => s + Number(f(r) ?? 0), 0);

  return (
    <>
      <Nav peran={peran} email={user.email} />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <h1>Halo{inv?.nama ? `, ${inv.nama}` : ""}</h1>
        {inv && !inv.nama && (
          <form action={isiNama} className="card flex flex-wrap items-end gap-2">
            <div className="grow">
              <label className="label" htmlFor="nama">Lengkapi nama lengkap Anda supaya pengelola mengenali Anda</label>
              <input className="input" id="nama" name="nama" required placeholder="Nama sesuai KTP" />
            </div>
            <button className="btn">Simpan</button>
          </form>
        )}
        {ambil === "ok" && <p className="card text-sm" style={{ borderColor: "var(--accent)" }}>Berhasil. Penawaran ini sekarang milik Anda. Pengelola akan menghubungi Anda untuk penyerahan dana.</p>}
        {ambil === "gagal" && <p className="card text-sm" style={{ borderColor: "#c0563b" }}>Maaf, penawaran ini sudah diambil investor lain atau sudah ditutup.</p>}
        {inv && (terbuka.length > 0 || punyaku.length > 0) && (
          <section className="card space-y-3">
            <h2>Penawaran investasi</h2>
            {terbuka.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 text-sm">
                <div className="grow">
                  <b>{p.judul}</b> <span className="badge">{namaJalur(p.jalur)}</span>
                  <div>{rupiah(p.nominal)}{p.jumlah_ekor ? ` · ${p.jumlah_ekor} ekor` : ""}{p.keterangan ? ` · ${p.keterangan}` : ""}</div>
                  <div className="muted text-xs">Bagian Anda {p.jalur === "idul_adha" ? "50%" : "30%"} dari keuntungan (harga jual − harga beli). Siapa cepat dia dapat.</div>
                </div>
                <form action={ambilPermintaan}><input type="hidden" name="id" value={p.id} /><button className="btn">Ambil</button></form>
              </div>
            ))}
            {punyaku.map((p) => (
              <div key={p.id} className="muted text-sm">Sudah Anda ambil: {p.judul}, {rupiah(p.nominal)} ({tgl(p.diambil_pada)})</div>
            ))}
          </section>
        )}
        {milik.length === 0 ? (
          <p className="card text-sm">Belum ada kambing atas nama Anda. Kalau Anda sudah berinvestasi, minta pengelola mendaftarkan email {user.email}.</p>
        ) : (
          <>
            {(kabar ?? []).length > 0 && (
              <section className="card space-y-3" style={{ borderColor: "var(--accent)" }}>
                <h2>Pemberitahuan</h2>
                {(kabar ?? []).map((r) => (
                  <div key={r.id} className="flex gap-3 text-sm">
                    <Foto url={r.foto_url} size={72} />
                    <div>
                      <div>
                        {tgl(r.tanggal)}: {kambing.get(r.kambing_id)?.kode} pindah dari {namaJalur(r.dari)} ke <b>{namaJalur(r.ke)}</b>
                        {r.darurat && <span className="badge ml-1">darurat, dipotong lebih awal</span>}
                      </div>
                      <div>Alasan: {r.alasan}</div>
                      <div className="muted text-xs">Bagi hasil untuk Anda menjadi {r.ke === "idul_adha" ? "50%" : "30%"} dari keuntungan.</div>
                    </div>
                  </div>
                ))}
              </section>
            )}
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
            {(kas ?? []).length > 0 && (
              <section className="card overflow-x-auto">
                <h2 className="mb-2">Transaksi terkait Anda</h2>
                <table className="tbl">
                  <thead><tr><th>Tanggal</th><th>Jenis</th><th>Kambing</th><th>Metode</th><th>Bukti</th><th className="num">Jumlah</th></tr></thead>
                  <tbody>
                    {(kas ?? []).map((r) => {
                      const url = r.bukti_path ? urls.get(r.bukti_path) : null;
                      return (
                        <tr key={r.id}>
                          <td>{tgl(r.tanggal)}</td>
                          <td>{jenisKas[r.jenis]?.label ?? r.jenis}</td>
                          <td>{r.kambing_id ? kambing.get(r.kambing_id)?.kode : ""}</td>
                          <td>{r.metode === "transfer" ? "Transfer" : "Tunai"}</td>
                          <td>{url ? <a className="underline" href={url} target="_blank">lihat</a> : "-"}</td>
                          <td className="num">{rupiah(r.jumlah)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
