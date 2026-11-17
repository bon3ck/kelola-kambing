import { MetodeFields } from "@/components/Metode";
import { wajibPengelola } from "@/lib/auth";
import { rupiah, tgl, labelInvestor } from "@/lib/format";
import { Field, Pesan, Stat, hariIni } from "@/components/ui";
import { buktiUrls, hitungSaldo, jenisKas } from "@/lib/kas";
import { hapusKas, tambahKas } from "../actions";

export default async function BukuKas({ searchParams }: { searchParams: Promise<{ pesan?: string; investor?: string; jumlah?: string; ket?: string; pid?: string }> }) {
  const sp = await searchParams;
  const { supabase, admin } = await wajibPengelola();
  const [{ data: kas }, { data: kp }, { data: inv }, { data: kb }] = await Promise.all([
    supabase.from("kas").select("*").order("tanggal", { ascending: false }).order("id", { ascending: false }),
    supabase.from("kepemilikan").select("investor_id,modal"),
    supabase.from("investor").select("id,nama,nama_panggilan,email").order("id"),
    supabase.from("kambing").select("id,kode"),
  ]);
  const rows = kas ?? [];
  const s = hitungSaldo(rows, kp ?? []);
  const invOf = new Map((inv ?? []).map((i) => [i.id, i]));
  const kodeOf = new Map((kb ?? []).map((k) => [k.id, k.kode as string]));
  const urls = await buktiUrls(supabase, rows.map((r) => r.bukti_path));
  const masuk = rows.filter((r) => jenisKas[r.jenis]?.arah === 1).reduce((a, r) => a + Number(r.jumlah), 0);
  const keluar = rows.filter((r) => jenisKas[r.jenis]?.arah === -1).reduce((a, r) => a + Number(r.jumlah), 0);

  return (
    <>
      <h1>Buku kas</h1>
      <p className="muted text-sm">
        Semua uang masuk dan keluar, tunai maupun transfer. Transaksi dari menu Kambing, Bongkaran, Bagi hasil dan Biaya otomatis tercatat di sini.
        Pakai form di bawah untuk uang yang tidak terkait kambing tertentu, misalnya modal masuk dari investor.
      </p>
      <Pesan pesan={sp.pesan} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Saldo tunai" value={rupiah(s.tunai)} sub="uang cash di tangan pengelola" />
        <Stat label="Saldo rekening" value={rupiah(s.transfer)} sub="dari transaksi transfer" />
        <Stat label="Dana investor belum terpakai" value={rupiah(s.totalBelumTerpakai)} sub="modal masuk yang belum jadi kambing" />
        <Stat label="Arus kas" value={rupiah(masuk - keluar)} sub={`masuk ${rupiah(masuk)} · keluar ${rupiah(keluar)}`} />
      </div>
      {s.belumTerpakai.some((b) => b.sisa > 0) && (
        <section className="card overflow-x-auto">
          <h2 className="mb-2">Dana investor belum terpakai</h2>
          <table className="tbl">
            <thead><tr><th>Investor</th><th className="num">Modal masuk</th><th className="num">Sudah jadi kambing</th><th className="num">Sisa</th></tr></thead>
            <tbody>
              {s.belumTerpakai.filter((b) => b.sisa > 0).map((b) => (
                <tr key={b.investor_id}><td>{labelInvestor(invOf.get(b.investor_id))}</td><td className="num">{rupiah(b.masuk)}</td><td className="num">{rupiah(b.terpakai)}</td><td className="num font-semibold">{rupiah(b.sisa)}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
      <section className="card">
        <h2 className="mb-1">Catat uang masuk / keluar</h2>
        <p className="muted mb-3 text-xs">Isi siapa yang memegang uangnya (untuk tunai). Foto nota opsional, dan uang tunai dari investor tidak perlu bukti foto.</p>
        <form action={tambahKas} className="grid gap-2 sm:grid-cols-3">
          {sp.pid && <input type="hidden" name="permintaan_id" value={sp.pid} />}
          <Field label="Tanggal"><input className="input" type="date" name="tanggal" defaultValue={hariIni()} required /></Field>
          <Field label="Jenis">
            <select className="input" name="jenis" defaultValue={sp.investor ? "modal_masuk" : "lain_keluar"}>
              {Object.entries(jenisKas).map(([k, v]) => <option key={k} value={k}>{v.arah === 1 ? "Masuk: " : "Keluar: "}{v.label}</option>)}
            </select>
          </Field>
          <Field label="Jumlah (Rp)"><input className="input" name="jumlah" inputMode="numeric" defaultValue={sp.jumlah ?? ""} required /></Field>
          <Field label="Investor (wajib untuk modal masuk)">
            <select className="input" name="investor_id" defaultValue={sp.investor ?? ""}>
              <option value="">-</option>
              {(inv ?? []).map((i) => <option key={i.id} value={i.id}>{labelInvestor(i)}</option>)}
            </select>
          </Field>
          <Field label="Dipegang oleh"><input className="input" name="dipegang_oleh" placeholder="nama pengelola yang pegang uang" /></Field>
          <Field label="Keterangan"><input className="input" name="keterangan" defaultValue={sp.ket ?? ""} placeholder="Modal Idul Adha 2 ekor" /></Field>
          <MetodeFields />
          <div className="flex items-end"><button className="btn w-full">Catat</button></div>
        </form>
      </section>
      <section className="card overflow-x-auto">
        <h2 className="mb-2">Riwayat</h2>
        {rows.length === 0 ? <p className="muted text-sm">Belum ada transaksi.</p> : (
          <table className="tbl">
            <thead><tr><th>Tanggal</th><th>Jenis</th><th>Terkait</th><th>Metode</th><th>Dipegang</th><th>Bukti</th><th className="num">Masuk</th><th className="num">Keluar</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => {
                const arah = jenisKas[r.jenis]?.arah ?? 0;
                const url = r.bukti_path ? urls.get(r.bukti_path) : null;
                return (
                  <tr key={r.id}>
                    <td>{tgl(r.tanggal)}</td>
                    <td>{jenisKas[r.jenis]?.label ?? r.jenis}{r.keterangan && <div className="muted text-xs">{r.keterangan}</div>}</td>
                    <td className="text-xs">{[r.kambing_id && kodeOf.get(r.kambing_id), r.investor_id && labelInvestor(invOf.get(r.investor_id))].filter(Boolean).join(" · ")}</td>
                    <td>{r.metode === "transfer" ? `Transfer${r.bank ? " " + r.bank : ""}` : "Tunai"}</td>
                    <td className="text-xs">{r.dipegang_oleh}</td>
                    <td>{url ? <a className="underline" href={url} target="_blank">lihat</a> : <span className="muted text-xs">-</span>}</td>
                    <td className="num">{arah === 1 ? rupiah(r.jumlah) : ""}</td>
                    <td className="num">{arah === -1 ? rupiah(r.jumlah) : ""}</td>
                    <td className="num">
                      {admin && !r.sumber_tabel && (
                        <form action={hapusKas}><input type="hidden" name="id" value={r.id} /><button className="muted text-xs underline">hapus</button></form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
