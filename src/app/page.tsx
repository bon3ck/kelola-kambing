import { redirect } from "next/navigation";
import { getSesi } from "@/lib/auth";

export default async function Home() {
  const { staf, menunggu } = await getSesi();
  redirect(menunggu ? "/menunggu" : staf ? "/kelola" : "/portal");
}
