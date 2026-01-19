"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { Search, SlidersHorizontal, LayoutGrid, List, Plus, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ItemCard } from "@/components/features/item-card"
import { itemsAPI } from "@/lib/api"
import type { Item } from "@/lib/types"
import { CATEGORIES } from "@/lib/types"
import { cn } from "@/lib/utils"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { toast } from "sonner"

type ViewMode = "grid" | "list"
type ItemType = "all" | "lost" | "found"
type ItemStatus = "all" | "active" | "claimed" | "returned"

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [typeFilter, setTypeFilter] = useState<ItemType>("all")
  const [statusFilter, setStatusFilter] = useState<ItemStatus>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("newest")
  const searchParams = useSearchParams()

  // Fetch items from API
  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true)
        const isMine = searchParams.get('mine') === 'true'
        
        if (isMine) {
           const myItems = await itemsAPI.getMyItems()
           setItems(myItems || [])
        } else {
           const response = await itemsAPI.getItems({
            type: typeFilter !== "all" ? typeFilter : undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
            category: categoryFilter !== "all" ? categoryFilter : undefined,
          })
          setItems(response.items || [])
        }
      } catch (error) {
        console.error("Failed to fetch items:", error)
        toast.error("Failed to load items")
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    fetchItems()
  }, [typeFilter, statusFilter, categoryFilter, searchParams])

  const filteredItems = useMemo(() => {
    let filtered = [...items]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.location.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [items, searchQuery, sortBy])

  const activeFiltersCount = [
    typeFilter !== "all",
    statusFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length

  const clearFilters = () => {
    setTypeFilter("all")
    setStatusFilter("all")
    setCategoryFilter("all")
    setSearchQuery("")
  }

  return (
    <Suspense fallback={null}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {searchParams.get('mine') === 'true' ? "My Items" : "Items"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {searchParams.get('mine') === 'true' 
                ? "Manage your reported lost and found items" 
                : "Browse and search for lost & found items"}
            </p>
          </div>
          <div className="flex gap-2">
             {searchParams.get('mine') === 'true' && (
                <Button variant="outline" asChild>
                  <Link href="/items">
                    View All Items
                  </Link>
                </Button>
             )}
              <Button asChild>
                <Link href="/items/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Report Item
                </Link>
              </Button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items by title, description, location, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Type Filter Pills */}
            <div className="hidden gap-1 md:flex">
              {(["all", "lost", "found"] as const).map((type) => (
                <Button
                  key={type}
                  variant={typeFilter === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "capitalize",
                    typeFilter === type &&
                      type === "lost" &&
                      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                    typeFilter === type &&
                      type === "found" &&
                      "bg-success text-success-foreground hover:bg-success/90"
                  )}
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filters */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative bg-transparent">
                  <SlidersHorizontal className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>Filter items by type, status, and category</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Type */}
                  <div className="space-y-3">
                    <Label>Type</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["all", "lost", "found"] as const).map((type) => (
                        <Button
                          key={type}
                          variant={typeFilter === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTypeFilter(type)}
                          className="capitalize"
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-3">
                    <Label>Status</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["all", "active", "claimed", "returned"] as const).map((status) => (
                        <Button
                          key={status}
                          variant={statusFilter === status ? "default" : "outline"}
                          size="sm"
                          onClick={() => setStatusFilter(status)}
                          className="capitalize"
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="space-y-3">
                    <Label>Category</Label>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeFiltersCount > 0 && (
                    <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
                      <X className="mr-2 h-4 w-4" />
                      Clear all filters
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* View Toggle */}
            <div className="hidden items-center gap-1 rounded-lg border border-border p-1 md:flex">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {typeFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                Type: {typeFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setTypeFilter("all")}
                />
              </Badge>
            )}
            {statusFilter !== "all" && (
              <Badge variant="secondary" className="gap-1 capitalize">
                Status: {statusFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setStatusFilter("all")}
                />
              </Badge>
            )}
            {categoryFilter !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Category: {categoryFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setCategoryFilter("all")}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
        </p>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length > 0 ? (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-4"
            )}
          >
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Search className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No items found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" className="mt-4 bg-transparent" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </Suspense>
  )
}
