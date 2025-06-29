"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight, Sparkles, Heart, Shield, Globe } from "lucide-react"

const ALLERGIES_OPTIONS = [
  { name: "Peanuts", emoji: "🥜" },
  { name: "Tree nuts", emoji: "🌰" },
  { name: "Dairy/Lactose", emoji: "🥛" },
  { name: "Eggs", emoji: "🥚" },
  { name: "Soy", emoji: "🫘" },
  { name: "Wheat/Gluten", emoji: "🌾" },
  { name: "Fish", emoji: "🐟" },
  { name: "Shellfish", emoji: "🦐" },
]

const PREFERRED_ITEMS_OPTIONS = [
  { name: "Low-carb", emoji: "🥬" },
  { name: "High-protein", emoji: "💪" },
  { name: "Vegetables", emoji: "🥕" },
  { name: "Fruits", emoji: "🍎" },
  { name: "Whole grains", emoji: "🌾" },
  { name: "Lean meats", emoji: "🍗" },
  { name: "Plant-based", emoji: "🌱" },
]

const RISK_FACTORS_OPTIONS = [
  { name: "Heart disease", emoji: "❤️" },
  { name: "Diabetes", emoji: "🩺" },
  { name: "High blood pressure", emoji: "📈" },
  { name: "High cholesterol", emoji: "🧪" },
  { name: "Obesity", emoji: "⚖️" },
  { name: "None", emoji: "✅" },
]

