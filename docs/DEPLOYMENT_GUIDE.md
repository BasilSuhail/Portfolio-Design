# 🚀 Deployment Guide - Security Updates

All security features are implemented! Here's what you need to do to deploy.

---

## ✅ What Was Done

I've updated all your frontend code to use the new secure `secureFetch()` function for CSRF protection.

**Files updated:**
- ✅ [client/src/components/BlogManager.tsx](client/src/components/BlogManager.tsx) - Blog create/update/delete/upload
- ✅ [client/src/components/ContactSection.tsx](client/src/components/ContactSection.tsx) - Contact form
- ✅ [client/src/pages/Admin.tsx](client/src/pages/Admin.tsx) - Content updates
- ✅ [client/src/pages/AdminLogin.tsx](client/src/pages/AdminLogin.tsx) - Admin login

All POST/PUT/DELETE requests now include CSRF tokens automatically!

---

## 📋 Deployment Checklist

### Step 1: Add Environment Variables to Dokploy

1. **Login to your Dokploy dashboard**
2. **Go to your portfolio project**
3. **Find Environment Variables section**
4. **Add these variables from your local `.env` file:**

```bash
SESSION_SECRET=<copy-from-your-.env-file>
RESEND_API_KEY=<copy-from-your-.env-file>
ADMIN_PASSWORD=<copy-from-your-.env-file>
```

**Important:** Copy the actual values from your local `.env` file - do NOT use placeholders!

### Step 2: Commit and Push Your Changes

```bash
git add .
git commit -m "Add security: CSRF protection, rate limiting, input sanitization"
git push origin main
```

### Step 3: Redeploy on Dokploy

Your Dokploy should auto-deploy when you push. If not:
1. Go to Dokploy dashboard
2. Click "Redeploy" or "Deploy"
3. Wait for build to complete

### Step 4: Test Everything Works

After deployment, test these:

1. **Contact Form** - Fill and submit
2. **Admin Login** - Login with your password
3. **Blog CMS** - Create/edit/delete a blog
4. **Image Upload** - Upload an image in blog editor

If everything works, you're done! 🎉

---

## 🔐 Environment Variables Explained

| Variable | Purpose | Required |
|----------|---------|----------|
| `SESSION_SECRET` | CSRF token encryption | ✅ Yes |
| `RESEND_API_KEY` | Contact form emails | ✅ Yes |
| `ADMIN_PASSWORD` | Admin panel access | ✅ Yes |
| `SUPABASE_URL` | Database (optional) | ❌ No |
| `SUPABASE_ANON_KEY` | Database (optional) | ❌ No |

---

## ⚠️ Important Notes

### Environment Variables Format

**Dokploy accepts these formats:**

**Option 1: One per line (recommended)**
```
SESSION_SECRET=your-actual-session-secret
RESEND_API_KEY=your-actual-resend-key
ADMIN_PASSWORD=your-actual-password
```

**Option 2: Key-Value pairs**
- Some platforms have a UI where you add one variable at a time
- Add each as separate key-value pair

**Copy the actual values from your local `.env` file!**

### HTTPS Required

Your CSRF cookies require HTTPS in production. Make sure:
- ✅ Your domain has SSL/TLS enabled
- ✅ You're accessing via `https://` not `http://`

If using Dokploy, SSL should already be enabled.

---

## 🧪 Testing CSRF Protection

After deployment, try this test:

### Test 1: Contact form should work
1. Go to your portfolio
2. Fill out contact form
3. Submit
4. Should see "Message sent!" ✅

### Test 2: Blog creation should work
1. Login to `/admin`
2. Go to Blogs tab
3. Create a new blog
4. Should save successfully ✅

If both work, CSRF protection is active! 🔒

---

## 🆘 Troubleshooting

### Problem: "403 Forbidden" on form submissions

**Cause:** CSRF token not being sent

**Solution:**
1. Clear browser cookies
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check SESSION_SECRET is set in Dokploy
4. Make sure you deployed the latest code

### Problem: "Invalid CSRF token"

**Cause:** SESSION_SECRET mismatch or cookies blocked

**Solution:**
1. Verify SESSION_SECRET in Dokploy matches `.env`
2. Make sure cookies are enabled in browser
3. Check if HTTPS is enabled
4. Try incognito/private window

### Problem: Build fails with "module not found @/lib/csrf"

**Cause:** The csrf.ts file wasn't committed

**Solution:**
```bash
git add client/src/lib/csrf.ts
git commit -m "Add CSRF utility"
git push
```

### Problem: Rate limited (429 error)

**Cause:** Too many requests (this is working as intended!)

**Solution:**
- Wait 15 minutes, or
- Reduce request frequency

---

## 📊 What Happens Now

When someone tries to use your forms:

1. **Browser loads page** → Gets a CSRF token cookie
2. **User fills form** → `secureFetch()` grabs the token
3. **Form submits** → Token sent in request headers
4. **Server checks token** → Valid? ✅ Process request
5. **Invalid/missing token** → ❌ 403 Forbidden

This prevents attackers from submitting forms on your behalf!

---

## 🎯 Summary

**What you need to do:**
1. ✅ Add environment variables to Dokploy (copy from DOKPLOY_ENV.txt)
2. ✅ Push code to git
3. ✅ Deploy on Dokploy
4. ✅ Test forms work

**What's automatic:**
- ✅ CSRF tokens sent with all requests
- ✅ Rate limiting active
- ✅ Input sanitization working
- ✅ Security headers enabled

Your portfolio is now secure! 🔐

---

## 📚 Related Guides

- **[SECURITY_COMPLETE.md](SECURITY_COMPLETE.md)** - Full security implementation details
- **[SECURITY.md](SECURITY.md)** - Technical implementation log
- **[CLOUDFLARE_SETUP.md](CLOUDFLARE_SETUP.md)** - Optional DDoS protection setup

---

**Questions?** Check the troubleshooting section or the security guides above!
