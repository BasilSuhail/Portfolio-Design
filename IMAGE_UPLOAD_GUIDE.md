# Image Upload Guide

## How to Add Images to Your Portfolio

### Method 1: Upload Images (Recommended)

1. **Go to the Admin Panel**
   - Navigate to `http://localhost:5000/admin`

2. **Find the Image Field**
   - For example: Avatar Image, Project Image, Company Logo, etc.

3. **Click "Upload Image"**
   - A file picker will open
   - Select your image (JPG, PNG, GIF, WebP - max 5MB)

4. **Image is Automatically Uploaded**
   - The correct URL will be filled in automatically
   - Format: `/uploads/1765566380949-451783012.png`
   - Preview appears instantly

5. **Click "Save Changes"**
   - Your image is now live!

---

### Method 2: Paste Image URLs

You can also paste URLs directly:

**External URLs:**
```
https://example.com/image.png
```

**Uploaded Images:**
```
/uploads/your-image.png
```

⚠️ **IMPORTANT:** Do NOT use full file system paths like:
```
❌ /Users/basilsuhail/folders/Portfolio/Portfolio-Design/client/public/uploads/image.png
✅ /uploads/image.png
```

---

## Adding Inline Images in Bio Text

In the Profile Bio field, you can add small inline icons:

### Syntax:
```
[img:IMAGE_URL]
or
[img:IMAGE_URL:ALT_TEXT]
```

### Examples:

**Using uploaded image:**
```
I study at University [img:/uploads/university-logo.png:University Logo]
```

**Using external URL:**
```
I'm from Scotland [img:https://example.com/flag.png:Scotland Flag]
```

**Your current bio example:**
```
Hey, I'm Basil a student at University of Aberdeen [img:https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/University_of_Aberdeen_coat_of_arms.svg/120px-University_of_Aberdeen_coat_of_arms.svg.png:University of Aberdeen], Scotland [img:https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Flag_of_Scotland.svg/23px-Flag_of_Scotland.svg.png:Scotland Flag].
```

---

## Where Are My Images Stored?

All uploaded images are saved in:
```
/client/public/uploads/
```

Files in `/client/public/` are automatically served by the web server.

---

## Troubleshooting

### Image Not Showing?

**Check the URL format:**
- ✅ Correct: `/uploads/image.png`
- ❌ Wrong: `/Users/basilsuhail/.../client/public/uploads/image.png`

**Steps to Fix:**
1. Go to admin panel
2. Find the broken image field
3. Delete the current URL
4. Click "Upload Image" again
5. The correct URL will be filled automatically

### Preview Not Loading?

If the preview shows "Invalid Image":
- The URL might be incorrect
- Try uploading the image again using the Upload button
- Or check that the external URL is accessible

---

## All Image Fields in Admin

### Profile Tab
- **Avatar Image** - Your profile picture

### Projects Tab
- **Main Project Image** - Shown on homepage and detail pages

### Experience Tab
- **Company Logo** - Replaces the colored circle

### Testimonials Tab
- **Company Logo** - Replaces the colored circle

---

## Tips

1. **Use the Upload Button** - It's the easiest way and ensures correct URLs
2. **Keep Images Under 5MB** - Larger images will be rejected
3. **Use Common Formats** - JPG, PNG, GIF, WebP are supported
4. **Preview Before Saving** - Check the preview to make sure it looks good
5. **Save Your Changes** - Don't forget to click "Save Changes" at the bottom!
