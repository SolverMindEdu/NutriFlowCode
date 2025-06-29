"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, ArrowLeft, RotateCcw, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface MealSuggestion {
  name: string
  description: string
  calories: string
  recipe: {
    ingredients: string[]
    instructions: string[]
  }
  takenItems: string[]
}

export default function ResultsPage() {
  const [mealSuggestions, setMealSuggestions] = useState<MealSuggestion[]>([])
  const [currentMealIndex, setCurrentMealIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load meal suggestions from localStorage or API
    const stored = localStorage.getItem("mealSuggestions")
    if (stored) {
      try {
        const suggestions = JSON.parse(stored)
        setMealSuggestions(suggestions)
      } catch (err) {
        console.error("Failed to parse meal suggestions:", err)
        router.push("/dashboard")
      }
    } else {
      router.push("/dashboard")
    }
    setLoading(false)
  }, [router])

  const handlePrevious = () => {
    setCurrentMealIndex((prev) => (prev > 0 ? prev - 1 : mealSuggestions.length - 1))
  }

  const handleNext = () => {
    setCurrentMealIndex((prev) => (prev < mealSuggestions.length - 1 ? prev + 1 : 0))
  }

  const handleClear = () => {
    localStorage.removeItem("mealSuggestions")
    router.push("/dashboard")
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading meal suggestions...</p>
        </div>
      </div>
    )
  }

  if (mealSuggestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center p-6">
            <p className="mb-4">No meal suggestions available.</p>
            <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentMeal = mealSuggestions[currentMealIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={handleBackToDashboard} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-green-700">Meal Suggestions</h1>
            </div>
            <Button variant="outline" onClick={handleClear}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear & Start Over
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" onClick={handlePrevious} disabled={mealSuggestions.length <= 1}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Meal {currentMealIndex + 1} of {mealSuggestions.length}
            </p>
          </div>

          <Button variant="outline" onClick={handleNext} disabled={mealSuggestions.length <= 1}>
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Meal Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">{currentMeal.name}</CardTitle>
                <CardDescription className="text-base mb-3">{currentMeal.description}</CardDescription>

                {/* Calories Display */}
                {currentMeal.calories && currentMeal.calories !== "Not specified" && (
                  <div className="flex items-center mb-3">
                    <Flame className="w-4 h-4 text-orange-500 mr-2" />
                    <span className="text-lg font-semibold text-orange-600">{currentMeal.calories}</span>
                    <span className="text-sm text-gray-500 ml-1">per serving</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Used */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Items from your fridge:</h4>
              <div className="flex flex-wrap gap-2">
                {currentMeal.takenItems.map((item, index) => (
                  <Badge key={index} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Ingredients */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {currentMeal.recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Instructions</h3>
              <ol className="space-y-3">
                {currentMeal.recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex items-start">
                    <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Dots */}
        {mealSuggestions.length > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {mealSuggestions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMealIndex(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentMealIndex ? "bg-green-600" : "bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
