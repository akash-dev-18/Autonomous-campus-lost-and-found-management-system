"use client"

import Image from "next/image"
import { Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Claim } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ClaimCardProps {
  claim: Claim
  isOwner?: boolean
  onApprove?: (claimId: string) => void
  onReject?: (claimId: string) => void
  className?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: "Pending",
    variant: "secondary" as const,
    className: "bg-warning/10 text-warning border-warning/50",
  },
  approved: {
    icon: CheckCircle,
    label: "Approved",
    variant: "default" as const,
    className: "bg-success/10 text-success border-success/50",
  },
  rejected: {
    icon: XCircle,
    label: "Rejected",
    variant: "destructive" as const,
    className: "bg-destructive/10 text-destructive border-destructive/50",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    variant: "default" as const,
    className: "bg-primary/10 text-primary border-primary/50",
  },
}

export function ClaimCard({ claim, isOwner, onApprove, onReject, className }: ClaimCardProps) {
  const status = statusConfig[claim.status]
  const StatusIcon = status.icon

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
          {claim.item?.images[0] ? (
            <Image
              src={claim.item.images[0] || "/placeholder.svg"}
              alt={claim.item?.title || "Item"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{claim.item?.title}</h3>
              <p className="text-sm text-muted-foreground">{claim.item?.location}</p>
            </div>
            <Badge variant="outline" className={cn("gap-1", status.className)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Claimer Info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={claim.claimer?.avatar || "/placeholder.svg"} alt={claim.claimer?.full_name} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{claim.claimer?.full_name}</p>
            <p className="text-xs text-muted-foreground">
              Claimed on {new Date(claim.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Claim Description */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Claim Description</h4>
          <p className="text-sm text-muted-foreground">{claim.description}</p>
        </div>

        {/* Verification Details */}
        {Object.keys(claim.verification_details).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Verification Details</h4>
            <div className="grid gap-2">
              {Object.entries(claim.verification_details).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                >
                  <span className="capitalize text-muted-foreground">
                    {key.replace("_", " ")}
                  </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      {isOwner && claim.status === "pending" && (
        <CardFooter className="flex gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
            onClick={() => onReject?.(claim.id)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Reject
          </Button>
          <Button
            className="flex-1 bg-success text-success-foreground hover:bg-success/90"
            onClick={() => onApprove?.(claim.id)}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
