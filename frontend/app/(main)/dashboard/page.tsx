"use client"

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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { mockItems, mockMatches, mockClaims } from "@/lib/mock-data"
import { ItemCard } from "@/components/features/item-card"

const stats = [
  {
    name: "My Items",
    value: mockItems.filter((i) => i.user_id === "user-1").length,
    icon: Package,
    href: "/items?mine=true",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    name: "Active Matches",
    value: mockMatches.length,
    icon: Sparkles,
    href: "/matches",
    color: "text-success",
    bgColor: "bg-success/10",
  },
  {
    name: "Pending Claims",
    value: mockClaims.filter((c) => c.status === "pending").length,
    icon: ClipboardList,
    href: "/claims",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    name: "Unread Messages",
    value: 2,
    icon: MessageSquare,
    href: "/messages",
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
]

const recentActivity = [
  {
    id: 1,
    type: "match",
    message: "New match found for your lost iPhone",
    time: "2 hours ago",
  },
  {
    id: 2,
    type: "claim",
    message: "Your claim for the student ID was approved",
    time: "5 hours ago",
  },
  {
    id: 3,
    type: "message",
    message: "New message from Jane Smith",
    time: "1 day ago",
  },
  {
    id: 4,
    type: "item",
    message: "Someone found car keys near the gym",
    time: "2 days ago",
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const recentItems = mockItems.slice(0, 4)

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

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest updates</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Items */}
        <Card className="lg:col-span-2">
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
            <div className="grid gap-4 sm:grid-cols-2">
              {recentItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
