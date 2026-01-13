# 🌍 ReliefNett – Crowdsourced Disaster Relief & Donation Platform

ReliefNett is a web-based platform designed to **crowdsource real-time disaster reporting** and provide **transparent, verified donation channels**.  
It aims to reduce misinformation during emergencies and build trust in disaster relief contributions.

---

## 📌 Problem Statement

During disasters such as floods, fires, road accidents, or urban waterlogging:

- Information spreads slowly or inaccurately
- Authorities and nearby citizens are unaware in real time
- People hesitate to donate due to lack of transparency
- Fake donation links and scams reduce trust

There is a strong need for a **centralized, trustworthy platform** where disasters can be reported and verified quickly.

---

## 💡 Solution Overview

ReliefNett solves this problem by:

- Allowing users to **report disasters** with location, description, and media
- Enabling **admin verification** to filter false reports
- Showing only **verified donation channels**
- Providing **donation tracking** to build trust and transparency
- Offering a clean, user-friendly dashboard for users and admins

---

## 🔄 Workflow

1. A user reports a disaster with location, description, and image/video
2. The report is stored and marked as *Pending*
3. Admin reviews and verifies or rejects the report
4. Verified disasters are visible to all users
5. Users can donate through trusted channels
6. Donation status and updates are tracked transparently

---

## 🧩 Key Features

### 👤 User Features
- Disaster reporting with media upload
- View verified disaster reports
- Access verified donation links
- Track donation transparency
- User authentication

### 🛡 Admin Features
- Review reported disasters
- Verify or reject reports
- View full disaster details
- Delete invalid or duplicate reports
- Maintain trust and data quality

---

## 📸 Screenshots

### Home Page
![Home Page](screenshots/home1.png)
![Home Page – Alternate View](screenshots/home2.png)

### Disaster Reporting
![Report Disaster](screenshots/report1.png)
![Report Disaster – Form View](screenshots/report2.png)

### Live Map View
![Live Map](screenshots/live_map.png)

### Admin Dashboard
![Admin Dashboard](screenshots/admin_dashboard.png)
![Admin Dashboard – Verification](screenshots/admin_dashboard2.png)
![Admin Dashboard – Actions](screenshots/admin_dashboard3.png)

### Donations & Transparency
![Donations Page](screenshots/donations.png)
![Track Donation Status](screenshots/track_donation.png)

### Safety & Alerts
![Safety Check](screenshots/safetycheck.png)

### Email Alerts
![Email Alert](screenshots/email_1.png)
![Email Alert](screenshots/email_2.png)

### Multilingual Support
![Multiple Languages](screenshots/multiple_languages.png)

---

## 🛠 Technology Stack

### Frontend
- React (Vite)
- HTML, CSS, JavaScript
- Responsive UI design

### Backend / Services
- Firebase Authentication
- Firebase Firestore
- Firebase Storage
- Google Cloud services

---

## 🗂 Project Structure
ReliefNett/
│
├── components/ # Reusable UI components
├── pages/ # Application pages
├── services/ # Firebase and API services
├── public/ # Static assets
├── App.tsx
├── index.tsx
├── index.html
├── package.json
└── README.md

---

## ▶️ Running the Project Locally

### Prerequisites
- Node.js (v16+ recommended)
- Firebase project setup

### Steps
```bash
npm install
npm run dev
