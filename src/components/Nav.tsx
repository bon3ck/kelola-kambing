import Link from "next/link";

export function Nav({ peran, email }: { peran: "pengelola" | "investor"; email?: string }) {
  const links =
    peran === "pengelola"
      ? [["/kelola", "Ringkasan"], ["/kelola/kambing", "Kambing"], ["/kelola/biaya", "Biaya bersama"],
         ["/kelola/investor", "Investor"], ["/kelola/bagi-hasil", "Bagi hasil"]]
      : [["/portal", "Kambing saya"]];
  return (
    <header className="border-b" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <span className="font-bold">🐐 Kelola Kambing</span>
        <nav className="flex flex-wrap gap-3 text-sm">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:underline">{label}</Link>
          ))}
        </nav>
        <form action="/auth/keluar" method="post" className="ml-auto flex items-center gap-3 text-sm">
          <span className="muted hidden sm:inline">{email}</span>
          <button className="btn-ghost">Keluar</button>
        </form>
      </div>
    </header>
  );
}
