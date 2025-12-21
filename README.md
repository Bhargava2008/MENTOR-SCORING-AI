Mentor Scoring AI

Mentor Scoring AI is an AI-powered teacher evaluation platform that analyzes recorded teaching sessions and provides objective, mentor-grade feedback.
It combines computer vision, speech analysis, and large language models to generate scores, timestamped evidence, improvement plans, and institutional analytics.

Built and finalized during the UpSkill India Challenge – TechFest IIT Bombay (Onsite Grand Finale Sprint).

🚀 Key Features

🎥 Video-based teaching evaluation

🧍 Client-side body language analysis (MediaPipe)

🗣️ Speech-to-text with timestamps (Groq Whisper)

📊 Audio quality & delivery metrics

🧠 LLM-based rubric scoring & feedback

🎬 Automatic evidence video clips

🔊 Instructor-style audio feedback (TTS)

🏫 Institution dashboard & bulk PDF reports

📄 Professional single & bulk PDF exports

🔐 Authentication for teachers & institutions

☁️ Deployed (Render + Vercel)

🧠 Problem Statement

Teacher evaluation is often manual, subjective, and inconsistent.
Mentor Scoring AI automates this process by analyzing how a teacher speaks, moves, and explains concepts, providing data-driven feedback that scales across individuals and institutions.

🧩 System Overview
End-to-End Workflow

User logs in (Teacher / Institution Admin)

Enters Teaching Role / Subject

Uploads teaching video

MediaPipe runs locally in browser (privacy-first)

Backend processes:

Audio extraction

Transcript + timestamps

AI scoring

Final report generated:

Scores

Evidence clips

Improvement plan

Dashboard & PDF reports available

🤖 AI & Analytics Components

1. Body Language Analysis (Frontend – Browser)

Uses MediaPipe Pose, FaceMesh, Hands

Runs entirely client-side

Extracts:

Eye contact

Posture

Gestures

Facial expressiveness

Movement

Only numeric metrics are sent to backend

2. Speech-to-Text (Backend)

FFmpeg extracts audio

Groq Whisper (large-v3) generates:

Clean transcript

Word-level SRT timestamps

3. Audio Metrics

Computed from transcript + timestamps:

Words Per Minute (WPM)

Filler word count

Pause detection

Speaking stability

Pace quality

4. Rubric Engine

Role-based rubrics (Python, C, Math, etc.)

If missing → LLM auto-generates rubric JSON

Each rubric defines:

Dimensions

Weights

Evaluation criteria

5. LLM Scoring Engine

Inputs

Transcript

SRT timestamps

Audio metrics

Body language metrics

Rubric

Outputs

0–5 score per dimension

Timestamp-based evidence

Conceptual gaps

Final weighted score

Detailed improvement plan

Corrected teaching explanation

Strict prompts enforce valid JSON-only output.

6. Evidence Clip Generation

FFmpeg extracts 2–6 second video clips

Clips correspond to problematic timestamps

Displayed directly in reports

7. Instructor Feedback Audio (Optional)

Google Text-to-Speech

Generated automatically for low scores

Mentor-style audio coaching

🏗️ Technical Architecture
Frontend

HTML, CSS, Vanilla JavaScript (SPA-style)

MediaPipe (client-side inference)

Deployed on Vercel

Also served via backend on Render

Backend

Node.js + Express

REST APIs for:

Sessions

Uploads

AI processing

PDF generation

Deployed on Render

Database

MongoDB Atlas

Stores:

Users & institutions

Sessions

Transcripts

Metrics

Rubrics

Scores

Evidence clips

Feedback audio paths

📊 Dashboards
Teacher Dashboard

Session history

Scores & trends

Evidence clips

Audio feedback

PDF download

Institution Dashboard

All teacher sessions

Date filters (Today / Week / Month)

Bulk PDF reports

Teacher ranking table

📄 PDF Reporting

Single-session PDF

Bulk institution PDF

Professional layout:

Teacher-wise sections

Scores & averages

Final ranking page

🔐 Authentication & Roles

JWT-based authentication

Roles:

Individual Teacher

Institution Admin

Institution codes link teachers to organizations

🌐 Deployment

Backend: Render

Frontend: Vercel

Database: MongoDB Atlas

Environment variables are used for all credentials and secrets.

⚙️ Environment Variables

Create a .env file (local) or configure in deployment:

MONGO_URL=your_mongodb_url
GROQ_API_KEY=your_groq_api_key
GOOGLE_CREDENTIALS_JSON=your_google_tts_json_string

▶️ Running Locally
git clone https://github.com/Bhargava2008/MENTOR-SCORING-AI
cd MENTOR-SCORING-AI
npm install
npm start

Open in browser:

http://localhost:5000

📡 Core API Endpoints
Create Session
POST /api/session/create

Upload Video
POST /api/session/:sessionId/upload

Extract Audio
POST /api/session/:sessionId/extract-audio

Generate Transcript
POST /api/session/:sessionId/transcript

Save Body Metrics
POST /api/session/:sessionId/body-metrics

Score Session
POST /api/session/score/:sessionId

🧪 Testing

End-to-end workflow tested:

Login → Upload → Analysis → Report

Multiple roles and institutions validated

Bulk PDF generation verified

🛣️ Roadmap

Async job queues for heavy processing

Batch video uploads

Advanced analytics dashboards

Domain-specific rubric expansion

Model fine-tuning for timestamp accuracy

Live classroom evaluation mode

👤 Contributor

Bhargava Chandra
Mentor Scoring AI
Hackathon Prototype – TechFest IIT Bombay
