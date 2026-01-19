"use client"

import { useState, useMemo, useEffect } from "react"
import { ClipboardList, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ClaimCard } from "@/components/features/claim-card"
import { claimsAPI, itemsAPI } from "@/lib/api"
import type { Claim, Item } from "@/lib/types"
import { useAuth } from "@/context/auth-context"

type StatusFilter = "all" | "pending" | "approved" | "rejected" | "completed"
type TabValue = "my-claims" | "received-claims"

export default function ClaimsPage() {
  const { user } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [myItems, setMyItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabValue>("my-claims")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [claimsData, itemsData] = await Promise.all([
          claimsAPI.getClaims(),
          itemsAPI.getItems({ user_id: user?.id }),
        ])
        setClaims(claimsData || [])
        setMyItems(itemsData.items || [])
      } catch (error) {
        console.error("Failed to fetch claims:", error)
        toast.error("Failed to load claims")
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchData()
  }, [user])

  // Claims I made
  const myClaims = claims.filter((claim) => claim.claimer_id === user?.id)

  // Claims on my items
  const myItemIds = myItems.map((i) => i.id)
  const receivedClaims = claims.filter((claim) => myItemIds.includes(claim.item_id))

  const filteredClaims = useMemo(() => {
    const claimsList = activeTab === "my-claims" ? myClaims : receivedClaims

    if (statusFilter === "all") return claimsList
    return claimsList.filter((claim) => claim.status === statusFilter)
  }, [activeTab, statusFilter, myClaims, receivedClaims])

  const stats = {
    myClaims: {
      total: myClaims.length,
      pending: myClaims.filter((c) => c.status === "pending").length,
      approved: myClaims.filter((c) => c.status === "approved").length,
      rejected: myClaims.filter((c) => c.status === "rejected").length,
    },
    received: {
      total: receivedClaims.length,
      pending: receivedClaims.filter((c) => c.status === "pending").length,
      approved: receivedClaims.filter((c) => c.status === "approved").length,
      rejected: receivedClaims.filter((c) => c.status === "rejected").length,
    },
  }

  const currentStats = activeTab === "my-claims" ? stats.myClaims : stats.received

  const handleApprove = async (claimId: string) => {
    try {
      await claimsAPI.updateClaimStatus(claimId, "approved")
      toast.success("Claim approved! The claimer has been notified.")
      // Refresh claims
      const updated = await claimsAPI.getClaims()
      setClaims(updated || [])
    } catch (error) {
      toast.error("Failed to approve claim")
    }
  }

  const handleReject = async (claimId: string) => {
    try {
      await claimsAPI.updateClaimStatus(claimId, "rejected")
      toast.info("Claim rejected. The claimer has been notified.")
      // Refresh claims
      const updated = await claimsAPI.getClaims()
      setClaims(updated || [])
    } catch (error) {
      toast.error("Failed to reject claim")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
          <ClipboardList className="h-8 w-8 text-primary" />
          Claims Management
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage claims you&apos;ve made and claims on your items.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto p-1">
            <TabsTrigger value="my-claims" className="gap-2 px-4 py-2">
              My Claims
              {stats.myClaims.total > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.myClaims.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received-claims" className="gap-2 px-4 py-2">
              Claims on My Items
              {stats.received.pending > 0 && (
                <Badge className="ml-1">{stats.received.pending}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setStatusFilter("all")}
          >
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-foreground">{currentStats.total}</div>
              <p className="text-sm text-muted-foreground">Total Claims</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setStatusFilter("pending")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-warning">{currentStats.pending}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <Clock className="h-5 w-5 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setStatusFilter("approved")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-success">{currentStats.approved}</div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer transition-all hover:shadow-md"
            onClick={() => setStatusFilter("rejected")}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-destructive">
                    {currentStats.rejected}
                  </div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claims List */}
        <TabsContent value="my-claims" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClaims.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredClaims.map((claim) => (
                <ClaimCard key={claim.id} claim={claim} isOwner={false} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No claims found</h3>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  {statusFilter !== "all"
                    ? "No claims with this status. Try a different filter."
                    : "You haven't made any claims yet. Browse items to find what you've lost."}
                </p>
                {statusFilter !== "all" && (
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => setStatusFilter("all")}
                  >
                    Show all claims
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="received-claims" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClaims.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredClaims.map((claim) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  isOwner={true}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  No claims on your items
                </h3>
                <p className="mt-1 text-center text-sm text-muted-foreground">
                  {statusFilter !== "all"
                    ? "No claims with this status. Try a different filter."
                    : "No one has claimed your items yet. Check back later."}
                </p>
                {statusFilter !== "all" && (
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => setStatusFilter("all")}
                  >
                    Show all claims
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Claim Process Info */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Claim Process</CardTitle>
          <CardDescription>How the claiming process works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                1
              </div>
              <div>
                <h4 className="font-medium">Submit Claim</h4>
                <p className="text-sm text-muted-foreground">
                  Provide details and proof of ownership
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                2
              </div>
              <div>
                <h4 className="font-medium">Review</h4>
                <p className="text-sm text-muted-foreground">
                  Owner reviews your claim and verification
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                3
              </div>
              <div>
                <h4 className="font-medium">Decision</h4>
                <p className="text-sm text-muted-foreground">
                  Claim is approved or rejected
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                4
              </div>
              <div>
                <h4 className="font-medium">Return</h4>
                <p className="text-sm text-muted-foreground">
                  Arrange item return if approved
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
