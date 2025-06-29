"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Play, Search, LogOut, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureStatus, setCaptureStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const router = useRouter()

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      setError("Failed to access camera. Please check permissions.")
    }
  }

  const handleStartCapture = async () => {
    setLoading(true)
    setError("")
    setCaptureStatus("Capturing full fridge state...")

    try {
      const response = await fetch("/api/capture/before", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setIsCapturing(true)
        setCaptureStatus('Monitoring fridge... Take items out and then click "What Was Taken?"')
      } else {
        setError(data.error || "Failed to start capture")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleWhatWasTaken = async () => {
    setLoading(true)
    setError("")
    setCaptureStatus("Analyzing what was taken and generating meal suggestions...")

    try {
      const response = await fetch("/api/capture/after", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        // Store the meal suggestions and navigate to results
        localStorage.setItem("mealSuggestions", JSON.stringify(data.mealSuggestions))
        router.push("/results")
      } else {
        setError(data.error || "Failed to analyze items")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
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
              </CardTitle>
              <CardDescription>Live view of your fridge contents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-64 object-cover" />
                {!stream && (
                  <div className="absolute inset-0 flex items-center justify-center text-white">
                    <p>Camera loading...</p>
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
                <Button onClick={handleStartCapture} disabled={loading || isCapturing} className="w-full" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  {loading && !isCapturing ? "Starting..." : "Start Capture"}
                </Button>

                <Button
                  onClick={handleWhatWasTaken}
                  disabled={!isCapturing || loading}
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
                  <strong>How to use:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Click "Start Capture" to record your full fridge</li>
                  <li>Take items out of your fridge</li>
                  <li>Click "What Was Taken?" to get meal suggestions</li>
                  <li>Use "Clear & Reset" to start over</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
