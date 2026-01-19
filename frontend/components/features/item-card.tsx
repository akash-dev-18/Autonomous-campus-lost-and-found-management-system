"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Calendar, Tag } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Item } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ItemCardProps {
  item: Item
  className?: string
}

export function ItemCard({ item, className }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`}>
      <Card
        className={cn(
          "group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1",
          className
        )}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {item.images[0] ? (
            <Image
              src={item.images[0] || "/placeholder.svg"}
              alt={item.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge
              variant={item.type === "lost" ? "destructive" : "default"}
              className={cn(
                "capitalize",
                item.type === "found" && "bg-success text-success-foreground hover:bg-success/90"
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
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{new Date(item.date_lost_found).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-1 border-t border-border px-4 py-3">
          <Tag className="h-3 w-3 text-muted-foreground" />
          {item.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {item.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.tags.length - 3}
            </Badge>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
