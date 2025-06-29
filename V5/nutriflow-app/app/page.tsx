"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Play, Search, LogOut, User, Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureStatus, setCaptureStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [backendConnected, setBackendConnected] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const router = useRouter()

  // Check backend connection and camera status
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/status")
        if (response.ok) {
          const data = await response.json()
          setBackendConnected(true)
          setCameraActive(data.camera_active)
          setIsCapturing(data.capture_running)
        } else {
          setBackendConnected(false)
        }
      } catch (err) {
        setBackendConnected(false)
        setError("Cannot connect to Python backend. Make sure it's running on port 8000.")
      }
    }

    checkBackendStatus()
    const interval = setInterval(checkBackendStatus, 5000) // Check every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Set up video stream from backend
  useEffect(() => {
    if (backendConnected && imgRef.current) {
      // Use the video feed endpoint from your Python backend
      imgRef.current.src = "http://localhost:8000/video-feed"
      imgRef.current.onerror = () => {
        setError("Failed to load video stream from backend")
      }
    }
  }, [backendConnected])

  const handleStartCapture = async () => {
    setLoading(true)
    setError("")
    setCaptureStatus("Capturing full fridge state...")

    try {
      const response = await fetch("http://localhost:8000/capture-before", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsCapturing(true)
        setCaptureStatus('Monitoring fridge... Take items out and then click "What Was Taken?"')
      } else {
        setError(data.error || "Failed to start capture")
      }
    } catch (err) {
      setError("Network error. Make sure Python backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatWasTaken = async () => {
    setLoading(true)
    setError("")
    setCaptureStatus("Analyzing what was taken and generating meal suggestions...")

    try {
      const response = await fetch("http://localhost:8000/capture-after", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Parse the meal suggestion and create structured data
        const mealSuggestions = parseMealSuggestion(data.meal_suggestion, data.taken_items)

        // Store the meal suggestions and navigate to results
        localStorage.setItem("mealSuggestions", JSON.stringify(mealSuggestions))
        localStorage.setItem("takenItems", JSON.stringify(data.taken_items))
        router.push("/results")
      } else {
        setError(data.error || data.message || "Failed to analyze items")
      }
    } catch (err) {
      setError("Network error. Make sure Python backend is running.")
    } finally {
      setLoading(false)
    }
  }

  // Helper function to parse LLM response into structured data
  const parseMealSuggestion = (llmResponse: string, takenItems: any) => {
    // This is a simple parser - you might want to improve this based on your LLM's output format
    const meals = []
    const lines = llmResponse.split("\n").filter((line) => line.trim())

    // Try to extract meal names and descriptions
    let currentMeal = null
    let inRecipe = false
    let ingredients = []
    let instructions = []

    for (const line of lines) {
      if (line.includes("Meal") || line.includes("Recipe") || line.match(/^\d+\./)) {
        if (currentMeal) {
          meals.push({
            ...currentMeal,
            recipe: { ingredients, instructions },
          })
        }
        currentMeal = {
          name: line.replace(/^\d+\.?\s*/, "").trim(),
          description: "Healthy meal suggestion based on your preferences",
          takenItems: Object.keys(takenItems),
        }
        ingredients = []
        instructions = []
        inRecipe = false
      } else if (line.toLowerCase().includes("ingredients")) {
        inRecipe = true
      } else if (line.toLowerCase().includes("instructions") || line.toLowerCase().includes("steps")) {
        inRecipe = false
      } else if (inRecipe && line.trim().startsWith("-")) {
        ingredients.push(line.replace(/^-\s*/, "").trim())
      } else if (!inRecipe && line.trim().startsWith("-")) {
        instructions.push(line.replace(/^-\s*/, "").trim())
      }
    }

    if (currentMeal) {
      meals.push({
        ...currentMeal,
        recipe: { ingredients, instructions },
      })
    }

    // If parsing failed, create a simple structure
    if (meals.length === 0) {
      meals.push({
        name: "AI Generated Meal Suggestion",
        description: "Based on the items you took from your fridge",
        recipe: {
          ingredients: Object.keys(takenItems),
          instructions: [llmResponse],
        },
        takenItems: Object.keys(takenItems),
      })
    }

    return meals
  }

  const handleClear = () => {
    setIsCapturing(false)
    setCaptureStatus("")
    setError("")
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-700">NutriFlow</h1>
              <div className="ml-4 flex items-center">
                {backendConnected ? (
                  <div className="flex items-center text-green-600">
                    <Wifi className="w-4 h-4 mr-1" />
                    <span className="text-sm">Backend Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <WifiOff className="w-4 h-4 mr-1" />
                    <span className="text-sm">Backend Disconnected</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Fridge Camera
                {cameraActive && <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
              </CardTitle>
              <CardDescription>Live view from your Python backend</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden">
                {backendConnected ? (
                  <img
                    ref={imgRef}
                    alt="Fridge Camera Feed"
                    className="w-full h-64 object-cover"
                    onError={() => setError("Failed to load video stream")}
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center text-white">
                    <div className="text-center">
                      <WifiOff className="w-8 h-8 mx-auto mb-2" />
                      <p>Waiting for backend connection...</p>
                      <p className="text-sm text-gray-400">Make sure Python backend is running</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Fridge Tracking</CardTitle>
              <CardDescription>Track what you take from your fridge and get meal suggestions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {captureStatus && (
                <Alert>
                  <AlertDescription>{captureStatus}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  onClick={handleStartCapture}
                  disabled={loading || isCapturing || !backendConnected}
                  className="w-full"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {loading && !isCapturing ? "Starting..." : "Start Capture"}
                </Button>

                <Button
                  onClick={handleWhatWasTaken}
                  disabled={!isCapturing || loading || !backendConnected}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading && isCapturing ? "Analyzing..." : "What Was Taken?"}
                </Button>

                <Button onClick={handleClear} disabled={loading} className="w-full bg-transparent" variant="outline">
                  Clear & Reset
                </Button>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>Status:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Backend: {backendConnected ? "✅ Connected" : "❌ Disconnected"}</li>
                  <li>Camera: {cameraActive ? "✅ Active" : "❌ Inactive"}</li>
                  <li>Capture: {isCapturing ? "🔄 Monitoring" : "⏸️ Idle"}</li>
                </ul>

                <p className="mt-4">
                  <strong>How to use:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Make sure Python backend is running</li>
                  <li>Click "Start Capture" to record your full fridge</li>
                  <li>Take items out of your fridge</li>
                  <li>Click "What Was Taken?" to get meal suggestions</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
