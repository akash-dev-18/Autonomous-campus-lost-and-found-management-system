"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeftRight, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { Match } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  match: Match
  className?: string
}

export function MatchCard({ match, className }: MatchCardProps) {
  const scorePercent = Math.round(match.similarity_score * 100)
  const scoreLevel =
    scorePercent >= 80 ? "High" : scorePercent >= 50 ? "Medium" : "Low"
  const scoreColor =
    scorePercent >= 80
      ? "text-success"
      : scorePercent >= 50
        ? "text-warning"
        : "text-muted-foreground"

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">AI Match</span>
          <Badge
            variant="outline"
            className={cn(
              scorePercent >= 80
                ? "border-success/50 bg-success/10 text-success"
                : scorePercent >= 50
                  ? "border-warning/50 bg-warning/10 text-warning"
                  : ""
            )}
          >
            {scoreLevel} Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {/* Lost Item */}
          <div className="flex-1 space-y-2">
            <Badge variant="destructive" className="mb-2">
              Lost
            </Badge>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {match.lost_item?.images[0] ? (
                <Image
                  src={match.lost_item.images[0] || "/placeholder.svg"}
                  alt={match.lost_item?.title || "Lost item"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <p className="line-clamp-1 text-sm font-medium">{match.lost_item?.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {match.lost_item?.location}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Found Item */}
          <div className="flex-1 space-y-2">
            <Badge className="mb-2 bg-success text-success-foreground hover:bg-success/90">
              Found
            </Badge>
            <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
              {match.found_item?.images[0] ? (
                <Image
                  src={match.found_item.images[0] || "/placeholder.svg"}
                  alt={match.found_item?.title || "Found item"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <p className="line-clamp-1 text-sm font-medium">{match.found_item?.title}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {match.found_item?.location}
            </p>
          </div>
        </div>

        {/* Match Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Match Score</span>
            <span className={cn("font-semibold", scoreColor)}>{scorePercent}%</span>
          </div>
          <Progress value={scorePercent} className="h-2" />
        </div>

        {/* Matching Attributes */}
        <div className="flex flex-wrap gap-1">
          {match.matching_attributes.map((attr) => (
            <Badge key={attr} variant="secondary" className="text-xs capitalize">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              {attr.replace("_", " ")}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 border-t border-border pt-4">
        <Button asChild variant="outline" className="flex-1 bg-transparent">
          <Link href={`/items/${match.lost_item_id}`}>View Lost</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/items/${match.found_item_id}`}>View Found</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
