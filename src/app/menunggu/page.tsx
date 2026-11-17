import { redirect } from "next/navigation";
import { getSesi } from "@/lib/auth";

export default async function Menunggu() {
  const { menunggu, user } = await getSesi();
  if (!menunggu) redirect("/");
  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-16">
      <h1>Menunggu persetujuan</h1>
      <p className="card text-sm">
        Akun {user.email} sudah terdaftar sebagai calon pengelola. Pengelola utama perlu menyetujuinya dulu.
        Setelah disetujui, buka lagi halaman ini atau masuk ulang.
      </p>
      <form action="/auth/keluar" method="post"><button className="btn-ghost">Keluar</button></form>
    </main>
  );
}
