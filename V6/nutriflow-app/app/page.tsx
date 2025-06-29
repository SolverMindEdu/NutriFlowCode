import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function HomePage() {
  const cookieStore = await cookies()
  const user = cookieStore.get("user")

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/auth/login")
  }
}
