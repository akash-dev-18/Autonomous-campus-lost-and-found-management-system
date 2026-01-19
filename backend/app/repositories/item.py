from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, date
from uuid import UUID

from app.models.item import Item, ItemType, ItemStatus
from app.schemas.item import ItemCreate, ItemUpdate
from app.repositories.base import BaseCRUD


class ItemRepository(BaseCRUD[Item, ItemCreate, ItemUpdate]):
    """
    Item repository with custom methods for lost/found items.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Item, db)
    
    async def get_by_user(self, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get all items posted by a user"""
        return await self.get_multi(skip=skip, limit=limit, user_id=user_id)
    
    async def get_by_type(self, item_type: ItemType, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get items by type (lost or found)"""
        return await self.get_multi(skip=skip, limit=limit, type=item_type)
    
    async def get_by_status(self, status: ItemStatus, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get items by status"""
        return await self.get_multi(skip=skip, limit=limit, status=status)
    
    async def get_active_items(self, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get all active items"""
        return await self.get_multi(skip=skip, limit=limit, status=ItemStatus.ACTIVE)
    
    async def get_by_category(self, category: str, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get items by category"""
        return await self.get_multi(skip=skip, limit=limit, category=category)
    
    async def search_items(
        self,
        query: Optional[str] = None,
        item_type: Optional[ItemType] = None,
        category: Optional[str] = None,
        status: Optional[ItemStatus] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        location: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Item]:
        """
        Advanced search for items with multiple filters.
        
        Args:
            query: Text search in title/description
            item_type: Filter by lost/found
            category: Filter by category
            status: Filter by status
            date_from: Filter by date range start
            date_to: Filter by date range end
            location: Filter by location
            skip: Pagination offset
            limit: Max results
            
        Returns:
            List of matching items
        """
        stmt = select(Item)
        
        # Text search
        if query:
            stmt = stmt.where(
                or_(
                    Item.title.ilike(f"%{query}%"),
                    Item.description.ilike(f"%{query}%")
                )
            )
        
        # Type filter
        if item_type:
            stmt = stmt.where(Item.type == item_type)
        
        # Category filter
        if category:
            stmt = stmt.where(Item.category == category)
        
        # Status filter
        if status:
            stmt = stmt.where(Item.status == status)
        
        # Date range filter
        if date_from:
            stmt = stmt.where(Item.date_lost_found >= date_from)
        if date_to:
            stmt = stmt.where(Item.date_lost_found <= date_to)
        
        # Location filter
        if location:
            stmt = stmt.where(Item.location_found.ilike(f"%{location}%"))
        
        # Pagination
        stmt = stmt.offset(skip).limit(limit).order_by(Item.created_at.desc())
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def get_expired_items(self) -> List[Item]:
        """Get all expired items that need cleanup"""
        stmt = select(Item).where(
            and_(
                Item.expires_at.isnot(None),
                Item.expires_at <= datetime.utcnow(),
                Item.status == ItemStatus.ACTIVE
            )
        )
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def mark_as_claimed(self, item_id: UUID) -> Optional[Item]:
        """Mark item as claimed"""
        return await self.update(item_id, {"status": ItemStatus.CLAIMED})
    
    async def mark_as_expired(self, item_id: UUID) -> Optional[Item]:
        """Mark item as expired"""
        return await self.update(item_id, {"status": ItemStatus.EXPIRED})
    
    async def get_recent_items(self, days: int = 7, skip: int = 0, limit: int = 100) -> List[Item]:
        """Get items created in the last N days"""
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        stmt = select(Item).where(
            Item.created_at >= cutoff_date
        ).order_by(Item.created_at.desc()).offset(skip).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
