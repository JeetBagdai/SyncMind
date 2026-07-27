# 🎓 GyaanaSetu

**🌐 Live Demo:** [https://gyaanasetu-frontend-lonbmookea-el.a.run.app](https://gyaanasetu-frontend-lonbmookea-el.a.run.app)

> **A Next-Generation, AI-Powered Learning Ecosystem.** 
> Revolutionizing the way students interact with educational material by bridging traditional learning with cutting-edge Cloud Architecture, Computer Vision, and Large Language Models (LLMs).

---

## 🌟 Overview

GyaanaSetu creates a personalized, highly interactive, and engaging learning environment. By combining dynamic frontend experiences with powerful AI backend processing, the platform transforms static curriculum into a conversational and intelligent journey.

---

## 🚀 Key Features

*   📝 **Intelligent Notebook Grading (Computer Vision & LLMs)**  
    Students can handwrite answers in their physical notebooks, snap a picture, and instantly receive intelligent grading. The platform leverages state-of-the-art vision models (**Llama 4 Scout Multimodal**) to read the handwriting, cross-reference it with the expected NCERT rubric, and provide granular scoring along with constructive feedback.

*   🤖 **Conversational AI Tutor**  
    A floating, context-aware AI companion overlay that students can interact with at any time. It helps clarify doubts, explain complex concepts interactively, and is fully responsive to the active study session.

*   📅 **Smart Attendance & Timetable Management**  
    Facilitates digital classrooms with dynamic attendance tracking and automated timetable generation for seamless scheduling.

*   ☁️ **Cloud-Native Architecture**  
    Built entirely on Google Cloud Platform (GCP) and Firebase, ensuring high availability, scalable data storage, and low-latency API responses.

---

## 🛠️ Tech Stack

### Frontend
*   **React (Vite)**: Lightning-fast, modern component architecture.
*   **Vanilla CSS**: Custom Glassmorphism UI, smooth micro-animations, and dynamic themes.

### Backend & AI
*   **Google Cloud Functions**: Serverless, autoscaling endpoints (Node.js).
*   **Groq API**: Blazing fast AI inference using:
    *   `llama-3.3-70b-versatile` for conversational AI logic.
    *   `meta-llama/llama-4-scout-17b-16e-instruct` for optical character recognition and visual answer evaluation.
*   **Firebase Firestore**: Real-time NoSQL database.
*   **Firebase Authentication**: Secure user management.

### Deployment
*   **Google Cloud Run**: Containerized frontend hosting.
*   **Google Cloud Storage**: Scalable asset and curriculum delivery.

---

## 🔒 Security

All sensitive API keys and service account credentials are securely managed through environment variables and excluded from source control.

---

## 🏃‍♂️ Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v20+)
*   [Firebase CLI](https://firebase.google.com/docs/cli)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/GyaanaSetu.git
   cd GyaanaSetu
   ```

2. **Install Frontend Dependencies**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd functions
   npm install
   cd ..
   ```

4. **Environment Variables**
   Set up your `.env` files using `.env.example` as a reference. You will need:
   * Firebase config keys
   * A valid `GROQ_API_KEY` for AI features

5. **Run the App**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view the app in the browser.

---

*Built with ❤️ to empower the next generation of learners.*
