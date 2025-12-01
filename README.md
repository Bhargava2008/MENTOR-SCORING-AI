<<<<<<< HEAD
-----------------------------
MENTOR SCORING AI
-----------------------------


Mentor Scoring AI is a prototype system that evaluates a teacher’s recorded video session using AI.
It analyzes four components:

Body Language – Using MediaPipe in the browser (eye contact, posture, gestures).

Speech-to-Text – Whisper.cpp converts audio to transcript and timestamps.

Audio Quality Metrics – Words per minute, filler words, pauses, clarity, stability.

Content Scoring via LLM – Based on a rubric (loaded or auto-generated), the LLM provides:

Category-wise scores

Timestamp evidence

Conceptual gaps

Final weighted score

Improvement plan

Optional TTS audio feedback

The system produces:

transcript

audio metrics

body-language metrics

LLM scoring

evidence clips

feedback audio

a dashboard for results

It demonstrates an end-to-end working workflow suitable for a hackathon prototype.

---

## Setup Instructions

Clone the repository

git clone <your-repo>
cd <your-repo>

Install dependencies

npm install

Create .env file

MONGO_URL=your_mongodb_url
GROQ_API_KEY=your_groq_key
GOOGLE_APPLICATION_CREDENTIALS=google-credentials.json

Place Whisper.cpp files
Put whisper models + executables inside:

/whisper/

Start MongoDB
Use local or Atlas.

Start server

node server.js

Open frontend
Either open:

index.html

or visit:

http://localhost:5000

---

## Architecture Overview

Browser (Frontend)

Captures video file for upload.

Runs MediaPipe locally (pose, face, gestures).

Sends only metrics to backend (privacy-friendly).

Backend (Node.js + Express)

Handle uploads (multer).

Extract audio using FFmpeg.

Run Whisper.cpp to generate:

transcript

SRT timestamps

Compute audio metrics.

Detect pauses.

Load or generate rubric.

Send all data to LLM for scoring.

Generate timestamp-based evidence clips.

Generate TTS feedback audio.

Save everything to MongoDB.

Database (MongoDB)

---------Stores:

session metadata

transcript

audio metrics

body-language metrics

rubric

score report

clip paths

feedback audio path

Frontend Dashboard

---------------Shows:

final score

category scores

evidence clips

improvement plan

conceptual gaps

transcript

audio metrics

body-language metrics

---

## How to Run Locally

Install Node and MongoDB.

Install dependencies (npm install).

Create .env file with DB + API keys.

Place Whisper binaries and models under /whisper/.

Run node server.js.

Open index.html or access via browser at http://localhost:5000.

The system is fully functional after these six steps.

## APIs or Endpoints

Create session

POST /session/create
Body:

{
"institutionCode": "IIT-B",
"mentorName": "John",
"role": "Python Teacher"
}

Upload video

POST /session/:sessionId/upload
Form-data:

video: file.mp4

Extract audio

POST /session/:sessionId/extract-audio

Generate transcript

POST /session/:sessionId/transcript

Save body metrics

POST /session/:sessionId/body-metrics
Body (example):

{
"eyeContact": 7.5,
"posture": 6.2,
"gestures": 4.8
}

Score session (final evaluation)

POST /session/score/:sessionId
Returns:

scores

evidence clips

conceptual gaps

final score

improvement plan

feedback audio

---

## Example Inputs / Outputs

Example Input:
{
"institutionCode": "IIT-B",
"mentorName": "Bhargava",
"role": "Python Teacher"
}

