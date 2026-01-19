"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { MessageSquare, Send, Search, User, Check, CheckCheck, Wifi, WifiOff, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/context/auth-context"
import { useWebSocket } from "@/lib/hooks/useWebSocket"
import { usersAPI, messagesAPI } from "@/lib/api"
import type { User as UserType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export default function MessagesPage() {
  const { user: currentUser } = useAuth()
  const { messages: wsMessages, sendMessage, isConnected, error } = useWebSocket()
  
  const [users, setUsers] = useState<UserType[]>([])
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
  const [historicalMessages, setHistoricalMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch users on mount
  // Fetch conversations and users
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [conversations, allUsers] = await Promise.all([
          messagesAPI.getConversations().catch(() => []), 
          usersAPI.listUsers().catch(() => [])
        ])

        // If we have conversations, show them. Otherwise show all users to start.
        if (conversations.length > 0) {
          // Conversations have { user, last_message, ... } we just need the user object for the list
          // But wait, the list usually needs the whole conversation object to show unread counts etc.
          // Let's rely on conversations for the main view, but if emptry, maybe show suggestions?
          // Actually, the user wants to SEARCH.
          const convUsers = conversations.map((c: any) => ({
            ...c.user, 
            // attach conversation meta if needed, or just look it up later
            conversationMeta: c
          }))
          setUsers(convUsers)
        } else {
           // No conversations, show all users so they can start one
           setUsers(allUsers)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    if (currentUser) fetchData()
  }, [currentUser])

  // Search effect
  useEffect(() => {
    async function search() {
      if (!searchQuery.trim()) {
        // Reload conversations/default view if cleared? 
        // For simplicity, let's just re-fetch conversations if search is cleared
        if (currentUser) {
           const conversations = await messagesAPI.getConversations().catch(() => [])
           setUsers(conversations.map((c: any) => ({...c.user, conversationMeta: c})))
        }
        return
      }

      try {
        setLoading(true)
        const results = await usersAPI.searchUsers(searchQuery)
        setUsers(results)
      } catch (error) {
        console.error("Search failed:", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(search, 500)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, currentUser])

  // Fetch historical messages when user is selected
  useEffect(() => {
    async function fetchMessages() {
      if (!selectedUser) return
      
      try {
        const response = await messagesAPI.getMessages(selectedUser.id)
        setHistoricalMessages(response || [])
      } catch (error) {
        console.error("Failed to fetch messages:", error)
        setHistoricalMessages([])
      }
    }
    fetchMessages()
  }, [selectedUser])

  // Combine historical and WebSocket messages
  const allMessages = useMemo(() => {
    if (!selectedUser) return []
    
    // Filter WebSocket messages for this conversation
    const relevantWsMessages = wsMessages.filter(
      (msg) =>
        (msg.sender_id === currentUser?.id && msg.recipient_id === selectedUser.id) ||
        (msg.sender_id === selectedUser.id && msg.recipient_id === currentUser?.id)
    )
    
    // Combine and deduplicate
    const combined = [...historicalMessages, ...relevantWsMessages]
    const uniqueMessages = Array.from(new Map(combined.map(item => [item.id, item])).values())
    
    return uniqueMessages.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [historicalMessages, wsMessages, selectedUser, currentUser])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [allMessages])

  // Show WebSocket error
  useEffect(() => {
    if (error) {
      toast.error(`WebSocket error: ${error}`)
    }
  }, [error])

  // Track users in a ref to check for existence/updates without triggering infinite loops in useEffect
  const usersRef = useRef(users)
  useEffect(() => {
    usersRef.current = users
  }, [users])

  // Handle incoming WebSocket messages
  useEffect(() => {
    console.log('WS Messages updated:', wsMessages.length)
    if (wsMessages.length === 0) return

    const lastMessage = wsMessages[wsMessages.length - 1]
    console.log('Last message:', lastMessage)
    
    // Identify who the "other" person is in this transaction
    const isFromMe = lastMessage.sender_id === currentUser?.id
    const otherUserId = isFromMe ? lastMessage.recipient_id : lastMessage.sender_id

    // Use ref to check existence to avoid dependency loop
    const currentUsers = usersRef.current
    const userExists = currentUsers.some(u => u.id === otherUserId)

    if (userExists) {
      // Notify if it's an incoming message from someone we aren't currently viewing
      if (!isFromMe && selectedUser?.id !== otherUserId) {
        setUsers(prev => prev.map(u => 
          u.id === otherUserId ? { ...u, hasUnread: true } : u
        ))
        const sender = currentUsers.find(u => u.id === otherUserId)
        toast.info(`New message from ${sender?.full_name || 'User'}`)
      }
    } else {
      // New conversation started! Fetch user and add to list
      const fetchNewUser = async () => {
        try {
          // Double check ref before fetching to avoid race conditions
          if (usersRef.current.some(u => u.id === otherUserId)) return

          const newUser = await usersAPI.getUser(otherUserId)
          setUsers(prev => {
             // Check again to avoid duplicates
            if (prev.some(u => u.id === newUser.id)) return prev
            // If from others, mark as unread
            const userToAdd = isFromMe ? newUser : { ...newUser, hasUnread: true }
            return [userToAdd, ...prev]
          })
          if (!isFromMe) {
            toast.info(`New message from ${newUser.full_name}`)
          }
        } catch (error) {
          console.error('Failed to fetch new user:', error)
        }
      }
      fetchNewUser()
    }
  }, [wsMessages, selectedUser, currentUser])

  // Filter users client-side for search
  const displayUsers = useMemo(() => {
    if (!searchQuery) return users
    return users.filter((user) => 
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    sendMessage(selectedUser.id, newMessage.trim())
    setNewMessage("")
  }

  const handleSelectUser = (user: UserType) => {
    setSelectedUser(user)
    setNewMessage("")
    // Clear unread status
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, hasUnread: false } : u))
    
    // If selected from search and not in list, add them to list immediately
    if (!users.some(u => u.id === user.id)) {
      setUsers(prev => [user, ...prev])
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <MessageSquare className="h-8 w-8 text-primary" />
            Messages
          </h1>
          <p className="mt-1 text-muted-foreground">
            Real-time chat with other users
          </p>
        </div>
        
        {/* Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="gap-2 border-success/50 bg-success/10 text-success">
              <Wifi className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-2 border-destructive/50 bg-destructive/10 text-destructive">
              <WifiOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </div>
      </div>

      {/* Chat Layout - WhatsApp Style */}
      {/* Increased height: h-[calc(100vh-180px)] */}
      <Card className="flex flex-row gap-0 p-0 h-[calc(100vh-180px)] min-h-[500px] overflow-hidden border-border/60">
        
        {/* Users List Sidebar */}
        {/* Mobile: Hidden if user selected. Desktop: Always visible (w-80) */}
        <div className={cn(
          "flex flex-col border-r border-border bg-card/50",
          "w-full md:w-80 shrink-0", 
          selectedUser ? "hidden md:flex" : "flex"
        )}>
          {/* Search */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* User List */}
          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : displayUsers.length > 0 ? (
              <div className="divide-y divide-border">
                {displayUsers.map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className={cn(
                      "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                      selectedUser?.id === user.id && "bg-accent"
                    )}
                  >
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.full_name}
                      />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={cn("font-medium truncate", (user as any).hasUnread && "font-bold")}>
                          {user.full_name}
                        </span>
                        {(user as any).hasUnread && (
                           <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shrink-0 ml-2" />
                        )}
                      </div>
                      <p className={cn("truncate text-xs", (user as any).hasUnread ? "text-foreground font-medium" : "text-muted-foreground")}>
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                <User className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No users found</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        {/* Mobile: Hidden if NO user selected. Desktop: Always visible (flex-1) */}
        <div className={cn(
          "flex flex-col overflow-hidden bg-background",
          "w-full md:flex-1",
          !selectedUser ? "hidden md:flex" : "flex"
        )}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 border-b border-border p-4 bg-card/30">
                {/* Back Button: Mobile Only */}
                <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={() => setSelectedUser(null)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.full_name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedUser.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-hidden bg-muted/10 relative">
                {/* Optional: Add a subtle pattern (SVG) here for WhatsApp feel if desired, keeping it clean for now */}
                
                <ScrollArea className="h-full p-4">
                  <div className="space-y-4 max-w-3xl mx-auto"> 
                    {/* Added max-w-3xl for better readability on large screens */}
                    {allMessages.map((message) => {
                      const isOwn = message.sender_id === currentUser?.id
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 shadow-sm",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-card text-card-foreground border border-border rounded-bl-md"
                            )}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1 text-[10px] opacity-70",
                                isOwn ? "justify-end" : "justify-start"
                              )}
                            >
                              <span>{formatTime(message.created_at)}</span>
                              {isOwn && (
                                message.is_read ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-2 border-t border-border p-4 bg-background"
              >
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim() || !isConnected}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-muted/5">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                 <MessageSquare className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Welcome to Messages</h3>
              <p className="mt-2 text-muted-foreground max-w-sm">
                Select a user from the sidebar to verify items, coordinate returns, or just say hello!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
