from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from uuid import UUID

from app.models.match import Match, MatchStatus
from app.schemas.match import MatchUpdate
from app.repositories.base import BaseCRUD
from pydantic import BaseModel


class MatchCreate(BaseModel):
    """Schema for creating matches"""
    lost_item_id: UUID
    found_item_id: UUID
    similarity_score: float


class MatchRepository(BaseCRUD[Match, MatchCreate, MatchUpdate]):
    """
    Match repository for AI-powered item matching.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Match, db)
    
    async def get_by_lost_item(self, lost_item_id: UUID, skip: int = 0, limit: int = 100) -> List[Match]:
        """Get all matches for a lost item"""
        return await self.get_multi(skip=skip, limit=limit, lost_item_id=lost_item_id)
    
    async def get_by_found_item(self, found_item_id: UUID, skip: int = 0, limit: int = 100) -> List[Match]:
        """Get all matches for a found item"""
        return await self.get_multi(skip=skip, limit=limit, found_item_id=found_item_id)
    
    async def get_pending_matches(self, skip: int = 0, limit: int = 100) -> List[Match]:
        """Get all pending matches"""
        return await self.get_multi(skip=skip, limit=limit, status=MatchStatus.PENDING)
    
    async def get_accepted_matches(self, skip: int = 0, limit: int = 100) -> List[Match]:
        """Get all accepted matches"""
        return await self.get_multi(skip=skip, limit=limit, status=MatchStatus.ACCEPTED)
    
    async def get_match_by_items(self, lost_item_id: UUID, found_item_id: UUID) -> Optional[Match]:
        """Get match between specific lost and found items"""
        stmt = select(Match).where(
            and_(
                Match.lost_item_id == lost_item_id,
                Match.found_item_id == found_item_id
            )
        )
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_top_matches(
        self,
        item_id: UUID,
        is_lost: bool = True,
        min_score: float = 0.5,
        limit: int = 10
    ) -> List[Match]:
        """
        Get top matches for an item sorted by similarity score.
        
        Args:
            item_id: Item UUID
            is_lost: True if item is lost, False if found
            min_score: Minimum similarity score threshold
            limit: Max number of matches
            
        Returns:
            List of top matches
        """
        if is_lost:
            stmt = select(Match).where(
                and_(
                    Match.lost_item_id == item_id,
                    Match.similarity_score >= min_score
                )
            )
        else:
            stmt = select(Match).where(
                and_(
                    Match.found_item_id == item_id,
                    Match.similarity_score >= min_score
                )
            )
        
        stmt = stmt.order_by(Match.similarity_score.desc()).limit(limit)
        
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
    
    async def accept_match(self, match_id: UUID) -> Optional[Match]:
        """Mark match as accepted"""
        return await self.update(match_id, {"status": MatchStatus.ACCEPTED})
    
    async def reject_match(self, match_id: UUID) -> Optional[Match]:
        """Mark match as rejected"""
        return await self.update(match_id, {"status": MatchStatus.REJECTED})
