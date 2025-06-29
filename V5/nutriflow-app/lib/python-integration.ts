// Helper functions to integrate with your Python backend

export interface UserProfile {
  name: string
  allergies: string[]
  preferred_items: string[]
  risk_factors: string[]
  food_cusine: string[]
  age: number
}

export interface TakenItems {
  [item: string]: number
}

// Function to send user profile to your Python backend
export async function updatePythonUserProfile(profile: UserProfile) {
  try {
    // This would call your Python backend to update the global variables
    const response = await fetch("http://localhost:8000/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    })

    return response.ok
  } catch (error) {
    console.error("Failed to update Python profile:", error)
    return false
  }
}

// Function to trigger your Python meal generation
export async function generatePythonMealSuggestion(takenItems: TakenItems, profile: UserProfile) {
  try {
    const response = await fetch("http://localhost:8000/generate-meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taken_items: takenItems,
        user_profile: profile,
      }),
    })

    if (response.ok) {
      return await response.json()
    }

    return null
  } catch (error) {
    console.error("Failed to generate meal suggestion:", error)
    return null
  }
}
