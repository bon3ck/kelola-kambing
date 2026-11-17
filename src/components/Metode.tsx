import { FotoInput } from "./FotoInput";

// Kolom uang: tunai/transfer + foto nota. Dipakai di semua form yang memindahkan uang.
export function MetodeFields({ wajibBukti = false }: { wajibBukti?: boolean }) {
  return (
    <>
      <label className="block">
        <span className="label">Dibayar / diterima</span>
        <select className="input" name="metode" defaultValue="tunai">
          <option value="tunai">Tunai</option>
          <option value="transfer">Transfer</option>
        </select>
      </label>
      <label className="block">
        <span className="label">Bank (kalau transfer)</span>
        <input className="input" name="bank" placeholder="BCA, BRI…" />
      </label>
      <label className="block">
        <span className="label">Foto nota / bukti{wajibBukti ? "" : " (disarankan)"}</span>
        <FotoInput name="bukti" required={wajibBukti} />
      </label>
    </>
  );
}
