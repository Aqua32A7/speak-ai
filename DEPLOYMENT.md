# Deployment Guide: SpeakPrep AI 🚀

This guide provides end-to-end instructions for deploying **SpeakPrep AI**:
1. **Codebase on GitHub**
2. **Backend on Render**
3. **Frontend on Vercel**

---

## 1. Push to GitHub

The local Git repository has already been initialized on the `main` branch with all secrets and build artifacts safely excluded via `.gitignore`.

1. Go to [github.com/new](https://github.com/new) and create a new repository (e.g. `speakprep-ai`). **Do not initialize with a README, .gitignore, or license** (those are already set up).
2. Link your local repository and push:
   ```bash
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/speakprep-ai.git
   git push -u origin main
   ```

---

## 2. Deploy Backend on Render

The repository includes a ready-to-use [`render.yaml`](../render.yaml) configuration.

### Option A: Automatic Blueprint Deployment (Recommended)
1. Go to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** ➔ **Blueprint**.
3. Connect your GitHub repository `speakprep-ai`.
4. Render will read `render.yaml` automatically.
5. In the environment variables prompt, enter your secret:
   - `GEMINI_API_KEY`: Paste your Google Gemini API key.
6. Click **Apply**.
7. Once deployed, copy your backend URL (e.g. `https://speakprep-backend.onrender.com`).

### Option B: Manual Web Service Setup
1. On Render, click **New +** ➔ **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `speakprep-backend`
   - **Region**: Oregon or closest to your users
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `GEMINI_API_KEY`: `your_gemini_api_key_here`
   - `GEMINI_MODEL`: `gemini-3-flash-preview`
   - `CORS_ORIGINS`: `http://localhost:5173,https://*.vercel.app`
5. Click **Create Web Service**.
6. Note the public URL (e.g., `https://speakprep-backend.onrender.com`). Verify it by opening `https://speakprep-backend.onrender.com/api/health`.

---

## 3. Deploy Frontend on Vercel

The frontend includes a [`vercel.json`](../frontend/vercel.json) rewrite rule for single-page routing.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** ➔ **Project**.
3. Import your `speakprep-ai` repository from GitHub.
4. Configure the Project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and set to `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://speakprep-backend.onrender.com` (your Render service URL from Step 2, without a trailing slash)
6. Click **Deploy**.
7. Vercel will build and launch your live application at `https://<your-project>.vercel.app`.

---

## 4. Verification After Deployment

1. Open your live Vercel URL in **Google Chrome** or **Microsoft Edge**.
2. Click **"Start 1-Minute Practice"**.
3. Select parameters and click **"Generate Topic & Begin Drill"**.
4. Confirm that Gemini generates a live topic from the Render backend.
5. Allow microphone permissions, complete a 60-second speaking drill, and review your live AI coaching feedback!
