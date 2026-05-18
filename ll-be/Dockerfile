# Use a specialized uv image for faster dependency management
FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy

WORKDIR /app

# Copy dependency files explicitly to bypass Railway's lack of bind mount support
COPY uv.lock pyproject.toml ./

# Install dependencies first using the valid Railway cache mount format
RUN --mount=type=cache,id=s/1564c4e9-2fef-4c94-ab10-f9783fa142c9-uv,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# Install the project itself
RUN --mount=type=cache,id=s/1564c4e9-2fef-4c94-ab10-f9783fa142c9-uv,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Final image
FROM python:3.13-slim-bookworm

WORKDIR /app

# Install system dependencies for WeasyPrint and PDF generation
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from the builder
COPY --from=builder /app/.venv /app/.venv

# Place executable scripts in PATH
ENV PATH="/app/.venv/bin:$PATH"

# Copy the application code
COPY . .

# Expose the application port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "src.app:app", "--host", "0.0.0.0", "--port", "8000"]
