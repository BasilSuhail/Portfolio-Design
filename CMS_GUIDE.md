# Portfolio CMS Guide

Your portfolio now has a fully functional Content Management System (CMS) that allows you to edit all text and images without touching any code!

## Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Access your portfolio:**
   - Website: `http://localhost:5000`
   - Admin Panel: `http://localhost:5000/admin`

## How to Edit Content

### Using the Admin Panel

Navigate to `http://localhost:5000/admin` to access your CMS dashboard. You'll see 7 tabs:

#### 1. Profile
Edit your personal information:
- Name
- Professional Title
- Bio
- Email
- Avatar URL
- Avatar Fallback (initials)

#### 2. Projects
Manage your portfolio projects:
- Project Title
- Project Image URL

#### 3. Experience
Edit your work experience:
- Date Range (e.g., "2024 - NOW")
- Company Name
- Role/Position
- Company Color (visual accent color)
- Description

#### 4. Testimonials
Manage client testimonials:
- Quote
- Author Name
- Author Role
- Author Initials
- Company Color

#### 5. Tech Stack
List technologies you use:
- Technology Name
- Icon name (e.g., "react", "typescript", "figma")

#### 6. Writing
Manage blog posts/articles:
- Date
- Title
- Read Time (in minutes)

#### 7. Social
Edit social media links:
- Label
- Value (e.g., "@username")
- URL

### Saving Changes

After making edits in any tab:
1. Click the **"Save Changes"** button in the top-right
2. You'll see a success notification
3. Click **"View Site"** to see your changes live

## Editing Content Directly

If you prefer editing JSON directly, you can modify the `content.json` file in the root directory:

```bash
/Users/basilsuhail/folders/Portfolio/Portfolio-Design/content.json
```

Changes to this file will be reflected on the website immediately after you refresh the page.

## Managing Images

### Option 1: Upload Images (Coming Soon)
The upload functionality is ready in the backend. You can upload images via the API endpoint:
- Endpoint: `POST /api/upload`
- Accepts: image files (jpg, png, gif, webp)
- Max size: 5MB
- Returns: image URL

### Option 2: Use Image URLs
For now, the easiest way to manage images:

1. **Using the existing images:**
   - Images are located in `/client/attached_assets/`
   - Reference them as: `/assets/generated_images/filename.png`

2. **Adding new images:**
   - Place images in `/client/public/uploads/` folder
   - Reference them as: `/uploads/your-image.png`

3. **Using external images:**
   - Upload images to a service like Imgur, Cloudinary, or AWS S3
   - Copy the image URL
   - Paste it into the Admin Panel or `content.json`

## File Structure

```
Portfolio-Design/
├── content.json              # Your editable content
├── server/
│   └── routes.ts            # API endpoints
├── client/
│   ├── public/
│   │   └── uploads/         # Uploaded images go here
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx     # Main portfolio page
│   │   │   └── Admin.tsx    # CMS admin panel
│   │   └── hooks/
│   │       └── use-content.ts # Content fetching hook
└── CMS_GUIDE.md             # This guide
```

## API Endpoints

Your CMS uses these endpoints:

- `GET /api/content` - Fetches all portfolio content
- `POST /api/content` - Updates portfolio content
- `POST /api/upload` - Uploads an image file

## Deployment Notes

When you're ready to deploy:

1. **Content updates:** Your `content.json` file should be committed to Git
2. **Uploaded images:** The `/client/public/uploads/` folder should also be committed
3. **Environment:** Set `NODE_ENV=production` for production builds

## Tips

1. **Backup your content:** Before making major changes, copy your `content.json` file as a backup
2. **Image optimization:** Use compressed/optimized images for better performance
3. **Color codes:** Use hex color codes for company colors (e.g., #FFB800)
4. **URLs:** Make sure all URLs start with `http://` or `https://`

## Troubleshooting

**Changes not showing up?**
- Click "Save Changes" in the admin panel
- Refresh the browser page
- Check browser console for errors

**Images not loading?**
- Verify the image path is correct
- Check that the image file exists
- Try using the full URL instead of a relative path

**Admin panel not accessible?**
- Make sure the server is running (`npm run dev`)
- Navigate to `http://localhost:5000/admin`

## Next Steps: Git Deployment

When you're ready to deploy to Git (GitHub, GitLab, etc.):

1. Initialize/update Git repository
2. Commit all changes including `content.json`
3. Push to your repository
4. Deploy using services like:
   - Vercel
   - Netlify
   - Railway
   - Render

Let me know when you're ready, and I'll help you set up Git deployment!
