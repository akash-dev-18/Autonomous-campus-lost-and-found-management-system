from typing import Generator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.repositories import (
    UserRepository,
    ItemRepository,
    MatchRepository,
    ClaimRepository,
    MessageRepository,
    NotificationRepository,
)


# Repository dependency injection
def get_user_repository(db: AsyncSession = Depends(get_db)) -> UserRepository:
    """Get UserRepository instance"""
    return UserRepository(db)


def get_item_repository(db: AsyncSession = Depends(get_db)) -> ItemRepository:
    """Get ItemRepository instance"""
    return ItemRepository(db)


def get_match_repository(db: AsyncSession = Depends(get_db)) -> MatchRepository:
    """Get MatchRepository instance"""
    return MatchRepository(db)


def get_claim_repository(db: AsyncSession = Depends(get_db)) -> ClaimRepository:
    """Get ClaimRepository instance"""
    return ClaimRepository(db)


def get_message_repository(db: AsyncSession = Depends(get_db)) -> MessageRepository:
    """Get MessageRepository instance"""
    return MessageRepository(db)


def get_notification_repository(db: AsyncSession = Depends(get_db)) -> NotificationRepository:
    """Get NotificationRepository instance"""
    return NotificationRepository(db)
