"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, X, Loader2, ImageIcon, Wand2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { CATEGORIES } from "@/lib/types"
import { cn } from "@/lib/utils"
import { itemsAPI } from "@/lib/api"
import { aiAPI } from "@/lib/api/ai"
import { Suspense } from "react"
import Loading from "./loading"

export default function CreateItemPage() {
  const router = useRouter()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    type: "lost" as "lost" | "found",
    title: "",
    description: "",
    category: "",
    location: "",
    date_lost_found: new Date().toISOString().split("T")[0],
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")
  const [images, setImages] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.category || !formData.location) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      // Create item via API
      await itemsAPI.createItem({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        location_found: formData.location,
        date_lost_found: formData.date_lost_found,
        tags: formData.tags,
        images: images,
      })

      toast.success(
        `${formData.type === "lost" ? "Lost" : "Found"} item reported successfully! Our AI will search for matches.`
      )
      router.push("/items")
    } catch (error: any) {
      console.error("Failed to create item:", error)
      toast.error(error.message || "Failed to create item")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const tag = tagInput.trim().toLowerCase()
      if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
        setFormData({ ...formData, tags: [...formData.tags, tag] })
        setTagInput("")
      }
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Limit to 5 images total
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    const newImages: string[] = []
    const fileArray = Array.from(files)

    // Process all images for preview
    for (const file of fileArray) {
      const reader = new FileReader()
      await new Promise<void>((resolve) => {
        reader.onload = (e) => {
          if (e.target?.result) newImages.push(e.target.result as string)
          resolve()
        }
        reader.readAsDataURL(file)
      })
    }
    setImages((prev) => [...prev, ...newImages])

    // Trigger AI Analysis on the FIRST uploaded file
    const fileToAnalyze = fileArray[0]
    if (fileToAnalyze) {
      try {
        toast.info("AI is analyzing your image...", { icon: <Wand2 className="h-4 w-4 animate-spin"/> })
        
        const result = await aiAPI.analyzeImage(fileToAnalyze)
        
        // Auto-select category if not set or if confidence is high
        if (!formData.category || result.confidence > 0.4) {
             // Find exact match in CATEGORIES (case sensitive check just in case)
             const matchedCategory = CATEGORIES.find(c => c.toLowerCase() === result.category.toLowerCase()) || "Other"
             setFormData(prev => ({ ...prev, category: matchedCategory }))
        }
        
        // Add suggested tags (avoid duplicates)
        if (result.tags.length > 0) {
           setFormData(prev => {
             const newTags = [...prev.tags]
             result.tags.forEach(tag => {
               if (!newTags.includes(tag.toLowerCase()) && newTags.length < 10) {
                 newTags.push(tag.toLowerCase())
               }
             })
             return { ...prev, tags: newTags }
           })
           toast.success(`Detected: ${result.category}`, { description: `Added tags: ${result.tags.join(", ")}` })
        }
        
      } catch (error) {
        console.error("AI Analysis failed:", error)
      }
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Button asChild variant="ghost" className="gap-2">
        <Link href="/items">
          <ArrowLeft className="h-4 w-4" />
          Back to items
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Report an Item</CardTitle>
          <CardDescription>
            Fill in the details below to report a lost or found item. Our AI will automatically
            search for matches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Item Type */}
            <div className="space-y-3">
              <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50">Item Type *</div>
              <RadioGroup
                value={formData.type}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, type: value as "lost" | "found" })
                }
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="lost"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all",
                    formData.type === "lost"
                      ? "border-destructive bg-destructive/5"
                      : "border-border hover:border-destructive/50"
                  )}
                >
                  <RadioGroupItem value="lost" id="lost" className="sr-only" />
                  <div
                    className={cn(
                      "mb-2 rounded-full p-2",
                      formData.type === "lost" ? "bg-destructive/10" : "bg-muted"
                    )}
                  >
                    <span className="text-2xl">😢</span>
                  </div>
                  <span className="font-medium">I Lost Something</span>
                  <span className="text-xs text-muted-foreground">Report a lost item</span>
                </Label>
                <Label
                  htmlFor="found"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 p-4 transition-all",
                    formData.type === "found"
                      ? "border-success bg-success/5"
                      : "border-border hover:border-success/50"
                  )}
                >
                  <RadioGroupItem value="found" id="found" className="sr-only" />
                  <div
                    className={cn(
                      "mb-2 rounded-full p-2",
                      formData.type === "found" ? "bg-success/10" : "bg-muted"
                    )}
                  >
                    <span className="text-2xl">🎉</span>
                  </div>
                  <span className="font-medium">I Found Something</span>
                  <span className="text-xs text-muted-foreground">Report a found item</span>
                </Label>
              </RadioGroup>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Black iPhone 15 Pro"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide as much detail as possible - color, size, distinguishing features, etc."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50">Category *</div>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">
                Location {formData.type === "lost" ? "Last Seen" : "Found"} *
              </Label>
              <Input
                id="location"
                placeholder="e.g., Main Library, 2nd Floor"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">
                Date {formData.type === "lost" ? "Lost" : "Found"} *
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date_lost_found}
                onChange={(e) =>
                  setFormData({ ...formData, date_lost_found: e.target.value })
                }
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optional)</Label>
              <div className="space-y-2">
                <Input
                  id="tags"
                  placeholder="Type a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                />
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Add keywords that describe your item (max 10)
                </p>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-2">
              <Label>Images (optional)</Label>
              <div className="space-y-4">
                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
                    {images.map((image, index) => (
                      <div
                        key={index}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                      >
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Upload ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Area */}
                {images.length < 5 && (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-8 transition-colors hover:border-primary/50 hover:bg-accent/50">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Click to upload images
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 10MB ({5 - images.length} remaining)
                    </p>
                  </label>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Report Item
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export const SuspenseBoundary = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<Loading />}>{children}</Suspense>
)
