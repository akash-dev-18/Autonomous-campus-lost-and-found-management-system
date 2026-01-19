"use client"

import { useState, useMemo } from "react"
import { Sparkles, Filter, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MatchCard } from "@/components/features/match-card"
import { mockMatches } from "@/lib/mock-data"

type ConfidenceFilter = "all" | "high" | "medium" | "low"

export default function MatchesPage() {
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>("all")
  const [sortBy, setSortBy] = useState("score")

  const filteredMatches = useMemo(() => {
    let matches = [...mockMatches]

    // Confidence filter
    if (confidenceFilter !== "all") {
      matches = matches.filter((match) => {
        const score = match.similarity_score * 100
        switch (confidenceFilter) {
          case "high":
            return score >= 80
          case "medium":
            return score >= 50 && score < 80
          case "low":
            return score < 50
          default:
            return true
        }
      })
    }

    // Sort
    matches.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return b.similarity_score - a.similarity_score
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        default:
          return 0
      }
    })

    return matches
  }, [confidenceFilter, sortBy])

  const stats = {
    total: mockMatches.length,
    high: mockMatches.filter((m) => m.similarity_score >= 0.8).length,
    medium: mockMatches.filter((m) => m.similarity_score >= 0.5 && m.similarity_score < 0.8)
      .length,
    low: mockMatches.filter((m) => m.similarity_score < 0.5).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <Sparkles className="h-8 w-8 text-primary" />
            AI-Powered Matches
          </h1>
          <p className="mt-1 text-muted-foreground">
            Our AI analyzes items to find potential matches based on description, location, and
            other attributes.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Matches</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => setConfidenceFilter(confidenceFilter === "high" ? "all" : "high")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">{stats.high}</div>
                <p className="text-sm text-muted-foreground">High Confidence</p>
              </div>
              <Badge
                variant="outline"
                className="border-success/50 bg-success/10 text-success"
              >
                {">"}80%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => setConfidenceFilter(confidenceFilter === "medium" ? "all" : "medium")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-warning">{stats.medium}</div>
                <p className="text-sm text-muted-foreground">Medium Confidence</p>
              </div>
              <Badge
                variant="outline"
                className="border-warning/50 bg-warning/10 text-warning"
              >
                50-80%
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => setConfidenceFilter(confidenceFilter === "low" ? "all" : "low")}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-muted-foreground">{stats.low}</div>
                <p className="text-sm text-muted-foreground">Low Confidence</p>
              </div>
              <Badge variant="outline">{"<"}50%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "high", "medium", "low"] as const).map((filter) => (
            <Button
              key={filter}
              variant={confidenceFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setConfidenceFilter(filter)}
              className="capitalize"
            >
              {filter === "all" ? "All" : `${filter} confidence`}
            </Button>
          ))}
        </div>
        <div className="ml-auto">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Highest Score</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredMatches.length} {filteredMatches.length === 1 ? "match" : "matches"}
      </p>

      {/* Matches Grid */}
      {filteredMatches.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sparkles className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">No matches found</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {confidenceFilter !== "all"
                ? "Try changing your confidence filter to see more matches."
                : "No AI matches are available at the moment. Check back later."}
            </p>
            {confidenceFilter !== "all" && (
              <Button
                variant="outline"
                className="mt-4 bg-transparent"
                onClick={() => setConfidenceFilter("all")}
              >
                Show all matches
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            How AI Matching Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                1
              </div>
              <h4 className="font-medium">Analysis</h4>
              <p className="text-sm text-muted-foreground">
                Our AI analyzes item descriptions, categories, and locations to understand each
                item.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                2
              </div>
              <h4 className="font-medium">Comparison</h4>
              <p className="text-sm text-muted-foreground">
                Lost items are compared against found items to identify potential matches.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                3
              </div>
              <h4 className="font-medium">Notification</h4>
              <p className="text-sm text-muted-foreground">
                You get notified when a potential match is found so you can verify and claim.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
