# 📧 EmailJS Setup Guide (FREE Email Solution)

EmailJS is a **100% free** email service that works directly from your frontend - no backend, no API limits for personal use!

---

## 🎯 Why EmailJS?

✅ **Completely FREE** for personal use (200 emails/month)
✅ **No backend needed** - works from React directly
✅ **No credit card required**
✅ **Reliable** - used by thousands of portfolios
✅ **Easy setup** - 5 minutes total

---

## 🚀 Setup Instructions (5 Minutes)

### Step 1: Create EmailJS Account

1. Go to: https://www.emailjs.com/
2. Click **"Sign Up Free"**
3. Sign up with Google or email
4. Verify your email

### Step 2: Add Email Service

1. Go to **Email Services** in dashboard
2. Click **"Add New Service"**
3. Choose **Gmail** (recommended) or any email provider
4. Click **"Connect Account"** and sign in with your Gmail
5. Copy the **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Template

1. Go to **Email Templates** in dashboard
2. Click **"Create New Template"**
3. Use this template:

```
Subject: New Contact from {{from_name}}

From: {{from_name}}
Email: {{from_email}}

Message:
{{message}}
```

4. Click **"Save"**
5. Copy the **Template ID** (e.g., `template_xyz789`)

### Step 4: Get Your Public Key

1. Go to **Account** → **General**
2. Find **Public Key** (e.g., `abc123XYZ`)
3. Copy it

### Step 5: Update Your .env File

Add these to your `.env` file:

```env
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_xyz789
VITE_EMAILJS_PUBLIC_KEY=abc123XYZ
```

**Important:** Use `VITE_` prefix so React can access them!

### Step 6: Update ContactSection.tsx

Replace the placeholder values in `ContactSection.tsx`:

```typescript
await emailjs.send(
  import.meta.env.VITE_EMAILJS_SERVICE_ID,
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
  {
    from_name: formData.name,
    from_email: formData.email,
    message: formData.message,
    to_email: 'basilsuhail3@gmail.com',
  },
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY
);
```

### Step 7: Deploy & Test!

```bash
npm run build
# Deploy to Dokploy
# Test the contact form
```

---

## 📊 EmailJS Limits (FREE Tier)

| Feature | Limit |
|---------|-------|
| Emails/month | 200 (plenty for portfolio) |
| Email services | 2 |
| Email templates | Unlimited |
| Cost | $0 forever |

**Need more?** Paid plan is only $7/month for 1,000 emails

---

## 🎨 Template Variables

You can use these in your email template:

- `{{from_name}}` - Visitor's name
- `{{from_email}}` - Visitor's email
- `{{message}}` - Their message
- `{{to_email}}` - Your email (optional)

---

## 🔒 Security

EmailJS is secure because:
- ✅ Public key is safe to expose (it's public!)
- ✅ Rate limiting built-in
- ✅ Spam protection included
- ✅ reCAPTCHA optional (if you want extra protection)

---

## 🐛 Troubleshooting

### Emails Not Sending:

1. **Check browser console** for errors
2. **Verify .env variables** are set correctly
3. **Check EmailJS dashboard** → Email History
4. **Test email service** in EmailJS dashboard
5. **Check spam folder** for test emails

### Getting "Failed to send":

1. Verify Service ID, Template ID, Public Key are correct
2. Check email service is connected in EmailJS
3. Try sending test email from EmailJS dashboard
4. Make sure Gmail account is properly connected

---

## 💡 Pro Tips

### Custom Email Template:

Make your emails look professional:

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif;">
  <h2>New Contact Form Submission</h2>
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
    <p><strong>Name:</strong> {{from_name}}</p>
    <p><strong>Email:</strong> {{from_email}}</p>
    <p><strong>Message:</strong></p>
    <p>{{message}}</p>
  </div>
  <hr>
  <p style="color: #666; font-size: 12px;">
    Sent from your portfolio contact form
  </p>
</body>
</html>
```

### Auto-Reply to Visitor:

Create a second template to send confirmation to visitors:

```
Subject: Thanks for contacting Basil!

Hi {{from_name}},

Thank you for reaching out! I've received your message and will get back to you soon.

Best regards,
Basil Suhail
```

Then add in your code:

```typescript
// Send to you
await emailjs.send(SERVICE_ID, TEMPLATE_ID, {...});

// Send auto-reply to visitor
await emailjs.send(SERVICE_ID, 'template_autoreply', {
  to_email: formData.email,
  from_name: formData.name
});
```

---

## ✅ Advantages Over Resend

| Feature | EmailJS | Resend |
|---------|---------|--------|
| Free tier | 200/month | 100/day (3,000/month) |
| Setup | 5 minutes | Need domain verification |
| Backend needed | No | Yes |
| Credit card | Not required | Not required |
| Reliability | Excellent | Excellent |
| **Best for** | Portfolios | Production apps |

---

## 🎉 You're Done!

Your contact form now uses **EmailJS** instead of Resend:

✅ No backend API needed
✅ No API keys to manage
✅ 100% free for portfolio use
✅ Emails sent directly from frontend
✅ Spam protection built-in

**All features still work:**
- ✅ Honeypot spam filter
- ✅ Time-based validation
- ✅ Keyword filtering
- ✅ Rate limiting
- ✅ Calendar integration

---

## 📚 Resources

- EmailJS Dashboard: https://dashboard.emailjs.com/
- Documentation: https://www.emailjs.com/docs/
- Examples: https://www.emailjs.com/docs/examples/

---

**Need Help?**

Check the EmailJS dashboard → Email History to see all sent emails and any errors.