const CUISINE_OPTIONS = [
  { name: "Italian", emoji: "🍝" },
  { name: "Mexican", emoji: "🌮" },
  { name: "Indian", emoji: "🍛" },
  { name: "Chinese", emoji: "🥢" },
  { name: "Japanese", emoji: "🍣" },
  { name: "Mediterranean", emoji: "🫒" },
  { name: "American", emoji: "🍔" },
  { name: "Thai", emoji: "🍜" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    birthday: "",
    allergies: [] as string[],
    otherAllergies: "",
    preferredItems: [] as string[],
    otherPreferredItems: "",
    riskFactors: [] as string[],
    otherRiskFactors: "",
    foodCuisines: [] as string[],
    otherFoodCuisines: "",
  })
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [backendError, setBackendError] = useState("")
  const router = useRouter()

  const totalSteps = 5
  const progress = (step / totalSteps) * 100

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleCheckboxChange = (field: keyof typeof formData, value: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter((item) => item !== value),
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setBackendError("")

    try {
      // Calculate age from birthday
      const birthday = new Date(formData.birthday)
      const age = new Date().getFullYear() - birthday.getFullYear()

      // Combine selected options with custom inputs
      const allergies = [
        ...formData.allergies,
        ...(formData.otherAllergies ? formData.otherAllergies.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const preferredItems = [
        ...formData.preferredItems,
        ...(formData.otherPreferredItems ? formData.otherPreferredItems.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const riskFactors = [
        ...formData.riskFactors,
        ...(formData.otherRiskFactors ? formData.otherRiskFactors.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const foodCuisines = [
        ...formData.foodCuisines,
        ...(formData.otherFoodCuisines ? formData.otherFoodCuisines.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      // Prepare data for Python backend (exact format your backend expects)
      const pythonBackendData = {
        name: formData.fullName,
        age: age,
        allergies: allergies,
        preferred_items: preferredItems,
        risk_factors: riskFactors,
        food_cusine: foodCuisines, // Note: keeping your backend's spelling
      }

      console.log("🚀 Sending to Python backend:", pythonBackendData)

      // First, update the Python backend AI with the user's actual profile
      try {
        const backendResponse = await fetch("http://localhost:8000/update-profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pythonBackendData),
        })

        if (!backendResponse.ok) {
          throw new Error(`Backend responded with status: ${backendResponse.status}`)
        }

        const backendResult = await backendResponse.json()
        console.log("✅ Python backend updated successfully:", backendResult)
      } catch (backendErr) {
        console.error("❌ Failed to update Python backend:", backendErr)
        setBackendError("Failed to update AI backend. Your profile was saved but AI personalization may not work.")
      }

      // Then save to web app database
      const webResponse = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          birthday: formData.birthday,
          allergies,
          preferredItems,
          riskFactors,
          foodCuisines,
        }),
      })

      if (webResponse.ok) {
        setShowSuccess(true)
        console.log("✅ Profile saved successfully!")
        console.log("📊 User's actual profile data:")
        console.log(`   👤 Name: ${formData.fullName}`)
        console.log(`   🎂 Age: ${age}`)
        console.log(`   🚨 Allergies: ${allergies.join(", ") || "None"}`)
        console.log(`   💚 Preferences: ${preferredItems.join(", ") || "None"}`)
        console.log(`   🏥 Health factors: ${riskFactors.join(", ") || "None"}`)
        console.log(`   🍽️ Cuisines: ${foodCuisines.join(", ") || "None"}`)

        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        throw new Error("Failed to save profile to web app")
      }
    } catch (err) {
      console.error("❌ Failed to save profile:", err)
      alert("Failed to save profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case 1:
        return <Sparkles className="w-8 h-8 text-blue-500" />
      case 2:
        return <Shield className="w-8 h-8 text-red-500" />
      case 3:
        return <Heart className="w-8 h-8 text-green-500" />
      case 4:
        return <div className="text-3xl">🏥</div>
      case 5:
        return <Globe className="w-8 h-8 text-purple-500" />
      default:
        return <Sparkles className="w-8 h-8 text-blue-500" />
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">👋</div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-lg font-medium flex items-center justify-center">
                  ✨ What should we call you?
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your awesome name! 😊"
                  className="text-center text-lg h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday" className="text-lg font-medium flex items-center justify-center">
                  🎂 When's your birthday?
                </Label>
                <Input
                  id="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))}
                  className="text-center text-lg h-12"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">🚨</div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Safety First!</h3>
              <p className="text-gray-600">Help us keep you safe by telling us about any allergies</p>
            </div>
            <div>
              <Label className="text-base font-medium mb-4 block">🛡️ Select any allergies you have:</Label>
              <div className="grid grid-cols-2 gap-4">
                {ALLERGIES_OPTIONS.map((allergy) => (
                  <div
                    key={allergy.name}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-red-50 ${
                      formData.allergies.includes(allergy.name)
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200 hover:border-red-200"
                    }`}
                  >
                    <Checkbox
                      id={allergy.name}
                      checked={formData.allergies.includes(allergy.name)}
                      onCheckedChange={(checked) => handleCheckboxChange("allergies", allergy.name, checked as boolean)}
                    />
                    <Label htmlFor={allergy.name} className="text-sm cursor-pointer flex items-center">
                      <span className="text-lg mr-2">{allergy.emoji}</span>
                      {allergy.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="otherAllergies" className="text-sm font-medium">
                  🔍 Any other allergies? (comma-separated)
                </Label>
                <Input
                  id="otherAllergies"
                  value={formData.otherAllergies}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherAllergies: e.target.value }))}
                  placeholder="e.g., sesame, mustard, sulfites"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-bounce">🥗</div>
              <h3 className="text-xl font-bold text-green-600 mb-2">What Do You Love?</h3>
              <p className="text-gray-600">Tell us about your favorite foods and dietary preferences</p>
            </div>
            <div>
              <Label className="text-base font-medium mb-4 block">💚 Choose your favorites:</Label>
              <div className="grid grid-cols-2 gap-4">
                {PREFERRED_ITEMS_OPTIONS.map((item) => (
                  <div
                    key={item.name}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-green-50 ${
                      formData.preferredItems.includes(item.name)
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 hover:border-green-200"
                    }`}
                  >
                    <Checkbox
                      id={item.name}
                      checked={formData.preferredItems.includes(item.name)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("preferredItems", item.name, checked as boolean)
                      }
                    />
                    <Label htmlFor={item.name} className="text-sm cursor-pointer flex items-center">
                      <span className="text-lg mr-2">{item.emoji}</span>
                      {item.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="otherPreferredItems" className="text-sm font-medium">
                  ✨ Anything else you love? (comma-separated)
                </Label>
                <Input
                  id="otherPreferredItems"
                  value={formData.otherPreferredItems}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherPreferredItems: e.target.value }))}
                  placeholder="e.g., organic, local, seasonal, spicy"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-pulse">🏥</div>
              <h3 className="text-xl font-bold text-blue-600 mb-2">Health & Wellness</h3>
              <p className="text-gray-600">Help us suggest healthier options tailored for you</p>
            </div>
            <div>
              <Label className="text-base font-medium mb-4 block">🩺 Any health considerations?</Label>
              <div className="grid grid-cols-2 gap-4">
                {RISK_FACTORS_OPTIONS.map((factor) => (
                  <div
                    key={factor.name}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-blue-50 ${
                      formData.riskFactors.includes(factor.name)
                        ? "border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:border-blue-200"
                    }`}
                  >
                    <Checkbox
                      id={factor.name}
                      checked={formData.riskFactors.includes(factor.name)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("riskFactors", factor.name, checked as boolean)
                      }
                    />
                    <Label htmlFor={factor.name} className="text-sm cursor-pointer flex items-center">
                      <span className="text-lg mr-2">{factor.emoji}</span>
                      {factor.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="otherRiskFactors" className="text-sm font-medium">
                  🔍 Other health considerations? (comma-separated)
                </Label>
                <Input
                  id="otherRiskFactors"
                  value={formData.otherRiskFactors}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherRiskFactors: e.target.value }))}
                  placeholder="e.g., kidney disease, food sensitivities"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-spin" style={{ animationDuration: "3s" }}>
                🌍
              </div>
              <h3 className="text-xl font-bold text-purple-600 mb-2">Flavors of the World!</h3>
              <p className="text-gray-600">What cuisines make your taste buds dance?</p>
            </div>
            <div>
              <Label className="text-base font-medium mb-4 block">🍽️ Choose your favorite cuisines:</Label>
              <div className="grid grid-cols-2 gap-4">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <div
                    key={cuisine.name}
                    className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all cursor-pointer hover:bg-purple-50 ${
                      formData.foodCuisines.includes(cuisine.name)
                        ? "border-purple-300 bg-purple-50"
                        : "border-gray-200 hover:border-purple-200"
                    }`}
                  >
                    <Checkbox
                      id={cuisine.name}
                      checked={formData.foodCuisines.includes(cuisine.name)}
                      onCheckedChange={(checked) =>
                        handleCheckboxChange("foodCuisines", cuisine.name, checked as boolean)
                      }
                    />
                    <Label htmlFor={cuisine.name} className="text-sm cursor-pointer flex items-center">
                      <span className="text-lg mr-2">{cuisine.emoji}</span>
                      {cuisine.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="otherFoodCuisines" className="text-sm font-medium">
                  🌟 Any other cuisines you love? (comma-separated)
                </Label>
                <Input
                  id="otherFoodCuisines"
                  value={formData.otherFoodCuisines}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherFoodCuisines: e.target.value }))}
                  placeholder="e.g., Korean, Ethiopian, Fusion, Vegan"
                  className="mt-2"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">AI Chef Personalized!</h2>
            <p className="text-gray-600 mb-4">
              Your AI chef now knows your preferences and will create personalized meal suggestions just for you!
            </p>
            {backendError && (
              <div className="text-sm text-orange-600 mb-4 p-2 bg-orange-50 rounded">⚠️ {backendError}</div>
            )}
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating emojis */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 text-2xl animate-bounce">🍎</div>
        <div className="absolute top-32 right-32 text-2xl animate-bounce animation-delay-1000">🥕</div>
        <div className="absolute bottom-40 left-40 text-2xl animate-bounce animation-delay-2000">🥗</div>
        <div className="absolute bottom-20 right-20 text-2xl animate-bounce animation-delay-3000">🍳</div>
        <div className="absolute top-1/2 left-10 text-xl animate-pulse">✨</div>
        <div className="absolute top-1/3 right-10 text-xl animate-pulse animation-delay-1500">🌟</div>
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Welcome to NutriFlow! 🎉
          </h1>
          <p className="text-lg text-gray-600">{"Let's create your personalized AI chef profile!"}</p>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-3 bg-gray-200" />
          <div className="flex justify-between items-center mt-3">
            <p className="text-sm text-gray-600">
              Step {step} of {totalSteps}
            </p>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center">
                {getStepIcon()}
              </div>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 && "👋 Let's Get to Know You!"}
              {step === 2 && "🛡️ Safety & Allergies"}
              {step === 3 && "💚 Your Food Preferences"}
              {step === 4 && "🏥 Health & Wellness"}
              {step === 5 && "🌍 Cuisine Adventures"}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 1 && "Tell us about yourself so we can personalize your experience"}
              {step === 2 && "Help us keep you safe by sharing any allergies or restrictions"}
              {step === 3 && "What foods make you happy? Let's build your taste profile"}
              {step === 4 && "Share any health goals so we can suggest better options"}
              {step === 5 && "What flavors and cuisines do you love most?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={step === 1}
                className="min-w-24 bg-transparent hover:bg-gray-50"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              {step < totalSteps ? (
                <Button onClick={handleNext} className="min-w-24 bg-gradient-to-r from-green-500 to-blue-600">
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="min-w-32 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Personalizing your AI chef...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create My AI Chef! 🚀
                    </div>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-1500 {
          animation-delay: 1.5s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
