"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, X, Camera, Play, Search, RotateCcw } from "lucide-react"

interface TutorialStep {
  title: string
  description: string
  icon: React.ReactNode
  action?: string
  highlight?: string
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to NutriFlow! 🎉",
    description:
      "Let's learn how to use your smart fridge tracker in just 4 simple steps. This will only take a minute!",
    icon: <div className="text-4xl">👋</div>,
  },
  {
    title: "Step 1: Open Your Fridge 🚪",
    description:
      "First, open your fridge door so the camera can see all your food items clearly. Make sure the lighting is good!",
    icon: <Camera className="w-8 h-8 text-blue-500" />,
    action: "Open your fridge door now",
  },
  {
    title: "Step 2: Start Capture 📸",
    description:
      'Click the "Start Capture" button to take a snapshot of your full fridge. This helps NutriFlow remember what you have.',
    icon: <Play className="w-8 h-8 text-green-500" />,
    highlight: "Start Capture",
  },
  {
    title: "Step 3: Take Items Out 🥕",
    description:
      "Now take out the ingredients you want to cook with. NutriFlow will monitor what you remove from the fridge.",
    icon: <div className="text-4xl">🍎</div>,
    action: "Take some items from your fridge",
  },
  {
    title: "Step 4: Generate Meals 🍽️",
    description:
      'Click "What Was Taken?" and NutriFlow will analyze what you removed and suggest personalized meal recipes!',
    icon: <Search className="w-8 h-8 text-purple-500" />,
    highlight: "What Was Taken?",
  },
  {
    title: "Bonus: Start Over 🔄",
    description: 'Want to try again? Just click "Clear & Reset" to start a new cooking session. Easy as that!',
    icon: <RotateCcw className="w-8 h-8 text-orange-500" />,
    highlight: "Clear & Reset",
  },
  {
    title: "You're All Set! 🌟",
    description:
      "That's it! You're now ready to use NutriFlow. Remember: Open fridge → Start Capture → Take items → Generate meals. Happy cooking!",
    icon: <div className="text-4xl">🎊</div>,
  },
]

interface TutorialOverlayProps {
  isVisible: boolean
  onComplete: () => void
}

export function TutorialOverlay({ isVisible, onComplete }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0)

  if (!isVisible) return null

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete()
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const currentTutorialStep = tutorialSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg relative">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
            {currentTutorialStep.icon}
          </div>
          <CardTitle className="text-xl font-bold text-gray-800">{currentTutorialStep.title}</CardTitle>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-2">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <CardDescription className="text-base text-gray-600 leading-relaxed">
            {currentTutorialStep.description}
          </CardDescription>

          {currentTutorialStep.action && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-800">👆 Action Required:</p>
              <p className="text-sm text-blue-700 mt-1">{currentTutorialStep.action}</p>
            </div>
          )}

          {currentTutorialStep.highlight && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-800">🎯 Look for this button:</p>
              <p className="text-sm text-green-700 mt-1 font-mono bg-white px-2 py-1 rounded border inline-block">
                "{currentTutorialStep.highlight}"
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="min-w-20 bg-transparent"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <span className="text-sm text-gray-500">
              {currentStep + 1} of {tutorialSteps.length}
            </span>

            <Button onClick={handleNext} className="min-w-20">
              {currentStep === tutorialSteps.length - 1 ? (
                "Get Started! 🚀"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {currentStep === 0 && (
            <div className="pt-2">
              <Button variant="ghost" onClick={handleSkip} className="text-sm text-gray-500 hover:text-gray-700">
                Skip tutorial
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
