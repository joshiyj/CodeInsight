# CodeInsight — Interactive AI Code Review & Flowchart Visualizer

CodeInsight is a developer-centric tool that analyzes code snippets, streams deep AI code reviews with inline editor markers, and automatically generates interactive flowcharts to visualize code logic. 

This repository contains the version optimized for **V1 deployment** (using Groq LLM API and Mermaid Flowchart visualization).

---

## 🚀 Key Features

*   **Real-time AI Insights (SSE Streaming):** Streams code reviews instantly (Overview, Complexity, Strengths, Issues, Recommendations).
*   **Monaco Editor Integration:** Embedded professional editor featuring syntax highlighting, automatic language detection (supporting JS, Python, Java, C, C++), and inline error markers linking to the issues list.
*   **AI-driven Flowcharts:** Generates Mermaid.js flowcharts depicting loop back-edges, condition checks, and assignment blocks.
*   **Visual Complexity Cards:** Automatically parses and highlights Time and Space Complexity in prominent, easy-to-read UI chips.
*   **Diagnostics & Scoring:** Computes a **Quality Score** (0-100) based on issue count and severity (Error, Warning, Info, Hint) with a quick-scan risk indicator.
*   **PNG Diagram Export:** Allows high-resolution PNG exports of the generated Mermaid flowcharts.

---

## 🛠️ Technology Stack

### Frontend
*   **Core:** React 18, Vite
*   **Styling:** TailwindCSS, Vanilla CSS
*   **Editor:** `@monaco-editor/react` (Monaco Editor)
*   **Visualization:** `mermaid` (SVG renderer)
*   **State Management:** `zustand`
*   **Markdown & LaTeX Rendering:** `react-markdown`, `remark-math`, `rehype-katex`

### Backend
*   **Runtime:** Node.js (ES Modules)
*   **Framework:** Express
*   **AI Service:** Groq Cloud API SDK (`llama-3.3-70b-versatile`)
*   **Server-Sent Events (SSE):** Standard Express response streaming

---

## 📂 Project Structure

```text
CodeInsight/
├── backend/
│   ├── src/
│   │   ├── config/             # Configuration & environment variables
│   │   ├── modules/
│   │   │   ├── ai/             # Groq API stream & prompt managers
│   │   │   └── analysis/       # Code issue regex & structure parsers
│   │   ├── routes/             # API Router (analyze, diagram, stream)
│   │   └── app.js              # Express app entry point
│   ├── .env                    # Backend environment config
│   └── package.json
│
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # Axios/fetch diagram and analysis callers
│   │   ├── components/         # Editor, Insights, Diagram, and Issues UI
│   │   ├── store/              # Zustand global analysis store
│   │   ├── App.jsx
│   │   └── main.jsx            # React root & Mermaid initialization
│   ├── .env                    # Frontend environment config
│   └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
*   Node.js (v18.x or higher)
*   A Groq Cloud API Key ([Get one here](https://console.groq.com/))

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` folder:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   PORT=3001
   NODE_ENV=development
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server will run on `http://localhost:3001`.

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend/` folder:
   ```env
   VITE_API_URL=http://localhost:3001
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend server will run on `http://localhost:5173`. Open this URL in your web browser.

---

## 📦 Deployment Guide

To deploy this version of the application:

### Backend Deployment (Render, Heroku, Railway, etc.)
1. Create a web service linked to this repository.
2. Set the build command to `npm install` and start command to `node src/app.js` (inside the `backend` folder context).
3. Set the environment variables in your deployment dashboard:
   *   `GROQ_API_KEY` (Your secret key)
   *   `NODE_ENV=production`
   *   `PORT` (usually provided automatically by host)

### Frontend Deployment (Vercel, Netlify, Github Pages, etc.)
1. Create a static web service linked to this repository.
2. Set the build directory context to the `frontend/` folder.
3. Configure the build command as `npm run build` and output directory to `dist/`.
4. Set the environment variables:
   *   `VITE_API_URL`: Set to the URL of your deployed backend service (e.g. `https://your-backend.onrender.com`).
