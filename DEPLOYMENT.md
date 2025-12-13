# Deployment Guide

This guide will help you deploy your portfolio website with admin panel protection.

## 🔐 Security Setup (IMPORTANT!)

Before deploying, ensure your secrets are safe:

### 1. Check .gitignore
Your `.env` file should already be in `.gitignore`. Verify:
```bash
cat .gitignore | grep .env
```

You should see:
```
.env
.env.local
.env.production
```

### 2. Set Your Admin Password
Edit `.env` and change the default password:
```bash
ADMIN_PASSWORD=your_strong_password_here
```

**⚠️ NEVER commit this file to Git!**

## 📦 Deployment Options

### Option 1: Deploy to Vercel (Recommended - Free)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/portfolio.git
   git push -u origin main
   ```

2. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your repository
   - Add Environment Variables:
     - `ADMIN_PASSWORD` = your secure password
     - `RESEND_API_KEY` = your Resend API key (optional, for contact form)
   - Click "Deploy"

3. **Access Your Site**
   - Homepage: `https://your-site.vercel.app`
   - Admin Login: `https://your-site.vercel.app/admin/login`

### Option 2: Deploy to Netlify (Free Alternative)

1. **Build Command**: `npm run build`
2. **Publish Directory**: `dist`
3. **Environment Variables**:
   - `ADMIN_PASSWORD` = your secure password
   - `RESEND_API_KEY` = your Resend API key (optional)

### Option 3: Deploy to Render (Free)

1. Create a new Web Service
2. Connect your GitHub repository
3. Build Command: `npm run build`
4. Start Command: `npm start`
5. Add Environment Variables in the dashboard

## 🔒 Admin Access

After deployment:

1. Go to `https://your-site.com/admin/login`
2. Enter your admin password
3. You'll be redirected to the admin panel
4. The session is stored in browser (clears on logout or browser close)

**Default Password for Development**: `admin123`
**⚠️ Change this before deploying!**

## 📧 Email Setup (Optional)

If you want the contact form to work:

1. Sign up at [resend.com](https://resend.com/signup) (Free)
2. Get your API key
3. Add it to your `.env` or hosting environment variables:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```
4. Restart your server

Without this, the contact form will fail silently.

## 🔐 Public vs Private Repository

**You can safely use a PUBLIC repository** because:

✅ Sensitive data is in `.env` (git-ignored)
✅ Your portfolio content is meant to be public anyway
✅ No passwords or API keys are in the code

**What's Protected**:
- `.env` file (contains passwords and API keys)
- Admin sessions (password-protected)
- Contact form submissions (go to your email)

**What's Public**:
- Your portfolio content (experiences, projects, etc.)
- Source code
- Design and styling

## 🚀 Post-Deployment Checklist

- [ ] Changed default admin password
- [ ] Tested admin login at `/admin/login`
- [ ] Verified admin panel access
- [ ] Set up environment variables on hosting platform
- [ ] (Optional) Added Resend API key for contact form
- [ ] Tested contact form submission
- [ ] Verified calendar booking buttons work

## 📝 Managing Content

1. Go to `https://your-site.com/admin/login`
2. Login with your password
3. Edit content in the admin panel
4. Click "Save Changes"
5. Refresh your homepage to see updates

## 🆘 Troubleshooting

**Can't access admin panel**:
- Make sure you're at `/admin/login` not just `/admin`
- Check browser console for errors
- Verify `ADMIN_PASSWORD` is set in environment variables

**Contact form not working**:
- Check if `RESEND_API_KEY` is set
- Verify the API key is valid at resend.com
- Check server logs for error messages

**Changes not saving**:
- Check browser console for errors
- Verify you're logged in
- Check network tab for failed requests

## 🔄 Updating Your Site

After making changes locally:

```bash
git add .
git commit -m "Update content"
git push
```

Your hosting platform will automatically redeploy!

---

Need help? Check the [README.md](./README.md) or [QUICK_START.md](./QUICK_START.md)
