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
<img width="1908" height="897" alt="home1" src="https://github.com/user-attachments/assets/a654df74-a9af-4db9-bb8c-759669763b12" />
<img width="1897" height="907" alt="home2" src="https://github.com/user-attachments/assets/ab547e87-f3d1-43bb-9132-1a01d96cf621" />


### Disaster Reporting
<img width="1898" height="912" alt="report1" src="https://github.com/user-attachments/assets/0cffbd76-f66d-491c-b154-31bacdc9c59c" />
<img width="1900" height="908" alt="report2" src="https://github.com/user-attachments/assets/91cfbacf-3b2c-44d3-be9d-729fe2b8fbd7" />


### Live Map View
<img width="1897" height="898" alt="live_map" src="https://github.com/user-attachments/assets/fe07c27c-f98d-4e14-a844-223a50741ff5" />


### Admin Dashboard
<img width="1897" height="908" alt="admin_dashboard" src="https://github.com/user-attachments/assets/e0378ccf-08eb-426e-980a-abc0c7d3436a" />
<img width="1897" height="905" a<img width="1882" height="893" alt="admin_dashboard3" src="https://github.com/user-attachments/assets/14067fa5-7c80-4e9b-909e-4d2700e64768" />
<img width="1882" height="893" alt="admin_dashboard3" src="https://github.com/user-attachments/assets/3ded0119-6dfd-4c88-8276-c9b2ef957f09" />



### Donations & Transparency
<img width="1901" height="900" alt="donations" src="https://github.com/user-attachments/assets/2289d939-f73f-4499-a517-e5d3fdec6dae" />

Track Donation Status<img width="1896" height="913" alt="track_donation" src="https://github.com/user-attachments/assets/6f9e3cdd-934b-45c5-95b9-354cd29fc440" />


### Safety & Alerts
Safety Check
<img width="1901" height="906" alt="safetycheck" src="https://github.com/user-attachments/assets/17a3842d-4e1e-48dd-bbbd-7d1fc28bb36a" />

### Email Alerts
<img width="1058" height="642" alt="email_1" src="https://github.com/user-attachments/assets/6c46e451-42fb-468e-91ce-c3971b9d0762" />
<img width="1067" height="543" alt="email_2" src="https://github.com/user-attachments/assets/4a2dd0a7-6490-4e73-9004-e42ed43af9d3" />

### Multilingual Support
<img width="1897" height="903" alt="multiple_languages" src="https://github.com/user-attachments/assets/69ac82eb-4c8a-4c00-99aa-40ce20d606b1" />


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
