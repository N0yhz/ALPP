from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_postgres import PGVector
from sqlalchemy.ext.asyncio import create_async_engine
from langchain_classic.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.tools import create_retriever_tool, tool
from langchain_tavily import TavilySearch
from langchain_community.chat_message_histories import RedisChatMessageHistory
from langsmith import traceable
from bs4 import BeautifulSoup
import httpx
import asyncio
from src.config.settings import settings
from src.schemas.lesson import LessonPlanResponse
from typing import Optional, List
import os

DIFFICULTY_PROMPTS = {
    "Easy": "Use extremely simple language, avoid any technical terms, and provide very basic, relatable examples. Be encouraging and patient. Ensure all tasks are highly achievable.",
    "Medium": "Provide balanced, clear explanations suitable for standard curriculum levels. Use standard terminology and structured reasoning.",
    "Advanced": "Use professional and technical language. Dive deep into complex concepts, provide challenging multi-step examples, and assume significant prior knowledge.",
    "Olympiad": "Focus on extreme problem-solving, theoretical depth, and competition-level rigor (e.g., IMO/IPhO level). Generate brutally difficult, non-standard tasks that require creative leaps and profound logical or mathematical frameworks. Do not use textbook examples."
}

class AIService:
    def __init__(self):
        self._setup_tracing()
        self.llm = self._initialize_llm()
        self.embeddings = self._initialize_embeddings()
        self.async_engine = create_async_engine(settings.database_url)
        self.vector_store = self._initialize_vector_store()
        self.system_prompt_template = self._load_prompt("system_agent.md")

    def _load_prompt(self, filename: str) -> str:
        """Loads a prompt template from the prompts directory."""
        path = os.path.join(os.path.dirname(__file__), "prompts", filename)
        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception as e:
            print(f"ERROR: Failed to load prompt {filename}: {e}")
            return "You are a helpful AI assistant."

    def _setup_tracing(self):
        if settings.langsmith_tracing and settings.langsmith_api_key:
            os.environ["LANGSMITH_TRACING"] = "true"
            os.environ["LANGSMITH_API_KEY"] = settings.langsmith_api_key
            os.environ["LANGSMITH_PROJECT"] = settings.langsmith_project
            os.environ["LANGSMITH_ENDPOINT"] = settings.langsmith_endpoint
            print(f"DEBUG: LangSmith tracing enabled for project: {settings.langsmith_project}")

    def _initialize_llm(self):
        provider = settings.llm_provider.lower()
        
        try:
            if provider == "openai":
                if not settings.openai_api_key:
                    return None
                return ChatOpenAI(
                    api_key=settings.openai_api_key,
                    model=settings.llm_model
                )
            
            elif provider == "anthropic":
                if not settings.anthropic_api_key:
                    return None
                return ChatAnthropic(
                    anthropic_api_key=settings.anthropic_api_key,
                    model_name=settings.llm_model
                )
            
            elif provider == "google":
                if not settings.google_api_key:
                    return None
                return ChatGoogleGenerativeAI(
                    google_api_key=settings.google_api_key,
                    model=settings.llm_model
                )
            
            return None
        except Exception as e:
            print(f"ERROR: Failed to initialize LLM provider '{provider}': {e}")
            return None

    def _initialize_embeddings(self):
        provider = (settings.embedding_provider or settings.llm_provider).lower()
        
        try:
            if provider == "openai":
                if not settings.openai_api_key:
                    return None
                model = settings.embedding_model or "text-embedding-3-small"
                return OpenAIEmbeddings(
                    api_key=settings.openai_api_key,
                    model=model
                )
            
            elif provider == "google":
                if not settings.google_api_key:
                    return None
                model = settings.embedding_model or "models/text-embedding-004"
                return GoogleGenerativeAIEmbeddings(
                    google_api_key=settings.google_api_key,
                    model=model
                )
            
            return None
        except Exception as e:
            print(f"ERROR: Failed to initialize embedding provider '{provider}': {e}")
            return None

    def _initialize_vector_store(self):
        if not self.embeddings:
            return None
        
        try:
            return PGVector(
                embeddings=self.embeddings,
                collection_name="lessonlift_docs",
                connection=self.async_engine,
                use_jsonb=True,
            )
        except Exception as e:
            print(f"ERROR: Failed to initialize vector store: {e}")
            return None

    def _get_agent_executor(self, user_id: int = None, use_community_docs: bool = False, use_websearch: bool = False, difficulty_instructions: str = ""):
        if not self.llm:
            return None

        tools = []
        
        # 1. Add RAG tools
        if self.vector_store and user_id is not None:
            # We need to wrap the async search in a tool properly
            @tool
            async def search_my_documents(query: str) -> str:
                """
                Search and return information from YOUR own uploaded documents. 
                Use this first when searching for files you uploaded.
                """
                try:
                    docs = await self.vector_store.asimilarity_search(
                        query, k=3, filter={"user_id": str(user_id)}
                    )
                    return "\n\n".join([doc.page_content for doc in docs])
                except Exception as e:
                    return f"Error searching personal documents: {str(e)}"
            
            tools.append(search_my_documents)

            # Global database tool (if requested)
            if use_community_docs:
                @tool
                async def search_global_database(query: str, grade: Optional[str] = None, subject: Optional[str] = None, topic: Optional[str] = None) -> str:
                    """
                    Search the global database for shared educational materials, pedagogical guidelines, and lesson plan structures.
                    You can optionally filter by grade, subject, and topic to find more relevant information.
                    Use this tool if the user asks for specific curriculum standards or teaching approaches.
                    """
                    filters = {"is_shared": True}
                    if grade:
                        filters["grade"] = grade
                    if subject:
                        filters["subject"] = subject
                    if topic:
                        filters["topic"] = topic
                    
                    try:
                        docs = await self.vector_store.asimilarity_search(query, k=3, filter=filters)
                        return "\n\n".join([f"Source: {doc.metadata.get('source_file', 'Unknown')}\nContent: {doc.page_content}" for doc in docs])
                    except Exception as e:
                        return f"Error searching global database: {str(e)}"

                tools.append(search_global_database)
        
        # 2. Add Tavily Search tool (ONLY IF enabled by user)
        if use_websearch and settings.tavily_api_key:
            os.environ["TAVILY_API_KEY"] = settings.tavily_api_key
            web_search = TavilySearch(max_results=3)
            tools.append(web_search)
            
        # 3. Add URL Scraping tool
        @tool
        def scrape_url(url: str) -> str:
            """
            Fetches a webpage from a URL and extracts its main text content.
            Use this tool if the user provides a specific link/URL in the chat.
            """
            try:
                with httpx.Client(timeout=10.0, follow_redirects=True) as client:
                    response = client.get(url)
                    response.raise_for_status()
                
                soup = BeautifulSoup(response.text, "lxml")
                
                # Aggressively remove non-content elements
                for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "iframe"]):
                    tag.decompose()
                    
                text = soup.get_text(separator=' ', strip=True)
                return f"--- Content from {url} ---\n{text[:10000]}\n"
            except Exception as e:
                return f"Error fetching {url}: {str(e)}"

        tools.append(scrape_url)
        
        if not tools:
            # We still return an executor even without tools, or maybe a simple chain
            # But for this agent, tools are expected.
            pass

        # 4. Define Prompt
        prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_prompt_template),
            MessagesPlaceholder(variable_name="history"),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # 4. Create Agent
        agent = create_tool_calling_agent(self.llm, tools, prompt)
        agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
        
        # 5. Wrap with history
        return RunnableWithMessageHistory(
            agent_executor,
            self._get_session_history,
            input_messages_key="input",
            history_messages_key="history",
        )

    def _get_session_history(self, session_id: str):
        return RedisChatMessageHistory(session_id, url=settings.redis_url)

    async def notify_upload_in_history(self, session_id: str, filename: str):
        """
        Injects a system notification into the chat history to inform the AI about a new file upload.
        """
        try:
            history = self._get_session_history(session_id)
            notification = f"System Notification: The user just uploaded a file named '{filename}'. You can now search for it using your document search tool if requested."
            history.add_message(SystemMessage(content=notification))
        except Exception as e:
            print(f"ERROR: Failed to add upload notification to history: {e}")

    def get_chat_history(self, session_id: str) -> list[dict]:
        """
        Retrieves and serializes the chat history for a given session.
        """
        try:
            history = self._get_session_history(session_id)
            serialized_messages = []
            for msg in history.messages:
                role = "user"
                if isinstance(msg, AIMessage):
                    role = "assistant"
                elif isinstance(msg, SystemMessage):
                    role = "system"
                elif isinstance(msg, HumanMessage):
                    role = "user"
                else:
                    continue # Skip other message types like FunctionMessage for now

                serialized_messages.append({
                    "role": role,
                    "content": msg.content
                })
            return serialized_messages
        except Exception as e:
            print(f"ERROR: Failed to retrieve chat history: {e}")
            return []

    async def get_relevant_context(self, query: str, k: int = 3) -> str:
        if not self.vector_store:
            return ""
        
        try:
            # Use async similarity search
            docs = await self.vector_store.asimilarity_search(query, k=k)
            return "\n\n".join([doc.page_content for doc in docs])
        except Exception as e:
            print(f"ERROR: Failed to retrieve context: {e}")
            return ""

    @traceable(name="LessonLift Chat", run_type="chain")
    async def chat(self, user_input: str, session_id: str = "default_session", difficulty: str = "Medium", user_id: int = None, use_community_docs: bool = False, use_websearch: bool = False) -> str:
        if not self.llm:
            provider = settings.llm_provider
            return f"AI Service ({provider}) is not configured. Please add the required API key to your .env file."

        difficulty_instructions = DIFFICULTY_PROMPTS.get(difficulty, DIFFICULTY_PROMPTS["Medium"])
        
        # Get dynamic agent executor based on user context
        agent_executor = self._get_agent_executor(
            user_id=user_id, 
            use_community_docs=use_community_docs,
            use_websearch=use_websearch,
            difficulty_instructions=difficulty_instructions
        )

        if not agent_executor:
            # Fallback to simple chat if agent is not initialized (e.g. no tools available)
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful assistant for the LessonLift platform. "
                           "Difficulty level instructions: {difficulty_instructions}"),
                ("user", "{input}")
            ])
            chain = prompt | self.llm | StrOutputParser()
            try:
                return await chain.ainvoke({
                    "input": user_input,
                    "difficulty_instructions": difficulty_instructions
                })
            except Exception as e:
                return f"Error: {str(e)}"

        try:
            # Note: RunnableWithMessageHistory uses invoke/ainvoke
            result = await agent_executor.ainvoke(
                {
                    "input": user_input,
                    "difficulty_instructions": difficulty_instructions
                },
                config={"configurable": {"session_id": session_id}}
            )
            return result["output"]
        except Exception as e:
            return f"Error communicating with AI Agent: {str(e)}"

ai_service = AIService()
