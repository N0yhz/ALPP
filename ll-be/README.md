# AI Lesson Planning Platform Backend (ll-be)

A robust, AI-powered FastAPI backend for AI Lesson Planning Platform, featuring custom OTP authentication, PGVector-based RAG, multi-provider LLM integration, and dynamic PDF generation.

## 🚀 Tech Stack

### Core Framework & Runtime
- **FastAPI**: Modern, high-performance web framework for Python 3.13+.
- **uv**: Ultra-fast Python package manager and resolver.
- **Uvicorn**: Lightning-fast ASGI server implementation.

### AI & Search
- **LangChain**: Orchestration for multi-provider LLM support (OpenAI, Anthropic, Google Gemini).
- **PGVector**: Vector similarity search for Retrieval-Augmented Generation (RAG).
- **Tavily API**: AI-optimized search engine for real-time web data.
- **Pydantic**: Schema-driven data validation and AI response structured output.

### Database & State
- **PostgreSQL**: Primary relational database.
- **Redis**: High-performance caching and rate limiting.
- **SQLAlchemy 2.0**: Type-safe Async ORM.
- **Alembic**: Database migration management.

### Security & Auth
- **JWT (PyJWT)**: Token-based authentication.
- **Passlib (Bcrypt)**: Secure password hashing.
- **OTP (Email)**: Two-factor verification using Jinja2 templates.

### Document Processing
- **WeasyPrint**: Professional PDF rendering from HTML/CSS.
- **latex2mathml**: Rendering LaTeX expressions in PDFs via native MathML.
- **PyPDF / Beautiful Soup 4**: Document parsing and ingestion.

---

## 🛠️ Local Development

### Prerequisites
- [uv](https://github.com/astral-sh/uv) (Highly recommended)
- [Docker & Docker Compose](https://www.docker.com/)
- Python 3.13+

### 1. Setup Environment
Clone the repository and install dependencies using `uv`:
```bash
uv sync
```

### 2. Configuration
Copy the example environment file and fill in your secrets:
```bash
cp .env.example .env
```
Key variables to set:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `REDIS_URL`: Your Redis connection string.
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY`: At least one LLM provider.
- `TAVILY_API_KEY`: For web search capabilities.
- `MAIL_USERNAME` / `MAIL_PASSWORD`: For OTP delivery.
- `ALLOWED_ORIGINS` / ["Your frontend url"]

### 3. Database & Infrastructure
Start the database and Redis services:
```bash
docker-compose up -d
```

Run database migrations:
```bash
uv run alembic upgrade head
```

### 4. Running the Server
Start the development server with hot-reload:
```bash
uv run uvicorn main:app --reload
```
The API will be available at `http://localhost:8000`.
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## 📁 Project Structure
- `src/app.py`: FastAPI application entry and middleware.
- `src/config/`: Pydantic settings and environment management.
- `src/services/`: Core business logic (AI, PDF, Mail, Security).
- `src/repositories/`: Data access layer.
- `src/routers/`: API endpoint definitions.
- `src/entity/`: SQLAlchemy database models.
- `src/schemas/`: Pydantic models for request/response.
- `migrations/`: Alembic migration scripts.
- `knowledge/`: Pedagogical reference materials for RAG.
