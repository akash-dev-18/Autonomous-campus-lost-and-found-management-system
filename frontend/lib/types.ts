export interface User {
  id: string
  email: string
  full_name: string
  student_id?: string
  phone?: string
  role: "user" | "admin"
  reputation_score: number
  is_active: boolean
  created_at: string
  avatar?: string
}

export interface Item {
  id: string
  type: "lost" | "found"
  title: string
  description: string
  category: string
  location: string
  location_found?: string
  date_lost_found: string
  status: "active" | "claimed" | "returned" | "closed"
  tags: string[]
  images: string[]
  user_id: string
  user?: User
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  lost_item_id: string
  found_item_id: string
  similarity_score: number
  matching_attributes: string[]
  lost_item?: Item
  found_item?: Item
  created_at: string
}

export interface Claim {
  id: string
  item_id: string
  claimer_id: string
  description: string
  verification_details: Record<string, string>
  status: "pending" | "approved" | "rejected" | "completed"
  item?: Item
  claimer?: User
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  user: User
  last_message: string
  last_message_at: string
  unread_count: number
}

export interface Notification {
  id: string
  type: "match_found" | "claim_update" | "message" | "item_claimed"
  message: string
  data: Record<string, string>
  is_read: boolean
  created_at: string
}

export const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Documents",
  "Accessories",
  "Books",
  "Keys",
  "Bags",
  "Sports Equipment",
  "Other",
] as const

export type Category = (typeof CATEGORIES)[number]
