from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    redis_url: str
    jwt_secret: str
    
    # SMTP Settings
    mail_username: str
    mail_password: str
    mail_from: str
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    mail_from_name: str = "AI Lesson Planning Platform"
    mail_starttls: bool = True
    mail_ssl_tls: bool = False

    # LLM Settings
    llm_provider: str = "openai"  # openai, anthropic, google
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    llm_model: str = "gpt-4o"
    
    # Embedding Settings
    embedding_provider: Optional[str] = None  # if None, uses llm_provider
    embedding_model: Optional[str] = None      # Default depends on provider

    # LangSmith Tracing
    langsmith_tracing: bool = True
    langsmith_api_key: Optional[str] = None
    langsmith_project: str = "LessonLift"
    langsmith_endpoint: str = "https://api.smith.langchain.com"

    # Search Settings
    tavily_api_key: Optional[str] = None

    # Storage Settings
    upload_dir: str = "uploads"

    # CORS Settings
    # Note: When allow_credentials is True, allow_origins cannot be ["*"]
    allowed_origins: list[str] = ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
