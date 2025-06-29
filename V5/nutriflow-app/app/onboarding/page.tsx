"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"

const ALLERGIES_OPTIONS = ["Peanuts", "Tree nuts", "Dairy/Lactose", "Eggs", "Soy", "Wheat/Gluten", "Fish", "Shellfish"]
const PREFERRED_ITEMS_OPTIONS = [
  "Low-carb",
  "High-protein",
  "Vegetables",
  "Fruits",
  "Whole grains",
  "Lean meats",
  "Plant-based",
]
const RISK_FACTORS_OPTIONS = ["Heart disease", "Diabetes", "High blood pressure", "High cholesterol", "Obesity", "None"]
const CUISINE_OPTIONS = ["Italian", "Mexican", "Indian", "Chinese", "Japanese", "Mediterranean", "American", "Thai"]

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
    try {
      const response = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Failed to save profile:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData((prev) => ({ ...prev, birthday: e.target.value }))}
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Allergies</Label>
              <p className="text-sm text-gray-600 mb-3">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {ALLERGIES_OPTIONS.map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={allergy}
                      checked={formData.allergies.includes(allergy)}
                      onCheckedChange={(checked) => handleCheckboxChange("allergies", allergy, checked as boolean)}
                    />
                    <Label htmlFor={allergy} className="text-sm">
                      {allergy}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="otherAllergies" className="text-sm">
                  Other allergies
                </Label>
                <Input
                  id="otherAllergies"
                  value={formData.otherAllergies}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherAllergies: e.target.value }))}
                  placeholder="Enter other allergies"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Preferred Food Items</Label>
              <p className="text-sm text-gray-600 mb-3">Select your dietary preferences</p>
              <div className="grid grid-cols-2 gap-3">
                {PREFERRED_ITEMS_OPTIONS.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={formData.preferredItems.includes(item)}
                      onCheckedChange={(checked) => handleCheckboxChange("preferredItems", item, checked as boolean)}
                    />
                    <Label htmlFor={item} className="text-sm">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="otherPreferredItems" className="text-sm">
                  Other preferences
                </Label>
                <Input
                  id="otherPreferredItems"
                  value={formData.otherPreferredItems}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherPreferredItems: e.target.value }))}
                  placeholder="Enter other preferences"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Health Risk Factors</Label>
              <p className="text-sm text-gray-600 mb-3">Select any that apply to you</p>
              <div className="grid grid-cols-2 gap-3">
                {RISK_FACTORS_OPTIONS.map((factor) => (
                  <div key={factor} className="flex items-center space-x-2">
                    <Checkbox
                      id={factor}
                      checked={formData.riskFactors.includes(factor)}
                      onCheckedChange={(checked) => handleCheckboxChange("riskFactors", factor, checked as boolean)}
                    />
                    <Label htmlFor={factor} className="text-sm">
                      {factor}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="otherRiskFactors" className="text-sm">
                  Other risk factors
                </Label>
                <Input
                  id="otherRiskFactors"
                  value={formData.otherRiskFactors}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherRiskFactors: e.target.value }))}
                  placeholder="Enter other risk factors"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Favorite Cuisines</Label>
              <p className="text-sm text-gray-600 mb-3">Select your favorite types of cuisine</p>
              <div className="grid grid-cols-2 gap-3">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine}
                      checked={formData.foodCuisines.includes(cuisine)}
                      onCheckedChange={(checked) => handleCheckboxChange("foodCuisines", cuisine, checked as boolean)}
                    />
                    <Label htmlFor={cuisine} className="text-sm">
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <Label htmlFor="otherFoodCuisines" className="text-sm">
                  Other cuisines
                </Label>
                <Input
                  id="otherFoodCuisines"
                  value={formData.otherFoodCuisines}
                  onChange={(e) => setFormData((prev) => ({ ...prev, otherFoodCuisines: e.target.value }))}
                  placeholder="Enter other cuisines"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-green-700 mb-2">Welcome to NutriFlow</h1>
          <p className="text-center text-gray-600">{"Let's set up your personalized nutrition profile"}</p>
        </div>

        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-600 mt-2 text-center">
            Step {step} of {totalSteps}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && "Personal Information"}
              {step === 2 && "Allergies & Restrictions"}
              {step === 3 && "Dietary Preferences"}
              {step === 4 && "Health Information"}
              {step === 5 && "Cuisine Preferences"}
            </CardTitle>
            <CardDescription>
              {step === 1 && "Tell us about yourself"}
              {step === 2 && "Help us keep you safe"}
              {step === 3 && "What do you like to eat?"}
              {step === 4 && "Any health considerations?"}
              {step === 5 && "What flavors do you enjoy?"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handlePrev} disabled={step === 1}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {step < totalSteps ? (
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Saving..." : "Complete Setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
