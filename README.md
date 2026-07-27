# 🚀 FreelancePro AI — AI-Powered Freelance Proposal & Client Assistant

![FreelancePro AI Banner](screenshots/banner.png)

## 🌐 Live Application

🔗 **Live Demo:** https://freelancepro-ai-app.onrender.com/

---

# 📌 Overview

FreelancePro AI is an AI-powered freelance assistant designed to help freelancers analyze client job requirements, generate personalized proposals, and manage client relationships from a single platform.

The application combines Generative AI, Firebase authentication, Firestore database, and modern web technologies to simplify the freelance proposal workflow.

---

# 🎯 Problem Statement

Many freelancers struggle with:

- Understanding complex client job descriptions
- Identifying required skills and project expectations
- Writing personalized proposals for every opportunity
- Maintaining organized records of clients and proposals
- Tracking previous applications and proposal history

Freelancers often spend significant time manually analyzing jobs and preparing proposals, reducing the time available for finding and completing projects.

FreelancePro AI solves this problem by providing an intelligent assistant that analyzes job requirements and helps freelancers create professional, customized proposals efficiently.

---

# 👥 Target Users

This application is designed for:

- Freelancers looking for projects on platforms like Upwork and Fiverr
- Beginners learning professional proposal writing
- Independent consultants managing multiple clients
- Freelance agencies managing client communications

---

# ✨ Features

## 🔐 User Authentication

- Google Sign-In authentication
- Email and password authentication
- Secure Firebase Authentication
- Individual user accounts with isolated data

---

## 👤 Freelancer Profile Management

Users can:

- Create and manage freelancer profiles
- Add professional skills
- Store experience information
- Maintain personalized profile data

The AI uses this profile information when generating proposals.

---

## 🤖 AI Job Analysis

The application analyzes client job descriptions using Gemini AI.

It extracts:

- Job summary
- Key requirements
- Required technical skills
- Client expectations
- Responsibilities
- Potential skill gaps
- Suggested clarification questions
- Recommended proposal approach

This helps freelancers understand the project before applying.

---

## ✍️ AI Proposal Generation

FreelancePro AI generates customized proposals based on:

- Client job description
- AI job analysis
- Freelancer profile
- Verified skills

Generated proposals include:

- Personalized introduction
- Understanding of client requirements
- Technical approach
- Relevant skills alignment
- Clarifying questions
- Professional closing message

Users can:

- Generate proposals
- Regenerate proposals
- Edit proposals
- Save proposals
- Delete proposals

---

## 📄 Proposal Management

Users can:

- Save generated proposals
- View proposal history
- Edit previous proposals
- Track proposal status
- Delete proposals

Each user's proposals are private and protected through Firestore security rules.

---

## 👥 Client Management

Users can:

- Add clients
- Edit client information
- Delete clients
- Maintain client records

---

## 🔗 Client–Proposal Integration

Users can:

- Link proposals with clients
- View client-related proposals
- Organize freelance opportunities better

---

## 📊 Dashboard

The dashboard provides:

- Proposal statistics
- Client overview
- Recent activity
- Quick access to major features

---

# 🧠 AI Feature Details

## AI Model Used

**Google Gemini Flash Model**

The application uses Google's Gemini API through a secure server-side integration.

The API key is stored securely using environment variables and is never exposed to the frontend.

---

# AI System Instructions / Prompt

The AI assistant follows these instructions:
You are an expert freelance proposal assistant.

Your task is to analyze client job descriptions and help freelancers create professional, personalized proposals.

You must:

Understand the client's business requirements.
Extract technical and non-technical requirements.
Identify required skills.
Compare requirements with freelancer profile skills.
Highlight skill matches and gaps honestly.
Suggest useful clarification questions.
Generate a professional proposal focused on solving the client's problem.

Do not invent experience or claim skills that are not provided by the freelancer.

The proposal should:

