import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Mock function to simulate your Python backend's meal generation
async function generateMealSuggestion(takenItems: string[], userProfile: any) {
  const itemsText = takenItems.join(", ")

  // This would call your Python backend's LLM generation
  // For demo purposes, we'll return mock data
  const mockMealSuggestions = [
    {
      name: "Mediterranean Scrambled Eggs",
      description: "A healthy breakfast with eggs, tomatoes, and cheese inspired by Mediterranean flavors.",
      recipe: {
        ingredients: [
          "3 eggs",
          "1 tomato, diced",
          "1/4 cup cheese, crumbled",
          "2 tbsp olive oil",
          "Salt and pepper to taste",
          "Fresh herbs (optional)",
        ],
        instructions: [
          "Heat olive oil in a non-stick pan over medium heat",
          "Add diced tomatoes and cook for 2-3 minutes until softened",
          "Beat eggs in a bowl and season with salt and pepper",
          "Pour eggs into the pan and gently scramble",
          "Add crumbled cheese in the last minute of cooking",
          "Serve hot with fresh herbs if desired",
        ],
      },
      takenItems: takenItems,
    },
    {
      name: "Quick Cheese Toast",
      description: "A simple and satisfying snack with melted cheese on toasted bread.",
      recipe: {
        ingredients: ["2 slices bread", "2 slices cheese", "1 tbsp butter", "Pinch of herbs (optional)"],
        instructions: [
          "Toast the bread slices until golden brown",
          "Butter one side of each toast",
          "Place cheese slices on the buttered side",
          "Place under broiler for 1-2 minutes until cheese melts",
          "Sprinkle with herbs if desired and serve immediately",
        ],
      },
      takenItems: takenItems,
    },
    {
      name: "Fresh Tomato Salad",
      description: "A light and refreshing salad perfect as a side dish or light meal.",
      recipe: {
        ingredients: [
          "2 large tomatoes, sliced",
          "2 tbsp olive oil",
          "1 tbsp vinegar",
          "Salt and pepper to taste",
          "Fresh basil leaves (optional)",
        ],
        instructions: [
          "Slice tomatoes into thick rounds",
          "Arrange on a serving plate",
          "Drizzle with olive oil and vinegar",
          "Season with salt and pepper",
          "Garnish with fresh basil leaves if available",
          "Let sit for 5 minutes before serving to allow flavors to meld",
        ],
      },
      takenItems: takenItems,
    },
  ]

  return mockMealSuggestions
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userCookie = cookieStore.get("user")

    if (!userCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Simulate detecting what was taken
    const mockTakenItems = ["eggs", "tomato", "cheese"]

    // Get user profile for personalized suggestions
    const user = JSON.parse(userCookie.value)

    // Fetch the actual user profile from storage
    const profileResponse = await fetch(`${request.nextUrl.origin}/api/user/python-format`, {
      headers: { Cookie: request.headers.get("cookie") || "" },
    })

    let userProfile = {
      name: "John",
      allergies: ["peanuts"],
      preferred_items: ["low-carb", "high-protein"],
      risk_factors: ["diabetes"],
      food_cusine: ["Mediterranean", "Italian"],
      age: 30,
    }

    if (profileResponse.ok) {
      userProfile = await profileResponse.json()
    }

    console.log("Using user profile for meal generation:", userProfile)

    // Generate meal suggestions
    const mealSuggestions = await generateMealSuggestion(mockTakenItems, userProfile)

    return NextResponse.json({
      success: true,
      takenItems: mockTakenItems,
      mealSuggestions,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze items" }, { status: 500 })
  }
}
