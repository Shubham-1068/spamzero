# SpamZero 🛡️

**SpamZero** is a full-stack AI-powered spam detection system that classifies emails and SMS messages as **Spam** or **Ham (Not Spam)** in real time. The frontend and backend are built with Next.js, while the machine learning model is deployed as a separate FastAPI microservice on Hugging Face Spaces, with prediction history stored in MongoDB Atlas.

🌐 **Live Demo:** [spamzero.vercel.app](https://spamzero.vercel.app)

---

## System Architecture

```
User → Next.js Frontend UI
          ↓
     Next.js API Route
          ↓
  FastAPI ML Microservice (Hugging Face Spaces)
  [Preprocessing → TF-IDF → Prediction]
          ↓
     Result returned to Next.js
          ↓
     MongoDB Atlas (prediction log stored)
```

---

## Features

- 📨 **Email/SMS Spam Classification** — Detects spam using a trained Scikit-learn model
- ⚡ **Real-Time Predictions** — FastAPI microservice handles inference with low latency
- 📋 **Prediction History** — Every prediction (text, result, confidence, timestamp) is logged to MongoDB Atlas
- 🧠 **TF-IDF + Classical ML** — Preprocessing pipeline with Naive Bayes / Logistic Regression / SVM
- 🌐 **Fully Deployed** — Next.js on Vercel, ML service on Hugging Face Spaces, DB on MongoDB Atlas

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend & Backend | Next.js (App Router + API Routes) |
| Language | TypeScript (Next.js), Python (ML) |
| Machine Learning | Scikit-learn, NLTK |
| ML API | FastAPI |
| Database | MongoDB Atlas |
| Deployment (App) | Vercel |
| Deployment (ML) | Hugging Face Spaces |
| Version Control | GitHub |

---

## Machine Learning Workflow

1. **Text Preprocessing** — Lowercasing, punctuation removal, stopword removal (NLTK)
2. **Feature Extraction** — TF-IDF Vectorization
3. **Model Training** — Naive Bayes, Logistic Regression, SVM evaluated and compared
4. **Evaluation** — Precision, Recall, F1 Score
5. **Model Export** — Best model saved as `.pkl` files
6. **Deployment** — Served via FastAPI on Hugging Face Spaces for real-time inference

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+ (for ML service)
- MongoDB Atlas account
- Hugging Face account (for ML deployment)

### Installation

```bash
git clone https://github.com/Shubham-1068/spamzero.git
cd spamzero
npm install
```

### Environment Setup

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net
MONGODB_DB=spamzero
HUGGINGFACE_PREDICT_URL=https://your-huggingface-space-url/predict
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Reference

### `POST /api/predict`

Proxies the user's input to the FastAPI ML microservice on Hugging Face and returns the prediction.

**Request body:**

```json
{ "text": "Congratulations! You've won a free iPhone. Click here to claim." }
```

**Response:**

```json
{
  "result": "spam",
  "confidence": 0.97
}
```

---

### `POST /api/history`

Saves a prediction record to MongoDB Atlas.

**Request body:**

```json
{
  "text": "Congratulations! You've won a free iPhone.",
  "result": "spam",
  "confidence": 0.97
}
```

---

### `GET /api/history`

Returns all stored prediction records, sorted from newest to oldest.

**Response:**

```json
[
  {
    "_id": "...",
    "text": "Congratulations! You've won a free iPhone.",
    "result": "spam",
    "confidence": 0.97,
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
]
```

---

## MongoDB Schema

Each prediction document stored in the `history` collection follows this structure:

| Field | Type | Description |
|---|---|---|
| `text` | String | The input message |
| `result` | String | `"spam"` or `"ham"` |
| `confidence` | Number | Model confidence score (0–1) |
| `timestamp` | Date | Time of prediction |
| `feedback` | String | *(Optional)* User feedback for retraining |

---

## Project Structure

```
spamzero/
├── app/
│   ├── page.tsx          # Main UI
│   └── api/
│       ├── predict/      # Proxies to FastAPI ML service
│       └── history/      # MongoDB read/write
├── lib/                  # MongoDB client utility
├── public/               # Static assets
├── .env.local            # Environment variables (not committed)
├── next.config.ts
└── package.json
```

---

## Team Roles

| Role | Responsibilities |
|---|---|
| **Data Engineer** | Data cleaning, feature engineering, TF-IDF, dataset validation |
| **ML Scientist** | Model selection, evaluation (Precision/Recall/F1), `.pkl` export, FastAPI deployment |
| **Full-Stack Developer** | Frontend UI, Next.js API routes, FastAPI integration, MongoDB logging |
| **Database Engineer** | MongoDB schema design, Atlas cluster management, query optimization |
| **DevOps Engineer** | Environment variables, Vercel + Hugging Face deployment, CI/CD pipelines |

---

## Deliverables

- [x] Structured GitHub Repository
- [x] Deployed Next.js Application ([spamzero.vercel.app](https://spamzero.vercel.app))
- [ ] Deployed FastAPI ML Service (Hugging Face Spaces)
- [ ] MongoDB Atlas Integration
- [ ] Model Performance Report
- [ ] Final Presentation (PPT)

---

## Deployment

### Next.js → Vercel

1. Push code to GitHub
2. Import repository on [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel project settings
4. Deploy

### FastAPI ML Service → Hugging Face Spaces

1. Create a new Space on Hugging Face (SDK: Docker or Gradio)
2. Upload your `app.py`, `model.pkl`, `vectorizer.pkl`, and `requirements.txt`
3. Copy the Space's public URL and set it as `HUGGINGFACE_PREDICT_URL` in your `.env.local`

---

## License

This project is open source. See the repository for details.