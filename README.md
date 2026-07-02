# UniQualis

An enterprise-grade Academic Quality Assurance and Evaluation Platform built with Next.js.

## Overview

UniQualis is a comprehensive system designed to streamline and automate the process of academic course evaluations, quality assurance (QA) monitoring, and institutional feedback. It provides tailored experiences for Students, Lecturers, QA Officials, and Administrators to foster continuous academic improvement.

## Features

### 🎓 For Students
- **Course Evaluations**: Submit structured feedback and evaluations for enrolled courses.
- **Dashboard**: Track pending evaluations, enrolled courses, and assignments.

### 👨‍🏫 For Lecturers
- **Performance Metrics**: View aggregated feedback and performance scores securely.
- **Response Management**: Acknowledge and respond to QA action plans and student feedback.
- **Live Feed**: Real-time updates on new evaluations and administrative notices.

### 🛡️ For QA Officials
- **Monitoring & Action Plans**: Monitor courses at risk, review flagged evaluations, and generate required QA Action Plans.
- **AI-Powered Insights**: Utilize AI to extract actionable summaries from thousands of qualitative student feedback entries.
- **Live Dashboard**: Real-time polling for instantaneous updates on academic metrics and evaluations.

### ⚙️ For Administrators
- **System Management**: Manage faculties, departments, courses, and user provisioning.
- **Global Metrics**: Oversee platform usage, evaluation completion rates, and system health statistics.
- **Role-Based Access Control (RBAC)**: Strict separation of concerns enforced at the edge via Next.js Middleware.

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **Database**: PostgreSQL with Prisma ORM
- **AI Integration**: Google GenAI (Gemini) for text summarization and action plan generation.
- **Authentication**: Secure cookie-based session management.

## Getting Started

### Prerequisites
- Node.js 18.x or later
- PostgreSQL database (local or cloud)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd uniqualis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Variables Setup:
   Create a `.env` file in the root directory (referencing `.env.example` if available):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/uniqualis"
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

4. Initialize the Database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

- `/app`: Next.js App Router containing pages, layouts, and role-based `/api` route handlers.
- `/components`: Reusable React components organized by role (e.g., `/admin`, `/official`, `/student`, `/lecturer`).
- `/prisma`: Prisma schema definitions with optimized indexing.
- `/lib` (if applicable): Utility functions, database clients, and shared helpers.

## Security & Architecture

- **Edge Authorization**: All routes and API endpoints are protected by Next.js Middleware enforcing strict role-based access control (RBAC).
- **Database Indexing**: Optimized Prisma schema with compound indexes on frequently queried fields to ensure rapid retrieval in live dashboards.
- **Resiliency**: Implements graceful error boundaries (`error.tsx`) providing user recovery options without application crashes.


Vercel Build Command (UI way)
In your Vercel dashboard → Project Settings → Build & Development Settings:
Set:
```bash
   prisma generate && npm run build
   ```