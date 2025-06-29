import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock user database - replace with real database
const users: Array<{ id: number; email: string; password: string }> = []

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Check if user already exists
    const existingUser = users.find((u) => u.email === email)
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password, // In production, hash this password
    }
    users.push(newUser)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("user", JSON.stringify({ id: newUser.id, email: newUser.email }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
