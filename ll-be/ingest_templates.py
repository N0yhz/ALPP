import asyncio
import os
from sqlalchemy.orm import Session
from src.data.database import SessionLocal
from src.services.ingestion_service import ingestion_service
from src.entity.user import User

async def main():
    print("Connecting to database...")
    db: Session = SessionLocal()
    
    try:
        # Get any user to attach the documents to (e.g., the first registered user)
        user = db.query(User).first()
        if not user:
            print("ERROR: No users found in the database. Please register a user first.")
            return

        files_to_ingest = [
            "basic-lesson.md",
            "old-approach.md",
            "modern-approach.md",
            "Ukrainian-example.md"
        ]

        for filename in files_to_ingest:
            file_path = os.path.join(os.getcwd(), "knowledge", filename)
            if not os.path.exists(file_path):
                print(f"WARNING: File {filename} not found in the 'knowledge' directory. Skipping.")
                continue
            
            print(f"Ingesting {filename}...")
            # Ingest and share globally with specific topic tagging
            result = await ingestion_service.ingest_file(
                db=db,
                file_path=file_path,
                user_id=user.id,
                is_shared=True,
                subject="Pedagogy",
                topic="Lesson Planning Guidelines"
            )
            print(f"Result: {result}")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())