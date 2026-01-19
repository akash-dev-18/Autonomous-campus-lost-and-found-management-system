from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from app.models.item import ItemType, ItemStatus


# Base schemas
class ItemBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    category: str = Field(..., min_length=2, max_length=100)
    location_found: Optional[str] = Field(None, max_length=255)
    date_lost_found: date
    tags: List[str] = Field(default_factory=list)


# Request schemas
class ItemCreate(ItemBase):
    type: ItemType
    images: List[str] = Field(default_factory=list, max_items=10)


class ItemUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10)
    category: Optional[str] = Field(None, min_length=2, max_length=100)
    location_found: Optional[str] = Field(None, max_length=255)
    tags: Optional[List[str]] = None
    status: Optional[ItemStatus] = None


# Response schemas
class ItemResponse(ItemBase):
    id: UUID
    user_id: UUID
    type: ItemType
    status: ItemStatus
    images: List[str]
    qr_code_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ItemWithUser(ItemResponse):
    """Item with user information"""
    user_name: str
    user_email: str
    user_phone: Optional[str]


class ItemList(BaseModel):
    """Paginated item list"""
    items: List[ItemResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Search schemas
class ItemSearch(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    type: Optional[ItemType] = None
    status: Optional[ItemStatus] = None
    date_from: Optional[date] = None
    date_to: Optional[date] = None
    location: Optional[str] = None
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)
