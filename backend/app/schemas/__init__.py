"""
Pydantic schemas for request/response validation
"""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserLogin,
    UserUpdate,
    PasswordChange,
    UserResponse,
    UserProfile,
    Token,
    TokenPayload,
    RefreshTokenRequest,
)
from app.schemas.item import (
    ItemBase,
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemWithUser,
    ItemList,
    ItemSearch,
)
from app.schemas.match import (
    MatchResponse,
    MatchWithItems,
    MatchUpdate,
    MatchList,
)
from app.schemas.claim import (
    ClaimCreate,
    ClaimUpdate,
    ClaimResponse,
    ClaimWithDetails,
    ClaimList,
)
from app.schemas.message import (
    MessageCreate,
    MessageResponse,
    MessageWithUsers,
    ConversationResponse,
    MessageList,
)
from app.schemas.notification import (
    NotificationResponse,
    NotificationList,
    NotificationMarkRead,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate",
    "UserLogin",
    "UserUpdate",
    "PasswordChange",
    "UserResponse",
    "UserProfile",
    "Token",
    "TokenPayload",
    "RefreshTokenRequest",
    # Item schemas
    "ItemBase",
    "ItemCreate",
    "ItemUpdate",
    "ItemResponse",
    "ItemWithUser",
    "ItemList",
    "ItemSearch",
    # Match schemas
    "MatchResponse",
    "MatchWithItems",
    "MatchUpdate",
    "MatchList",
    # Claim schemas
    "ClaimCreate",
    "ClaimUpdate",
    "ClaimResponse",
    "ClaimWithDetails",
    "ClaimList",
    # Message schemas
    "MessageCreate",
    "MessageResponse",
    "MessageWithUsers",
    "ConversationResponse",
    "MessageList",
    # Notification schemas
    "NotificationResponse",
    "NotificationList",
    "NotificationMarkRead",
]
