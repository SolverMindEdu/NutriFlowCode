import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock profile storage - this would be your actual database
const profiles: Record<string, any> = {}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)
    const profile = profiles[user.id]

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Format exactly like your Python backend variables
    const pythonFormatData = {
      name: profile.name, // "John"
      allergies: profile.allergies, // ["peanuts", "lactose"]
      preferred_items: profile.preferred_items, // ["low-carb", "high-protein", "vegetables"]
      risk_factors: profile.risk_factors, // ["heart disease", "diabetes"]
      food_cusine: profile.food_cusine, // ["Italian", "Mexican", "Indian"]
      age: profile.age, // 30
    }

    return NextResponse.json(pythonFormatData)
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
