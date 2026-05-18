from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from src.data.database import get_db
from src.entity.document import Document
from src.entity.user import User
from src.services.security import get_current_user
from typing import List, Optional
import os
import uuid

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.get("/")
async def list_documents(
    shared_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List documents. By default, returns the user's personal documents.
    If shared_only=True, returns all documents shared to the global database.
    """
    if shared_only:
        query = select(Document).where(Document.is_shared == True)
    else:
        query = select(Document).where(Document.user_id == current_user.id)
    
    result = db.execute(query)
    documents = result.scalars().all()
    return documents

@router.get("/{document_id}/download")
async def download_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a document by its ID.
    Verifies that the document exists and that the user has permission to access it.
    """
    query = select(Document).where(Document.id == document_id)
    result = db.execute(query)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Permission check: must be owner or document must be shared
    if document.user_id != current_user.id and not document.is_shared:
        raise HTTPException(status_code=403, detail="You do not have permission to access this document")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Physical file missing on server")
    
    return FileResponse(
        path=document.file_path,
        filename=document.filename,
        media_type="application/octet-stream"
    )
