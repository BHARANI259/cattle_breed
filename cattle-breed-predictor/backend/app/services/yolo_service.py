import cv2
import numpy as np
import logging
from pathlib import Path
import torch

# ============================================================================
# FIX FOR PYTORCH 2.6 weights_only BREAKING CHANGE
# ============================================================================
# PyTorch 2.6 changed torch.load default to weights_only=True which breaks
# YOLOv8 model loading. Add safe globals for all torch/ultralytics modules.

torch.serialization.add_safe_globals([
    torch.nn.modules.conv.Conv2d,
    torch.nn.modules.batchnorm.BatchNorm2d,
    torch.nn.modules.batchnorm.SyncBatchNorm,
    torch.nn.modules.activation.SiLU,
    torch.nn.modules.activation.ReLU,
    torch.nn.modules.activation.LeakyReLU,
    torch.nn.modules.pooling.MaxPool2d,
    torch.nn.modules.pooling.AdaptiveAvgPool2d,
    torch.nn.modules.linear.Linear,
    torch.nn.modules.upsampling.Upsample,
    torch.nn.modules.container.Sequential,
    torch.nn.modules.container.ModuleList,
    torch.nn.modules.container.ModuleDict,
])

# Fallback: also permit weights_only=False if above still fails
_orig_load = torch.load
def _safe_load(*args, **kwargs):
    kwargs.setdefault("weights_only", False)
    return _orig_load(*args, **kwargs)
torch.load = _safe_load

# NOW import YOLO after the torch patch
from ultralytics import YOLO
from app.config import settings

# Configure logging
logging.getLogger("ultralytics").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

# ============================================================================
# LOAD YOLO MODEL (Singleton Pattern)
# ============================================================================
model = None

def _load_yolo_model():
    global model
    
    # Resolve absolute path
    model_path = Path(settings.MODEL_PATH).resolve()
    
    # Validate file exists
    if not model_path.exists():
        raise FileNotFoundError(
            f"\n❌ YOLO weights not found at: {model_path}\n"
            f"   Please place your best.pt file in the backend/ directory.\n"
            f"   Expected location: {model_path}"
        )
    
    try:
        model = YOLO(str(model_path))
        print(f"✅ YOLO model loaded from: {model_path}")
        return model
    except Exception as e:
        print(f"❌ Failed to load YOLO model: {e}")
        raise

# Load model at import time
try:
    model = _load_yolo_model()
except Exception as e:
    logger.error(f"YOLO model initialization failed: {e}")
    model = None


def run_inference(image_bytes: bytes) -> dict:
    """
    Run YOLO inference on image bytes.
    
    Args:
        image_bytes: Raw image data as bytes
        
    Returns:
        dict with keys:
            - predicted_breed: str (class name with highest confidence)
            - confidence_score: float (0-1, rounded to 4 decimals)
            - all_class_scores: dict {class_name: confidence}
            - bounding_boxes: list of {x1, y1, x2, y2, class_name, confidence}
    """
    if model is None:
        raise RuntimeError("YOLO model not loaded")
    
    # Decode bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    image_array = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image_array is None:
        raise ValueError("Failed to decode image")
    
    # Run inference
    results = model(image_array)
    result = results[0]
    
    # Extract predictions
    predicted_breed = None
    confidence_score = 0.0
    all_class_scores = {}
    bounding_boxes = []
    
    if result.boxes is not None and len(result.boxes) > 0:
        # Get class names mapping
        class_names = result.names  # {0: 'class_name', ...}
        
        # Process all detections
        for i, box in enumerate(result.boxes):
            cls_id = int(box.cls)
            conf = float(box.conf)
            class_name = class_names[cls_id]
            
            # Store all class scores
            all_class_scores[class_name] = round(conf, 4)
            
            # Track highest confidence for predicted breed
            if conf > confidence_score:
                confidence_score = conf
                predicted_breed = class_name
            
            # Extract bounding box coordinates
            xyxy = box.xyxy[0].cpu().numpy()  # [x1, y1, x2, y2]
            x1, y1, x2, y2 = float(xyxy[0]), float(xyxy[1]), float(xyxy[2]), float(xyxy[3])
            
            bounding_boxes.append({
                "x1": round(x1, 2),
                "y1": round(y1, 2),
                "x2": round(x2, 2),
                "y2": round(y2, 2),
                "class_name": class_name,
                "confidence": round(conf, 4)
            })
    
    return {
        "predicted_breed": predicted_breed or "Unknown",
        "confidence_score": round(confidence_score, 4),
        "all_class_scores": all_class_scores,
        "bounding_boxes": bounding_boxes,
    }


def draw_boxes(image_bytes: bytes, bboxes: list) -> bytes:
    """
    Draw bounding boxes on image.
    
    Args:
        image_bytes: Raw image data as bytes
        bboxes: List of {x1, y1, x2, y2, class_name, confidence}
        
    Returns:
        Annotated image as JPEG bytes
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Failed to decode image")
    
    # Green color in BGR
    color = (0, 255, 0)
    thickness = 2
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.6
    font_thickness = 1
    
    # Draw each bounding box
    for bbox in bboxes:
        x1, y1, x2, y2 = int(bbox["x1"]), int(bbox["y1"]), int(bbox["x2"]), int(bbox["y2"])
        class_name = bbox["class_name"]
        confidence = bbox["confidence"]
        
        # Draw rectangle
        cv2.rectangle(image, (x1, y1), (x2, y2), color, thickness)
        
        # Draw label
        label = f"{class_name} {confidence:.2%}"
        label_size, baseline = cv2.getTextSize(label, font, font_scale, font_thickness)
        label_y = max(y1 - 5, label_size[1] + 5)
        
        # Draw label background
        cv2.rectangle(
            image,
            (x1, label_y - label_size[1] - 5),
            (x1 + label_size[0] + 5, label_y + baseline),
            color,
            -1
        )
        
        # Put text
        cv2.putText(
            image,
            label,
            (x1 + 2, label_y - 5),
            font,
            font_scale,
            (0, 0, 0),
            font_thickness
        )
    
    # Encode to JPEG bytes
    _, jpeg_bytes = cv2.imencode(".jpg", image)
    return jpeg_bytes.tobytes()
