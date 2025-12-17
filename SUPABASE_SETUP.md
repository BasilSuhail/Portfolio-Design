# 🚀 Supabase Setup Guide

This guide will walk you through setting up Supabase for your blog CMS. It takes about 10 minutes.

## Why Supabase?

- ✅ **Free tier** with 500MB database + 1GB file storage
- ✅ **Automatic backups** - never lose your blogs
- ✅ **Image hosting** - upload flowcharts, diagrams, etc.
- ✅ **PostgreSQL** - professional database
- ✅ **No deployment needed** - changes reflect instantly

---

## Step 1: Create Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub (recommended) or email
4. You'll be redirected to the dashboard

---

## Step 2: Create a New Project

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `portfolio-blog` (or any name you like)
   - **Database Password**: Create a strong password (save it somewhere safe!)
   - **Region**: Choose the closest to you (e.g., `US West` or `Europe`)
   - **Pricing Plan**: Select **Free** tier
3. Click **"Create new project"**
4. Wait 2-3 minutes for your database to be provisioned ☕

---

## Step 3: Get Your API Keys

Once your project is ready:

1. In the Supabase dashboard, click on your project
2. Go to **Settings** (gear icon in sidebar) → **API**
3. You'll see two important values:
   - **Project URL** - looks like `https://xxxxx.supabase.co`
   - **anon public** key - long string starting with `eyJ...`

**Copy both of these!**

---

## Step 4: Create the Blogs Table

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **"+ New Query"**
3. Copy and paste this SQL:

```sql
-- Create blogs table
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  featured_in_writing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on slug for faster lookups
CREATE INDEX idx_blogs_slug ON blogs(slug);

-- Create index on published for filtering
CREATE INDEX idx_blogs_published ON blogs(published);

-- Enable Row Level Security (RLS)
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Allow public to read published blogs
CREATE POLICY "Public can view published blogs"
  ON blogs FOR SELECT
  USING (published = true);

-- Allow all operations for now (we'll add auth later)
CREATE POLICY "Allow all for development"
  ON blogs FOR ALL
  USING (true);
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see **"Success. No rows returned"**

---

## Step 5: Set Up Storage for Images

1. Go to **Storage** (bucket icon in sidebar)
2. Click **"Create a new bucket"**
3. Name it: `blog-images`
4. Make it **Public** (toggle the public option)
5. Click **"Create bucket"**

### Set Storage Policies:

1. Click on the `blog-images` bucket
2. Go to **Policies** tab
3. Click **"New Policy"** → **"For full customization"**
4. Add this policy:

**Policy name**: `Public Access`

```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'blog-images' );

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'blog-images' );
```

Or simply use the **template**: "Allow public read access" and "Allow authenticated uploads"

---

## Step 6: Add Keys to Your Project

1. Create a `.env` file in your project root (if it doesn't exist):

```bash
# In Portfolio-Design folder
touch .env
```

2. Add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace** the values with what you copied from Step 3!

3. Add `.env` to `.gitignore` (should already be there):

```bash
# Check if it's in .gitignore
cat .gitignore | grep .env
```

If it's not there, add it:

```bash
echo ".env" >> .gitignore
```

---

## Step 7: Verify Everything Works

After I finish the code changes, you can test:

1. Go to `/admin` → **Blogs** tab
2. Create a test blog
3. Go to Supabase → **Table Editor** → **blogs**
4. You should see your blog there! 🎉

---

## Step 8: Migrate Existing Blogs (If Any)

If you have blogs in `blogs.json`, I'll create a migration script to move them to Supabase.

---

## 🔐 Security Notes

**Current setup**: Anyone can read published blogs (public), and the development policy allows all operations.

**For production**, you'll want to:
1. Set up Supabase Auth
2. Restrict write operations to authenticated admins only
3. I can help with this later!

---

## 💰 Free Tier Limits

- **Database**: 500MB (thousands of blog posts)
- **Storage**: 1GB (hundreds of images)
- **Bandwidth**: 5GB/month
- **API requests**: Unlimited

This is **more than enough** for a personal blog!

---

## 🆘 Troubleshooting

### "Can't connect to database"
- Check your `.env` file has correct URL and key
- Make sure the project is active in Supabase dashboard

### "Policy violation" errors
- Go to Table Editor → blogs → Policies
- Make sure "Allow all for development" policy exists

### Images not uploading
- Check Storage → blog-images → Policies
- Make sure public access is enabled

---

## ✅ You're Done!

Once you complete these steps:
1. Your blogs will be safely stored in Supabase
2. Images will be hosted in Supabase Storage
3. Automatic backups are enabled
4. No need to commit blog content to git anymore!

**Next**: I'll update the code to use Supabase instead of `blogs.json` 🚀
