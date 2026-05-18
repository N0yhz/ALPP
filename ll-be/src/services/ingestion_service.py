import os
import shutil
import uuid
from sqlalchemy.orm import Session
from src.config.settings import settings
from src.entity.document import Document
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    TextLoader,
    CSVLoader
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.services.ai_service import ai_service

class IngestionService:
    def __init__(self):
        pass

    async def ingest_file(self, db: Session, file_path: str, user_id: uuid.UUID, is_shared: bool = False, grade: str = None, subject: str = None, topic: str = None):
        if not ai_service.vector_store:
            return "Vector store not initialized."

        # 1. Ensure upload directory exists
        if not os.path.exists(settings.upload_dir):
            os.makedirs(settings.upload_dir)

        ext = os.path.splitext(file_path)[1].lower()
        original_filename = os.path.basename(file_path)
        
        # 2. Save file permanently with a unique ID
        unique_id = uuid.uuid4()
        new_filename = f"{unique_id}{ext}"
        permanent_path = os.path.join(settings.upload_dir, new_filename)
        
        # Move file from temp to permanent storage
        shutil.copy2(file_path, permanent_path)

        # 3. Create Database Record
        document = Document(
            id=unique_id,
            filename=original_filename,
            file_path=permanent_path,
            user_id=user_id,
            is_shared=is_shared,
            grade=grade,
            subject=subject,
            topic=topic
        )
        db.add(document)
        db.commit()
        db.refresh(document)

        try:
            if ext == ".pdf":
                loader = PyPDFLoader(permanent_path)
            elif ext == ".docx":
                loader = Docx2txtLoader(permanent_path)
            elif ext == ".csv":
                loader = CSVLoader(permanent_path)
            elif ext == ".txt":
                loader = TextLoader(permanent_path)
            else:
                return f"Unsupported file format: {ext}"

            documents = loader.load()
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                add_start_index=True
            )
            
            chunks = text_splitter.split_documents(documents)
            
            # Add metadata about the source and owner
            for chunk in chunks:
                chunk.metadata["source_file"] = original_filename
                chunk.metadata["document_id"] = str(document.id)
                chunk.metadata["user_id"] = str(user_id)
                chunk.metadata["is_shared"] = is_shared
                if grade:
                    chunk.metadata["grade"] = grade
                if subject:
                    chunk.metadata["subject"] = subject
                if topic:
                    chunk.metadata["topic"] = topic

            await ai_service.vector_store.aadd_documents(chunks)
            return f"Successfully ingested {len(chunks)} chunks from {original_filename}. File tracked with ID: {document.id}"
        
        except Exception as e:
            return f"Error ingesting file: {str(e)}"

ingestion_service = IngestionService()
