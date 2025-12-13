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

---

## 📦 Deployment to Contabo VPS (Recommended for Production)

This is a Docker-based deployment that gives you full control and persistent storage.

### Prerequisites

Your Contabo server should have:
- Ubuntu 20.04 or later
- Root or sudo access
- At least 2GB RAM
- Domain name pointed to your server IP

### Step 1: Initial Server Setup

SSH into your Contabo server:
```bash
ssh root@your-server-ip
```

Update system packages:
```bash
apt update && apt upgrade -y
```

Install Docker and Docker Compose:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

Install Nginx and Certbot for SSL:
```bash
apt install nginx certbot python3-certbot-nginx -y
```

### Step 2: Clone Your Repository

Create project directory:
```bash
mkdir -p /opt/portfolio
cd /opt/portfolio
```

Clone your repository:
```bash
git clone https://github.com/BasilSuhail/Portfolio-Design.git .
```

### Step 3: Configure Environment Variables

Create `.env` file on the server:
```bash
nano .env
```

Add your environment variables:
```env
ADMIN_PASSWORD=7qxq0GfxIjMfxRhg8vpXZA47
RESEND_API_KEY=your_resend_api_key_here
```

Save and exit (Ctrl+X, Y, Enter)

### Step 4: Build and Start Docker Container

Make deployment script executable:
```bash
chmod +x deploy.sh
```

Run the deployment:
```bash
./deploy.sh
```

This will:
- Build the Docker image
- Start the container
- Expose the app on port 5000

Verify the container is running:
```bash
docker-compose ps
```

### Step 5: Configure Nginx as Reverse Proxy

Copy nginx configuration:
```bash
cp nginx.conf /etc/nginx/sites-available/portfolio
```

Edit the configuration to add your domain:
```bash
nano /etc/nginx/sites-available/portfolio
```

Replace `yourdomain.com` with your actual domain name.

Create symbolic link:
```bash
ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
```

Test nginx configuration:
```bash
nginx -t
```

Remove default site (optional):
```bash
rm /etc/nginx/sites-enabled/default
```

Restart nginx:
```bash
systemctl restart nginx
```

### Step 6: Set Up SSL Certificate (Let's Encrypt)

Make sure your domain DNS points to your server IP first!

Create directory for certbot:
```bash
mkdir -p /var/www/certbot
```

Get SSL certificate:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: yes)

Certbot will automatically configure nginx for SSL.

Test auto-renewal:
```bash
certbot renew --dry-run
```

### Step 7: Set Up Auto-Deployment (Optional)

To automatically pull updates from GitHub and redeploy:

Create a webhook or cron job:
```bash
# Create a cron job to check for updates daily
crontab -e
```

Add this line to check for updates at 3 AM daily:
```
0 3 * * * cd /opt/portfolio && git pull && ./deploy.sh >> /var/log/portfolio-deploy.log 2>&1
```

Or set up a GitHub webhook for instant deployments.

### Step 8: Verify Deployment

Visit your domain:
- Homepage: `https://yourdomain.com`
- Admin Login: `https://yourdomain.com/admin/login`

Check logs if needed:
```bash
docker-compose logs -f
```

---

## 🔒 Admin Access

After deployment:

1. Go to `https://your-site.com/admin/login`
2. Enter your admin password
3. You'll be redirected to the admin panel
4. The session is stored in browser (clears on logout or browser close)

**Your Admin Password**: `7qxq0GfxIjMfxRhg8vpXZA47`

---

## 📧 Email Setup (Optional)

If you want the contact form to work:

1. Sign up at [resend.com](https://resend.com/signup) (Free)
2. Get your API key
3. Add it to your server's `.env` file:
   ```bash
   nano /opt/portfolio/.env
   ```
4. Restart the container:
   ```bash
   cd /opt/portfolio && docker-compose restart
   ```

---

## 🔄 Updating Your Site

### Method 1: Manual Update (SSH)

SSH into your server:
```bash
ssh root@your-server-ip
cd /opt/portfolio
./deploy.sh
```

### Method 2: Automatic Updates

The cron job will pull updates daily at 3 AM automatically.

### Method 3: From Local Machine

Just push to GitHub:
```bash
git add .
git commit -m "Update content"
git push
```

Then SSH and run deploy script, or wait for cron job.

---

## 🔍 Monitoring and Maintenance

### View Application Logs
```bash
docker-compose logs -f portfolio
```

### View Nginx Logs
```bash
tail -f /var/log/nginx/portfolio_access.log
tail -f /var/log/nginx/portfolio_error.log
```

### Restart Application
```bash
docker-compose restart
```

### Stop Application
```bash
docker-compose down
```

### Check SSL Certificate Expiry
```bash
certbot certificates
```

### Renew SSL Certificate Manually
```bash
certbot renew
systemctl reload nginx
```

---

## 🆘 Troubleshooting

**Can't access website**:
- Check if Docker container is running: `docker-compose ps`
- Check nginx status: `systemctl status nginx`
- Check firewall: `ufw status` (allow ports 80, 443)
- Check logs: `docker-compose logs`

**SSL certificate issues**:
- Make sure DNS is pointing to server
- Check certbot logs: `/var/log/letsencrypt/`
- Verify nginx config: `nginx -t`

**Admin panel not working**:
- Verify `ADMIN_PASSWORD` in `.env`
- Restart container: `docker-compose restart`
- Check browser console for errors

**Contact form not working**:
- Verify `RESEND_API_KEY` in `.env`
- Check application logs for errors

**Upload issues**:
- Check uploads directory permissions
- Verify volume mount in docker-compose.yml

---

## 🔐 Security Recommendations

1. **Firewall Configuration**:
```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
```

2. **Change SSH Port** (optional but recommended):
```bash
nano /etc/ssh/sshd_config
# Change Port 22 to something else
systemctl restart sshd
```

3. **Set Up Fail2Ban**:
```bash
apt install fail2ban -y
systemctl enable fail2ban
```

4. **Regular Backups**:
```bash
# Backup content and uploads
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/portfolio/content.json /opt/portfolio/uploads/
```

5. **Keep System Updated**:
```bash
apt update && apt upgrade -y
```

---

## 📊 Performance Optimization

Your Contabo server deployment includes:
- ✅ Docker containerization for isolation
- ✅ Nginx reverse proxy with caching
- ✅ Gzip compression
- ✅ SSL/TLS encryption
- ✅ Health checks
- ✅ Persistent storage for uploads
- ✅ No spin-down (always available)

---

Need help? Check the deployment logs or contact support.
