from app.workers.celery_app import celery_app
from typing import Dict, Any
import asyncio
from app.config import settings


@celery_app.task(name="app.workers.email_tasks.send_verification_email")
def send_verification_email(email: str, verification_token: str):
    """
    Send email verification link to user.
    
    Args:
        email: User email address
        verification_token: Verification token
    """
    # TODO: Implement actual email sending with SMTP
    print(f"Sending verification email to {email} with token {verification_token}")
    
    # Example email content
    subject = "Verify your email - Lost and Found"
    body = f"""
    Hello,
    
    Please verify your email by clicking the link below:
    {settings.APP_NAME}/verify?token={verification_token}
    
    If you didn't create an account, please ignore this email.
    
    Best regards,
    Lost and Found Team
    """
    
    # TODO: Use aiosmtplib or similar to send email
    return {"status": "sent", "email": email}


@celery_app.task(name="app.workers.email_tasks.send_match_notification")
def send_match_notification(user_email: str, match_data: Dict[str, Any]):
    """
    Send email notification when a match is found.
    
    Args:
        user_email: User email address
        match_data: Match information
    """
    print(f"Sending match notification to {user_email}")
    
    subject = "New Match Found - Lost and Found"
    body = f"""
    Hello,
    
    We found a potential match for your item!
    
    Item: {match_data.get('item_title')}
    Match Score: {match_data.get('similarity_score', 0) * 100}%
    
    Log in to view details and contact the other user.
    
    Best regards,
    Lost and Found Team
    """
    
    return {"status": "sent", "email": user_email}


@celery_app.task(name="app.workers.email_tasks.send_claim_notification")
def send_claim_notification(user_email: str, claim_data: Dict[str, Any]):
    """
    Send email notification when someone claims an item.
    
    Args:
        user_email: Item owner email
        claim_data: Claim information
    """
    print(f"Sending claim notification to {user_email}")
    
    subject = "New Claim Submitted - Lost and Found"
    body = f"""
    Hello,
    
    Someone has submitted a claim for your item:
    
    Item: {claim_data.get('item_title')}
    Claimer: {claim_data.get('claimer_name')}
    
    Please review the claim and verify the claimer's identity.
    
    Best regards,
    Lost and Found Team
    """
    
    return {"status": "sent", "email": user_email}


@celery_app.task(name="app.workers.email_tasks.send_claim_approved_notification")
def send_claim_approved_notification(user_email: str, item_title: str):
    """
    Send email when claim is approved.
    
    Args:
        user_email: Claimer email
        item_title: Item title
    """
    print(f"Sending claim approved notification to {user_email}")
    
    subject = "Claim Approved - Lost and Found"
    body = f"""
    Hello,
    
    Great news! Your claim for "{item_title}" has been approved.
    
    Please coordinate with the item owner to arrange pickup.
    
    Best regards,
    Lost and Found Team
    """
    
    return {"status": "sent", "email": user_email}


@celery_app.task(name="app.workers.email_tasks.send_claim_rejected_notification")
def send_claim_rejected_notification(user_email: str, item_title: str, reason: str = None):
    """
    Send email when claim is rejected.
    
    Args:
        user_email: Claimer email
        item_title: Item title
        reason: Rejection reason
    """
    print(f"Sending claim rejected notification to {user_email}")
    
    subject = "Claim Update - Lost and Found"
    body = f"""
    Hello,
    
    Unfortunately, your claim for "{item_title}" was not approved.
    
    {f"Reason: {reason}" if reason else ""}
    
    If you believe this is an error, please contact support.
    
    Best regards,
    Lost and Found Team
    """
    
    return {"status": "sent", "email": user_email}
