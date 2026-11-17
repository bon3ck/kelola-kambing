import { Nav } from "@/components/Nav";
import { wajibPengelola } from "@/lib/auth";

export default async function KelolaLayout({ children }: { children: React.ReactNode }) {
  const { user } = await wajibPengelola();
  return (
    <>
      <Nav peran="pengelola" email={user.email} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">{children}</main>
    </>
  );
}
