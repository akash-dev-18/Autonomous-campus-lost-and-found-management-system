from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime
from uuid import UUID
from app.models.claim import ClaimStatus


# Request schemas
class ClaimCreate(BaseModel):
    item_id: UUID
    verification_answers: Dict[str, Any] = Field(..., description="Answers to security questions")


class ClaimUpdate(BaseModel):
    status: ClaimStatus
    admin_notes: Optional[str] = None


# Response schemas
class ClaimResponse(BaseModel):
    id: UUID
    item_id: UUID
    claimer_id: UUID
    status: ClaimStatus
    admin_notes: Optional[str]
    reviewed_by: Optional[UUID]
    reviewed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ClaimWithDetails(ClaimResponse):
    """Claim with item and user details"""
    item_title: str
    item_type: str
    claimer_name: str
    claimer_email: str
    claimer_reputation: int


class ClaimList(BaseModel):
    """Paginated claim list"""
    claims: List[ClaimWithDetails]
    total: int
    page: int
    page_size: int
