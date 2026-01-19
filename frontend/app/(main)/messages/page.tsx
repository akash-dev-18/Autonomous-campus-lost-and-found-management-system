"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, Search, User, Check, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { mockConversations, mockMessages, currentUser, mockUsers } from "@/lib/mock-data"
import type { Message, User as UserType } from "@/lib/types"
import { cn } from "@/lib/utils"

const Loading = () => null

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const [selectedUser, setSelectedUser] = useState<UserType | null>(mockConversations[0]?.user || null)
  const [messages, setMessages] = useState<Message[]>(
    selectedUser ? mockMessages[selectedUser.id] || [] : []
  )
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredConversations = mockConversations.filter((conv) =>
    conv.user.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    if (selectedUser) {
      setMessages(mockMessages[selectedUser.id] || [])
    }
  }, [selectedUser])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedUser) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: newMessage.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, message])
    setNewMessage("")
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
    <Suspense fallback={<Loading />}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
            <MessageSquare className="h-8 w-8 text-primary" />
            Messages
          </h1>
          <p className="mt-1 text-muted-foreground">
            Chat with other users about lost and found items.
          </p>
        </div>

        {/* Chat Layout */}
        <Card className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
          {/* Conversations List */}
          <div className="w-full max-w-xs border-r border-border flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversation List */}
            <ScrollArea className="flex-1">
              {filteredConversations.length > 0 ? (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conversation) => (
                    <button
                      type="button"
                      key={conversation.user.id}
                      onClick={() => setSelectedUser(conversation.user)}
                      className={cn(
                        "flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-accent",
                        selectedUser?.id === conversation.user.id && "bg-accent"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage
                            src={conversation.user.avatar || "/placeholder.svg"}
                            alt={conversation.user.full_name}
                          />
                          <AvatarFallback>
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate font-medium text-foreground">
                            {conversation.user.full_name}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {conversation.last_message}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">No conversations found</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-border p-4">
                  <Avatar className="h-10 w-10">
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
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isOwn = message.sender_id === currentUser.id
                      return (
                        <div
                          key={message.id}
                          className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            )}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div
                              className={cn(
                                "mt-1 flex items-center gap-1 text-xs",
                                isOwn ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
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

                {/* Message Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 border-t border-border p-4"
                >
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground/30" />
                <h3 className="mt-4 text-lg font-medium text-foreground">No conversation selected</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select a conversation from the list to start chatting
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Suspense>
  )
}
