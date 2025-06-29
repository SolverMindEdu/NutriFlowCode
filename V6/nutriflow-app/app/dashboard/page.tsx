"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Play, Search, LogOut, User, Wifi, WifiOff, HelpCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingOverlay } from "@/components/loading-overlay"
import { TutorialOverlay } from "@/components/tutorial-overlay"

export default function DashboardPage() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureStatus, setCaptureStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [backendConnected, setBackendConnected] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const router = useRouter()
  const [mealGenerationLoading, setMealGenerationLoading] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [allergyWarnings, setAllergyWarnings] = useState<any[]>([])

  // Check if this is the user's first time
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("nutriflow_tutorial_completed")
    if (!hasSeenTutorial) {
      setShowTutorial(true)
    }
  }, [])

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
    const interval = setInterval(checkBackendStatus, 5000)

    return () => clearInterval(interval)
  }, [])

  // Set up video stream from backend
  useEffect(() => {
    if (backendConnected && imgRef.current) {
      imgRef.current.src = "http://localhost:8000/video-feed"
      imgRef.current.onerror = () => {
        setError("Failed to load video stream from backend")
      }
    }
  }, [backendConnected])

  const handleTutorialComplete = () => {
    setShowTutorial(false)
    localStorage.setItem("nutriflow_tutorial_completed", "true")
  }

  const handleShowTutorial = () => {
    setShowTutorial(true)
  }

  const handleStartCapture = async () => {
    setLoading(true)
    setError("")
    setAllergyWarnings([])
    setCaptureStatus("Capturing full fridge state...")

    try {
      const response = await fetch("http://localhost:8000/capture-before", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsCapturing(true)
        setCaptureStatus('✅ Fridge captured! Now take items out and click "What Was Taken?" when ready.')
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
    setMealGenerationLoading(true)
    setError("")
    setAllergyWarnings([])
    setCaptureStatus("🤖 AI Chef is analyzing what you took and checking for allergies...")

    try {
      const response = await fetch("http://localhost:8000/capture-after", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const mealSuggestions = parseMealSuggestion(data.meal_suggestion, data.taken_items)
        localStorage.setItem("mealSuggestions", JSON.stringify(mealSuggestions))
        localStorage.setItem("takenItems", JSON.stringify(data.taken_items))
        router.push("/results")
      } else {
        if (data.allergy_warnings && data.allergy_warnings.length > 0) {
          setAllergyWarnings(data.allergy_warnings)
          setError("⚠️ Allergy warnings detected! Please check the items you selected.")
        } else {
          setError(data.error || data.message || "Failed to analyze items")
        }
      }
    } catch (err) {
      setError("Network error. Make sure Python backend is running.")
    } finally {
      setLoading(false)
      setMealGenerationLoading(false)
    }
  }

  // Enhanced helper function to parse LLM response with calories
  const parseMealSuggestion = (llmResponse: string, takenItems: any) => {
    const meals = []
    const sections = llmResponse.split(/MEAL \d+:/i).filter((section) => section.trim())

    sections.forEach((section, index) => {
      const lines = section.split("\n").filter((line) => line.trim())

      let name = `Meal ${index + 1}`
      let description = "Healthy meal suggestion based on your preferences"
      let calories = "Not specified"
      const ingredients = []
      const instructions = []
      let currentSection = "name"

      for (const line of lines) {
        const trimmedLine = line.trim()

        if (
          index === 0 &&
          !trimmedLine.toLowerCase().includes("description") &&
          !trimmedLine.toLowerCase().includes("calories") &&
          !trimmedLine.toLowerCase().includes("ingredients") &&
          !trimmedLine.toLowerCase().includes("instructions") &&
          trimmedLine.length > 0
        ) {
          name = trimmedLine
          continue
        }

        if (trimmedLine.toLowerCase().startsWith("description:")) {
          description = trimmedLine.replace(/^description:\s*/i, "")
          currentSection = "description"
        } else if (trimmedLine.toLowerCase().startsWith("calories:")) {
          calories = trimmedLine.replace(/^calories:\s*/i, "")
          currentSection = "calories"
        } else if (trimmedLine.toLowerCase().includes("ingredients:")) {
          currentSection = "ingredients"
        } else if (trimmedLine.toLowerCase().includes("instructions:")) {
          currentSection = "instructions"
        } else if (trimmedLine.startsWith("-") && currentSection === "ingredients") {
          ingredients.push(trimmedLine.replace(/^-\s*/, ""))
        } else if ((trimmedLine.match(/^\d+\./) || trimmedLine.startsWith("-")) && currentSection === "instructions") {
          instructions.push(trimmedLine.replace(/^\d+\.\s*|-\s*/, ""))
        }
      }

      meals.push({
        name: name || `Meal ${index + 1}`,
        description,
        calories,
        recipe: {
          ingredients: ingredients.length > 0 ? ingredients : Object.keys(takenItems),
          instructions:
            instructions.length > 0
              ? instructions
              : ["Follow your preferred cooking method with the available ingredients."],
        },
        takenItems: Object.keys(takenItems),
      })
    })

    if (meals.length === 0) {
      meals.push({
        name: "AI Generated Meal Suggestion",
        description: "Based on the items you took from your fridge",
        calories: "Calories not calculated",
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
    setAllergyWarnings([])
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
              <Button variant="ghost" size="sm" onClick={handleShowTutorial}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Tutorial
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/profile")}>
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
              <CardTitle>Smart Fridge Tracking 🤖</CardTitle>
              <CardDescription>
                AI-powered meal suggestions with calorie counting and allergy protection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {allergyWarnings.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-orange-800">
                    <div className="font-medium mb-2">⚠️ Allergy Warnings Detected:</div>
                    {allergyWarnings.map((warning, index) => (
                      <div key={index} className="text-sm">
                        • {warning.warning}
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              )}

              {captureStatus && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{captureStatus}</AlertDescription>
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
                  {loading && !isCapturing ? "Starting..." : "📸 Start Capture"}
                </Button>

                <Button
                  onClick={handleWhatWasTaken}
                  disabled={!isCapturing || loading || !backendConnected}
                  className="w-full"
                  size="lg"
                  variant="secondary"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {loading && isCapturing ? "Analyzing..." : "🍽️ What Was Taken?"}
                </Button>

                <Button onClick={handleClear} disabled={loading} className="w-full bg-transparent" variant="outline">
                  🔄 Clear & Reset
                </Button>
              </div>

              <div className="text-sm text-gray-600 space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800">🆕 New Features:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>🔥 Calorie estimation for each meal</li>
                  <li>⚠️ Allergy warnings when you take unsafe items</li>
                  <li>🎯 Personalized suggestions based on your profile</li>
                  <li>📊 Nutritional information included</li>
                </ul>
              </div>

              <div className="text-sm text-gray-600 space-y-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-medium text-blue-800">📋 Quick Guide:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Open your fridge door</li>
                  <li>Click "Start Capture"</li>
                  <li>Take out ingredients you want</li>
                  <li>Click "What Was Taken?"</li>
                </ol>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShowTutorial}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                >
                  Need help? Watch tutorial →
                </Button>
              </div>

              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>System Status:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Backend: {backendConnected ? "✅ Connected" : "❌ Disconnected"}</li>
                  <li>Camera: {cameraActive ? "✅ Active" : "❌ Inactive"}</li>
                  <li>Capture: {isCapturing ? "🔄 Monitoring" : "⏸️ Idle"}</li>
                  <li>Allergy Protection: {backendConnected ? "✅ Active" : "❌ Offline"}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay isVisible={showTutorial} onComplete={handleTutorialComplete} />

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={mealGenerationLoading}
        message="Analyzing your fridge contents, checking for allergies, and generating personalized meal suggestions with calorie information..."
      />
    </div>
  )
}
