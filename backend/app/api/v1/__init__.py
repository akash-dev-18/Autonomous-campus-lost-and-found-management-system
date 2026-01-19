"""
API v1 routes
"""

from fastapi import APIRouter
from app.api.v1 import auth, users, items, matches, claims, messages, notifications

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(items.router, prefix="/items", tags=["Items"])
api_router.include_router(matches.router, prefix="/matches", tags=["Matches"])
api_router.include_router(claims.router, prefix="/claims", tags=["Claims"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
