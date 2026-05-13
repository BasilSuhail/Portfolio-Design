# Basil Suhail — Portfolio

Personal portfolio and CMS built with React, TypeScript, Express, and SQLite.

> **Live:** [basilsuhail.com](https://basilsuhail.com) · **Market Terminal:** [basilsuhail.com/market-terminal](https://basilsuhail.com/market-terminal)

---

## Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Framer Motion, shadcn/ui
- **Backend:** Express.js, SQLite (better-sqlite3), Drizzle ORM
- **AI/ML:** FinBERT sentiment analysis, TF-IDF clustering, Geopolitical Risk Index
- **Infra:** Docker, Dokploy, Nginx, GitHub Actions CI

---

## Local Development

```bash
npm install
npm run dev        # starts on port 3001 (port 5000 is taken by macOS)
```

Admin panel: `http://localhost:3001/admin`

---

## CI Pipeline

Every PR runs three checks via GitHub Actions:

| Job | Command | Blocks |
|---|---|---|
| Type Check | `npm run check` | Yes |
| Lint | `npm run lint` | Yes |
| Build | `npm run build` | Yes (after typecheck + lint) |

---

## Content Management

All portfolio content lives in `content.json`. Edit directly or use the admin panel at `/admin`.

Key sections: `profile`, `projects`, `experiences`, `education`, `technologies`, `testimonials`.

---

## Deployment

Deployed via [Dokploy](https://dokploy.com) with Docker. Push to `main` triggers auto-deploy.

---

## License

MIT
