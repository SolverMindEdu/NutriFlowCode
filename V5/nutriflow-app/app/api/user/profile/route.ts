import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock profile storage - replace with real database
const profiles: Record<string, any> = {}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)
    const profileData = await request.json()

    // Calculate age from birthday
    const birthday = new Date(profileData.birthday)
    const age = new Date().getFullYear() - birthday.getFullYear()

    // Combine selected options with custom inputs
    const allergies = [
      ...profileData.allergies,
      ...(profileData.otherAllergies ? profileData.otherAllergies.split(",").map((s: string) => s.trim()) : []),
    ].filter(Boolean)

    const preferredItems = [
      ...profileData.preferredItems,
      ...(profileData.otherPreferredItems
        ? profileData.otherPreferredItems.split(",").map((s: string) => s.trim())
        : []),
    ].filter(Boolean)

    const riskFactors = [
      ...profileData.riskFactors,
      ...(profileData.otherRiskFactors ? profileData.otherRiskFactors.split(",").map((s: string) => s.trim()) : []),
    ].filter(Boolean)

    const foodCuisines = [
      ...profileData.foodCuisines,
      ...(profileData.otherFoodCuisines ? profileData.otherFoodCuisines.split(",").map((s: string) => s.trim()) : []),
    ].filter(Boolean)

    // Store profile in the exact format your Python backend expects
    profiles[user.id] = {
      name: profileData.fullName, // Maps to your 'name' variable
      age, // Maps to your 'age' variable
      allergies, // Maps to your 'allergies' array
      preferred_items: preferredItems, // Maps to your 'preferred_items' array
      risk_factors: riskFactors, // Maps to your 'risk_factors' array
      food_cusine: foodCuisines, // Maps to your 'food_cusine' array (note: keeping your spelling)
    }

    console.log("Stored user profile:", profiles[user.id])

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const user = JSON.parse(userCookie.value)
    const profile = profiles[user.id]

    return NextResponse.json(profile || {})
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
