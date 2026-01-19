/**
 * WebSocket hook for real-time messaging
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/context/auth-context'

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  created_at: string
  is_read: boolean
}

interface WebSocketMessage {
  type: 'connected' | 'message' | 'typing' | 'error' | 'pong'
  [key: string]: any
}

interface UseWebSocketReturn {
  messages: Message[]
  sendMessage: (recipientId: string, content: string) => void
  sendTyping: (recipientId: string, isTyping: boolean) => void
  isConnected: boolean
  error: string | null
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws'

export function useWebSocket(): UseWebSocketReturn {
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const connect = useCallback(() => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    
    if (!token) {
      setError('No authentication token available')
      return
    }

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        setError(null)  // Clear any error from handshake
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data)
          
          switch (data.type) {
            case 'connected':
              console.log('Connection confirmed:', data.message)
              break
            
            case 'message':
              // Backend sends message with all required fields
              // Convert to Message type
              console.log('WS Received message:', data)
              if (data.id && data.sender_id && data.recipient_id && data.content && data.created_at) {
                const message: Message = {
                  id: data.id,
                  sender_id: data.sender_id,
                  recipient_id: data.recipient_id,
                  content: data.content,
                  created_at: data.created_at,
                  is_read: data.is_read || false
                }
                console.log('Processed message:', message)
                setMessages((prev) => [...prev, message])
              } else {
                console.warn('WS Message missing fields:', data)
              }
              break
            
            case 'typing':
              // Handle typing indicator (optional)
              console.log(`User ${data.user_id} is typing: ${data.is_typing}`)
              break
            
            case 'error':
              console.error('WebSocket error:', data.message)
              setError(data.message)
              break
            
            case 'pong':
              // Keep-alive response
              break
            
            default:
              console.warn('Unknown message type:', data.type)
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (event) => {
        // Error event fires during handshake but connection may still succeed
        // Don't set error state here - let onclose handle real errors
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          console.log(`Reconnecting in ${delay}ms...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        } else {
          setError('Max reconnection attempts reached')
        }
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Error creating WebSocket:', err)
      setError('Failed to create WebSocket connection')
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (wsRef.current) {
      // Prevent onclose from triggering reconnect
      wsRef.current.onclose = null
      wsRef.current.onerror = null
      wsRef.current.close()
      wsRef.current = null
    }
    
    setIsConnected(false)
  }, [])

  const sendMessage = useCallback((recipientId: string, content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected')
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      recipient_id: recipientId,
      content,
    }))
  }, [])

  const sendTyping = useCallback((recipientId: string, isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'typing',
      recipient_id: recipientId,
      is_typing: isTyping,
    }))
  }, [])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()
    
    // Ping every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, 30000)

    return () => {
      clearInterval(pingInterval)
      disconnect()
    }
  }, [connect, disconnect, isAuthenticated])

  return {
    messages,
    sendMessage,
    sendTyping,
    isConnected,
    error,
  }
}
