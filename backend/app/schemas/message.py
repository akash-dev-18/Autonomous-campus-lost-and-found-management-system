from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# Request schemas
class MessageCreate(BaseModel):
    receiver_id: UUID
    item_id: Optional[UUID] = None
    content: str = Field(..., min_length=1, max_length=5000)


# Response schemas
class MessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    item_id: Optional[UUID]
    content: str
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class MessageWithUsers(MessageResponse):
    """Message with sender and receiver names"""
    sender_name: str
    receiver_name: str
    item_title: Optional[str]


class ConversationResponse(BaseModel):
    """Conversation between two users"""
    other_user_id: UUID
    other_user_name: str
    last_message: str
    last_message_time: datetime
    unread_count: int


class MessageList(BaseModel):
    """Paginated message list"""
    messages: List[MessageWithUsers]
    total: int
    page: int
    page_size: int
