from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime
from uuid import UUID

from app.models.claim import Claim, ClaimStatus
from app.schemas.claim import ClaimCreate, ClaimUpdate
from app.repositories.base import BaseCRUD


class ClaimRepository(BaseCRUD[Claim, ClaimCreate, ClaimUpdate]):
    """
    Claim repository for item verification and approval.
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Claim, db)
    
    async def get_by_item(self, item_id: UUID, skip: int = 0, limit: int = 100) -> List[Claim]:
        """Get all claims for an item"""
        return await self.get_multi(skip=skip, limit=limit, item_id=item_id)
    
    async def get_by_claimer(self, claimer_id: UUID, skip: int = 0, limit: int = 100) -> List[Claim]:
        """Get all claims by a user"""
        return await self.get_multi(skip=skip, limit=limit, claimer_id=claimer_id)
    
    async def get_pending_claims(self, skip: int = 0, limit: int = 100) -> List[Claim]:
        """Get all pending claims"""
        return await self.get_multi(skip=skip, limit=limit, status=ClaimStatus.PENDING)
    
    async def get_approved_claims(self, skip: int = 0, limit: int = 100) -> List[Claim]:
        """Get all approved claims"""
        return await self.get_multi(skip=skip, limit=limit, status=ClaimStatus.APPROVED)
    
    async def approve_claim(
        self,
        claim_id: UUID,
        reviewer_id: UUID,
        admin_notes: Optional[str] = None
    ) -> Optional[Claim]:
        """
        Approve a claim.
        
        Args:
            claim_id: Claim UUID
            reviewer_id: Admin user UUID
            admin_notes: Optional admin notes
            
        Returns:
            Updated claim or None
        """
        return await self.update(claim_id, {
            "status": ClaimStatus.APPROVED,
            "reviewed_by": reviewer_id,
            "reviewed_at": datetime.utcnow(),
            "admin_notes": admin_notes
        })
    
    async def reject_claim(
        self,
        claim_id: UUID,
        reviewer_id: UUID,
        admin_notes: Optional[str] = None
    ) -> Optional[Claim]:
        """
        Reject a claim.
        
        Args:
            claim_id: Claim UUID
            reviewer_id: Admin user UUID
            admin_notes: Optional admin notes
            
        Returns:
            Updated claim or None
        """
        return await self.update(claim_id, {
            "status": ClaimStatus.REJECTED,
            "reviewed_by": reviewer_id,
            "reviewed_at": datetime.utcnow(),
            "admin_notes": admin_notes
        })
    
    async def get_claim_by_item_and_user(self, item_id: UUID, claimer_id: UUID) -> Optional[Claim]:
        """Check if user has already claimed an item"""
        stmt = select(Claim).where(
            and_(
                Claim.item_id == item_id,
                Claim.claimer_id == claimer_id
            )
        )
        
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
