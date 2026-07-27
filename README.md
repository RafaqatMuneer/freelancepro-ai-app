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
