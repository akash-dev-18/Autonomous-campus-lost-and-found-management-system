from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from datetime import datetime
from uuid import UUID

from app.models.message import Message
from app.schemas.message import MessageCreate
from app.repositories.base import BaseCRUD
from pydantic import BaseModel


class MessageUpdate(BaseModel):
    """Schema for updating messages"""
    is_read: Optional[bool] = None


class MessageRepository(BaseCRUD[Message, MessageCreate, MessageUpdate]):
    """
    Message repository for user-to-user communication.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Message, db)
    
    async def get_by_sender(self, sender_id: UUID, skip: int = 0, limit: int = 100) -> List[Message]:
        """Get all messages sent by a user"""
        return await self.get_multi(skip=skip, limit=limit, sender_id=sender_id, order_by="-created_at")
    
    async def get_by_receiver(self, receiver_id: UUID, skip: int = 0, limit: int = 100) -> List[Message]:
        """Get all messages received by a user"""
        return await self.get_multi(skip=skip, limit=limit, receiver_id=receiver_id, order_by="-created_at")
    
    async def get_conversation(
        self,
        user1_id: UUID,
        user2_id: UUID,
        skip: int = 0,
        limit: int = 100
    ) -> List[Message]:
        """
        Get conversation between two users.
        
        Args:
            user1_id: First user UUID
            user2_id: Second user UUID
            skip: Pagination offset
            limit: Max results
            
        Returns:
            List of messages ordered by creation time
        """
        stmt = select(Message).where(
            or_(
                and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
                and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
            )
        ).order_by(Message.created_at.asc()).offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_unread_messages(self, user_id: UUID) -> List[Message]:
        """Get all unread messages for a user"""
        return await self.get_multi(receiver_id=user_id, is_read=False, order_by="-created_at")
    
    async def count_unread_messages(self, user_id: UUID) -> int:
        """Count unread messages for a user"""
        return await self.count(receiver_id=user_id, is_read=False)
    
    async def mark_as_read(self, message_id: UUID) -> Optional[Message]:
        """Mark a message as read"""
        return await self.update(message_id, {
            "is_read": True,
            "read_at": datetime.utcnow()
        })
    
    async def mark_conversation_as_read(self, receiver_id: UUID, sender_id: UUID) -> int:
        """
        Mark all messages in a conversation as read.
        
        Args:
            receiver_id: User receiving messages
            sender_id: User sending messages
            
        Returns:
            Number of messages marked as read
        """
        stmt = select(Message).where(
            and_(
                Message.receiver_id == receiver_id,
                Message.sender_id == sender_id,
                Message.is_read == False
            )
        )
        
        result = await self.db.execute(stmt)
        messages = list(result.scalars().all())
        
        for message in messages:
            message.is_read = True
            message.read_at = datetime.utcnow()
        
        await self.db.flush()
        return len(messages)
    
    async def get_recent_conversations(self, user_id: UUID, limit: int = 20) -> List[dict]:
        """
        Get recent conversations for a user with last message info.
        
        Args:
            user_id: User UUID
            limit: Max number of conversations
            
        Returns:
            List of conversation summaries
        """
        # This is a complex query - get latest message for each conversation
        stmt = select(Message).where(
            or_(Message.sender_id == user_id, Message.receiver_id == user_id)
        ).order_by(Message.created_at.desc())
        
        result = await self.db.execute(stmt)
        all_messages = list(result.scalars().all())
        
        # Group by conversation partner
        conversations = {}
        for msg in all_messages:
            partner_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            
            if partner_id not in conversations:
                conversations[partner_id] = {
                    "partner_id": partner_id,
                    "last_message": msg.content,
                    "last_message_time": msg.created_at,
                    "is_read": msg.is_read if msg.receiver_id == user_id else True
                }
        
        return list(conversations.values())[:limit]
