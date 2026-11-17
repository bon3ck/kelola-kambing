"use client";

// Kecilkan foto di HP sebelum diunggah (batas unggah server sekitar 4 MB).
export function FotoInput({ required }: { required?: boolean }) {
  async function kecilkan(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size < 800_000) return;
    try {
      const bmp = await createImageBitmap(file);
      const skala = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas");
      c.width = Math.round(bmp.width * skala);
      c.height = Math.round(bmp.height * skala);
      c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
      const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.8));
      if (!blob) return;
      const dt = new DataTransfer();
      dt.items.add(new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" }));
      input.files = dt.files;
    } catch {
      // biarkan file asli
    }
  }
  return <input className="input" type="file" name="foto" accept="image/*" capture="environment" required={required} onChange={kecilkan} />;
}
