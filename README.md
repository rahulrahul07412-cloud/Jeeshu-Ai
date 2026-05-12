# ✦ Jeeshu AI — Image Generator

A full-stack AI image generator built with Node.js + Express + Vanilla JS.
Powered by the **Reve AI** image generation API.

---

## 📁 Folder Structure

```
jeeshu-ai/
├── public/
│   ├── index.html     ← Frontend UI (all the buttons, chat layout)
│   ├── style.css      ← All dark theme styles
│   └── app.js         ← Frontend JavaScript (sends requests to backend)
├── uploads/           ← Temporary folder for uploaded images (auto-created)
├── .env               ← Your SECRET API key (NEVER commit this!)
├── .env.example       ← Safe template to share
├── .gitignore         ← Keeps .env and node_modules out of GitHub
├── server.js          ← Express backend (calls Reve AI with your key)
├── package.json       ← Dependencies list
├── vercel.json        ← Tells Vercel how to deploy this app
└── README.md          ← This file
```

---

## 🚀 How to Run Locally (Step by Step)

### Step 1 — Install Node.js
Download and install from: https://nodejs.org (choose LTS version)

### Step 2 — Download / Clone the project
```bash
# Option A: Clone from GitHub
git clone https://github.com/YOUR_USERNAME/jeeshu-ai.git
cd jeeshu-ai

# Option B: If you downloaded a ZIP, extract it and open terminal in that folder
cd jeeshu-ai
```

### Step 3 — Install dependencies
```bash
npm install
```
This reads `package.json` and installs: express, axios, multer, dotenv, cors, form-data

### Step 4 — Add your API key
```bash
# Copy the example file
cp .env.example .env
```
Now open `.env` in any text editor and replace the placeholder:
```
REVE_API_KEY=your_actual_key_here
```
Get your key from: https://app.reve.art/settings/api

### Step 5 — Start the server
```bash
npm start
# OR for auto-restart during development:
npm run dev
```

### Step 6 — Open in browser
Visit: **http://localhost:3000**

You should see the Jeeshu AI UI. Type a prompt and press Send! ✦

---

## 🔐 How the API Key is Kept Hidden

This is the most important security concept in this project:

```
Browser (app.js)                    Server (server.js)              Reve AI
     │                                      │                          │
     │  POST /generate-image                │                          │
     │  { prompt, count, ratio }  ────────► │                          │
     │  (NO API key here!)                  │                          │
     │                                      │  GET images              │
     │                                      │  + REVE_API_KEY ────────►│
     │                                      │                          │
     │                                      │◄──── image URLs ─────────│
     │◄──── { images: [...urls] } ──────────│
```

- The browser **never sees** `REVE_API_KEY`
- The key lives only in `.env` on the server
- `.gitignore` prevents `.env` from being uploaded to GitHub
- On Vercel, the key is set as an Environment Variable in the dashboard

---

## 📤 How to Upload to GitHub

### Step 1 — Create a GitHub account
Sign up at: https://github.com

### Step 2 — Create a new repository
1. Click the **+** button → "New repository"
2. Name it: `jeeshu-ai`
3. Set to Public or Private
4. Do NOT add README (we already have one)
5. Click "Create repository"

### Step 3 — Push your code
Open terminal in your project folder:
```bash
# Initialize git
git init

# Add all files (but .env is excluded by .gitignore ✅)
git add .

# First commit
git commit -m "Initial commit — Jeeshu AI"

# Connect to GitHub (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/jeeshu-ai.git

# Push!
git push -u origin main
```

### Step 4 — Confirm .env is NOT in GitHub
Go to your repo on GitHub and verify that `.env` is NOT listed.
Only `.env.example` should be visible. ✅

---

## ☁️ How to Deploy on Vercel

### Step 1 — Create Vercel account
Sign up at: https://vercel.com (use your GitHub account)

### Step 2 — Import your project
1. Click **"Add New Project"**
2. Click **"Import Git Repository"**
3. Select your `jeeshu-ai` repository
4. Click **Import**

### Step 3 — Add your API key (CRITICAL!)
Before clicking Deploy:
1. Look for **"Environment Variables"** section
2. Add a new variable:
   - **Name:**  `REVE_API_KEY`
   - **Value:** `your_actual_reve_api_key`
3. Click **Add**

### Step 4 — Deploy
Click **"Deploy"** and wait ~1 minute.

Vercel will give you a URL like: `https://jeeshu-ai.vercel.app` 🎉

### Step 5 — Test it
Visit your Vercel URL and test the image generator.

---

## 🔧 Environment Variables

| Variable       | Where to set          | Description                    |
|----------------|-----------------------|--------------------------------|
| `REVE_API_KEY` | `.env` (local)        | Your Reve AI API key           |
| `REVE_API_KEY` | Vercel Dashboard      | Same key, for production       |
| `PORT`         | `.env` (optional)     | Port number (default: 3000)    |

---

## 🌐 Frontend ↔ Backend Connection

The frontend (`app.js`) sends requests to `/generate-image`:

```javascript
// In app.js — frontend sends request to OUR backend (same domain)
const res = await fetch("/generate-image", {
  method: "POST",
  body: formData  // contains prompt, aspectRatio, count, optional image
});
```

This works because:
- **Locally:** Frontend is on `http://localhost:3000`, backend is also on `localhost:3000`
- **On Vercel:** Everything is on the same domain (`jeeshu-ai.vercel.app`)

The backend then calls Reve AI:
```javascript
// In server.js — backend calls Reve AI with the SECRET key
const response = await axios.post(
  "https://api.reve.art/v1/images/generations",
  payload,
  { headers: { "Authorization": `Bearer ${process.env.REVE_API_KEY}` } }
);
```

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "API key not configured" | Open `.env`, make sure `REVE_API_KEY` has your real key |
| "Could not reach server" | Make sure you ran `npm start` in terminal |
| Images not generating | Check terminal for error messages |
| Vercel deploy fails | Check if `REVE_API_KEY` is set in Vercel Environment Variables |
| Port already in use | Change `PORT=3001` in `.env` |

---

## 📦 Installing New Packages

If you ever need to add a package:
```bash
npm install package-name
```
This updates `package.json` automatically. Commit the updated `package.json` but never `node_modules/`.

---

## 🎨 Customizing the UI

- **Colors:** Edit `:root` variables at the top of `style.css`
- **Fonts:** Change the Google Fonts link in `index.html`
- **App name:** Search and replace "Jeeshu AI" in HTML files
- **Loading text:** Find "Creating cinematic magic…" in `app.js`
