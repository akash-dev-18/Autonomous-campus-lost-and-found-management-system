"use client"

import { use, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Tag,
  User,
  MessageSquare,
  Flag,
  Share2,
  Edit,
  Trash2,
  ClipboardCheck,
  Sparkles,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { itemsAPI, matchesAPI, claimsAPI } from "@/lib/api"
import type { Item, Match } from "@/lib/types"
import { useAuth } from "@/context/auth-context"
import { cn } from "@/lib/utils"
import { ItemCard } from "@/components/features/item-card"

export default function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { user } = useAuth()
  const [item, setItem] = useState<Item | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [similarItems, setSimilarItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [claimDialogOpen, setClaimDialogOpen] = useState(false)
  const [claimDescription, setClaimDescription] = useState("")
  const [verificationKey, setVerificationKey] = useState("")
  const [verificationValue, setVerificationValue] = useState("")

  useEffect(() => {
    async function fetchItemData() {
      try {
        setLoading(true)
        const [itemData, matchesData, allItems] = await Promise.all([
          itemsAPI.getItem(id),
          matchesAPI.getItemMatches(id).catch(() => []),
          itemsAPI.getItems({ limit: 20 }),
        ])
        setItem(itemData)
        setMatches(Array.isArray(matchesData) ? matchesData : matchesData.matches || [])
        
        // Filter similar items by category
        const similar = allItems.items
          .filter((i) => i.id !== id && i.category === itemData.category)
          .slice(0, 3)
        setSimilarItems(similar)
      } catch (error) {
        console.error("Failed to fetch item:", error)
        toast.error("Failed to load item")
      } finally {
        setLoading(false)
      }
    }
    fetchItemData()
  }, [id])

  const handleClaim = async () => {
    try {
      await claimsAPI.createClaim({
        item_id: id,
        verification_answers: {
          description: claimDescription,
          ...(verificationKey && verificationValue 
            ? { [verificationKey]: verificationValue }
            : {})
        }
      })
      toast.success("Claim submitted successfully! The owner will be notified.")
      setClaimDialogOpen(false)
      setClaimDescription("")
      setVerificationKey("")
      setVerificationValue("")
    } catch (error) {
      toast.error("Failed to submit claim")
    }
  }

  const handleDelete = async () => {
    try {
      await itemsAPI.deleteItem(id)
      toast.success("Item deleted successfully")
      router.push("/items")
    } catch (error) {
      toast.error("Failed to delete item")
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard!")
  }

  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-2xl font-bold text-foreground">Item not found</h1>
        <p className="mt-2 text-muted-foreground">
          The item you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button asChild variant="outline" className="mt-4 bg-transparent">
          <Link href="/items">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to items
          </Link>
        </Button>
      </div>
    )
  }

  const isOwner = item.user_id === user?.id

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button asChild variant="ghost" className="gap-2">
        <Link href="/items">
          <ArrowLeft className="h-4 w-4" />
          Back to items
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image Gallery */}
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              {item.images[0] ? (
                <Image
                  src={item.images[0] || "/placeholder.svg"}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
              <div className="absolute left-4 top-4 flex gap-2">
                <Badge
                  variant={item.type === "lost" ? "destructive" : "default"}
                  className={cn(
                    "text-sm capitalize",
                    item.type === "found" &&
                      "bg-success text-success-foreground hover:bg-success/90"
                  )}
                >
                  {item.type}
                </Badge>
                {item.status !== "active" && (
                  <Badge variant="secondary" className="capitalize">
                    {item.status}
                  </Badge>
                )}
              </div>
            </div>
            {item.images.length > 1 && (
              <div className="flex gap-2 p-4">
                {item.images.map((image, index) => (
                  <div
                    key={index}
                    className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-primary"
                  >
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${item.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Item Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{item.title}</CardTitle>
                  <CardDescription className="mt-2 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {item.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(item.date_lost_found).toLocaleDateString()}
                    </span>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground">Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
                  <p className="mt-1 text-foreground">{item.category}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  <p className="mt-1 capitalize text-foreground">{item.status}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      <Tag className="mr-1 h-3 w-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Matches */}
          {matches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI-Powered Matches
                </CardTitle>
                <CardDescription>
                  Potential matches found by our AI system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {matches.map((match) => {
                    const matchedItem =
                      match.lost_item_id === id ? match.found_item : match.lost_item
                    const score = Math.round(match.similarity_score * 100)
                    return (
                      <Link
                        key={match.id}
                        href={`/items/${matchedItem?.id}`}
                        className="flex items-center gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {matchedItem?.images[0] && (
                            <Image
                              src={matchedItem.images[0] || "/placeholder.svg"}
                              alt={matchedItem.title}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{matchedItem?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {matchedItem?.location}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            score >= 80
                              ? "border-success/50 bg-success/10 text-success"
                              : score >= 50
                                ? "border-warning/50 bg-warning/10 text-warning"
                                : ""
                          )}
                        >
                          {score}% match
                        </Badge>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isOwner && item.status === "active" && (
                <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full">
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Claim This Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Claim Item</DialogTitle>
                      <DialogDescription>
                        Please provide details to verify your ownership of this item.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="claim-description">
                          How can you prove this is yours?
                        </Label>
                        <Textarea
                          id="claim-description"
                          placeholder="Describe unique features or provide proof of ownership..."
                          value={claimDescription}
                          onChange={(e) => setClaimDescription(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Verification Details (optional)</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="e.g., Serial number"
                            value={verificationKey}
                            onChange={(e) => setVerificationKey(e.target.value)}
                          />
                          <Input
                            placeholder="Value"
                            value={verificationValue}
                            onChange={(e) => setVerificationValue(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setClaimDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleClaim} disabled={!claimDescription}>
                        Submit Claim
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {!isOwner && (
                <Button variant="outline" className="w-full bg-transparent" asChild>
                  <Link href={`/messages?user=${item.user_id}`}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact {item.type === "lost" ? "Owner" : "Finder"}
                  </Link>
                </Button>
              )}

              {isOwner && (
                <>
                  <Button variant="outline" className="w-full bg-transparent" asChild>
                    <Link href={`/items/${id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Item
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
                    onClick={handleDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                  </Button>
                </>
              )}

              <Button variant="outline" className="w-full bg-transparent" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>

              {!isOwner && (
                <Button variant="ghost" className="w-full text-muted-foreground">
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Posted By */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {item.type === "lost" ? "Reported By" : "Found By"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={item.user?.avatar || "/placeholder.svg"} alt={item.user?.full_name} />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{item.user?.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Member since{" "}
                    {new Date(item.user?.created_at || "").toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {item.user?.reputation_score !== undefined && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-sm text-muted-foreground">Reputation Score:</span>
                  <span className="font-medium text-foreground">
                    {item.user.reputation_score}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Similar Items */}
          {similarItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Similar Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {similarItems.map((similarItem) => (
                  <Link
                    key={similarItem.id}
                    href={`/items/${similarItem.id}`}
                    className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {similarItem.images[0] && (
                        <Image
                          src={similarItem.images[0] || "/placeholder.svg"}
                          alt={similarItem.title}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {similarItem.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{similarItem.location}</p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
