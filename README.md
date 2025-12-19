# Portfolio Website

Modern portfolio website with CMS capabilities, built with React, Express, and TypeScript.

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Features

- ✅ **Admin CMS** - Manage content at `/admin`
- ✅ **Blog System** - Support for HTML and PDF blogs
- ✅ **Contact Form** - Powered by Formspree
- ✅ **Dark Mode** - Theme switching
- ✅ **Responsive Design** - Mobile-first approach

## Environment Setup

Required variables in `.env`:

```env
SESSION_SECRET=your_session_secret_here
VITE_FORMSPREE_ENDPOINT=https://formspree.io/f/your_form_id
ADMIN_PASSWORD=your_admin_password
```

## Documentation

See [`docs/`](docs/) folder for:
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Security Guide](docs/SECURITY_COMPLETE.md)
- [Recent Fixes](docs/FIXES_SUMMARY.md)

## Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS, Shadcn UI
- **Backend:** Express, Node.js
- **Database:** Supabase (optional) or JSON file storage
- **Deployment:** Dokploy, Docker

## Admin Access

Navigate to `/admin/login` and use your `ADMIN_PASSWORD` from `.env`

## License

MIT
