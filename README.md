# Daybook — AI-Powered Journal & Cognitive Memory Engine

Daybook is a secure, user-authenticated journaling, cognitive reflection, and automated reminder web application built on **Google Cloud Run**, **Firebase Authentication**, **Cloud Firestore**, and the **Gemini 3.6 Flash API**.

---

## 🌟 Core Features & AI Engine

1. **User Identity & Isolated Vault (Firebase Auth + Firestore)**: Federated Google Identity and owner-bound document paths (`/users/{userId}/entries/{entryId}`) enforcing zero cross-user access.
2. **AI Reminder & Motivation Engine**: Upon login, the engine automatically reviews previous journal entries:
   - **Pending Commitments / Deadlines Detected**: Displays an interactive reminder digest highlighting tasks, urgency badges, target dates, and one-click reflection sparks.
   - **All Commitments Clear**: Generates a personalized motivational message, philosophical quote, focus area anchor, and daily journaling spark.
3. **Multi-Turn Cognitive Reflection**: Converse with Gemini across 5 tailored reflection modes (*Deep Reflection*, *Summary & Synthesis*, *Brainstorm Ideas*, *Action Plan*, *Deep Questions*).
4. **Resilient Fallback Ladder**: Automated fallback protocol across `@google/genai` models:
   - Primary: `gemini-3.6-flash`
   - High-Availability Fallback: `gemini-3.1-flash-lite`
   - Dynamic Alias: `gemini-flash-latest`
   - Deep Reasoning Fallback: `gemini-3.7-flash`
5. **Zero-Secret Browser Exposure**: API keys are strictly maintained server-side and injected dynamically via Google Cloud Secret Manager.

---

## 🏗️ Architecture & Security Zones

| Zone | Threat Surface | Implemented Countermeasure |
| :--- | :--- | :--- |
| **Zone 1: Input Surfaces** | Malformed payloads & prompt injection | Defensive null-safe destructuring, schema validations in `server.ts`. |
| **Zone 2: Planning & Reasoning** | System persona bypass / instructions leak | Clear separation of user journal data from system instructions. |
| **Zone 3: Tool Execution & APIs** | API key leakage & rate limiting | Server-only key handling with multi-model fallback ladder. |
| **Zone 4: Memory & State** | Cross-user data theft in Firestore | Owner-bound rules (`request.auth.uid == userId`) deployed to Firestore. |
| **Zone 5: Inter-System Communication**| Credential exfiltration | Dynamic Google Cloud Secret Manager access; zero hardcoded secrets. |

---

## 📋 Prerequisites & GCP Setup

### 1. Enable Required Google Cloud APIs
```bash
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

### 2. Configure Secret Manager for Gemini API Key
Create the secret and grant the Cloud Run runtime service account access:
```bash
# Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run default compute service account read permissions
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🔒 Cloud Firestore Security Rules

Deploy the owner-bound security rules to ensure complete user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/entries/{entryId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /{allUserPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

---

## 🚀 Cloud Run Deployment

### 1. Deploy the Application to Cloud Run
```bash
gcloud run deploy reflection-studio \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

### 2. Apply Mandatory Verification Label
Register the service for automated campaign challenge verification:
```bash
gcloud run services update reflection-studio \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 🧪 Local Development

```bash
# Install dependencies
npm install

# Start full-stack development server (Express + Vite)
npm run dev

# Compile production bundle
npm run build

# Start production server
npm start
```
