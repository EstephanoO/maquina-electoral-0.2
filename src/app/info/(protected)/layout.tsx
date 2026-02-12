import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isInfoUserEmail } from "@/info/auth";

export default async function InfoProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user || !isInfoUserEmail(user.email)) {
    redirect("/info/login");
  }
  return children;
}
