# ExaGoal Complete Production Deployment Guide

This guide walks you through deploying your entire website to production for **100% free** using standard cloud platforms:
1. **Vector Database**: **Supabase** (PostgreSQL with native `pgvector` extension)
2. **Backend**: **Render** or **Railway** (FastAPI with `sentence-transformers` & `pgvector`)
3. **Frontend**: **Vercel** (Next.js 16 with Tailwind CSS & Math KaTeX)

---

## Architecture Overview

```mermaid
graph TD
    User["Student / Teacher Browser"] -->|Visits| Vercel["Next.js Frontend (Vercel)"]
    Vercel -->|REST API Calls| Render["FastAPI Backend (Render / Railway)"]
    Render -->|Embeddings & Retrieval| PgVector["PostgreSQL + pgvector (Supabase)"]
    Render -->|Single-pass Exam Gen| OpenRouter["OpenRouter LLM (DeepSeek / Nemotron)"]
```

---

## Step 1: Set up PostgreSQL with pgvector (Supabase - 100% Free)

Supabase gives you a free hosted PostgreSQL database that includes `pgvector` out of the box.

1. **Sign Up**: Go to [https://supabase.com](https://supabase.com) and click **Start your project** (Sign in with GitHub).
2. **Create New Project**:
   - Organization: Select your account.
   - Name: `exagoal-db`
   - Database Password: Create a strong password (save this!).
   - Region: Choose closest to you (e.g. `South Asia (Mumbai)` or `Southeast Asia (Singapore)`).
   - Pricing Plan: **Free Plan** ($0/month).
   - Click **Create new project**.
3. **Enable `vector` extension**:
   - In the left sidebar of your Supabase dashboard, click **SQL Editor**.
   - Click **New query**, paste the following, and click **Run**:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```
   - It will show `Success. No rows returned`.
4. **Copy Database Connection URL**:
   - In Supabase, go to **Project Settings** (gear icon) -> **Database**.
   - Under **Connection string**, select **URI** and choose **Session pooler** (or direct connection).
   - The URI looks like:
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with the password you created in step 2.
   - **Save this URI!** This is your `PGVECTOR_URL`.

---

## Step 2: Deploy Backend (FastAPI on Render.com - Free Tier)

Render provides free hosting for Python web services with HTTPS and automatic deployments.

1. **Push your code to GitHub**:
   Make sure your `EXAGOAL` project is committed and pushed to a GitHub repository.
2. **Sign Up on Render**: Go to [https://render.com](https://render.com) and sign in with GitHub.
3. **Create Web Service**:
   - Click **New +** -> **Web Service**.
   - Select your GitHub repository (`EXAGOAL`).
   - Configure the following settings:
     - **Name**: `exagoal-backend`
     - **Region**: Same as database (e.g. `Singapore` or `Frankfurt`).
     - **Root Directory**: `backend`
     - **Runtime**: `Python 3`
     - **Build Command**:
       ```bash
       pip install --upgrade pip && pip install -r requirements.txt
       ```
     - **Start Command**:
       ```bash
       uvicorn app:app --host 0.0.0.0 --port $PORT
       ```
     - **Instance Type**: `Free`
4. **Configure Environment Variables**:
   Click **Advanced** -> **Add Environment Variable**:
   - `OPENROUTER_API_KEY`: Your OpenRouter API Key (e.g. `sk-or-v1-...`)
   - `OPENROUTER_MODEL`: `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` (or `deepseek/deepseek-chat`)
   - `PGVECTOR_URL`: Your Supabase connection string from Step 1 (`postgresql://postgres...`)
   - `PYTHON_VERSION`: `3.11.9`
5. **Click Create Web Service**:
   - Render will build dependencies and start FastAPI.
   - Once live, you will get a URL like:
     `https://exagoal-backend.onrender.com`
   - Test it by visiting `https://exagoal-backend.onrender.com/api/vector/status`. You should see:
     ```json
     {
       "active": true,
       "backend": "pgvector (PostgreSQL)",
       "is_pgvector_active": true,
       "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
       "dimension": 384
     }
     ```

---

## Step 3: Deploy Frontend (Next.js on Vercel - Free Tier)

Vercel is the creator of Next.js and deploys it automatically with global CDN edge performance.

1. **Sign Up on Vercel**: Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. **Import Project**:
   - Click **Add New...** -> **Project**.
   - Select your GitHub repository (`EXAGOAL`).
3. **Configure Project Settings**:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and select `frontend`.
   - **Build Command**: `npm run build` (automatic)
   - **Output Directory**: `.next` (automatic)
4. **Add Environment Variable**:
   - Variable Name: `NEXT_PUBLIC_API_URL`
   - Value: Your Render backend URL (e.g. `https://exagoal-backend.onrender.com` - without trailing slash)
5. **Click Deploy**:
   - Vercel will build and deploy your Next.js application in ~1-2 minutes.
   - You will receive a live URL like:
     `https://exagoal.vercel.app`

---

## Step 4: Alternative Backend Deployment (Railway.app)

If you prefer **Railway** instead of Render:

1. Go to [https://railway.app](https://railway.app) and sign in.
2. Click **New Project** -> **Deploy from GitHub repo** -> Select `EXAGOAL`.
3. In Settings:
   - Root Directory: `/backend`
   - Start Command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. In Variables:
   - Add `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `PGVECTOR_URL`.
5. Under Networking -> Click **Generate Domain** to get your public backend URL.
6. Set this URL in Vercel as `NEXT_PUBLIC_API_URL`.

---

## Step 5: Production Verification Checklist

1. **Open Documents Hub**:
   - Navigate to `https://<your-app>.vercel.app/institute/dashboard/documents`.
   - Verify the database badge shows: 🟢 **pgvector (PostgreSQL)**.
2. **Upload Syllabus**:
   - Drag and drop a syllabus or exam paper (PDF or Word DOCX).
   - Select the target subject (e.g. *Physics* or *Mathematics*).
   - Confirm upload progress bar finishes with *Indexed into pgvector*.
   - Click **Chunks** to inspect the extracted semantic passages.
3. **Generate Exam with Subject Grounding**:
   - Navigate to `https://<your-app>.vercel.app/institute/dashboard/exam`.
   - In Step 1, select the subject you just uploaded.
   - Confirm the green status box appears: `🟢 pgvector Grounding Active (X Vector Chunks)`.
   - Proceed to Step 2 and click **Generate Examination**.
   - Inspect generated LaTeX questions, mark distribution, and Matplotlib diagram previews!
4. **Multi-Tenant Isolation**:
   - If Institute B uploads chemistry notes with `institute_id = "institute_b"`, Institute A (`institute_id = "default-institute"`) will never see or retrieve Institute B's data because of strict SQL column partitioning:
     ```sql
     WHERE institute_id = %s AND subject = %s
     ```

Your complete ExaGoal application is now live on the internet!