Address the client directly.
Demonstrate understanding of the project.
Explain the proposed technical approach.
Highlight relevant skills.
Maintain a professional freelance tone.


---

# 🛠️ Technologies & Tools Used

## Frontend

- React
- TypeScript
- Tailwind CSS
- Vite
- Lucide React

---

## Backend

- Node.js
- Express.js
- TypeScript
- ESBuild

---

## Database & Authentication

### Firebase

Used for:

- User authentication
- Firestore database
- User-specific data storage
- Security rules

---

## Artificial Intelligence

### Google Gemini API

Used for:

- Job description analysis
- Proposal generation
- AI-powered freelance assistance

---

## Development Tools

### Google AI Studio

Used for:

- AI-assisted application development
- Vibe coding workflow
- Gemini integration

### Google Stitch

Used for:

- UI/UX design and application interface planning

### GitHub

Used for:

- Source code management
- Version control
- Public project repository

### Render

Used for:

- Live application deployment
- Hosting backend and frontend application

---

# 🔒 Security Implementation

The application follows secure development practices:

- API keys are stored using environment variables
- Gemini API calls are handled server-side
- Firebase authentication protects user accounts
- Firestore security rules isolate user data

Users can only access:

- Their own profile
- Their own proposals
- Their own clients

---

# 📸 Application Screenshots

## 1. Authentication

![Login](screenshots/login.png)

User authentication through Google and Email/Password.

---

## 2. Dashboard

![Dashboard](screenshots/dashboard.png)

Main dashboard showing user activity and application overview.

---

## 3. AI Job Analysis

![Job Analysis](screenshots/job-analysis.png)

AI analyzes client requirements and extracts important project details.

---

## 4. AI Proposal Generation

![Proposal Generation](screenshots/proposal-generation.png)

Gemini generates a personalized freelance proposal.

---

## 5. Client Management

![Client Management](screenshots/client-management.png)

Users can manage clients and connect proposals.

---

# 🚀 How To Run The Project Locally

## Prerequisites

Install:

- Node.js
- npm or Bun
- Git

---

## Clone Repository

```bash
git clone https://github.com/RafaqatMuneer/freelancepro-ai-app.git
```
```bash
cd freelancepro-ai-app
```
---

## Install Dependencies

Using npm:

```bash
npm install
```

Or using Bun:

```bash
bun install
```

---

## Configure Environment Variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key
```

> **Important:** Never commit your `.env` file or actual API key to GitHub. Use environment variables for production deployment.

---

## Run Development Server

Using npm:

```bash
npm run dev
```

Or using Bun:

```bash
bun run dev
```

---

## Build Production Version

Using npm:

```bash
npm run build
```

Or using Bun:

```bash
bun run build
```

---

## Start Production Server

Using npm:

```bash
npm run start
```

Or using Bun:

```bash
bun run start
```

---

## 📂 Project Structure

```text
freelancepro-ai-app
│
├── src
│   ├── components
│   ├── pages
│   ├── services
│   └── lib
│
├── server.ts
├── package.json
├── vite.config.ts
├── README.md
└── screenshots
```

---

## 🔮 Future Improvements

Possible future enhancements include:

* n8n automation workflow integration
* Automatic job collection from freelance platforms
* Proposal performance tracking
* AI-based proposal scoring
* Email notifications
* Freelancer analytics dashboard

---

## 👨‍💻 Developer

**Rafaqat Muneer**

AI Application Development Project

---

## ⭐ Project Summary

FreelancePro AI demonstrates how Generative AI can be integrated into a real-world application to solve a practical problem faced by freelancers.

The application provides an end-to-end workflow:

```text
User Authentication
        ↓
Freelancer Profile
        ↓
Client Job Analysis
        ↓
AI Proposal Generation
        ↓
Proposal Management
        ↓
Client Management
        ↓
Dashboard Insights
```

The project combines AI, cloud services, databases, authentication, and modern web development into a complete, functional, and publicly deployed application.




