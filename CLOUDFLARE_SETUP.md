# ☁️ Cloudflare Setup Guide - DDoS Protection

Cloudflare provides free DDoS protection, CDN, and web application firewall (WAF) for your portfolio.

**Time Required:** 15-20 minutes
**Cost:** Free (Free tier is sufficient)

---

## Why Cloudflare?

- **DDoS Protection**: Blocks malicious traffic before it reaches your server
- **CDN**: Speeds up your site with global caching
- **WAF**: Web Application Firewall blocks common attacks
- **Analytics**: See real-time traffic and threats
- **SSL**: Free SSL certificates

---

## Step 1: Create Cloudflare Account

1. Go to [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)
2. Enter your email and create a password
3. Verify your email address
4. Login to Cloudflare dashboard

---

## Step 2: Add Your Domain

1. Click **"Add a Site"** button
2. Enter your domain (e.g., `yourportfolio.com`)
3. Click **"Add site"**
4. Select **"Free"** plan
5. Click **"Continue"**

---

## Step 3: Update DNS Records

Cloudflare will scan your existing DNS records:

1. Review the DNS records Cloudflare found
2. Make sure all records are correct
3. **Important**: Toggle the **orange cloud icon** ON for your domain records
   - Orange cloud = Proxied through Cloudflare (DDoS protection active)
   - Gray cloud = DNS only (no protection)
4. Click **"Continue"**

**Common DNS Records:**
```
Type    Name    Content              Proxy Status
A       @       your.server.ip       Proxied (orange)
CNAME   www     yourportfolio.com    Proxied (orange)
```

---

## Step 4: Change Nameservers

Cloudflare will give you 2 nameservers. You need to update these at your domain registrar:

**Cloudflare nameservers** (example):
```
ava.ns.cloudflare.com
carl.ns.cloudflare.com
```

**Where to update nameservers:**
- If domain is from GoDaddy: Go to GoDaddy → Domain Settings → Nameservers
- If domain is from Namecheap: Go to Namecheap → Domain List → Manage → Nameservers
- If domain is from Dokploy: Check where you purchased the domain

**Steps:**
1. Login to your domain registrar
2. Find "Nameservers" or "DNS Settings"
3. Change from current nameservers to Cloudflare's nameservers
4. Save changes
5. Return to Cloudflare and click **"Done, check nameservers"**

**Note:** DNS propagation can take 5 minutes to 24 hours (usually ~30 minutes)

---

## Step 5: Configure Security Settings

Once Cloudflare is active, configure these settings:

### 5.1 Enable "Under Attack Mode" (When Needed)
When your site is under attack:
1. Go to **Overview** tab
2. Click **"Under Attack Mode"** toggle
3. Visitors will see a 5-second check before accessing your site

### 5.2 Configure Firewall Rules (Recommended)
1. Go to **Security** → **WAF**
2. Click **"Create rule"**
3. Add these rules:

**Rule 1: Block Known Bots**
```
Field: Known Bots
Operator: equals
Value: On
Action: Block
```

**Rule 2: Rate Limit (Extra Protection)**
```
Field: Requests
Operator: greater than
Value: 30 requests per minute
Action: Challenge (CAPTCHA)
```

### 5.3 Enable Bot Fight Mode
1. Go to **Security** → **Bots**
2. Enable **"Bot Fight Mode"** (Free plan)
3. This blocks simple bots automatically

### 5.4 Security Level
1. Go to **Security** → **Settings**
2. Set **Security Level** to **"Medium"** (default)
3. Increase to "High" if you're experiencing attacks

---

## Step 6: Enable Performance Features

### 6.1 Auto Minify
1. Go to **Speed** → **Optimization**
2. Enable Auto Minify for:
   - JavaScript
   - CSS
   - HTML

### 6.2 Brotli Compression
1. Go to **Speed** → **Optimization**
2. Enable **Brotli** compression

### 6.3 Caching
1. Go to **Caching** → **Configuration**
2. Set **Caching Level** to **"Standard"**
3. Set **Browser Cache TTL** to **"4 hours"**

---

## Step 7: SSL/TLS Settings

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **"Full (strict)"**
   - This ensures end-to-end encryption
3. Go to **SSL/TLS** → **Edge Certificates**
4. Enable **"Always Use HTTPS"** (redirect HTTP to HTTPS)
5. Enable **"Automatic HTTPS Rewrites"**

---

## ✅ Verification

After setup, verify everything is working:

1. Visit your domain (https://yourportfolio.com)
2. Check SSL certificate (click padlock in browser)
3. Check if site loads correctly
4. Test contact form and blog CMS

**Cloudflare Analytics:**
- Go to **Analytics & Logs** to see traffic
- You'll see threats blocked, bandwidth saved, etc.

---

## 🔒 Recommended Settings Summary

| Setting | Location | Value |
|---------|----------|-------|
| Security Level | Security → Settings | Medium |
| Bot Fight Mode | Security → Bots | On |
| Always Use HTTPS | SSL/TLS → Edge Certificates | On |
| Auto Minify | Speed → Optimization | JS, CSS, HTML On |
| Brotli | Speed → Optimization | On |
| Proxy Status | DNS | Orange cloud (Proxied) |

---

## 🚨 Common Issues

**Issue: Site not loading after changing nameservers**
- Solution: Wait 30 minutes for DNS propagation
- Check nameservers: `nslookup yourportfolio.com`

**Issue: SSL error / "Your connection is not private"**
- Solution: Go to SSL/TLS → Overview → Set to "Full (strict)"
- Make sure your origin server has SSL enabled

**Issue: Forms not working / CORS errors**
- Solution: Go to Network → add your API domain to allowed origins
- Make sure cookies are allowed (Session CSRF needs cookies)

**Issue: Admin panel login fails**
- Solution: Disable "Bot Fight Mode" temporarily for `/admin` path
- Create Page Rule to bypass security for admin (not recommended)

---

## 💡 Pro Tips

1. **Create Page Rules** (3 free rules available):
   - Cache everything for `/blog/*` pages
   - Bypass cache for `/api/*` endpoints
   - Disable security for `/admin` if needed

2. **Monitor Threats**:
   - Check Security → Analytics regularly
   - See what attacks Cloudflare is blocking

3. **Purge Cache When Needed**:
   - After updating blog content: Caching → Configuration → Purge Everything
   - Or purge specific URLs

4. **Use Workers for Advanced Features** (requires paid plan):
   - Advanced request filtering
   - Custom redirects
   - A/B testing

---

## 🆘 Need Help?

- Cloudflare Docs: https://developers.cloudflare.com/
- Community Forum: https://community.cloudflare.com/
- Check your domain registrar's guide for changing nameservers

---

**Your portfolio is now protected by Cloudflare! 🛡️**

You get:
- DDoS protection (multi-layer)
- WAF (Web Application Firewall)
- Bot blocking
- CDN (faster load times)
- Free SSL certificate
- Analytics

Combined with your server-side security (rate limiting, CSRF, input sanitization), your portfolio is now well-protected against common attacks!
