import { redirect } from "next/navigation";
import { getSesi } from "@/lib/auth";

export default async function Home() {
  const { peran } = await getSesi();
  redirect(peran === "pengelola" ? "/kelola" : "/portal");
}
