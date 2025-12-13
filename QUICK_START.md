# Quick Start Guide

## Start Your Portfolio

```bash
npm run dev
```

Then open:
- **Website:** http://localhost:5000
- **Admin Panel (CMS):** http://localhost:5000/admin

## Edit Your Content

### Option 1: Admin Panel (Easiest)
1. Go to http://localhost:5000/admin
2. Click on any tab (Profile, Projects, Experience, etc.)
3. Edit the text fields
4. Click "Save Changes"
5. Done! View your changes at http://localhost:5000

### Option 2: Edit JSON Directly
Open and edit `content.json` in the root folder. Changes apply immediately on refresh.

## What You Can Edit

- **Profile:** Name, title, bio, email, avatar
- **Projects:** Project titles and images
- **Experience:** Job roles, companies, dates, descriptions
- **Testimonials:** Client quotes and details
- **Tech Stack:** Technologies and tools you use
- **Writing:** Blog posts and articles
- **Social Links:** Email, X/Twitter, GitHub, LinkedIn

## Managing Images

### Current Images
Your images are in `/client/attached_assets/`. Reference them as:
```
/assets/generated_images/filename.png
```

### Add New Images
1. Place images in `/client/public/uploads/`
2. Reference as: `/uploads/your-image.png`

Or use external image URLs from Imgur, Cloudinary, etc.

## Deploy to Production

When ready to go live:

```bash
npm run build
npm start
```

Or deploy to:
- Vercel (recommended)
- Netlify
- Railway
- Render

Just push to Git and connect your repo!

## Need Help?

See [CMS_GUIDE.md](./CMS_GUIDE.md) for detailed instructions.
