from fastapi import Request, HTTPException, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.cache import Cache
from app.config import settings
from typing import Optional
import time


# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)


class RateLimitMiddleware:
    """Custom rate limiting using Redis"""
    
    @staticmethod
    async def check_rate_limit(
        key: str,
        max_requests: int,
        window_seconds: int
    ) -> bool:
        """
        Check if rate limit is exceeded
        
        Args:
            key: Unique key for rate limiting (e.g., user_id or IP)
            max_requests: Maximum requests allowed
            window_seconds: Time window in seconds
        
        Returns:
            True if within limit, False if exceeded
        """
        rate_key = f"rate_limit:{key}"
        
        # Get current count
        current = await Cache.get(rate_key)
        
        if current is None:
            # First request in window
            await Cache.set(rate_key, 1, window_seconds)
            return True
        
        if isinstance(current, str):
            current = int(current)
        
        if current >= max_requests:
            return False
        
        # Increment counter
        await Cache.increment(rate_key)
        return True
    
    @staticmethod
    async def check_user_rate_limit(user_id: str) -> bool:
        """
        Check rate limit for authenticated user
        
        Args:
            user_id: User ID
        
        Returns:
            True if within limit
        
        Raises:
            HTTPException: If rate limit exceeded
        """
        # Per minute limit
        minute_ok = await RateLimitMiddleware.check_rate_limit(
            f"user:{user_id}:minute",
            settings.RATE_LIMIT_PER_MINUTE,
            60
        )
        
        if not minute_ok:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again in a minute."
            )
        
        # Per hour limit
        hour_ok = await RateLimitMiddleware.check_rate_limit(
            f"user:{user_id}:hour",
            settings.RATE_LIMIT_PER_HOUR,
            3600
        )
        
        if not hour_ok:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Hourly rate limit exceeded. Please try again later."
            )
        
        return True
    
    @staticmethod
    async def check_ip_rate_limit(ip: str) -> bool:
        """
        Check rate limit for IP address
        
        Args:
            ip: IP address
        
        Returns:
            True if within limit
        
        Raises:
            HTTPException: If rate limit exceeded
        """
        # Per minute limit (stricter for unauthenticated)
        minute_ok = await RateLimitMiddleware.check_rate_limit(
            f"ip:{ip}:minute",
            30,  # 30 requests per minute for IP
            60
        )
        
        if not minute_ok:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests from this IP. Please try again in a minute."
            )
        
        return True


async def rate_limit_dependency(request: Request):
    """
    Dependency for rate limiting endpoints
    
    Usage:
        @app.get("/items", dependencies=[Depends(rate_limit_dependency)])
    """
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Check IP rate limit
    await RateLimitMiddleware.check_ip_rate_limit(client_ip)
