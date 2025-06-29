"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Save, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "",
    allergies: [] as string[],
    otherAllergies: "",
    preferred_items: [] as string[],
    otherPreferredItems: "",
    risk_factors: [] as string[],
    otherRiskFactors: "",
    food_cusine: [] as string[],
    otherFoodCuisines: "",
    age: 0,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Load current profile from backend
    const loadProfile = async () => {
      try {
        const response = await fetch("http://localhost:8000/get-profile")
        if (response.ok) {
          const data = await response.json()
          setProfile({
            name: data.name || "",
            allergies: data.allergies || [],
            otherAllergies: "",
            preferred_items: data.preferred_items || [],
            otherPreferredItems: "",
            risk_factors: data.risk_factors || [],
            otherRiskFactors: "",
            food_cusine: data.food_cusine || [],
            otherFoodCuisines: "",
            age: data.age || 0,
          })
        }
      } catch (err) {
        console.error("Failed to load profile:", err)
      }
    }

    loadProfile()
  }, [])

  const handleCheckboxChange = (field: keyof typeof profile, value: string, checked: boolean) => {
    setProfile((prev) => ({
      ...prev,
      [field]: checked
        ? [...(prev[field] as string[]), value]
        : (prev[field] as string[]).filter((item) => item !== value),
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Combine selected options with custom inputs
      const allergies = [
        ...profile.allergies,
        ...(profile.otherAllergies ? profile.otherAllergies.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const preferred_items = [
        ...profile.preferred_items,
        ...(profile.otherPreferredItems ? profile.otherPreferredItems.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const risk_factors = [
        ...profile.risk_factors,
        ...(profile.otherRiskFactors ? profile.otherRiskFactors.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const food_cusine = [
        ...profile.food_cusine,
        ...(profile.otherFoodCuisines ? profile.otherFoodCuisines.split(",").map((s: string) => s.trim()) : []),
      ].filter(Boolean)

      const response = await fetch("http://localhost:8000/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          allergies,
          preferred_items,
          risk_factors,
          food_cusine,
          age: profile.age,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError("Failed to update profile")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mr-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-green-700">Profile Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">Profile updated successfully! 🎉</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || ""}
                    onChange={(e) => setProfile((prev) => ({ ...prev, age: Number.parseInt(e.target.value) || 0 }))}
                    placeholder="Enter your age"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          <Card>
            <CardHeader>
              <CardTitle>🚨 Allergies & Restrictions</CardTitle>
              <CardDescription>Select all that apply to keep you safe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ALLERGIES_OPTIONS.map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={allergy}
                      checked={profile.allergies.includes(allergy)}
                      onCheckedChange={(checked) => handleCheckboxChange("allergies", allergy, checked as boolean)}
                    />
                    <Label htmlFor={allergy} className="text-sm">
                      {allergy}
                    </Label>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="otherAllergies">Other allergies (comma-separated)</Label>
                <Input
                  id="otherAllergies"
                  value={profile.otherAllergies}
                  onChange={(e) => setProfile((prev) => ({ ...prev, otherAllergies: e.target.value }))}
                  placeholder="e.g., sesame, mustard, sulfites"
                />
              </div>
            </CardContent>
          </Card>

          {/* Dietary Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>🥗 Dietary Preferences</CardTitle>
              <CardDescription>What do you like to eat?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PREFERRED_ITEMS_OPTIONS.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={item}
                      checked={profile.preferred_items.includes(item)}
                      onCheckedChange={(checked) => handleCheckboxChange("preferred_items", item, checked as boolean)}
                    />
                    <Label htmlFor={item} className="text-sm">
                      {item}
                    </Label>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="otherPreferredItems">Other preferences (comma-separated)</Label>
                <Input
                  id="otherPreferredItems"
                  value={profile.otherPreferredItems}
                  onChange={(e) => setProfile((prev) => ({ ...prev, otherPreferredItems: e.target.value }))}
                  placeholder="e.g., organic, local, seasonal"
                />
              </div>
            </CardContent>
          </Card>

          {/* Health Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>🏥 Health Information</CardTitle>
              <CardDescription>Help us suggest healthier options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {RISK_FACTORS_OPTIONS.map((factor) => (
                  <div key={factor} className="flex items-center space-x-2">
                    <Checkbox
                      id={factor}
                      checked={profile.risk_factors.includes(factor)}
                      onCheckedChange={(checked) => handleCheckboxChange("risk_factors", factor, checked as boolean)}
                    />
                    <Label htmlFor={factor} className="text-sm">
                      {factor}
                    </Label>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="otherRiskFactors">Other health considerations (comma-separated)</Label>
                <Input
                  id="otherRiskFactors"
                  value={profile.otherRiskFactors}
                  onChange={(e) => setProfile((prev) => ({ ...prev, otherRiskFactors: e.target.value }))}
                  placeholder="e.g., kidney disease, food sensitivities"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cuisine Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>🍜 Favorite Cuisines</CardTitle>
              <CardDescription>What flavors do you enjoy?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CUISINE_OPTIONS.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine}
                      checked={profile.food_cusine.includes(cuisine)}
                      onCheckedChange={(checked) => handleCheckboxChange("food_cusine", cuisine, checked as boolean)}
                    />
                    <Label htmlFor={cuisine} className="text-sm">
                      {cuisine}
                    </Label>
                  </div>
                ))}
              </div>
              <div>
                <Label htmlFor="otherFoodCuisines">Other cuisines (comma-separated)</Label>
                <Input
                  id="otherFoodCuisines"
                  value={profile.otherFoodCuisines}
                  onChange={(e) => setProfile((prev) => ({ ...prev, otherFoodCuisines: e.target.value }))}
                  placeholder="e.g., Korean, Ethiopian, Fusion"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg" className="min-w-32">
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
