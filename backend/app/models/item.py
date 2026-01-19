from sqlalchemy import Column, String, Text, DateTime, Enum as SQLEnum, ForeignKey, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, date
import uuid
import enum
from app.database import Base


class ItemType(str, enum.Enum):
    """Item type enumeration"""
    LOST = "lost"
    FOUND = "found"


class ItemStatus(str, enum.Enum):
    """Item status enumeration"""
    ACTIVE = "active"
    CLAIMED = "claimed"
    EXPIRED = "expired"
    CLOSED = "closed"


class Item(Base):
    """Item model for lost and found items"""
    
    __tablename__ = "items"
    
    # Primary Key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign Keys
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Item Type
    type = Column(SQLEnum(ItemType), nullable=False, index=True)
    
    # Item Details
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, index=True)
    
    # Status
    status = Column(SQLEnum(ItemStatus), default=ItemStatus.ACTIVE, nullable=False, index=True)
    
    # Location & Date
    location_found = Column(String(255), nullable=True)
    date_lost_found = Column(Date, nullable=False, index=True)
    
    # Media & Metadata
    images = Column(JSON, default=list, nullable=False)  # Array of image URLs
    tags = Column(JSON, default=list, nullable=False)    # Array of tags for search
    
    # QR Code
    qr_code_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="items")
    lost_matches = relationship(
        "Match",
        foreign_keys="Match.lost_item_id",
        back_populates="lost_item",
        cascade="all, delete-orphan"
    )
    found_matches = relationship(
        "Match",
        foreign_keys="Match.found_item_id",
        back_populates="found_item",
        cascade="all, delete-orphan"
    )
    claims = relationship("Claim", back_populates="item", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="item", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Item {self.title} ({self.type})>"
