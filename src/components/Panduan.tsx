"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Langkah = { judul: string; isi: string[] };

// Penjelasan tiap halaman dan kolom yang perlu diisi. Muncul otomatis saat pertama kali membuka halaman.
const PANDUAN: Record<string, Langkah[]> = {
  "/portal": [
    { judul: "Selamat datang, investor", isi: ["Halaman ini khusus untuk Anda. Semua kambing yang Anda modali tampil di sini, lengkap dengan foto, berat, dan kesehatannya."] },
    { judul: "Isi nama lengkap", isi: ["Kalau muncul kolom nama, isi nama lengkap sesuai KTP. Pengelola memakainya untuk memastikan uang dan bagi hasil tidak tertukar dengan investor lain."] },
    { judul: "Penawaran investasi", isi: ["Saat pengelola butuh modal, penawaran muncul di sini.", "Tekan Ambil kalau Anda berminat. Satu penawaran hanya untuk satu investor, siapa cepat dia dapat.", "Setelah itu pengelola akan menghubungi Anda untuk penyerahan dana."] },
    { judul: "Kambing dan bagi hasil", isi: ["Setiap kambing menampilkan modal Anda, harga jual, dan bagian Anda.", "Bagian Anda = (harga jual − harga beli) × porsi: 50% untuk Idul Adha, 30% untuk resto/cafe dan Bongkaran.", "Biaya pakan, obat, dan jasa kelola ditanggung pengelola, tidak dipotong dari bagian Anda."] },
    { judul: "Pemberitahuan dan transaksi", isi: ["Kalau kambing harus dipotong lebih awal karena kondisinya menurun, Anda akan melihat pemberitahuan lengkap dengan foto dan alasannya.", "Di bagian Transaksi Anda bisa melihat uang masuk dan keluar terkait Anda, termasuk foto nota atau bukti transfernya."] },
  ],
  "/kelola": [
    { judul: "Selamat datang, pengelola", isi: ["Ringkasan menampilkan jumlah kambing, modal di kandang, saldo tunai dan rekening, serta dana investor yang belum dipakai.", "Tombol Panduan di atas bisa ditekan kapan saja untuk membuka penjelasan halaman yang sedang dibuka."] },
    { judul: "Urutan kerja", isi: ["1. Daftarkan investor di menu Investor.", "2. Tawarkan kebutuhan modal di Permintaan dana, atau catat modal masuk di Buku kas.", "3. Tambah kambing di menu Kambing, atau satu rombongan di Bongkaran.", "4. Timbang dan catat kesehatan secara rutin.", "5. Catat penjualan, lalu bayar investor di Bagi hasil."] },
  ],
  "/kelola/kambing": [
    { judul: "Tambah kambing", isi: ["Foto: wajib, karena kambing tidak memakai eartag. Ambil foto yang jelas dari samping supaya mudah dikenali.", "Kode: kosongkan saja, akan dibuat otomatis (KB-001, KB-002, …).", "Jenis kelamin dan jalur: jantan biasanya Idul Adha (50:50), betina biasanya resto/cafe (investor 30%).", "Tanggal beli, harga beli, dan berat awal: diisi sesuai nota pasar. Berat awal dipakai untuk grafik pertumbuhan.", "Investor: pilih pemodal kambing ini. Bisa ditambah lebih dari satu di halaman detail kambing.", "Tunai/transfer dan foto nota: supaya uang beli tercatat di Buku kas."] },
  ],
  "/kelola/kambing/[id]": [
    { judul: "Detail kambing", isi: ["Timbang: isi berat (kg) secara rutin, misalnya tiap 2 minggu. Investor melihat grafiknya.", "Kesehatan: catat gejala, obat, atau vaksin. Biaya obat opsional.", "Biaya: opsional, hanya untuk pembukuan pengelola. Tidak mengurangi bagian investor.", "Pemilik: investor dan modal masing-masing. Porsi dihitung dari besar modal.", "Ubah jalur: kalau kambing Idul Adha harus dipotong lebih awal, wajib lampirkan foto dan alasan. Investor otomatis diberi tahu.", "Penjualan: isi tanggal, harga jual, pembeli, dan tunai/transfer. Bagi hasil langsung dihitung."] },
  ],
  "/kelola/borongan": [
    { judul: "Bongkaran", isi: ["Untuk membeli satu rombongan kambing dari peternak lain lalu dijual cepat. Investor mendapat 30% keuntungan.", "Jumlah ekor dan total harga: aplikasi membuat kambing sebanyak itu dan membagi harganya rata.", "Investor: isi sampai 3 investor beserta modalnya. Modal dibagi ke tiap kambing secara proporsional.", "Foto nota dan metode bayar dicatat ke Buku kas."] },
  ],
  "/kelola/kas": [
    { judul: "Buku kas", isi: ["Saldo tunai: uang cash yang dipegang pengelola. Saldo rekening: uang dari transaksi transfer.", "Dana investor belum terpakai: modal yang sudah masuk tetapi belum dibelikan kambing.", "Transaksi dari menu lain otomatis masuk ke sini."] },
    { judul: "Mengisi transaksi manual", isi: ["Jenis: pilih masuk atau keluar. Untuk modal dari investor pilih Modal masuk dan pilih investornya.", "Jumlah: angka saja, tanpa titik juga boleh.", "Dipegang oleh: nama orang yang memegang uang tunainya.", "Tunai/transfer, bank, dan foto nota: foto nota sangat disarankan, terutama untuk belanja di pasar tradisional."] },
  ],
  "/kelola/permintaan": [
    { judul: "Permintaan dana", isi: ["Judul, jalur, jumlah kambing, dan dana yang dibutuhkan: tampil ke investor apa adanya.", "Ditawarkan ke: semua investor (siapa cepat dia dapat) atau hanya investor yang dicentang.", "Tombol WhatsApp membantu mengabari investor. Setelah diambil, klik Catat dana masuk saat uangnya diterima."] },
  ],
  "/kelola/investor": [
    { judul: "Investor", isi: ["Cukup isi email dan nomor WhatsApp. Nama lengkap diisi investor sendiri setelah mendaftar.", "Nama panggilan dan catatan: nama yang biasa Anda pakai untuk investor ini, supaya tidak salah orang.", "Saat investor mendaftar memakai email yang sama, akunnya otomatis tersambung."] },
  ],
  "/kelola/bagi-hasil": [
    { judul: "Bagi hasil", isi: ["Daftar hak tiap investor: modal kembali + bagian keuntungan.", "Bayar: isi jumlah yang dibayarkan, tunai atau transfer, dan foto bukti. Sisa yang belum dibayar akan berkurang."] },
  ],
  "/kelola/biaya": [
    { judul: "Biaya pengelola (opsional)", isi: ["Boleh diisi, boleh tidak. Biaya ditanggung pengelola dan tidak mengurangi bagian investor.", "Tarif jasa kelola harian dipakai untuk perkiraan di Ringkasan.", "Biaya bersama, misalnya pakan seminggu, dibagi rata ke kambing yang sedang dipelihara."] },
  ],
  "/kelola/pengelola": [
    { judul: "Tim pengelola", isi: ["Pengelola tambahan mendaftar sendiri dengan mencentang Saya mendaftar sebagai pengelola, lalu disetujui di sini.", "Daftarkan email lebih dulu kalau ingin perannya langsung dikenali saat mendaftar."] },
  ],
};

