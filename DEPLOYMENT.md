# Deployment Guide for VaiK on Render.com

## Prerequisites
- GitHub account
- Render.com account (free tier works)

---

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vaik.git
git push -u origin main
```

---

## Step 2: Deploy Backend

1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: vaik-backend
   - **Region**: Oregon (or closest to you)
   - **Branch**: main
   - **Build Command**: `cd backend-ts && npm install && npm run build`
   - **Start Command**: `cd backend-ts && npm start`
   - **Environment**: Node

5. Add Environment Variables:
   - `PORT`: `8000`
   - `GROQ_API_KEY`: Your Groq API key

6. Click "Create Web Service"

---

## Step 3: Deploy Frontend

1. Go to [Render.com](https://render.com)
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: vaik-frontend
   - **Region**: Oregon
   - **Branch**: main
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`

5. Add Environment Variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://vaik-backend.onrender.com` (your backend URL)

6. Click "Create Static Site"

---

## Step 4: Update Backend CORS

After deploying, you need to update the backend to allow your frontend domain:

1. In backend-ts/src/main.ts, update the CORS configuration:
```javascript
app.use(cors({
  origin: 'https://vaik-frontend.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

2. Rebuild and redeploy the backend

---

## Alternative: Deploy with Docker

You can also deploy using Docker:

```bash
docker-compose up --build
```

This will run both frontend and backend locally.

---

## Notes
- Free tier on Render: 750 hours per month
- Backend may take 30-60 seconds to start (free tier spins down after 15 min)
- For production, consider upgrading to paid plan for always-on
