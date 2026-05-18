# AI Lesson Planning PlatformFrontend

AI Lesson Planning Platform is a professional AI-driven platform for generating lesson plans through interactive chat, RAG-based document context, and structured PDF exports.

## 🚀 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) with `@tailwindcss/typography`
- **Icons:** [Lucide React](https://lucide.dev/)
- **API Client:** [Axios](https://axios-http.com/) with HTTP-only cookie authentication
- **UI Components:** [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Markdown Rendering:** [react-markdown](https://github.com/remarkjs/react-markdown)
- **Deployment:** Docker (Standalone optimization)

## 🛠️ Getting Started

### Prerequisites

- Node.js 20.9.0 or later
- npm (or yarn/pnpm/bun)
- Backend API running (Default: `http://localhost:8000`)

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) with your browser.

### 🐳 Running with Docker

1. **Build the image:**
   ```bash
   docker build -t lessonlift-fe --build-arg NEXT_PUBLIC_API_URL=https://your-api.com .
   ```

2. **Run the container:**
   ```bash
   docker run -p 3000:3000 alpp-fe
   ```

## 📋 Features

- **Interactive AI Chat:** Real-time lesson plan generation.
- **Document Context (RAG):** Upload PDF, DOCX, TXT, or CSV files (up to 10MB) to provide context for AI.
- **Structured Exports:** One-click PDF generation for lesson plans.
- **Workspace Settings:** Configure difficulty (Easy to Olympiad), Web Search, and Global Database access.
- **Secure Auth:** HTTP-only cookie-based session management with multi-step password reset flow.

## 📁 Project Structure

- `src/app`: Next.js App Router (Pages & Layouts)
- `src/components`: Reusable UI components
- `src/lib`: API client, utility functions, and contexts
- `public`: Static assets (images, logos)

## 📄 License
This project is private and proprietary.
