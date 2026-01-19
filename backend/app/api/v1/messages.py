from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.schemas.message import MessageCreate, MessageResponse, MessageList
from app.repositories import MessageRepository
from app.dependencies import get_message_repository
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Send a message to another user"""
    # Add sender_id
    message_dict = message_data.model_dump()
    message_dict['sender_id'] = current_user.id
    
    from pydantic import BaseModel
    from typing import Optional
    
    class MessageCreateDB(BaseModel):
        sender_id: UUID
        receiver_id: UUID
        item_id: Optional[UUID] = None
        content: str
    
    message = await message_repo.create(MessageCreateDB(**message_dict))
    
    # TODO: Send real-time notification via WebSocket
    
    return message


@router.get("/conversations", response_model=List[dict])
async def get_conversations(
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Get list of all conversations for current user"""
    import logging
    logger = logging.getLogger(__name__)
    try:
        # Get all unique users the current user has messaged with
        conversations = await message_repo.get_conversations_list(current_user.id)
        return conversations
    except Exception as e:
        logger.error(f"Error fetching conversations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{user_id}", response_model=List[MessageResponse])
async def get_conversation(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Get conversation with another user"""
    messages = await message_repo.get_conversation(
        current_user.id,
        user_id,
        skip=skip,
        limit=limit
    )
    return messages


@router.get("/", response_model=List[MessageResponse])
async def get_my_messages(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Get all messages for current user"""
    messages = await message_repo.get_by_receiver(current_user.id, skip=skip, limit=limit)
    return messages


@router.get("/unread", response_model=List[MessageResponse])
async def get_unread_messages(
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Get all unread messages"""
    messages = await message_repo.get_unread_messages(current_user.id)
    return messages


@router.put("/{message_id}/read", response_model=MessageResponse)
async def mark_message_as_read(
    message_id: UUID,
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Mark a message as read"""
    # Verify message belongs to current user
    message = await message_repo.get(message_id)
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found"
        )
    
    if message.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to mark this message as read"
        )
    
    updated_message = await message_repo.mark_as_read(message_id)
    return updated_message


@router.put("/conversations/{user_id}/read")
async def mark_conversation_as_read(
    user_id: UUID,
    current_user: User = Depends(get_current_active_user),
    message_repo: MessageRepository = Depends(get_message_repository)
):
    """Mark all messages in a conversation as read"""
    count = await message_repo.mark_conversation_as_read(current_user.id, user_id)
    return {"marked_as_read": count}
