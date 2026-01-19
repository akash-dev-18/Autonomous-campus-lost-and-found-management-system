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
    
    # Text similarity using TF-IDF (default baseline)
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        lost_text_full = f"{lost_item_data.get('title', '')} {lost_item_data.get('description', '')} {lost_item_data.get('category', '')} {lost_item_data.get('location_found', '')}"
        found_text_full = f"{found_item_data.get('title', '')} {found_item_data.get('description', '')} {found_item_data.get('category', '')} {found_item_data.get('location_found', '')}"
        
        corpus = [lost_text_full, found_text_full]
        vectorizer = TfidfVectorizer().fit_transform(corpus)
        vectors = vectorizer.toarray()
        text_score = cosine_similarity([vectors[0]], [vectors[1]])[0][0]
        score += text_score * 0.4  # Base text score (40%)
        
    except ImportError:
        print("scikit-learn not found")
        
    # CLIP AI Matching (Image-Text & Image-Image)
    try:
        import torch
        from app.services.ai_model import ai_service
        import requests
        from PIL import Image
        from io import BytesIO

        # Ensure model is loaded
        if not ai_service.model:
            pass # Skipping if model failed to load or not installed

        # Helpers
        def load_image(url_or_path):
            try:
                if url_or_path.startswith("http"):
                    response = requests.get(url_or_path, timeout=5)
                    return Image.open(BytesIO(response.content))
                else:
                    return Image.open(url_or_path) # Local path
            except Exception:
                return None

        # Get inputs
        lost_img_path = lost_item_data.get('images', [None])[0]
        found_img_path = found_item_data.get('images', [None])[0]
        
        lost_image = load_image(lost_img_path) if lost_img_path else None
        found_image = load_image(found_img_path) if found_img_path else None

        clip_score = 0.0
        
        # Case 1: Image <-> Image
        if lost_image and found_image and ai_service.model:
            inputs = ai_service.processor(images=[lost_image, found_image], return_tensors="pt", padding=True)
            with torch.no_grad():
                outputs = ai_service.model.get_image_features(**inputs)
            
            # Cosine similarity between two image vectors
            cos = torch.nn.CosineSimilarity(dim=1, eps=1e-6)
            clip_score = cos(outputs[0].unsqueeze(0), outputs[1].unsqueeze(0)).item()
            score += clip_score * 0.4  # Big boost if images match
            
        # Case 2: Image <-> Text (Multimodal)
        elif (lost_image or found_image) and ai_service.model:
            # One has image, match with other's text
            image_input = lost_image or found_image
            text_input = found_text_full if lost_image else lost_text_full
            # Truncate text to fit context window
            text_input = text_input[:77] 
            
            inputs = ai_service.processor(text=[text_input], images=image_input, return_tensors="pt", padding=True)
            with torch.no_grad():
                img_embed = ai_service.model.get_image_features(pixel_values=inputs['pixel_values'])
                text_embed = ai_service.model.get_text_features(input_ids=inputs['input_ids'], attention_mask=inputs['attention_mask'])
            
            cos = torch.nn.CosineSimilarity(dim=1, eps=1e-6)
            clip_score = cos(img_embed, text_embed).item()
            score += clip_score * 0.3 # Moderate boost for Image-Text match
            
    except ImportError:
        print("Torch/Transformers not installed, skipping AI matching")
    except Exception as e:
        print(f"CLIP Error: {e}")

    # Category match (20% weight)
    if lost_item_data.get('category') == found_item_data.get('category'):
        score += 0.2
    
    return min(score, 1.0)
    
    # Date proximity (10% weight)
    # TODO: Implement date comparison
    
    return min(score, 1.0)
