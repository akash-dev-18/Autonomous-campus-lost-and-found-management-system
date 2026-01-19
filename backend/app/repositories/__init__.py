"""
Repository layer for database operations.

This package contains repository classes that handle all database interactions.
Each repository inherits from BaseCRUD to avoid repetitive CRUD code.

Usage:
    from app.repositories import UserRepository, ItemRepository
    
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email("user@example.com")
"""

from app.repositories.base import BaseCRUD
from app.repositories.user import UserRepository
from app.repositories.item import ItemRepository
from app.repositories.match import MatchRepository
from app.repositories.claim import ClaimRepository
from app.repositories.message import MessageRepository
from app.repositories.notification import NotificationRepository

__all__ = [
    "BaseCRUD",
    "UserRepository",
    "ItemRepository",
    "MatchRepository",
    "ClaimRepository",
    "MessageRepository",
    "NotificationRepository",
]
