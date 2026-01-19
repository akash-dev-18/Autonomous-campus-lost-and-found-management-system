from app.workers.celery_app import celery_app
from typing import List
from uuid import UUID
import asyncio


@celery_app.task(name="app.workers.matching_tasks.run_matching_for_item")
def run_matching_for_item(item_id: str):
    """
    Run matching algorithm for a specific item.
    
    Args:
        item_id: Item UUID as string
    """
    print(f"Running matching algorithm for item {item_id}")
    
    # TODO: Implement actual matching algorithm
    # 1. Get item details
    # 2. Search for potential matches (opposite type)
    # 3. Calculate similarity scores
    # 4. Create match records
    # 5. Send notifications
    
    return {"status": "completed", "item_id": item_id, "matches_found": 0}


@celery_app.task(name="app.workers.matching_tasks.run_matching_for_all_items")
def run_matching_for_all_items():
    """
    Run matching algorithm for all active items.
    Scheduled task that runs periodically.
    """
    print("Running matching algorithm for all active items")
    
    # TODO: Implement batch matching
    # 1. Get all active lost items
    # 2. Get all active found items
    # 3. Run matching algorithm
    # 4. Create match records
    # 5. Send notifications
    
    return {"status": "completed", "items_processed": 0}


@celery_app.task(name="app.workers.matching_tasks.cleanup_expired_items")
def cleanup_expired_items():
    """
    Mark expired items as expired.
    Scheduled task that runs periodically.
    """
    print("Cleaning up expired items")
    
    # TODO: Implement cleanup
    # 1. Get all items past expiry date
    # 2. Mark as expired
    # 3. Send notifications to owners
    
    return {"status": "completed", "items_expired": 0}


@celery_app.task(name="app.workers.matching_tasks.calculate_similarity")
def calculate_similarity(lost_item_data: dict, found_item_data: dict) -> float:
    """
    Calculate similarity score between lost and found items.
    
    Args:
        lost_item_data: Lost item details
        found_item_data: Found item details
        
    Returns:
        Similarity score (0.0 to 1.0)
    """
    score = 0.0
    
    # Category match (40% weight)
    if lost_item_data.get('category') == found_item_data.get('category'):
        score += 0.4
    
    # Title/description similarity (30% weight)
    # TODO: Implement text similarity (e.g., using sentence transformers)
    lost_text = f"{lost_item_data.get('title', '')} {lost_item_data.get('description', '')}".lower()
    found_text = f"{found_item_data.get('title', '')} {found_item_data.get('description', '')}".lower()
    
    # Simple word overlap for now
    lost_words = set(lost_text.split())
    found_words = set(found_text.split())
    
    if lost_words and found_words:
        overlap = len(lost_words & found_words) / len(lost_words | found_words)
        score += overlap * 0.3
    
    # Location proximity (20% weight)
    if lost_item_data.get('location_found') and found_item_data.get('location_found'):
        if lost_item_data['location_found'].lower() in found_item_data['location_found'].lower() or \
           found_item_data['location_found'].lower() in lost_item_data['location_found'].lower():
            score += 0.2
    
    # Date proximity (10% weight)
    # TODO: Implement date comparison
    
    return min(score, 1.0)
