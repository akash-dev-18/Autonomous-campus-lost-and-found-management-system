import { useEffect, useRef, useState, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../lib/api';
import { Message } from '../lib/types';
import { useAuth } from '../context/auth';

interface WebSocketMessage {
  type: 'connected' | 'message' | 'typing' | 'error' | 'pong';
  [key: string]: any;
}

// Convert HTTP API_URL to WS_URL
const WS_URL = API_URL.replace('http', 'ws') + '/api/v1/ws';

export function useWebSocket() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  
  const connect = useCallback(async () => {
    const token = await SecureStore.getItemAsync("token");
    if (!token) return;

    try {
      const ws = new WebSocket(`${WS_URL}?token=${token}`);
      
      ws.onopen = () => {
        console.log('WS Connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          if (data.type === 'message') {
              if (data.id && data.sender_id && data.recipient_id && data.content && data.created_at) {
                 const newMsg: Message = {
                     id: data.id,
                     sender_id: data.sender_id,
                     receiver_id: data.recipient_id, // Normalize naming
                     content: data.content,
                     created_at: data.created_at,
                     is_read: data.is_read || false
                 };
                 setMessages(prev => [newMsg, ...prev]); // Prepend for mobile lists often
              }
          }
        } catch (e) {
            console.error(e);
        }
      };

      ws.onclose = (e) => {
        console.log('WS Disconnected', e.code, e.reason);
        setIsConnected(false);
        if (e.code === 1008) {
            setError("Session expired. Please log in again.");
        }
      };

      wsRef.current = ws;
    } catch (e: any) {
        setError(e.message);
    }
  }, []);

  const sendMessage = useCallback((recipientId: string, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
            type: 'message',
            recipient_id: recipientId,
            content
        }));
    }
  }, []);

  useEffect(() => {
    if (user) {
        connect();
        return () => wsRef.current?.close();
    }
  }, [user, connect]);

  return { messages, isConnected, sendMessage, error };
}
