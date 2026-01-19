from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from uuid import UUID

from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.repositories.base import BaseCRUD


class UserRepository(BaseCRUD[User, UserCreate, UserUpdate]):
    """
    User repository with custom methods beyond base CRUD.
    
    Inherits all basic CRUD operations from BaseCRUD and adds
    user-specific queries.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email address"""
        return await self.get_by_field("email", email)
    
    async def get_by_student_id(self, student_id: str) -> Optional[User]:
        """Get user by student ID"""
        return await self.get_by_field("student_id", student_id)
    
    async def get_active_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users"""
        return await self.get_multi(skip=skip, limit=limit, is_active=True)
    
    async def get_verified_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all verified users"""
        return await self.get_multi(skip=skip, limit=limit, is_verified=True)
    
    async def get_by_role(self, role: UserRole, skip: int = 0, limit: int = 100) -> List[User]:
        """Get users by role"""
        return await self.get_multi(skip=skip, limit=limit, role=role)
    
    async def search_users(self, query: str, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Search users by name or email.
        
        Args:
            query: Search query
            skip: Pagination offset
            limit: Max results
            
        Returns:
            List of matching users
        """
        stmt = select(User).where(
            or_(
                User.full_name.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
                User.student_id.ilike(f"%{query}%")
            )
        ).offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def update_reputation(self, user_id: UUID, points: int) -> Optional[User]:
        """
        Update user reputation score.
        
        Args:
            user_id: User UUID
            points: Points to add (can be negative)
            
        Returns:
            Updated user or None
        """
        user = await self.get(user_id)
        if not user:
            return None
        
        user.reputation_score += points
        await self.db.flush()
        await self.db.refresh(user)
        
        return user
    
    async def verify_user(self, user_id: UUID) -> Optional[User]:
        """Mark user as verified"""
        return await self.update(user_id, {"is_verified": True})
    
    async def deactivate_user(self, user_id: UUID) -> Optional[User]:
        """Deactivate user account"""
        return await self.update(user_id, {"is_active": False})
    
    async def activate_user(self, user_id: UUID) -> Optional[User]:
        """Activate user account"""
        return await self.update(user_id, {"is_active": True})
