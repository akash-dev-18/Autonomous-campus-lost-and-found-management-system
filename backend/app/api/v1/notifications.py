from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.schemas.notification import NotificationResponse, NotificationList, NotificationMarkRead
from app.repositories import NotificationRepository
from app.dependencies import get_notification_repository
from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()


@router.get("/", response_model=NotificationList)
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Get all notifications for current user"""
    notifications = await notification_repo.get_by_user(
        current_user.id,
        skip=skip,
        limit=limit
    )
    
    total = await notification_repo.count(user_id=current_user.id)
    unread_count = await notification_repo.count_unread_notifications(current_user.id)
    
    return NotificationList(
        notifications=notifications,
        total=total,
        unread_count=unread_count,
        page=skip // limit + 1,
        page_size=limit
    )


@router.get("/unread", response_model=List[NotificationResponse])
async def get_unread_notifications(
    current_user: User = Depends(get_current_active_user),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Get all unread notifications"""
    notifications = await notification_repo.get_unread_notifications(current_user.id)
    return notifications


@router.get("/count/unread")
async def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Get count of unread notifications"""
    count = await notification_repo.count_unread_notifications(current_user.id)
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_active_user),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Mark a notification as read"""
    # Verify notification belongs to current user
    notification = await notification_repo.get(notification_id)
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    if notification.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    updated_notification = await notification_repo.mark_as_read(notification_id)
    return updated_notification


@router.put("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_active_user),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Mark all notifications as read"""
    count = await notification_repo.mark_all_as_read(current_user.id)
    return {"marked_as_read": count}


@router.post("/mark-read")
async def mark_multiple_as_read(
    data: NotificationMarkRead,
    current_user: User = Depends(get_current_active_user),
    notification_repo: NotificationRepository = Depends(get_notification_repository)
):
    """Mark multiple notifications as read"""
    count = 0
    for notification_id in data.notification_ids:
        notification = await notification_repo.get(notification_id)
        if notification and notification.user_id == current_user.id:
            await notification_repo.mark_as_read(notification_id)
            count += 1
    
    return {"marked_as_read": count}