const kunciHalaman = (p: string) => (/^\/kelola\/kambing\/\d+/.test(p) ? "/kelola/kambing/[id]" : /^\/kelola\/borongan/.test(p) ? "/kelola/borongan" : p);

export function Panduan() {
  const path = kunciHalaman(usePathname());
  const langkah = PANDUAN[path];
  const [buka, setBuka] = useState(false);
  const [i, setI] = useState(0);
  const kunci = `panduan:${path}`;

  useEffect(() => {
    setI(0);
    try { if (langkah && !localStorage.getItem(kunci)) setBuka(true); } catch { /* abaikan */ }
  }, [kunci, langkah]);

  const tutup = () => { setBuka(false); try { localStorage.setItem(kunci, "1"); } catch { /* abaikan */ } };
  if (!langkah) return null;
  const l = langkah[i];
  return (
    <>
      <button type="button" className="btn-ghost text-sm" onClick={() => { setI(0); setBuka(true); }}>Panduan</button>
      {buka && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={tutup}>
          <div className="card w-full max-w-md space-y-3 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="muted text-xs">Panduan {i + 1} dari {langkah.length}</div>
            <h2>{l.judul}</h2>
            <ul className="list-disc space-y-1 pl-5 text-sm">{l.isi.map((t, k) => <li key={k}>{t}</li>)}</ul>
            <div className="flex items-center gap-2 pt-1">
              <button type="button" className="muted text-xs underline" onClick={tutup}>Lewati</button>
              <span className="grow" />
              {i > 0 && <button type="button" className="btn-ghost" onClick={() => setI(i - 1)}>Kembali</button>}
              {i < langkah.length - 1
                ? <button type="button" className="btn" onClick={() => setI(i + 1)}>Lanjut</button>
                : <button type="button" className="btn" onClick={tutup}>Mengerti</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
