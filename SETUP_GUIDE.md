# 🎯 B HAN — Setup Guide

## 📦 এই folder এ যা যা আছে:

```
bhan-app/
├── firebase-config.js   ⭐ Firebase connection (FIXED API key)
├── data.js              📊 Products + Store API
├── app.js               🛍️ Customer app
├── admin.js             🔐 Admin panel logic
├── index.html           🏠 Customer page
├── control-bhan-2025.html 🔒 Admin page (secret URL)
├── manifest.json        📱 PWA config
├── sw.js                ⚡ Service Worker (network-first)
├── robots.txt           🤖 SEO blocker
└── icons/               🎨 App icons
    ├── icon-192.png
    └── icon-512.png
```

---

## 🚀 GitHub Upload Steps (ফোন থেকে):

### 1️⃣ Old Repo Clean Korun

পুরানো `imran007-bit/bhan-app` repo এ যান এবং Settings → Danger Zone → **"Delete this repository"** delete করুন।

**অথবা** (সহজ method):

আপনি **নতুন একটা repo** create করতে পারেন:
1. GitHub এ + button → New repository
2. Name: `bhan-app-new`
3. Public select
4. Create repository

### 2️⃣ Files Upload Korun

1. **"uploading an existing file"** link এ tap করুন
2. **bhan-app folder** এর সব file upload করুন:
   - firebase-config.js
   - data.js
   - app.js
   - admin.js
   - index.html
   - control-bhan-2025.html
   - manifest.json
   - sw.js
   - robots.txt
3. **icons folder** আলাদা upload (আগে Add file → Create new file → name = `icons/icon-192.png` এভাবে যাবে না, তাই zip extract করে drag করতে হবে)

### 3️⃣ Vercel তে Connect Korun

1. `vercel.com` যান
2. **"New Project"** click
3. GitHub repo select: `bhan-app-new`
4. **Deploy** click

৩-৪ মিনিট পর আপনার live URL পাবেন!

---

## ⚙️ Firebase Settings (একবার করতে হবে):

আপনি **আগেই করেছেন**, কিন্তু verify করুন:

### ✅ 1. Firestore Database

- Console → Build → Firestore Database
- Database created: ✅
- Rules: test mode ✅

### ✅ 2. Authentication

- Console → Build → Authentication
- Email/Password: **Enabled** ✅

### ✅ 3. Authorized Domains (Important!)

- Console → Authentication → Settings tab
- Authorized domains list এ আপনার Vercel URL add করুন:
  - `bhan-app.vercel.app`
  - বা যে URL Vercel দিয়েছে

---

## 🎯 Test Korar Way:

### Customer Site:
- URL: আপনার Vercel URL
- Sign Up → Email + Password
- Skin Quiz নিন
- Product order করুন

### Admin Panel:
- URL: `[your-vercel-url]/control-bhan-2025.html`
- Password: `bhan2025admin`

---

## 🔥 যদি Error হয়:

### Error: `auth/api-key-not-valid`
✅ Solution: firebase-config.js এ API key check করুন
```
apiKey: "AIzaSyAoq6DJOtwHKdIpR2pRN8EJ43Wa7lFkj7Q"
                                     ↑
                                   ছোট হাতের l
```

### Error: `auth/unauthorized-domain`
✅ Solution: Firebase Console → Authentication → Settings → Authorized Domains → Vercel URL add করুন

### Error: কিছু কাজ করছে না
✅ Solution:
- Browser এ Cmd+Shift+R (hard refresh)
- বা Incognito mode try করুন

---

## 💯 Important:

- **firebase-config.js** এ API key এ `Wa7l` (lowercase l) আছে ✅
- নতুন project এ আপনার Vercel URL **Firebase এ Authorized Domains** এ add করতে হবে

Good luck ভাই! 🚀🇰🇷
