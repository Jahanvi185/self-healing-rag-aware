# 🤖 Self-Healing RAG Pipeline

A production-grade Retrieval-Augmented Generation (RAG) system designed to eliminate hallucinations through a **critique-based self-healing loop**. Unlike standard RAG implementations, this agent validates its own answers before delivery, ensuring higher factual accuracy and reliability.

## 🚀 Key Features
* **Self-Healing Loop:** Implements a critique agent that evaluates the generated response against the retrieved context. If the answer is insufficient or hallucinated, the system triggers a re-retrieval/re-generation cycle.
* **Pipeline Tracing:** Full visibility into the "Thinking" process, allowing users to see the RAG retrieval, critique, and final refinement steps.
* **Modern UI:** A custom-designed, responsive interface featuring a sophisticated Pistachio Green theme.
* **Interactive Feedback:** Users can rate responses, allowing for future fine-tuning and performance monitoring.

## 🛠 Tech Stack
* **Backend:** FastAPI (Python)
* **AI Orchestration:** LangGraph & LangChain
* **LLM Engine:** Groq API (Llama 3/Mixtral)
* **Vector Database:** ChromaDB
* **Frontend:** React (Vite) with custom CSS
* **Deployment:** Render (Backend) & Vercel (Frontend)

## 📦 How it Works
1.  **Retrieve:** The system fetches relevant document chunks from ChromaDB.
2.  **Generate:** Initial answer generation via Groq.
3.  **Critique:** A secondary agent acts as a "Gatekeeper," checking the generated answer for factual grounding.
4.  **Heal:** If the critique fails, the system refines the query and repeats the generation process until the answer meets the required quality standards.

## 🌐 Live Demo
* **Live App:** [Insert your Vercel URL here]
* *Note: Please allow a few seconds for the initial cold start on the backend.*

## ⚙️ Local Development
1. Clone the repo:
   ```bash
   git clone [https://github.com/YOUR_USERNAME/self-healing-rag.git](https://github.com/YOUR_USERNAME/self-healing-rag.git)
