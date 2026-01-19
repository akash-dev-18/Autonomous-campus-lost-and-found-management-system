from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from uuid import UUID

from app.models.notification import Notification
from app.repositories.base import BaseCRUD
from pydantic import BaseModel


class NotificationCreate(BaseModel):
    """Schema for creating notifications"""
    user_id: UUID
    type: str
    title: str
    message: str
    link: Optional[str] = None


class NotificationUpdate(BaseModel):
    """Schema for updating notifications"""
    is_read: Optional[bool] = None


class NotificationRepository(BaseCRUD[Notification, NotificationCreate, NotificationUpdate]):
    """
    Notification repository for real-time alerts.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)
    
    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Notification]:
        """Get all notifications for a user"""
        return await self.get_multi(skip=skip, limit=limit, user_id=user_id, order_by="-created_at")
    
    async def get_unread_notifications(self, user_id: UUID) -> List[Notification]:
        """Get all unread notifications for a user"""
        return await self.get_multi(user_id=user_id, is_read=False, order_by="-created_at")
    
    async def count_unread_notifications(self, user_id: UUID) -> int:
        """Count unread notifications for a user"""
        return await self.count(user_id=user_id, is_read=False)
    
    async def mark_as_read(self, notification_id: UUID) -> Optional[Notification]:
        """Mark a notification as read"""
        return await self.update(notification_id, {
            "is_read": True,
            "read_at": datetime.utcnow()
        })
    
    async def mark_all_as_read(self, user_id: UUID) -> int:
        """
        Mark all notifications as read for a user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Number of notifications marked as read
        """
        notifications = await self.get_unread_notifications(user_id)
        
        for notification in notifications:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
        
        await self.db.flush()
        return len(notifications)
    
    async def get_by_type(
        self,
        user_id: UUID,
        notification_type: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Notification]:
        """Get notifications by type for a user"""
        return await self.get_multi(
            skip=skip,
            limit=limit,
            user_id=user_id,
            type=notification_type,
            order_by="-created_at"
        )
    
    async def delete_old_notifications(self, user_id: UUID, days: int = 30) -> int:
        """
        Delete old read notifications.
        
        Args:
            user_id: User UUID
            days: Delete notifications older than this many days
            
        Returns:
            Number of deleted notifications
        """
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        from sqlalchemy import select, delete
        stmt = select(Notification.id).where(
            Notification.user_id == user_id,
            Notification.is_read == True,
            Notification.created_at < cutoff_date
        )
        
        result = await self.db.execute(stmt)
        old_notification_ids = [row[0] for row in result.all()]
        
        if old_notification_ids:
            return await self.bulk_delete(old_notification_ids)
        
        return 0
