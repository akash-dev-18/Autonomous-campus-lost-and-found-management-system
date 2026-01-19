from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, List
import json
import asyncio
from datetime import datetime
import redis.asyncio as aioredis
from app.config import settings
from app.core.cache import get_redis


class ConnectionManager:
    """WebSocket connection manager with Redis Pub/Sub for multi-server support"""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.redis_pubsub = None
        self.pubsub_task = None
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept WebSocket connection and register user"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        
        # Add user to online users set in Redis
        redis = await get_redis()
        await redis.sadd("online:users", user_id)
        
        # Broadcast user online status
        await self.broadcast_user_status(user_id, "online")
    
    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection and unregister user if no more connections"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # If no more connections for this user
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
                # Remove from online users
                redis = await get_redis()
                await redis.srem("online:users", user_id)
                
                # Broadcast user offline status
                await self.broadcast_user_status(user_id, "offline")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user (all their connections)"""
        if user_id in self.active_connections:
            message_str = json.dumps(message)
            
            # Send to all connections of this user
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                self.active_connections[user_id].discard(conn)
    
    async def broadcast(self, message: dict, exclude_user: str = None):
        """Broadcast message to all connected users"""
        message_str = json.dumps(message)
        
        for user_id, connections in self.active_connections.items():
            if exclude_user and user_id == exclude_user:
                continue
            
            disconnected = set()
            for connection in connections:
                try:
                    await connection.send_text(message_str)
                except Exception:
                    disconnected.add(connection)
            
            # Remove disconnected connections
            for conn in disconnected:
                connections.discard(conn)
    
    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user online/offline status"""
        message = {
            "type": "user_status",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast(message)
    
    async def publish_to_redis(self, channel: str, message: dict):
        """Publish message to Redis channel for multi-server support"""
        redis = await get_redis()
        await redis.publish(channel, json.dumps(message))
    
    async def subscribe_to_redis(self, channel: str):
        """Subscribe to Redis channel and forward messages to WebSocket clients"""
        redis = await get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel)
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    data = json.loads(message["data"])
                    user_id = data.get("user_id")
                    
                    if user_id:
                        await self.send_personal_message(data, user_id)
                    else:
                        await self.broadcast(data)
        except Exception as e:
            print(f"Redis subscription error: {e}")
        finally:
            await pubsub.unsubscribe(channel)
    
    async def get_online_users(self) -> List[str]:
        """Get list of online user IDs"""
        redis = await get_redis()
        users = await redis.smembers("online:users")
        return list(users)
    
    async def is_user_online(self, user_id: str) -> bool:
        """Check if user is online"""
        redis = await get_redis()
        return await redis.sismember("online:users", user_id)


# Global connection manager instance
manager = ConnectionManager()


async def notify_user(user_id: str, notification_type: str, title: str, message: str, link: str = None):
    """
    Send real-time notification to user via WebSocket
    
    Args:
        user_id: User ID to notify
        notification_type: Type of notification (match, claim, message, etc.)
        title: Notification title
        message: Notification message
        link: Optional link to related resource
    """
    notification = {
        "type": "notification",
        "notification_type": notification_type,
        "title": title,
        "message": message,
        "link": link,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Send via WebSocket
    await manager.send_personal_message(notification, user_id)
    
    # Also publish to Redis for multi-server support
    await manager.publish_to_redis("notifications", {
        **notification,
        "user_id": user_id
    })
