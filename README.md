# LessonLift 🎓

LessonLift is an advanced, AI-powered pedagogical assistant designed to empower educators. It streamlines the creation of high-quality lesson plans, manages educational resources through a private knowledge base, and leverages Retrieval-Augmented Generation (RAG) to provide context-aware teaching support.

---

## 🚀 Key Features

- **Agentic AI Chat:** A sophisticated AI agent that can search your documents, the web, and community resources to help you build curriculum content.
- **Smart RAG (Retrieval-Augmented Generation):** Upload PDFs, DOCX, or text files to create a personal knowledge base. The AI "reads" your files to provide specific, grounded answers.
- **Dynamic Difficulty Scaling:** Instantly adjust content complexity between *Easy*, *Medium*, *Advanced*, and *Olympiad* levels.
- **Community Knowledge:** Share and discover educational materials in a global, searchable vector database.
- **PDF Generation:** Transform AI-generated lesson plans into professionally formatted PDF documents.
- **Multimodal AI Support:** Seamlessly switch between OpenAI (GPT-4), Anthropic (Claude 3.5), and Google (Gemini) models.

---

## 🛠 Tech Stack

### Frontend (`ll-fe`)
- **Framework:** [Next.js](https://nextjs.org/) (React 19, App Router)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) & [Radix UI](https://www.radix-ui.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Content Rendering:** `react-markdown` for rich AI responses.

### Backend (`ll-be`)
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.13+)
- **AI Orchestration:** [LangChain](https://www.langchain.com/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) for high-performance vector similarity search.
- **ORM & Migrations:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/).
- **Caching & History:** [Redis](https://redis.io/) for chat history persistence and rate limiting.
- **Task Processing:** Background tasks for document ingestion and processing.
- **PDF Engine:** [WeasyPrint](https://weasyprint.org/) for HTML-to-PDF conversion.

---

## 🧠 AI Integration & Workflow

### 1. The Agentic Architecture
LessonLift doesn't just "chat"—it employs a **Tool-Calling Agent** that dynamically decides which resources to use based on your request.
- **`search_my_documents`**: Queries your private vector store.
- **`search_global_database`**: Accesses shared community knowledge.
- **`scrape_url`**: Fetches and parses live content from any link you provide.
- **`tavily_search`**: Performs real-time web searches for the latest educational standards.

### 2. Retrieval-Augmented Generation (RAG)
When you upload a file:
1. It is parsed (PDF, Docx, CSV, or Txt).
2. Content is split into semantic chunks using `RecursiveCharacterTextSplitter`.
3. Chunks are converted into vector embeddings (OpenAI/Google).
4. Vectors are stored in **PostgreSQL (pgvector)** with user-specific metadata for secure retrieval.

### 3. Persistent Memory
Conversations are backed by **Redis**. This ensures that the AI remembers the context of your lesson-building session across page refreshes or device changes.

---

## ⚙️ Setup & Installation

### Prerequisites
- Docker & Docker Compose
- API Keys for at least one provider:
    - [OpenAI API Key](https://platform.openai.com/)
    - [Anthropic API Key](https://console.anthropic.com/)
    - [Google AI (Gemini) Key](https://aistudio.google.com/)
    - [Tavily API Key](https://tavily.com/) (Optional, for web search)

### Quick Start (Docker)
The fastest way to get LessonLift running is via Docker Compose.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/lessonlift.git
   cd lessonlift
   ```

2. **Configure Environment:**
   Create a `.env` file in the `ll-be/` directory (see `.env.example`).
   ```env
   OPENAI_API_KEY=your_key_here
   DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/postgres
   REDIS_URL=redis://redis:6379/0
   ```

3. **Launch the stack:**
   ```bash
   docker-compose up --build
   ```
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

### Manual Backend Setup
If you prefer running locally without Docker:
```bash
cd ll-be
# Install dependencies using 'uv'
uv sync
# Run migrations
uv run alembic upgrade head
# Start the server
uv run uvicorn main:app --reload
```

### Manual Frontend Setup
```bash
cd ll-fe
npm install
npm run dev
```

---

## 📖 Project Structure

```text
LessonLift/
├── ll-be/                # FastAPI Backend
│   ├── src/
│   │   ├── routers/      # API Endpoints (Auth, AI, Docs)
│   │   ├── services/     # AI Logic, RAG, Ingestion
│   │   ├── entity/       # Database Models
│   │   └── schemas/      # Pydantic Validation
│   └── migrations/       # Alembic Migration Scripts
├── ll-fe/                # Next.js Frontend
│   ├── src/app/          # Pages & Layouts
│   ├── src/components/   # UI & Shared Components
│   └── src/lib/          # API Clients & Utils
└── docker-compose.yml    # Infrastructure Orchestration
```

---

## 🤝 Contributing
We welcome contributions to LessonLift! Please ensure you follow the coding standards and add tests for any new AI tools or features.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
