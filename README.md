# spend. — Deploy to Your iPhone

A minimal daily spend tracker. Free to host, works offline, lives on your home screen.

---

## What You Need

- A **GitHub** account (free) → github.com
- A **Vercel** account (free) → vercel.com (sign up with GitHub)
- Your **iPhone 15 Pro** with Safari

---

## Step-by-Step Setup (≈10 minutes)

### 1. Create a GitHub Repository

1. Go to **github.com** and sign in (or create an account)
2. Click the **+** button (top right) → **New repository**
3. Name it `spend` (or whatever you like)
4. Set it to **Public** or **Private** (either works)
5. Click **Create repository**

### 2. Upload the Project Files

On the repo page, click **"uploading an existing file"** link, then drag the entire contents of the `spend-pwa` folder into the upload area:

```
Files to upload:
├── package.json
├── vite.config.js
├── index.html
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── src/
    ├── main.jsx
    └── App.jsx
```

Click **Commit changes**.

> **Tip**: You can also use GitHub's web editor — click "Add file" → "Create new file" and paste each file's contents individually. For the PNG icons, use "Add file" → "Upload files".

### 3. Deploy on Vercel

1. Go to **vercel.com** and sign in with GitHub
2. Click **"Add New..."** → **Project**
3. Find and select your `spend` repository
4. Vercel auto-detects it's a Vite project — **no config needed**
5. Click **Deploy**
6. Wait ~60 seconds. You'll get a URL like `spend-abc123.vercel.app`

### 4. Add to Your iPhone Home Screen

1. Open **Safari** on your iPhone
2. Go to your Vercel URL (e.g., `spend-abc123.vercel.app`)
3. Tap the **Share** button (square with arrow, bottom center)
4. Scroll down and tap **"Add to Home Screen"**
5. It will say "spend." — tap **Add**

**That's it!** You now have a native-feeling app on your home screen.

---

## How It Works

- All data is stored **locally on your phone** (in the browser's localStorage)
- Works **offline** after the first load (thanks to the service worker)
- No account needed, no server, no tracking
- Your data stays on your device

---

## Custom Domain (Optional, Free)

If you want a clean URL like `spend.yourdomain.com`, you can add a custom domain in Vercel's project settings. But the default `.vercel.app` URL works perfectly.

---

## Updating the App

If you ever want to change something:
1. Edit the files on GitHub
2. Vercel automatically redeploys within seconds
3. The PWA updates on your phone next time you open it

---

## Troubleshooting

**"Add to Home Screen" not showing?**
→ Make sure you're using **Safari** (not Chrome or another browser). Only Safari supports PWA install on iOS.

**App doesn't open in full screen?**
→ Make sure you opened it from the **home screen icon**, not from Safari.

**Data disappeared?**
→ Data is stored per-domain. If your Vercel URL changes, you'll start fresh. This won't happen with normal use.