Example Output :
{
"message": "Scoring successful",
"finalReport": {
"sessionId": "6928316218d38ebff00a4f3c",
"metadata": {
"mentorName": "Bhargava Vakka",
"role": "Python teacher",
"institutionCode": "IIT-B-HACK",
"timestamp": "2025-11-27T11:09:22.904Z"
},
"transcript": "hello today I'm going to explain about operators like okay yeah I'm going to explain about operators in C what are operators okay right so what are operators are the rate terms that will be",
"audioMetrics": {
"totalWords": 35,
"totalSentences": 1,
"fillerWords": 4,
"wordsPerMin": 72,
"pauseCount": 0,
"sentenceComplexityScore": 5,
"pronunciationScore": 10,
"speakingStabilityScore": 10
},
"bodyLanguageMetrics": {},
"rubric": {
"dimensions": [
{
"name": "Concept Clarity",
"weight": 0.25,
"description": "How clearly the teacher explains Python concepts, such as data types, control flow, OOP, and libraries.",
"examplesOfGood": "Uses simple definitions; demonstrates with live code snippets; explains abstract ideas with concrete Python examples.",
"examplesOfBad": "Provides vague or ambiguous explanations; jumps between syntax and theory without clear linkage; uses jargon without clarification."
},
{
"name": "Delivery & Communication",
"weight": 0.25,
"description": "Voice clarity, pacing, energy, and ability to convey Python syntax and error messages effectively.",
"examplesOfGood": "Clear articulation of code; varied tone to emphasize key points; steady pace allowing learners to follow code execution.",
"examplesOfBad": "Monotone voice; speaks too fast causing missed parentheses; excessive filler words obscuring code explanation."
},
{
"name": "Content Structure",
"weight": 0.2,
"description": "Logical organization of Python lessons: introduction, concept explanation, coding demonstration, hands‑on exercise, summary.",
"examplesOfGood": "Starts with problem statement, walks through solution step‑by‑step, highlights key Python constructs, ends with recap and next steps.",
"examplesOfBad": "Randomly shows code snippets without context; skips prerequisite concepts; no clear transition between topics."
},
{
"name": "Student Engagement",
"weight": 0.15,
"description": "Interaction with learners, prompting them to write code, ask questions, and debug together.",
"examplesOfGood": "Poses coding challenges, asks learners to predict output, encourages pair‑programming, checks understanding through quick quizzes.",
"examplesOfBad": "One‑way lecture; never invites questions; no opportunities for learners to practice writing Python code."
},
{
"name": "Accuracy",
"weight": 0.15,
"description": "Correctness of Python syntax, semantics, and best practices presented.",
"examplesOfGood": "Demonstrates correct syntax; explains nuances of Python version differences; follows PEP 8 conventions.",
"examplesOfBad": "Shows code with syntax errors; misstates behavior of built‑in functions; recommends outdated or insecure practices."
}
]
},
"scoreReport": {
"scores": [
{
"dimension": "Concept Clarity",
"score": 1,
"justification": "The explanation is vague and uses undefined phrasing like \"rate terms\" without concrete Python examples."
},
{
"dimension": "Delivery & Communication",
"score": 1,
"justification": "Frequent filler words (\"okay\", \"yeah\") and no observable body‑language metrics reduce clarity; pacing is uneven."
},
{
"dimension": "Content Structure",
"score": 1,
"justification": "The lesson lacks a clear introduction, progression, or summary; it jumps straight into a loose definition."
},
{
"dimension": "Student Engagement",
"score": 0,
"justification": "No prompts, questions, or interactive coding tasks are presented to the learners."
},
{
"dimension": "Accuracy",
"score": 1,
"justification": "The teacher references operators in C rather than Python and provides an inaccurate definition."
}
],
"timestampEvidence": [
{
"issue": "Filler cluster",
"timestamp": "00:00:05,000 --> 00:00:07,000",
"reason": "Contains repeated fillers \"okay yeah\" which distract from the core explanation."
},
{
"issue": "Language mismatch (C vs Python)",
"timestamp": "00:00:03,000 --> 00:00:05,000",
"reason": "Mentions \"operators in C\" which is irrelevant for a Python lesson and confuses learners."
},
{
"issue": "Vague concept definition",
"timestamp": "00:00:08,000 --> 00:00:12,000",
"reason": "Uses the phrase \"operators are the rate terms that will be\" which offers no clear Python context or examples."
},
{
"issue": "Lack of structural cues",
"timestamp": "00:00:00,500 --> 00:00:04,500",
"reason": "No explicit introduction or roadmap; the segment jumps straight into the definition without framing."
},
{
"issue": "Monotone delivery (inferred from audio metrics)",
"timestamp": "00:00:00,000 --> 00:00:12,000",
"reason": "Pronunciation score is perfect but filler count and absence of pauses indicate a flat, unengaging tone."
}
],
"conceptualGaps": [
{
"gap": "Missing explanation of Python-specific operator categories (arithmetic, comparison, logical, bitwise)",
"impact": "Students cannot differentiate how each operator type behaves in Python code, leading to misuse and syntax errors."
},
{
"gap": "No coverage of operator precedence and associativity",
"impact": "Learners may write expressions that evaluate unexpectedly, causing debugging difficulties."
},
{
"gap": "Absence of examples showing operators with Python data types (e.g., strings, lists)",
"impact": "Students miss how operators are overloaded in Python, limiting their ability to write idiomatic code."
}
],
"finalScore": 0.9,
"improvementPlan": {
"issuesDetected": [
"Excessive filler words",
"Reference to C instead of Python",
"Vague and inaccurate definition of operators",
"No lesson structure or roadmap",
"No student interaction or practice opportunities"
],
"correctedVersion": "Welcome to the Python operators lesson. In Python, operators let us perform actions on values. We have several categories:\n1. **Arithmetic operators** (+, -, _, /, //, %, **) for numeric calculations.\n2. **Comparison operators** (==, !=, <, >, <=, >=) that return Boolean results.\n3. **Logical operators** (and, or, not) for combining Boolean expressions.\n4. **Bitwise operators** (&, |, ^, ~, <<, >>) for binary manipulation.\n5. **Assignment operators\*\* (=, +=, -=, etc.) that store values.\nOperator precedence determines the order of evaluation; for example, multiplication (_) happens before addition (+). Parentheses can override precedence. Let's see a quick example:\n`python\nresult = (3 + 5) * 2  # evaluates to 16, not 13 because parentheses force addition first.\nprint(result)\n`\nNotice how the same operators work with different data types: `+` concatenates strings (`'Hello' + ' World'` → `'Hello World'`) and merges lists (`[1,2] + [3,4]`).\nNow, try writing a small function that uses arithmetic and comparison operators to check if a number is both even and greater than 10.\nFeel free to ask questions as we go along.",
"teachingStrategy": [
"Begin with a clear agenda displayed on screen.",
"Introduce each operator category with a concise definition and a live coding demo.",
"Use visual diagrams to illustrate precedence hierarchy.",
"After each demo, ask learners to predict the output before running the code."
],
"engagementSuggestions": [
"Pose a short quiz after covering each operator group.",
"Invite learners to modify the example code in real time via a shared notebook.",
"Create pair‑programming challenges where students implement a simple calculator."
],
"deliveryGuidance": [
"Reduce filler words by rehearsing key sentences.",
"Vary vocal pitch when highlighting important syntax (e.g., code keywords).",
"Incorporate brief pauses (1‑2 seconds) after code snippets to let learners process.",
"Maintain open posture and make eye contact with the camera to increase presence."
]
},
"feedbackAudio": "uploads\\tts\\6928316218d38ebff00a4f3c_mentor_feedback.mp3"
},
"evidenceClips": [
{
"issue": "Filler cluster",
"reason": "Contains repeated fillers \"okay yeah\" which distract from the core explanation.",
"path": "uploads/evidence/6928316218d38ebff00a4f3c/6928316218d38ebff00a4f3c_clip1.mp4"
},
{
"issue": "Language mismatch (C vs Python)",
"reason": "Mentions \"operators in C\" which is irrelevant for a Python lesson and confuses learners.",
"path": "uploads/evidence/6928316218d38ebff00a4f3c/6928316218d38ebff00a4f3c_clip2.mp4"
},
{
"issue": "Vague concept definition",
"reason": "Uses the phrase \"operators are the rate terms that will be\" which offers no clear Python context or examples.",
"path": "uploads/evidence/6928316218d38ebff00a4f3c/6928316218d38ebff00a4f3c_clip3.mp4"
},
{
"issue": "Lack of structural cues",
"reason": "No explicit introduction or roadmap; the segment jumps straight into the definition without framing.",
"path": "uploads/evidence/6928316218d38ebff00a4f3c/6928316218d38ebff00a4f3c_clip4.mp4"
},
{
"issue": "Monotone delivery (inferred from audio metrics)",
"reason": "Pronunciation score is perfect but filler count and absence of pauses indicate a flat, unengaging tone.",
"path": "uploads/evidence/6928316218d38ebff00a4f3c/6928316218d38ebff00a4f3c_clip5.mp4"
}
],
"feedbackAudio": "uploads\\tts\\6928316218d38ebff00a4f3c_mentor_feedback.mp3"
}
}

---

## List of Dependencies

Backend

express

multer

mongoose

fluent-ffmpeg

ffmpeg-static

whisper.cpp (local binary)

axios

uuid

dotenv

AI / Processing

Whisper.cpp

Groq SDK / Ollama (LLM)

MediaPipe (client-side)

Google TTS

Frontend

MediaPipe Pose

MediaPipe FaceMesh

MediaPipe Hands

Vanilla JavaScript

---

## Contributors

Bhargava Chandra
vakkalagaddabhargavachandra@gmail.com
Mentor Scoring AI – Hackathon Prototype
=======
# MENTOR-SCORING-AI
Mentor Scoring AI automatically evaluates a teacher’s video using body-language analysis, Whisper speech-to-text, audio metrics, and an LLM-based rubric. It generates scores, timestamp evidence, improvement steps, and video clips, providing fast, objective teaching performance feedback.
>>>>>>> 823363eae66f2d603499b9efa4121b2cca54caac
