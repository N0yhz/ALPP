from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, BackgroundTasks
from fastapi.responses import FileResponse
from pydantic import BaseModel
from src.services.ai_service import ai_service
from src.services.ingestion_service import ingestion_service
from src.services.pdf_service import pdf_service
from src.schemas.lesson import LessonPlanResponse
from src.services.security import get_current_user
from src.entity.user import User
from typing import Optional
import os
import shutil
import tempfile

from src.data.database import get_db
from sqlalchemy.orm import Session

router = APIRouter(prefix="/ai", tags=["AI"])

class ChatRequest(BaseModel):
    message: str
    session_id: str = "default_session"
    difficulty: str = "Medium"
    use_global_database: bool = False
    use_websearch: bool = False

class ChatMessageResponse(BaseModel):
    role: str
    content: str

class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageResponse]

@router.post("/chat")
async def chat(request: ChatRequest, current_user: User = Depends(get_current_user)):
    """
    Send a message to the AI assistant.
    Supports session persistence via session_id and automatic tool usage (RAG/Web Search).
    """
    response = await ai_service.chat(
        request.message, 
        session_id=request.session_id,
        difficulty=request.difficulty,
        user_id=current_user.id,
        use_community_docs=request.use_global_database,
        use_websearch=request.use_websearch
    )
    return {"response": response}

@router.get("/chat/{session_id}/history", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str, current_user: User = Depends(get_current_user)):
    """
    Retrieve the conversation history for a specific session.
    """
    history = ai_service.get_chat_history(session_id)
    return {"messages": history}

@router.post("/generate-lesson-pdf")
async def generate_lesson_pdf(
    lesson_data: LessonPlanResponse,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user)
):
    """
    Generate a PDF from a pre-generated structured lesson plan.
    This endpoint acts as a presentation layer for data generated in the chat.
    """
    try:
        # 1. Generate PDF
        pdf_path = pdf_service.generate_lesson_pdf(lesson_data)
        
        # 2. Setup cleanup
        background_tasks.add_task(os.remove, pdf_path)
        
        filename = f"LessonPlan_{lesson_data.topic.replace(' ', '_')}.pdf"
        return FileResponse(
            path=pdf_path, 
            media_type="application/pdf", 
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    is_shared: bool = Form(False),
    grade: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a document (PDF, DOCX, TXT, CSV) to be used for RAG.
    Optionally share it to the global database with categorization.
    If session_id is provided, the AI in that session will be notified.
    """
    # Create a temporary file to store the upload
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        result = await ingestion_service.ingest_file(
            db=db,
            file_path=tmp_path, 
            user_id=current_user.id,
            is_shared=is_shared,
            grade=grade,
            subject=subject,
            topic=topic
        )
        if "Error" in result:
            raise HTTPException(status_code=500, detail=result)
        
        # If session_id is provided, notify the AI session
        if session_id:
            await ai_service.notify_upload_in_history(session_id, file.filename)
            
        return {"message": result}
    finally:
        # Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
