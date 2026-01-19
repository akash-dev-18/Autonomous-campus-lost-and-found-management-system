from pydantic import BaseModel, Field
from typing import List
from datetime import datetime
from uuid import UUID
from app.models.match import MatchStatus


# Response schemas
class MatchResponse(BaseModel):
    id: UUID
    lost_item_id: UUID
    found_item_id: UUID
    similarity_score: float
    status: MatchStatus
    created_at: datetime
    
    class Config:
        from_attributes = True


class MatchWithItems(MatchResponse):
    """Match with full item details"""
    lost_item_title: str
    lost_item_description: str
    lost_item_images: List[str]
    found_item_title: str
    found_item_description: str
    found_item_images: List[str]


class MatchUpdate(BaseModel):
    status: MatchStatus


class MatchList(BaseModel):
    """Paginated match list"""
    matches: List[MatchWithItems]
    total: int
    page: int
    page_size: int
