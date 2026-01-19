from typing import Tuple, List, Optional
try:
    from transformers import CLIPProcessor, CLIPModel
    import torch
    from PIL import Image
except ImportError:
    CLIPProcessor = None
    CLIPModel = None
    torch = None
    Image = None

class AIModelService:
    _instance = None
    _model = None
    _processor = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIModelService, cls).__new__(cls)
        return cls._instance
    
    def load_model(self):
        """Load CLIP model if not already loaded"""
        if self._model is None and CLIPModel is not None:
            print("Loading Shared CLIP Model...")
            try:
                self._model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
                self._processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
                print("CLIP Model Loaded Successfully")
            except Exception as e:
                print(f"Failed to load CLIP model: {e}")
                self._model = None
                self._processor = None
    
    @property
    def model(self):
        if self._model is None:
            self.load_model()
        return self._model
    
    @property
    def processor(self):
        if self._processor is None:
            self.load_model()
        return self._processor
        
    def get_image_features(self, image):
        """Get embedding for a single image"""
        if not self.model: 
            return None
        
        inputs = self.processor(images=image, return_tensors="pt")
        with torch.no_grad():
            outputs = self.model.get_image_features(**inputs)
        return outputs
        
    def get_text_features(self, texts: List[str]):
        """Get embeddings for a list of texts"""
        if not self.model: 
            return None
            
        inputs = self.processor(text=texts, return_tensors="pt", padding=True)
        with torch.no_grad():
            outputs = self.model.get_text_features(**inputs)
        return outputs

    def predict_labels(self, image, labels: List[str]) -> List[Tuple[str, float]]:
        """
        Zero-shot classification: Given an image and a list of labels, 
        return sorted (label, score) tuples.
        """
        if not self.model:
            return []
            
        inputs = self.processor(text=labels, images=image, return_tensors="pt", padding=True)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            
        # success: logits_per_image is [1, num_labels]
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1) # softmax to get probabilities
        
        # Convert to list
        probs_list = probs[0].tolist()
        
        # Zip with labels and sort
        results = list(zip(labels, probs_list))
        results.sort(key=lambda x: x[1], reverse=True)
        
        return results

ai_service = AIModelService()
