import { masuk, daftar } from "./actions";

export default async function Login({ searchParams }: { searchParams: Promise<{ pesan?: string; mode?: string }> }) {
  const { pesan, mode } = await searchParams;
  const isDaftar = mode === "daftar";
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1">Kelola Kambing</h1>
      <p className="muted mb-6 text-sm">
        {isDaftar ? "Buat akun dengan email yang didaftarkan pengelola." : "Masuk sebagai pengelola atau investor."}
      </p>
      {pesan && <p className="card mb-4 text-sm">{pesan}</p>}
      <form action={isDaftar ? daftar : masuk} className="card space-y-3">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="label" htmlFor="password">Kata sandi</label>
          <input className="input" id="password" name="password" type="password" required minLength={6}
            autoComplete={isDaftar ? "new-password" : "current-password"} />
        </div>
        {isDaftar && (
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="pengelola" className="mt-1" />
            <span>Saya mendaftar sebagai <b>pengelola</b> <span className="muted">(perlu persetujuan pengelola utama). Investor tidak perlu mencentang ini.</span></span>
          </label>
        )}
        <button className="btn w-full">{isDaftar ? "Daftar" : "Masuk"}</button>
      </form>
      <p className="mt-4 text-center text-sm">
        {isDaftar ? <a href="/login" className="underline">Sudah punya akun? Masuk</a>
                  : <a href="/login?mode=daftar" className="underline">Belum punya akun? Daftar</a>}
      </p>
    </main>
  );
}
