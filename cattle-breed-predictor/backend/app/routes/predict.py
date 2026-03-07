import logging
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Prediction
from app.services import yolo_service, file_service, llm_service
from app.schemas.prediction import PredictionResponse

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["predictions"],
)


@router.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload image and get breed prediction.
    
    - Accepts: JPEG, PNG (max 10MB)
    - Returns: Prediction with bounding boxes and annotated image
    """
    try:
        # Step 1: Save original image
        filename, file_path = file_service.save_upload(file)
        logger.info(f"Uploaded file: {filename}")
        
        # Step 2: Read image bytes
        with open(file_path, "rb") as f:
            image_bytes = f.read()
        
        # Step 3: Run YOLO inference
        inference_result = yolo_service.run_inference(image_bytes)
        logger.info(f"Inference complete: {inference_result['predicted_breed']}")
        
        # Step 4: Draw bounding boxes
        annotated_image_bytes = yolo_service.draw_boxes(
            image_bytes,
            inference_result["bounding_boxes"]
        )
        
        # Step 5: Save annotated image
        annotated_path = file_service.save_annotated(annotated_image_bytes, filename)
        
        # Step 6: Create and insert Prediction record
        prediction = Prediction(
            image_filename=filename,
            image_path=file_path,
            predicted_breed=inference_result["predicted_breed"],
            confidence_score=inference_result["confidence_score"],
            all_class_scores=inference_result["all_class_scores"],
            bounding_boxes=inference_result["bounding_boxes"],
            breed_info=None,  # Will be filled in Phase 3 (LLM)
            llm_model_used=None,
        )
        
        db.add(prediction)
        await db.commit()
        await db.refresh(prediction)
        
        logger.info(f"✓ Prediction saved to DB: {prediction.id}")
        
        # Trigger LLM breed info generation asynchronously
        background_tasks.add_task(
            llm_service.get_breed_info,
            inference_result["predicted_breed"],
            inference_result["confidence_score"]
        )
        logger.info(f"✓ LLM task queued for breed: {inference_result['predicted_breed']}")
        
        # Step 7: Return response with file URLs (without waiting for LLM)
        response_data = PredictionResponse(
            id=prediction.id,
            image_filename=prediction.image_filename,
            image_url=f"/uploads/originals/{filename}",
            annotated_image_url=f"/uploads/annotated/annotated_{filename}",
            predicted_breed=prediction.predicted_breed,
            confidence_score=prediction.confidence_score,
            all_class_scores=prediction.all_class_scores,
            bounding_boxes=inference_result["bounding_boxes"],
            created_at=prediction.created_at,
        )
        print(f"📤 Returning prediction response: {response_data.dict()}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
