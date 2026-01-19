"""WebSocket endpoints for real-time messaging."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from fastapi.exceptions import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
import json
import logging
from datetime import datetime

from app.websocket.manager import manager
from app.api.deps import get_db
from app.repositories.user import UserRepository
from app.repositories.message import MessageRepository
from app.core.security import Security

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_current_user_ws(
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """Authenticate WebSocket connection via JWT token."""
    try:
        user_id = Security.verify_token(token, "access")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user_repo = UserRepository(db)
        user = await user_repo.get(UUID(user_id))
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        return user
    except Exception as e:
        logger.error(f"WebSocket authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """
    WebSocket endpoint for real-time messaging.
    
    Connect: ws://localhost:8000/api/v1/ws?token=<jwt_token>
    
    Message format:
    {
        "type": "message",
        "recipient_id": "uuid",
        "content": "message text"
    }
    
    Response format:
    {
        "type": "message",
        "id": "uuid",
        "sender_id": "uuid",
        "recipient_id": "uuid",
        "content": "message text",
        "created_at": "timestamp"
    }
    """
    try:
        # Authenticate user
        user = await get_current_user_ws(token, db)
        user_id = str(user.id)
        
        # Connect to WebSocket
        await manager.connect(websocket, user_id)
        
        # Send connection confirmation
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id,
            "message": "Connected successfully"
        })
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_json()
                
                message_type = data.get("type")
                
                if message_type == "message":
                    # Handle new message
                    recipient_id = data.get("recipient_id")
                    content = data.get("content")
                    
                    if not recipient_id or not content:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Missing recipient_id or content"
                        })
                        continue
                    
                    # Save message to database
                    try:
                        message_repo = MessageRepository(db)
                        message = await message_repo.create({
                            "sender_id": UUID(user_id),
                            "receiver_id": UUID(recipient_id),
                            "content": content
                        })
                        await db.commit()
                        
                        # Prepare message data
                        message_data = {
                            "type": "message",
                            "id": str(message.id),
                            "sender_id": str(message.sender_id),
                            "recipient_id": str(message.receiver_id),
                            "content": message.content,
                            "created_at": message.created_at.isoformat(),
                            "is_read": message.is_read
                        }
                        
                        # Send to recipient
                        await manager.send_personal_message(message_data, recipient_id)
                        
                        # Echo back to sender (for confirmation)
                        await websocket.send_json(message_data)
                        
                        logger.info(f"Message sent from {user_id} to {recipient_id}")
                    except Exception as e:
                        logger.error(f"Error saving message: {e}")
                        await db.rollback()
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Failed to save message: {str(e)}"
                        })
                        continue
                
                elif message_type == "typing":
                    # Handle typing indicator
                    recipient_id = data.get("recipient_id")
                    is_typing = data.get("is_typing", False)
                    
                    if recipient_id:
                        await manager.send_personal_message({
                            "type": "typing",
                            "user_id": user_id,
                            "is_typing": is_typing
                        }, recipient_id)
                
                elif message_type == "ping":
                    # Handle ping/pong for connection keep-alive
                    await websocket.send_json({"type": "pong"})
                
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Unknown message type: {message_type}"
                    })
        
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
            logger.info(f"User {user_id} disconnected normally")
        
        except Exception as e:
            logger.error(f"Error in WebSocket connection for user {user_id}: {e}")
            manager.disconnect(websocket, user_id)
            raise
    
    except HTTPException as e:
        # Authentication failed
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning(f"WebSocket authentication failed: {e.detail}")
    
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket endpoint: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
