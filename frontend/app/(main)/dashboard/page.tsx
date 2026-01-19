"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Package,
  Sparkles,
  ClipboardList,
  MessageSquare,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { itemsAPI, matchesAPI, claimsAPI } from "@/lib/api"
import type { Item, Match, Claim } from "@/lib/types"
import { ItemCard } from "@/components/features/item-card"
import { toast } from "sonner"

export default function DashboardPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<Item[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        const [itemsRes, matchesRes, claimsRes] = await Promise.all([
          itemsAPI.getItems({ limit: 4 }),
          matchesAPI.getMyMatches().catch(() => ({ matches: [] })),
          claimsAPI.getClaims().catch(() => []),
        ])
        setItems(itemsRes.items || [])
        setMatches(Array.isArray(matchesRes) ? matchesRes : matchesRes.matches || [])
        setClaims(claimsRes || [])
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const stats = [
    {
      name: "My Items",
      value: items.filter((i) => i.user_id === user?.id).length,
      icon: Package,
      href: "/items?mine=true",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: "Active Matches",
      value: matches.length,
      icon: Sparkles,
      href: "/matches",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      name: "Pending Claims",
      value: claims.filter((c) => c.status === "pending").length,
      icon: ClipboardList,
      href: "/claims",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      name: "Total Items",
      value: items.length,
      icon: MessageSquare,
      href: "/items",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
  ]

  const recentItems = items.slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.full_name?.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-muted-foreground">
            {"Here's what's happening with your lost & found items."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/items">
              <Search className="mr-2 h-4 w-4" />
              Browse Items
            </Link>
          </Button>
          <Button asChild>
            <Link href="/items/create">
              <Plus className="mr-2 h-4 w-4" />
              Report Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Link key={stat.name} href={stat.href}>
                <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.name}</p>
                        <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      </div>
                      <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you can do right now</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-6 bg-transparent">
              <Link href="/items/create?type=lost">
                <div className="rounded-full bg-destructive/10 p-2">
                  <Package className="h-5 w-5 text-destructive" />
                </div>
                <span className="font-medium">Report Lost Item</span>
                <span className="text-xs text-muted-foreground">{"Lost something? Let us help"}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-6 bg-transparent">
              <Link href="/items/create?type=found">
                <div className="rounded-full bg-success/10 p-2">
                  <Package className="h-5 w-5 text-success" />
                </div>
                <span className="font-medium">Report Found Item</span>
                <span className="text-xs text-muted-foreground">Found something? Report it</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-6 bg-transparent">
              <Link href="/matches">
                <div className="rounded-full bg-primary/10 p-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <span className="font-medium">View Matches</span>
                <span className="text-xs text-muted-foreground">AI-powered item matching</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-2 py-6 bg-transparent">
              <Link href="/items">
                <div className="rounded-full bg-chart-1/10 p-2">
                  <Search className="h-5 w-5 text-chart-1" />
                </div>
                <span className="font-medium">Browse All Items</span>
                <span className="text-xs text-muted-foreground">Search through all listings</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Latest lost & found items</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/items">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentItems.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recentItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No items yet. Create your first item!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
