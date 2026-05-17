# 📖 Study App: Minimalist Noir & Stone

A high-end, maintenance-free knowledge base designed for focused learning. This MERN stack application features an editorial-style aesthetic and a database-centric storage architecture.

## ✨ Key Features

- 🌑 **Premium UI/UX**: Sophisticated "Noir & Stone" theme using a neutral palette (Rich Black, Cream White, and Stone Beige). Includes glassmorphism and modern typography.
- 💾 **BSON Binary Storage**: Direct MongoDB storage for all file uploads (PDFs, Images). No local filesystem dependencies!
- 🔗 **Deep-Link Persistent Navigation**: URL-based routing ensures you stay on the same subject or topic even after a page refresh.
- 🔎 **Global Power Search**: Instant search across all subjects, chapters, and topics.
- 🔳 **Segmented Selectors**: Sleek, horizontal creation form for rapid material management.
- 🛡️ **Secure Media Streaming**: Authenticated file streaming with token based URL validation.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), React Query, Axios, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB, JWT, Multer (Memory Storage).

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB Database (Atlas or local)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file with:
# PORT=5000
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📸 Aesthetic

The project uses a sophisticated design system:
- **Background**: `#fdfbf7` (Cream White)
- **Primary Accent**: `#6d6a5e` (Stone Beige)
- **Text**: Rich Black

---
*Organize your knowledge with clarity.*
